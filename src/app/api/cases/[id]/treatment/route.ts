import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const caseItem = await prisma.ems_cases.findUnique({
      where: { id: caseId },
      include: {
        ems_patient: true,
      },
    });

    if (!caseItem) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเคส" }, { status: 404 });
    }

    let hospitalPatient = null;
    if (caseItem.patient_source === "HOSPITAL" && caseItem.patient_hn) {
      hospitalPatient = await prisma.patient.findUnique({
        where: { hn: caseItem.patient_hn },
      }).catch(() => null);
    }

    const treatmentData = await prisma.ems_treatments.findFirst({
      where: { case_id: caseId },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      case: caseItem,
      hospital_patient: hospitalPatient,
      treatment: treatmentData,
    });
  } catch (error: any) {
    console.error("Error fetching treatment data:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 });
    }

    const body = await request.json();

    // 🌟 แปลงค่า cpr_performed ให้เป็น Int (1 หรือ 0) ตาม schema.prisma
    const cprValue = body.cpr_performed ? 1 : 0;

    const treatmentDataPayload = {
      patient_type: body.patient_type,
      sbp: body.sbp !== "" && body.sbp !== null ? parseInt(body.sbp, 10) : null,
      dbp: body.dbp !== "" && body.dbp !== null ? parseInt(body.dbp, 10) : null,
      pulse_rate: body.pulse_rate !== "" && body.pulse_rate !== null ? parseInt(body.pulse_rate, 10) : null,
      respiratory_rate: body.respiratory_rate !== "" && body.respiratory_rate !== null ? parseInt(body.respiratory_rate, 10) : null,
      spo2: body.spo2 !== "" && body.spo2 !== null ? parseInt(body.spo2, 10) : null,
      temperature: body.temperature !== "" && body.temperature !== null ? parseFloat(body.temperature) : null,
      dtx: body.dtx !== "" && body.dtx !== null ? parseInt(body.dtx, 10) : null,
      gcs_e: body.gcs_e !== "" && body.gcs_e !== null ? parseInt(body.gcs_e, 10) : null,
      gcs_v: body.gcs_v !== "" && body.gcs_v !== null ? parseInt(body.gcs_v, 10) : null,
      gcs_m: body.gcs_m !== "" && body.gcs_m !== null ? parseInt(body.gcs_m, 10) : null,
      consciousness: body.consciousness,
      pupil_right: body.pupil_right,
      pupil_left: body.pupil_left,
      breathing_type: body.breathing_type,
      wound_types: JSON.stringify(body.wound_types || []),
      deformity: body.deformity,
      injured_organs: JSON.stringify(body.injured_organs || []),
      airway_management: body.airway_management,
      wound_management: body.wound_management,
      splint_management: body.splint_management,
      cpr_performed: cprValue, // ✅ ส่งเป็นตัวเลข 1 หรือ 0
      initial_outcome: body.initial_outcome,
      destination_hospital: body.destination_hospital,
      hospital_decision_reasons: JSON.stringify(body.hospital_decision_reasons || []),
      treatment_notes: body.treatment_notes,
    };

    const treatment = await prisma.ems_treatments.upsert({
      where: { case_id: caseId },
      update: treatmentDataPayload,
      create: {
        case_id: caseId,
        ...treatmentDataPayload,
      },
    });

    if (body.case_status || body.incident_address !== undefined) {
      await prisma.ems_cases.update({
        where: { id: caseId },
        data: {
          ...(body.case_status && { status: body.case_status }),
          ...(body.incident_address !== undefined && { incident_address: body.incident_address }),
          ...(body.latitude && { latitude: parseFloat(body.latitude) }),
          ...(body.longitude && { longitude: parseFloat(body.longitude) }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลการรักษาสำเร็จ",
      treatment,
    });
  } catch (error: any) {
    console.error("Error saving treatment data:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}