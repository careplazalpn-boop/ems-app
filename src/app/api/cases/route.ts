import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // 🌟 จัดการเงื่อนไข Status
    if (status === "cancelled") {
      // ดึงเฉพาะเคสที่ยกเลิก
      where.status = "cancelled";
    } else if (status !== "all") {
      // ดึงตามสถานะที่ระบุ (เช่น pending, dispatched, completed)
      where.status = status;
    } else {
      // กรณี status === "all"
      // ถ้ามีการเลือกกรองตามระดับความรุนแรง (Triage) ให้แสดงเฉพาะเคสที่ไม่ถูกยกเลิก
      if (triage !== "all") {
        where.status = { not: "cancelled" };
      }
    }

    // 🌟 จัดการเงื่อนไข Triage (ความรุนแรง)
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

    // 2. 🌟 นับสถิติสรุปภาพรวม (KPI Summary) แยกตามระดับความรุนแรง ไม่รวมเคสยกเลิก
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
      // เคสทั้งหมดที่ไม่ถูกยกเลิก
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" } },
      }),
      // วิกฤต (Red) ไม่รวมยกเลิก
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "red" },
      }),
      // เร่งด่วน (Yellow) ไม่รวมยกเลิก
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "yellow" },
      }),
      // ไม่เร่งด่วน (Green) ไม่รวมยกเลิก
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "green" },
      }),
      // ทั่วไป (White) ไม่รวมยกเลิก
      prisma.ems_cases.count({
        where: { status: { not: "cancelled" }, triage_level: "white" },
      }),
      // เคสที่ถูกยกเลิกทั้งหมด
      prisma.ems_cases.count({
        where: { status: "cancelled" },
      }),
      // จำนวนเคสทั้งหมดที่ตรงกับตัวกรองค้นหา (สำหรับ Pagination)
      prisma.ems_cases.count({ where }),
      // ดึงรายการเคสตามเงื่อนไข
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

    const hospitalPatients = hospitalHns.length > 0
      ? await prisma.patient.findMany({
          where: { hn: { in: hospitalHns } },
          select: { hn: true, pname: true, fname: true, lname: true },
        })
      : [];

    const hospitalPtMap = new Map(hospitalPatients.map((p) => [p.hn, p]));

    // 4. รวบรวม User ID หัวหน้าชุด (หาทั้งจาก note: "leader" และ role_type: "team_leader")
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

    const leaders = leaderUserIds.length > 0
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