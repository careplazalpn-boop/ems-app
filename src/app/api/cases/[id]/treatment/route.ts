import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงข้อมูลเคส, ทีมปฏิบัติการเดิม, ข้อมูลการรักษา (ถ้ามี) และรูปภาพแนบ
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 });
    }

    // 1. ดึงข้อมูลเคสหลักและข้อมูลผู้ป่วย
    const emsCase = await prisma.ems_cases.findUnique({
      where: { id: caseId },
      include: {
        ems_patient: true,
      },
    });

    if (!emsCase) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเคสที่ระบุ" }, { status: 404 });
    }

    // 2. ดึงข้อมูล Dispatch และเจ้าหน้าที่ทีมปฏิบัติการ
    let dispatchInfo: any = null;
    try {
      const latestDispatch = await prisma.ems_dispatches.findFirst({
        where: { case_id: caseId },
        include: {
          staffs: true,
        },
        orderBy: { id: "desc" },
      });

      if (latestDispatch) {
        const userIds = latestDispatch.staffs.map((s: any) => s.user_id);
        const usersList = await prisma.users.findMany({
          where: { user_id: { in: userIds } },
          select: { user_id: true, fullname: true, role: true },
        });
        const userMap = new Map(usersList.map((u: any) => [u.user_id, u.fullname]));

        const leader = latestDispatch.staffs.find((s: any) => s.role_type === "leader");
        const driver = latestDispatch.staffs.find((s: any) => s.role_type === "driver");
        const members = latestDispatch.staffs.filter(
          (s: any) => s.role_type === "member" || s.role_type === "assistant"
        );

        dispatchInfo = {
          vehicle_id: latestDispatch.vehicle_id,
          leader_name: leader ? userMap.get(leader.user_id) || `ID #${leader.user_id}` : "-",
          driver_name: driver ? userMap.get(driver.user_id) || `ID #${driver.user_id}` : "-",
          member_names: members.map((m: any) => userMap.get(m.user_id) || `ID #${m.user_id}`),
        };
      }
    } catch (dispErr) {
      console.error("Error reading dispatch info:", dispErr);
    }

    // 3. ดึงข้อมูลการรักษาเดิม (ใช้ findFirst ปลอดภัยที่สุด)
    let treatmentData: any = null;
    try {
      treatmentData = await prisma.ems_treatments.findFirst({
        where: { case_id: caseId },
      });
    } catch (treatErr) {
      console.error("Error reading ems_treatments:", treatErr);
    }

    // 4. ดึงรูปภาพการปฏิบัติงาน
    let attachments: any[] = [];
    try {
      attachments = await prisma.ems_case_attachments.findMany({
        where: { case_id: caseId },
        orderBy: { id: "desc" },
      });
    } catch (attErr) {
      console.error("Error reading ems_case_attachments:", attErr);
    }
    
    const safeCase = {
      ...emsCase,
      latitude: emsCase.latitude ? Number(emsCase.latitude) : null,
      longitude: emsCase.longitude ? Number(emsCase.longitude) : null,
    };

    return NextResponse.json({
      success: true,
      case: safeCase,
      dispatch: dispatchInfo,
      treatment: treatmentData,
      attachments: attachments,
    });
  } catch (error: any) {
    console.error("Error in GET /api/cases/[id]/treatment:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลการรักษา" },
      { status: 500 }
    );
  }
}

