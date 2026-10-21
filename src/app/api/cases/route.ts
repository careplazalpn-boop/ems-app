import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ========================================================
// 1. GET /api/cases (ดึงรายการเคส, ตัวกรอง, สถิติ, แบ่งหน้า)
// ========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const triage = searchParams.get("triage") || "all";

    const skip = (page - 1) * limit;

    // 1.1 สร้างเงื่อนไขตัวกรอง (Where Clause)
    const where: any = {};

    if (status === "cancelled") {
      where.status = "cancelled";
    } else if (status !== "all") {
      where.status = status;
    } else {
      if (triage !== "all") {
        where.status = { not: "cancelled" };
      }
    }

    if (triage !== "all") {
      where.triage_level = triage;
    }

    if (search) {
      where.OR = [
        { case_number: { contains: search } },
        { patient_hn: { contains: search } },
        { caller_name: { contains: search } },
        { caller_phone: { contains: search } },
        { incident_address: { contains: search } },
      ];
    }

    // 1.2 นับสถิติสรุปภาพรวม (KPI Cards) และดึงข้อมูลเคส
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
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        include: {
          ems_patient: true,
          attachments: {
            take: 1,
            orderBy: { id: "desc" },
          },
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

    // 1.3 รวบรวม HN ทั้งหมดที่มีเพื่อนำไปค้นหาในตาราง patient
    const rawHns = cases
      .map((c) => c.patient_hn?.trim())
      .filter((hn): hn is string => Boolean(hn && hn !== "-"));

    const searchHns = Array.from(
      new Set(
        rawHns.flatMap((hn) => [
          hn,
          hn.padStart(9, "0"),
          hn.padStart(7, "0"),
          String(parseInt(hn, 10)),
        ])
      )
    );

    const hospitalPatients =
      searchHns.length > 0
        ? await prisma.patient.findMany({
            where: {
              hn: { in: searchHns },
            },
            select: {
              hn: true,
              pname: true,
              fname: true,
              lname: true,
            },
          })
        : [];

    const hospitalPtMap = new Map<string, any>();
    hospitalPatients.forEach((p) => {
      const cleanHn = p.hn.trim();
      hospitalPtMap.set(cleanHn, p);
      hospitalPtMap.set(String(parseInt(cleanHn, 10)), p);
    });

    // 1.4 รวบรวมข้อมูลหัวหน้าชุดปฏิบัติการ
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

    // 1.5 ประกอบข้อมูลเคส (formattedCases)
    const formattedCases = cases.map((c) => {
      let resolvedName = "";
      let resolvedHn = c.patient_hn || "-";
      const currentHn = c.patient_hn ? c.patient_hn.trim() : "";

      if (currentHn) {
        const hp = hospitalPtMap.get(currentHn) || hospitalPtMap.get(String(parseInt(currentHn, 10)));
        if (hp) {
          resolvedName = `${hp.pname || ""}${hp.fname || ""} ${hp.lname || ""}`.trim();
          resolvedHn = hp.hn;
        }
      }

      if (!resolvedName && c.ems_patient) {
        const ep = c.ems_patient;
        resolvedName = `${ep.pname || ""}${ep.fname || ""} ${ep.lname || ""}`.trim();
        resolvedHn = ep.id ? `ID: ${ep.id}` : resolvedHn;
      }

      if (!resolvedName && c.caller_name) {
        resolvedName = c.caller_name;
      }

      if (!resolvedName) {
        resolvedName = "ไม่ระบุชื่อ / นิรนาม";
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

      const fallbackImage =
        c.attachments && c.attachments.length > 0 ? c.attachments[0].file_path : null;

      return {
        ...c,
        resolved_patient_name: resolvedName,
        resolved_hn: resolvedHn,
        initial_outcome: initialOutcome,
        destination_hospital: destinationHospital,
        leader_name: leaderName,
        case_image: fallbackImage,
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

// ========================================================
// 2. POST /api/cases (สำหรับสร้างและบันทึกเคสใหม่)
// ========================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 2.1 สร้างรหัสเคสอัตโนมัติหากไม่ได้ส่งมา
    let caseNumber = body.case_number;
    if (!caseNumber) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      caseNumber = `EMS-${dateStr}-${randomSuffix}`;
    }

    // 2.2 แปลงค่าพิกัดให้เป็น Float อย่างปลอดภัย
    const latRaw = body.latitude !== undefined ? body.latitude : body.incident_latitude;
    const lngRaw = body.longitude !== undefined ? body.longitude : body.incident_longitude;
    const latitude =
      latRaw !== null && latRaw !== "" && latRaw !== undefined ? parseFloat(latRaw) : null;
    const longitude =
      lngRaw !== null && lngRaw !== "" && lngRaw !== undefined ? parseFloat(lngRaw) : null;

    // 2.3 ดึงค่า HN และ EMS Patient ID (รองรับทั้ง body.patient_hn และ body.hn)
    const resolvedHn = (body.patient_hn || body.hn || "").trim() || null;
    const emsPtId = body.ems_patient_id ? parseInt(body.ems_patient_id, 10) : null;

    // 2.4 บันทึกลงตาราง ems_cases (ไม่ส่ง user_id เนื่องจากไม่มีใน Schema)
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
        patient_source: body.patient_source || (resolvedHn ? "HOSPITAL" : "EMS"),
        patient_hn: resolvedHn,
        ems_patient_id: emsPtId,
        chief_complaint: body.chief_complaint || null,
        insurance_type: body.insurance_type || null,
        insurance_code: body.insurance_code || null,
        insurance_hosp_code: body.insurance_hosp_code || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 2.5 ส่งคืน Response ครอบคลุมทั้งแบบ Flat, .data และ .case
    return NextResponse.json(
      {
        ...newCase,
        id: newCase.id,
        case_id: newCase.id,
        case_number: newCase.case_number,
        success: true,
        case: newCase,
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