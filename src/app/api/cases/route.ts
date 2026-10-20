import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. GET /api/cases (คง Logic เดิมทั้งหมด 100%)
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const triage = searchParams.get("triage") || "all";

    const skip = (page - 1) * limit;

    // 1. สร้างเงื่อนไขตัวกรอง (Where Clause)
    const where: any = {};

    // จัดการเงื่อนไข Status
    if (status === "cancelled") {
      where.status = "cancelled";
    } else if (status !== "all") {
      where.status = status;
    } else {
      if (triage !== "all") {
        where.status = { not: "cancelled" };
      }
    }

    // จัดการเงื่อนไข Triage (ความรุนแรง)
    if (triage !== "all") {
      where.triage_level = triage;
    }

    // จัดการเงื่อนไขคำค้นหา (Search)
    if (search) {
      where.OR = [
        { case_number: { contains: search } },
        { patient_hn: { contains: search } },
        { caller_name: { contains: search } },
        { caller_phone: { contains: search } },
        { incident_address: { contains: search } },
      ];
    }

    // 2. นับสถิติสรุปภาพรวม (KPI Summary)
    const [
      totalActive,
      redCount,
      yellowCount,
      greenCount,
      whiteCount,
      cancelledCount,
      totalMatchingCases,
      cases,
    ] = await Promise.all([
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" } },
      }),
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "red" },
      }),
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "yellow" },
      }),
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "green" },
      }),
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "white" },
      }),
      prisma.ems_cases.count({
        where: { status: "cancelled" },
      }),
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
    ]);

    // 3. รวบรวม HN สำหรับดึงชื่อผู้ป่วยจากตาราง patient
    const hospitalHns = cases
      .filter((c) => c.patient_source === "HOSPITAL" && c.patient_hn)
      .map((c) => c.patient_hn as string);

    const hospitalPatients =
      hospitalHns.length > 0
        ? await prisma.patient.findMany({
            where: { hn: { in: hospitalHns } },
            select: { hn: true, pname: true, fname: true, lname: true },
          })
        : [];

    const hospitalPtMap = new Map(hospitalPatients.map((p) => [p.hn, p]));

    // 4. รวบรวม User ID หัวหน้าชุด
    const leaderUserIds: number[] = [];
    cases.forEach((c) => {
      const latestDisp = c.dispatches[0];
      if (latestDisp?.staffs) {
        const leader = latestDisp.staffs.find(
          (s) =>
            s.note?.toLowerCase() === "leader" ||
            s.role_type?.toLowerCase() === "team_leader" ||
            s.role_type?.toLowerCase() === "leader"
        );
        if (leader) leaderUserIds.push(leader.user_id);
      }
    });

    const leaders =
      leaderUserIds.length > 0
        ? await prisma.users.findMany({
            where: { user_id: { in: leaderUserIds } },
            select: { user_id: true, fullname: true },
          })
        : [];

    const leaderMap = new Map(leaders.map((u) => [u.user_id, u.fullname]));

    // 5. จัดรูปแบบข้อมูลเคส (formattedCases)
    const formattedCases = cases.map((c) => {
      let resolvedName = "ไม่ระบุชื่อ / นิรนาม";
      let resolvedHn = "-";

      if (c.patient_source === "HOSPITAL") {
        const hp = c.patient_hn ? hospitalPtMap.get(c.patient_hn) : null;
        if (hp) {
          resolvedName = `${hp.pname || ""}${hp.fname || ""} ${hp.lname || ""}`.trim();
        }
        resolvedHn = c.patient_hn || "-";
      } else {
        const ep = c.ems_patient;
        if (ep) {
          resolvedName = `${ep.pname || ""}${ep.fname || ""} ${ep.lname || ""}`.trim();
          resolvedHn = ep.id ? `ID: ${ep.id}` : "-";
        }
      }

      const latestTreatment = c.treatments[0] || null;
      const initialOutcome = latestTreatment?.initial_outcome || "กำลังดำเนินการ";
      const destinationHospital = latestTreatment?.destination_hospital || "-";

      const latestDisp = c.dispatches[0] || null;
      let leaderName = "ยังไม่ระบุหัวหน้าชุด";
      if (latestDisp?.staffs) {
        const leader = latestDisp.staffs.find(
          (s) =>
            s.note?.toLowerCase() === "leader" ||
            s.role_type?.toLowerCase() === "team_leader" ||
            s.role_type?.toLowerCase() === "leader"
        );
        if (leader && leaderMap.has(leader.user_id)) {
          leaderName = leaderMap.get(leader.user_id) || "ยังไม่ระบุหัวหน้าชุด";
        }
      }

      return {
        ...c,
        resolved_patient_name: resolvedName,
        resolved_hn: resolvedHn,
        initial_outcome: initialOutcome,
        destination_hospital: destinationHospital,
        leader_name: leaderName,
      };
    });

    return NextResponse.json({
      success: true,
      cases: formattedCases,
      summary: {
        total: totalActive,
        red: redCount,
        yellow: yellowCount,
        green: greenCount,
        white: whiteCount,
        cancelled: cancelledCount,
      },
      pagination: {
        page,
        limit,
        total: totalMatchingCases,
        totalPages: Math.ceil(totalMatchingCases / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching cases list:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงรายการเคส" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST /api/cases (สำหรับสร้างเคสใหม่)
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. สร้างเลขเคสอัตโนมัติหากไม่ได้ส่งมา
    let caseNumber = body.case_number;
    if (!caseNumber) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      caseNumber = `EMS-${dateStr}-${randomSuffix}`;
    }

    // 2. แปลงพิกัด (รองรับทั้ง latitude และ incident_latitude)
    const latRaw = body.latitude !== undefined ? body.latitude : body.incident_latitude;
    const lngRaw = body.longitude !== undefined ? body.longitude : body.incident_longitude;
    const latitude = latRaw !== null && latRaw !== "" && latRaw !== undefined ? parseFloat(latRaw) : null;
    const longitude = lngRaw !== null && lngRaw !== "" && lngRaw !== undefined ? parseFloat(lngRaw) : null;

    // 3. บันทึกลงตาราง ems_cases (ไม่ส่ง user_id เนื่องจากไม่มีใน Schema)
    const newCase = await prisma.ems_cases.create({
      data: {
        case_number: caseNumber,
        caller_name: body.caller_name || null,
        caller_phone: body.caller_phone || null,
        incident_address: body.incident_address || "ไม่ระบุที่อยู่เกิดเหตุ",
        latitude: latitude,
        longitude: longitude,
        triage_level: body.triage_level || "white",
        status: body.status || "pending",
        patient_source: body.patient_source || "EMS",
        patient_hn: body.patient_hn || null,
        chief_complaint: body.chief_complaint || null,
        insurance_type: body.insurance_type || null,
        insurance_code: body.insurance_code || null,
        insurance_hosp_code: body.insurance_hosp_code || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 🌟 คืนค่าแบบ Flat + Nested data เพื่อให้ฝั่ง Frontend ทุกแบบอ่านค่าได้ทันที
    return NextResponse.json(
      {
        ...newCase,
        id: newCase.id,
        case_id: newCase.id,
        success: true,
        data: newCase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating EMS case:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "เกิดข้อผิดพลาดในการสร้างเคสใหม่",
      },
      { status: 500 }
    );
  }
}