// POST / PATCH: บันทึกหรืออัปเดตข้อมูลการรักษา พร้อมพิกัดสถานที่เกิดเหตุ
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);
    const body = await request.json();

    const {
      patient_type,
      sbp,
      dbp,
      pulse_rate,
      respiratory_rate,
      spo2,
      temperature,
      dtx,
      gcs_e,
      gcs_v,
      gcs_m,
      consciousness,
      pupil_right,
      pupil_left,
      breathing_type,
      wound_types,
      deformity,
      injured_organs,
      airway_management,
      wound_management,
      splint_management,
      cpr_performed,
      initial_outcome,
      destination_hospital,
      hospital_decision_reasons,
      treatment_notes,
      recorded_by,
      case_status,
      incident_address,
      latitude,
      longitude,
    } = body;

    const payload = {
      patient_type: patient_type || "non_trauma",
      sbp: sbp !== null && sbp !== undefined && sbp !== "" ? parseInt(String(sbp), 10) : null,
      dbp: dbp !== null && dbp !== undefined && dbp !== "" ? parseInt(String(dbp), 10) : null,
      pulse_rate: pulse_rate !== null && pulse_rate !== undefined && pulse_rate !== "" ? parseInt(String(pulse_rate), 10) : null,
      respiratory_rate: respiratory_rate !== null && respiratory_rate !== undefined && respiratory_rate !== "" ? parseInt(String(respiratory_rate), 10) : null,
      spo2: spo2 !== null && spo2 !== undefined && spo2 !== "" ? parseInt(String(spo2), 10) : null,
      temperature: temperature !== null && temperature !== undefined && temperature !== "" ? parseFloat(String(temperature)) : null,
      dtx: dtx !== null && dtx !== undefined && dtx !== "" ? parseInt(String(dtx), 10) : null,
      gcs_e: gcs_e !== null && gcs_e !== undefined && gcs_e !== "" ? parseInt(String(gcs_e), 10) : null,
      gcs_v: gcs_v !== null && gcs_v !== undefined && gcs_v !== "" ? parseInt(String(gcs_v), 10) : null,
      gcs_m: gcs_m !== null && gcs_m !== undefined && gcs_m !== "" ? parseInt(String(gcs_m), 10) : null,
      consciousness: consciousness || null,
      pupil_right: pupil_right || null,
      pupil_left: pupil_left || null,
      breathing_type: breathing_type || null,
      wound_types: Array.isArray(wound_types) ? JSON.stringify(wound_types) : null,
      deformity: deformity || "none",
      injured_organs: Array.isArray(injured_organs) ? JSON.stringify(injured_organs) : null,
      airway_management: airway_management || null,
      wound_management: wound_management || null,
      splint_management: splint_management || null,
      cpr_performed: cpr_performed ? 1 : 0,
      initial_outcome: initial_outcome || null,
      destination_hospital: destination_hospital || null,
      hospital_decision_reasons: Array.isArray(hospital_decision_reasons)
        ? JSON.stringify(hospital_decision_reasons)
        : null,
      treatment_notes: treatment_notes || null,
      recorded_by: recorded_by ? parseInt(String(recorded_by), 10) : null,
      updated_at: new Date(),
    };

    // ใช้ Transaction เพื่อความปลอดภัยในการอัปเดตทั้งตาราง ems_treatments และ ems_cases
    const result = await prisma.$transaction(async (tx) => {
      // 1. บันทึกข้อมูลการรักษา
      const existingTreatment = await tx.ems_treatments.findFirst({
        where: { case_id: caseId },
      });
      let treatmentRecord;
      if (existingTreatment) {
        treatmentRecord = await tx.ems_treatments.update({
          where: { id: existingTreatment.id },
          data: payload,
        });
      } else {
        treatmentRecord = await tx.ems_treatments.create({
          data: {
            case_id: caseId,
            ...payload,
          },
        });
      }

      // 2. อัปเดตข้อมูลสถานที่ พิกัด และสถานะของเคส
      const updatedCase = await tx.ems_cases.update({
        where: { id: caseId },
        data: {
          ...(incident_address !== undefined && { incident_address }),
          ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
          ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
          status: case_status || "completed",
          updated_at: new Date(),
        },
      });

      return { treatmentRecord, updatedCase };
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลการรักษาและพิกัดเรียบร้อยแล้ว",
      treatment: result.treatmentRecord,
    });
  } catch (error: any) {
    console.error("Error in POST /api/cases/[id]/treatment:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลการรักษา" },
      { status: 500 }
    );
  }
}