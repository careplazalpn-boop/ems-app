import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // รันเลขที่เคสอัตโนมัติ เช่น EMS-202610-0001
    const today = new Date();
    const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
    const countToday = await prisma.ems_cases.count();
    const caseNumber = `EMS-${yearMonth}-${String(countToday + 1).padStart(4, "0")}`;

    let patientSource = body.patient_source || "TEMPORARY";
    let patientHn = body.hn || null;
    let emsPatientId = body.ems_patient_id || null;

    // ถ้าเป็นคนไข้ใหม่ที่ไม่ได้มาจากตารางหลัก และยังไม่มีใน ems_patients
    if (patientSource === "NEW") {
      const newEmsPt = await prisma.ems_patients.create({
        data: {
          id_type: body.id_type || "CID",
          id_card_no: body.cid || null,
          passport_no: body.passport_no || null,
          nationality: body.nationality || "THA",
          pname: body.pname || null,
          fname: body.fname,
          lname: body.lname || null,
          gender: body.gender || "male",
          age: body.age ? parseInt(body.age) : null,
          phone: body.patient_phone || null,
          address_full: body.patient_address || null,
          is_identified: body.is_identified ?? true,
        },
      });
      emsPatientId = newEmsPt.id;
      patientSource = "TEMPORARY";
    }

    // สร้างข้อมูลเคสลงใน ems_cases
    const newCase = await prisma.ems_cases.create({
      data: {
        case_number: caseNumber,
        patient_source: patientSource,
        patient_hn: patientHn,
        ems_patient_id: emsPatientId,
        insurance_type: body.insurance_type || null,
        insurance_code: body.insurance_code || null,
        caller_name: body.caller_name || null,
        caller_phone: body.caller_phone || null,
        incident_address: body.incident_address,
        chief_complaint: body.chief_complaint || null,
        triage_level: body.triage_level || "yellow",
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error("Save case error:", error);
    return NextResponse.json({ error: error.message || "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}