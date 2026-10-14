import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงรายการเคสรับแจ้งเหตุ พร้อมระบบค้นหาและกรองสถานะ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const triage = searchParams.get("triage")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    // เงื่อนไข Filter สำหรับ ems_cases
    const whereCondition: any = {};

    if (status && status !== "all") {
      whereCondition.status = status;
    }

    if (triage && triage !== "all") {
      whereCondition.triage_level = triage;
    }

    if (search) {
      whereCondition.OR = [
        { case_number: { contains: search } },
        { patient_hn: { contains: search } },
        { caller_name: { contains: search } },
        { caller_phone: { contains: search } },
        { incident_address: { contains: search } },
        { chief_complaint: { contains: search } },
        { ems_patient: { fname: { contains: search } } },
        { ems_patient: { lname: { contains: search } } },
        { ems_patient: { id_card_no: { contains: search } } },
      ];
    }

    // นับจำนวนทั้งหมด
    const totalCount = await prisma.ems_cases.count({
      where: whereCondition,
    });

    // ดึงรายการเคส
    const cases = await prisma.ems_cases.findMany({
      where: whereCondition,
      include: {
        ems_patient: true,
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    // รวบรวม HN เพื่อ Query ดึงข้อมูลชื่อผู้ป่วยจากตาราง hospital patient แบบรวดเร็ว
    const hnList = cases
      .filter((c) => c.patient_hn)
      .map((c) => c.patient_hn as string);

    let hospitalPatientsMap = new Map<string, any>();
    if (hnList.length > 0) {
      const hospitalPts = await prisma.patient.findMany({
        where: {
          hn: { in: hnList },
        },
        select: {
          hn: true,
          pname: true,
          fname: true,
          lname: true,
          sex: true,
          birthday: true,
          death: true,
        },
      });

      hospitalPts.forEach((pt) => {
        hospitalPatientsMap.set(pt.hn, pt);
      });
    }

    // ฟังก์ชันคำนวณอายุ
    const calculateAge = (birthday: Date | string | null) => {
      if (!birthday) return null;
      const bDate = new Date(birthday);
      if (isNaN(bDate.getTime())) return null;
      const diff = Date.now() - bDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Format ข้อมูลเคสพร้อมข้อมูลผู้ป่วยแบบครบถ้วน
    const formattedCases = cases.map((c) => {
      let patientInfo = {
        name: "ไม่ระบุชื่อ / นิรนาม",
        gender: "ไม่ระบุ",
        age: "-",
        hn: c.patient_hn || "-",
        is_deceased: false,
      };

      if (c.patient_source === "HOSPITAL" && c.patient_hn) {
        const hPt = hospitalPatientsMap.get(c.patient_hn);
        if (hPt) {
          const age = calculateAge(hPt.birthday);
          patientInfo = {
            name: `${hPt.pname || ""}${hPt.fname || ""} ${hPt.lname || ""}`.trim(),
            gender: hPt.sex === "1" ? "ชาย" : hPt.sex === "2" ? "หญิง" : "ไม่ระบุ",
            age: age !== null ? `${age} ปี` : "-",
            hn: hPt.hn,
            is_deceased: hPt.death === "Y" || hPt.death === "1",
          };
        }
      } else if (c.ems_patient) {
        patientInfo = {
          name: `${c.ems_patient.pname || ""}${c.ems_patient.fname || ""} ${c.ems_patient.lname || ""}`.trim(),
          gender:
            c.ems_patient.gender === "1"
              ? "ชาย"
              : c.ems_patient.gender === "2"
              ? "หญิง"
              : "ไม่ระบุ",
          age: c.ems_patient.age ? `${c.ems_patient.age} ปี` : "-",
          hn: "-",
          is_deceased: false,
        };
      }

      return {
        id: c.id,
        case_number: c.case_number,
        patient_source: c.patient_source,
        triage_level: c.triage_level,
        status: c.status,
        incident_address: c.incident_address,
        chief_complaint: c.chief_complaint || "ไม่ได้ระบุอาการ",
        caller_name: c.caller_name || "-",
        caller_phone: c.caller_phone || "-",
        latitude: c.latitude ? Number(c.latitude) : null,
        longitude: c.longitude ? Number(c.longitude) : null,
        created_at: c.created_at,
        patient: patientInfo,
      };
    });

    // สรุปยอด KPI สำหรับ Quick Filter
    const summary = {
      total: await prisma.ems_cases.count(),
      pending: await prisma.ems_cases.count({ where: { status: "pending" } }),
      dispatched: await prisma.ems_cases.count({ where: { status: "dispatched" } }),
      on_scene: await prisma.ems_cases.count({ where: { status: "on_scene" } }),
      completed: await prisma.ems_cases.count({ where: { status: "completed" } }),
      red: await prisma.ems_cases.count({ where: { triage_level: "red" } }),
    };

    return NextResponse.json({
      success: true,
      cases: formattedCases,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching EMS cases:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลรายการเคสได้" },
      { status: 500 }
    );
  }
}

// POST: บันทึกเคสใหม่ (โค้ดตามที่เราปรับแก้ร่วมกันไว้)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      patient_source,
      hn,
      ems_patient_id,
      id_type,
      cid,
      passport_no,
      nationality,
      pname,
      fname,
      lname,
      gender,
      age,
      blood_group,
      patient_phone,
      patient_address,
      village_name,
      latitude,
      longitude,
      insurance_type,
      insurance_code,
      caller_name,
      caller_phone,
      incident_address,
      chief_complaint,
      triage_level,
    } = body;

    if (!fname || !incident_address) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ป่วย และสถานที่เกิดเหตุ" },
        { status: 400 }
      );
    }

    let formattedGender: string = "1";
    const rawGender = String(gender || "").trim().toLowerCase();
    if (rawGender === "2" || rawGender === "female") {
      formattedGender = "2";
    }

    let targetEmsPatientId: number | null = ems_patient_id || null;

    if (!hn && !targetEmsPatientId) {
      const newEmsPatient = await prisma.ems_patients.create({
        data: {
          id_card_no: cid?.trim() || null,
          passport_no: passport_no?.trim() || null,
          nationality: nationality?.trim() || "ไทย",
          pname: pname?.trim() || null,
          fname: fname.trim(),
          lname: lname?.trim() || null,
          gender: formattedGender,
          age: age ? parseInt(String(age), 10) : null,
          phone: patient_phone?.trim() || null,
          address_full: patient_address?.trim() || null,
          created_at: new Date(),
        },
      });
      targetEmsPatientId = newEmsPatient.id;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    const lastCase = await prisma.ems_cases.findFirst({
      where: {
        case_number: {
          startsWith: `EMS-${datePrefix}-`,
        },
      },
      orderBy: { id: "desc" },
      select: { case_number: true },
    });

    let nextRunning = 1;
    if (lastCase?.case_number) {
      const parts = lastCase.case_number.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextRunning = lastSeq + 1;
      }
    }
    const caseNumber = `EMS-${datePrefix}-${String(nextRunning).padStart(4, "0")}`;

    const validLat = latitude ? parseFloat(String(latitude)) : null;
    const validLng = longitude ? parseFloat(String(longitude)) : null;

    const newCase = await prisma.ems_cases.create({
      data: {
        case_number: caseNumber,
        patient_source: hn ? "HOSPITAL" : "TEMPORARY",
        patient_hn: hn ? String(hn).trim() : null,
        ems_patient_id: targetEmsPatientId,
        insurance_type: insurance_type?.trim() || null,
        insurance_code: insurance_code?.trim() || null,
        caller_name: caller_name?.trim() || null,
        caller_phone: caller_phone?.trim() || null,
        incident_address: incident_address.trim(),
        latitude: validLat && !isNaN(validLat) && validLat !== 0 ? validLat : null,
        longitude: validLng && !isNaN(validLng) && validLng !== 0 ? validLng : null,
        chief_complaint: chief_complaint?.trim() || null,
        triage_level: triage_level || "yellow",
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกเคสฉุกเฉินเรียบร้อยแล้ว",
      case: newCase,
    });
  } catch (error: any) {
    console.error("Error creating case in /api/cases:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลเคส" },
      { status: 500 }
    );
  }
}