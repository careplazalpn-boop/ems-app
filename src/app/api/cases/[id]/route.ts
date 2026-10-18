import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงรายละเอียดเคส, ข้อมูลผู้ป่วยตามเงื่อนไข, รถพยาบาล, เจ้าหน้าที่ และข้อมูล Dispatch เดิม
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

    // 1. ดึงข้อมูลเคสพร้อม relation ems_patient (กรณีไม่ใช่ HOSPITAL)
    const caseItem = await prisma.ems_cases.findUnique({
      where: { id: caseId },
      include: {
        ems_patient: true,
      },
    });

    if (!caseItem) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเคส" }, { status: 404 });
    }

    // 2. เงื่อนไขดึงข้อมูลจากตาราง patient เมื่อ patient_source === 'HOSPITAL'
    let hospitalPatient = null;
    if (caseItem.patient_source === "HOSPITAL" && caseItem.patient_hn) {
      hospitalPatient = await prisma.patient.findUnique({
        where: { hn: caseItem.patient_hn },
      }).catch(() => null);
    }

    // 3. ดึงรายการรถพยาบาลที่พร้อมใช้งาน
    const vehicles = await prisma.vehicles.findMany({
      where: { status: "active" },
    });

    // 4. ดึงรายชื่อเจ้าหน้าที่ทั้งหมด
    const officers = await prisma.users.findMany({
      where: { is_active: true },
      select: { user_id: true, fullname: true, role: true },
    });

    const formattedOfficers = officers.map((u) => ({
      id: u.user_id,
      name: u.fullname,
      role: u.role,
    }));

    // 5. ดึงข้อมูล Dispatch ล่าสุดและสมาชิกทีมปฏิบัติการ
    const latestDispatch = await prisma.ems_dispatches.findFirst({
      where: { case_id: caseId },
      include: {
        staffs: true,
      },
      orderBy: { id: "desc" },
    });

    let dispatchInfo = null;
    if (latestDispatch) {
      const staffList = latestDispatch.staffs || [];

      // ตรวจสอบทั้ง role_type และ note เพื่อรองรับข้อมูลทุกรูปแบบ
      const leaderRecord = staffList.find(
        (s) =>
          s.note?.toLowerCase() === "leader" ||
          s.role_type?.toLowerCase() === "team_leader" ||
          s.role_type?.toLowerCase() === "leader"
      );

      const driverRecord = staffList.find(
        (s) =>
          s.note?.toLowerCase() === "driver" ||
          s.role_type?.toLowerCase() === "driver"
      );

      // สมาชิกผู้ร่วมปฏิบัติการที่ไม่ใช่หัวหน้าชุดและคนขับ
      const memberRecords = staffList
        .filter((s) => {
          const isLeader =
            s.note?.toLowerCase() === "leader" ||
            s.role_type?.toLowerCase() === "team_leader" ||
            s.role_type?.toLowerCase() === "leader";
          const isDriver =
            s.note?.toLowerCase() === "driver" ||
            s.role_type?.toLowerCase() === "driver";
          return !isLeader && !isDriver;
        })
        .map((s) => s.user_id);

      dispatchInfo = {
        id: latestDispatch.id,
        vehicle_id: latestDispatch.vehicle_id,
        leader_id: leaderRecord ? leaderRecord.user_id : null,
        driver_id: driverRecord ? driverRecord.user_id : null,
        member_ids: memberRecords,
      };
    }

    return NextResponse.json({
      success: true,
      case: caseItem,
      hospital_patient: hospitalPatient,
      vehicles,
      officers: formattedOfficers,
      latest_dispatch: dispatchInfo,
    });
  } catch (error: any) {
    console.error("Error fetching case detail:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PATCH: บันทึกข้อมูลการสั่งการเคส หรือบันทึกการยกเลิกเคส
export async function PATCH(
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

    // 1. เตรียมข้อมูลสำหรับอัปเดต ems_cases
    const updateData: any = {
      status: body.status,
    };

    if (body.triage_level !== undefined) updateData.triage_level = body.triage_level;
    if (body.chief_complaint !== undefined) updateData.chief_complaint = body.chief_complaint;
    if (body.incident_address !== undefined) updateData.incident_address = body.incident_address;
    if (body.caller_name !== undefined) updateData.caller_name = body.caller_name;
    if (body.caller_phone !== undefined) updateData.caller_phone = body.caller_phone;

    // รองรับข้อมูลการยกเลิกเคส
    if (body.status === "cancelled") {
      updateData.cancellation_reason = body.cancellation_reason || null;
      updateData.cancellation_note = body.cancellation_note || null;
      updateData.cancelled_at = body.cancelled_at ? new Date(body.cancelled_at) : new Date();
    } else {
      // หากเปลี่ยนกลับเป็นสถานะอื่นที่ไม่ใช่ยกเลิก ให้ล้างค่าการยกเลิกออก
      if (body.cancellation_reason !== undefined) {
        updateData.cancellation_reason = body.cancellation_reason;
      }
      if (body.cancellation_note !== undefined) {
        updateData.cancellation_note = body.cancellation_note;
      }
    }

    await prisma.ems_cases.update({
      where: { id: caseId },
      data: updateData,
    });

    // 2. บันทึกข้อมูล Dispatch เฉพาะเมื่อมีการระบุรถพยาบาลและไม่ใช่การกดยกเลิกเคสแบบไม่มีรถ
    if (body.vehicle_id && body.status !== "cancelled") {
      const dispatch = await prisma.ems_dispatches.create({
        data: {
          case_id: caseId,
          vehicle_id: parseInt(body.vehicle_id, 10),
          time_dispatched: new Date(),
        },
      });

      const staffData: any[] = [];

      if (body.leader_id) {
        staffData.push({
          dispatch_id: dispatch.id,
          user_id: parseInt(body.leader_id, 10),
          role_type: "assistant",
          note: "leader",
        });
      }

      if (body.driver_id) {
        staffData.push({
          dispatch_id: dispatch.id,
          user_id: parseInt(body.driver_id, 10),
          role_type: "assistant",
          note: "driver",
        });
      }

      if (Array.isArray(body.member_ids)) {
        body.member_ids.forEach((mId: number) => {
          staffData.push({
            dispatch_id: dispatch.id,
            user_id: Number(mId),
            role_type: "assistant",
            note: "member",
          });
        });
      }

      if (staffData.length > 0) {
        await prisma.ems_dispatch_staffs.createMany({
          data: staffData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: body.status === "cancelled" ? "บันทึกการยกเลิกเคสสำเร็จ" : "บันทึกการสั่งการสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}