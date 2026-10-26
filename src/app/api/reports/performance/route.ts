import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const query = searchParams.get("q")?.trim() || "";
    const triage = searchParams.get("triage") || "all";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = Math.max(0, (page - 1) * limit);

    // 1. เงื่อนไขช่วงเวลา
    const dateCondition: any = {};
    if (startDateParam || endDateParam) {
      dateCondition.created_at = {};
      if (startDateParam) {
        dateCondition.created_at.gte = new Date(`${startDateParam}T00:00:00.000Z`);
      }
      if (endDateParam) {
        dateCondition.created_at.lte = new Date(`${endDateParam}T23:59:59.999Z`);
      }
    }

    // 2. คำนวณการ์ดสรุปสถิติ (Summary) ตามระดับความรุนแรง
    const baseStatsWhere: any = { ...dateCondition };

    const [
      totalCount,
      redCount,
      yellowCount,
      greenCount,
      whiteCount,
      cancelledCount,
      completedCount,
    ] = await Promise.all([
      prisma.ems_cases.count({ where: { ...baseStatsWhere, status: { not: "cancelled" } } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, triage_level: "red", status: { not: "cancelled" } } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, triage_level: "yellow", status: { not: "cancelled" } } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, triage_level: "green", status: { not: "cancelled" } } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, triage_level: "white", status: { not: "cancelled" } } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, status: "cancelled" } }),
      prisma.ems_cases.count({ where: { ...baseStatsWhere, status: "completed" } }),
    ]);

    // 3. เงื่อนไขค้นหาผู้รับบริการ (HN, CID / id_card_no, ชื่อ-สกุล)
    let patientCondition: any = undefined;

    if (query) {
      const parts = query.split(/\s+/).filter(Boolean);

      // ค้นหาทั้งจาก patient ของ รพ. และ ems_patients
      const [matchedHospitalPts, matchedEmsPts] = await Promise.all([
        prisma.patient.findMany({
          where: {
            OR: [
              { hn: { contains: query } },
              { cid: { contains: query } },
              parts.length >= 2
                ? { AND: [{ fname: { contains: parts[0] } }, { lname: { contains: parts[1] } }] }
                : { OR: [{ fname: { contains: query } }, { lname: { contains: query } }] },
            ],
          },
          select: { hn: true },
          take: 100,
        }).catch(() => []),
        prisma.ems_patients.findMany({
          where: {
            OR: [
              { id_card_no: { contains: query } }, // 🌟 ตรงตาม schema: id_card_no
              { passport_no: { contains: query } },
              parts.length >= 2
                ? { AND: [{ fname: { contains: parts[0] } }, { lname: { contains: parts[1] } }] }
                : { OR: [{ fname: { contains: query } }, { lname: { contains: query } }] },
            ],
          },
          select: { id: true },
          take: 100,
        }).catch(() => []),
      ]);

      const foundHns = matchedHospitalPts.map((p) => p.hn);
      const foundEmsIds = matchedEmsPts.map((p) => p.id);

      patientCondition = {
        OR: [
          { case_number: { contains: query } },
          { patient_hn: { in: foundHns } },
          { ems_patient_id: { in: foundEmsIds } },
          { caller_name: { contains: query } },
          { incident_address: { contains: query } },
          { chief_complaint: { contains: query } },
        ],
      };
    }

    const where: any = {
      ...dateCondition,
      ...(patientCondition || {}),
    };

    if (triage && triage !== "all") {
      where.triage_level = triage;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    // 4. ดึงข้อมูลเคส, เจ้าหน้าที่, รถพยาบาล และชุมชน
    const [totalRecords, rawCases, officers, vehiclesList, villages] = await Promise.all([
      prisma.ems_cases.count({ where }),
      prisma.ems_cases.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          ems_patient: true,
          treatments: {
            orderBy: { id: "desc" },
            take: 1,
          },
          dispatches: {
            orderBy: { id: "desc" },
            take: 1,
            include: {
              staffs: true,
            },
          },
        },
      }),
      prisma.users.findMany({
        select: { user_id: true, fullname: true },
      }).catch(() => []),
      prisma.vehicles.findMany().catch(() => []), // 🌟 ตรงตาม schema: vehicles (vehicle_id, plate_number)
      prisma.village.findMany({
        select: { village_moo: true, village_name: true },
      }).catch(() => []),
    ]);

    // สร้าง Map จับคู่ข้อมูล
    const officerMap = new Map(officers.map((o) => [o.user_id, o.fullname]));
    const vehicleMap = new Map(vehiclesList.map((v) => [v.vehicle_id, v.plate_number]));
    const villageMap = new Map<string, string>();
    villages.forEach((v: any) => {
      villageMap.set(String(v.village_moo).trim(), v.village_name);
    });

    // ดึงข้อมูลผู้ป่วย รพ. เพิ่มเติมตาม patient_hn
    const hnList = Array.from(
      new Set(rawCases.map((c) => c.patient_hn).filter((hn): hn is string => Boolean(hn)))
    );

    let hospitalPtMap = new Map<string, any>();
    if (hnList.length > 0) {
      const hospitalPts = await prisma.patient.findMany({
        where: { hn: { in: hnList } },
        select: {
          hn: true,
          cid: true,
          pname: true,
          fname: true,
          lname: true,
          sex: true,
          birthday: true,
          moopart: true,
          address_full: true,
          death: true,
        },
      }).catch(() => []);

      hospitalPts.forEach((pt) => {
        hospitalPtMap.set(pt.hn.trim(), pt);
      });
    }

    // 5. ประกอบโครงสร้างข้อมูลส่งกลับหน้าบ้าน
    const records = rawCases.map((c) => {
      const dispatch = c.dispatches?.[0] || null;
      const staffs = dispatch?.staffs || [];
      const treatment = c.treatments?.[0] || null;

      const leader = staffs.find(
        (s) => s.note === "leader" || s.role_type === "team_leader" || s.role_type === "leader"
      );
      const driver = staffs.find(
        (s) => s.note === "driver" || s.role_type === "driver"
      );

      const leaderName = leader ? officerMap.get(leader.user_id) || `จนท. ${leader.user_id}` : "-";
      const driverName = driver ? officerMap.get(driver.user_id) || `จนท. ${driver.user_id}` : "-";
      const vehiclePlate = dispatch?.vehicle_id ? vehicleMap.get(dispatch.vehicle_id) || "-" : "-";

      let ptName = "ไม่ระบุชื่อ / นิรนาม";
      let ptCid = "-";
      let ptAge: string | number = "-";
      let villageName = "บุคคลนอกเขต";
      let isDeceased = false;

      if (c.patient_source === "HOSPITAL" && c.patient_hn) {
        const hPt = hospitalPtMap.get(c.patient_hn.trim());
        if (hPt) {
          ptName = `${hPt.pname || ""}${hPt.fname || ""} ${hPt.lname || ""}`.trim();
          ptCid = hPt.cid || "-";
          isDeceased = hPt.death === "Y";
          villageName = villageMap.get(String(hPt.moopart).trim()) || (hPt.moopart ? `หมู่ ${hPt.moopart}` : "บุคคลนอกเขต");
          if (hPt.birthday) {
            const ageDifMs = Date.now() - new Date(hPt.birthday).getTime();
            ptAge = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
          }
        }
      } else if (c.ems_patient) {
        ptName = `${c.ems_patient.pname || ""}${c.ems_patient.fname || ""} ${c.ems_patient.lname || ""}`.trim();
        ptCid = c.ems_patient.id_card_no || c.ems_patient.passport_no || "-"; // 🌟 ตรงตาม schema: id_card_no
        ptAge = c.ems_patient.age || "-";
      }

      if (ptName === "ไม่ระบุชื่อ / นิรนาม" && c.caller_name) {
        ptName = c.caller_name;
      }

      return {
        id: c.id,
        case_number: c.case_number,
        created_at: c.created_at,
        triage_level: c.triage_level,
        status: c.status,
        incident_address: c.incident_address,
        chief_complaint: c.chief_complaint || "-",
        patient: {
          name: ptName,
          hn: c.patient_hn || (c.ems_patient_id ? `ID: ${c.ems_patient_id}` : "-"),
          cid: ptCid,
          age: ptAge,
          village_name: villageName,
          is_deceased: isDeceased,
        },
        dispatch: {
          vehicle_plate: vehiclePlate,
          leader_name: leaderName,
          driver_name: driverName,
        },
        treatment: {
          outcome: treatment?.initial_outcome || (c.status === "cancelled" ? "ยกเลิกเคส" : "กำลังดำเนินการ"),
          destination_hospital: treatment?.destination_hospital || "-",
        },
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCount,
        completed: completedCount,
        red: redCount,
        yellow: yellowCount,
        green: greenCount,
        white: whiteCount,
        cancelled: cancelledCount,
      },
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      },
      records,
    });
  } catch (error: any) {
    console.error("Performance Report API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}