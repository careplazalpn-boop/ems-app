import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงข้อมูลรายละเอียดเคส ผู้ป่วย รถพยาบาล เจ้าหน้าที่ และประวัติ Dispatch
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

    // 1. ดึงข้อมูลเคส
    const emsCase = await prisma.ems_cases.findUnique({
      where: { id: caseId },
      include: {
        ems_patient: true,
      },
    });

    if (!emsCase) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเคสที่ระบุ" }, { status: 404 });
    }

    // 2. ดึงข้อมูล Dispatch ล่าสุด พร้อมรายชื่อเจ้าหน้าที่
    let latestDispatch: any = null;
    try {
      latestDispatch = await prisma.ems_dispatches.findFirst({
        where: { case_id: caseId },
        include: {
          staffs: true,
        },
        orderBy: { id: "desc" },
      });
    } catch (dispErr) {
      console.error("Error reading ems_dispatches:", dispErr);
    }

    // 3. ดึงข้อมูลผู้ป่วย รพ.
    let hospitalPatient: any = null;
    if (emsCase.patient_hn) {
      try {
        const pt = await prisma.patient.findFirst({
          where: { hn: emsCase.patient_hn },
        });

        if (pt) {
          let calculatedAge = null;
          if (pt.birthday) {
            const bDate = new Date(pt.birthday);
            const today = new Date();
            let age = today.getFullYear() - bDate.getFullYear();
            const m = today.getMonth() - bDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
            calculatedAge = age >= 0 ? age : null;
          }

          hospitalPatient = {
            hn: pt.hn,
            name: `${pt.pname || ""}${pt.fname || ""} ${pt.lname || ""}`.trim(),
            gender: pt.sex === "1" ? "ชาย" : pt.sex === "2" ? "หญิง" : "ไม่ระบุ",
            age: calculatedAge !== null ? `${calculatedAge} ปี` : "-",
            blood_group: (pt as any).bloodgrp?.trim() || (pt as any).bloodgroup?.trim() || "-",
            phone: (pt as any).mobile_phone_number?.trim() || (pt as any).hometel?.trim() || "-",
            address: (pt as any).address_full?.trim() || "-",
            is_deceased: pt.death === "Y" || pt.death === "1",
          };
        }
      } catch (err) {
        console.error("Error fetching hospital patient:", err);
      }
    }

    // 4. ดึงรายการรถพยาบาล
    let availableVehicles: any[] = [];
    try {
      const rawVehicles: any[] = await prisma.$queryRaw`
        SELECT vehicle_id, plate_number, vehicle_type, brand 
        FROM vehicles 
        ORDER BY vehicle_id ASC
      `;
      availableVehicles = rawVehicles.map((v) => ({
        vehicle_id: Number(v.vehicle_id),
        plate_number: v.plate_number || `รถรหัส ${v.vehicle_id}`,
        brand: v.brand || "",
        vehicle_type: v.vehicle_type || "",
      }));
    } catch (vErr) {
      console.error("Error reading vehicles via queryRaw:", vErr);
    }

    // 5. ดึงเจ้าหน้าที่จากตาราง users
    let emsOfficers: any[] = [];
    try {
      const uList = await prisma.users.findMany({
        where: {
          OR: [
            { role: "ems" },
            { role: "Supervisor" },
            { role: "supervisor" },
            { role: "EMS" },
          ],
        },
        select: {
          user_id: true,
          fullname: true,
          role: true,
          phone: true,
          username: true,
        },
        orderBy: { fullname: "asc" },
      });

      emsOfficers = uList.map((u: any) => ({
        id: u.user_id,
        name: u.fullname?.trim() || u.username || `เจ้าหน้าที่ ID #${u.user_id}`,
        role: u.role,
        phone: u.phone || "-",
      }));
    } catch (uErr) {
      console.error("Error reading users:", uErr);
    }

    // แปลงข้อมูล staffs (อ่านบทบาทจาก note หรือ role เผื่อไว้ทั้งสองแบบ)
    let formattedDispatch = null;
    if (latestDispatch) {
      const leaderStaff = latestDispatch.staffs?.find(
        (s: any) => s.note === "leader" || s.role === "leader"
      );
      const driverStaff = latestDispatch.staffs?.find(
        (s: any) => s.note === "driver" || s.role === "driver"
      );
      const memberStaffs = latestDispatch.staffs?.filter(
        (s: any) =>
          s.note === "member" ||
          s.role === "member" ||
          (!s.note && !s.role) ||
          (s.note !== "leader" && s.note !== "driver")
      );

      formattedDispatch = {
        id: latestDispatch.id,
        vehicle_id: latestDispatch.vehicle_id,
        leader_id: leaderStaff ? leaderStaff.user_id : null,
        driver_id: driverStaff ? driverStaff.user_id : null,
        member_ids: memberStaffs ? memberStaffs.map((s: any) => s.user_id) : [],
      };
    }

    const safeCase = {
      ...emsCase,
      latitude: emsCase.latitude ? Number(emsCase.latitude) : null,
      longitude: emsCase.longitude ? Number(emsCase.longitude) : null,
    };

    return NextResponse.json({
      success: true,
      case: safeCase,
      hospital_patient: hospitalPatient,
      vehicles: availableVehicles,
      officers: emsOfficers,
      latest_dispatch: formattedDispatch,
    });
  } catch (error: any) {
    console.error("Error in GET /api/cases/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลเคส" },
      { status: 500 }
    );
  }
}

// PATCH: บันทึกข้อมูลเคส + Dispatch + เจ้าหน้าที่ (ใช้ note แทน role)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);
    const body = await request.json();

    const {
      status,
      triage_level,
      chief_complaint,
      incident_address,
      caller_name,
      caller_phone,
      vehicle_id,
      leader_id,
      driver_id,
      member_ids,
    } = body;

    const parsedVehicleId = vehicle_id ? parseInt(String(vehicle_id), 10) : null;
    const parsedLeaderId = leader_id ? parseInt(String(leader_id), 10) : null;
    const parsedDriverId = driver_id ? parseInt(String(driver_id), 10) : null;
    const parsedMemberIds = Array.isArray(member_ids)
      ? member_ids.map((m: any) => parseInt(String(m), 10)).filter(Boolean)
      : [];

    const result = await prisma.$transaction(async (tx) => {
      // 1. อัปเดตข้อมูลในตาราง ems_cases
      const updatedCase = await tx.ems_cases.update({
        where: { id: caseId },
        data: {
          status: status || "dispatched",
          triage_level: triage_level || "yellow",
          chief_complaint: chief_complaint || null,
          incident_address: incident_address || "",
          caller_name: caller_name || null,
          caller_phone: caller_phone || null,
          updated_at: new Date(),
        },
      });

      // 2. จัดการตาราง ems_dispatches
      const existingDispatch = await tx.ems_dispatches.findFirst({
        where: { case_id: caseId },
        orderBy: { id: "desc" },
      });

      let dispatchId: number;

      if (existingDispatch) {
        dispatchId = existingDispatch.id;
        await tx.ems_dispatches.update({
          where: { id: dispatchId },
          data: {
            vehicle_id: parsedVehicleId,
          },
        });

        // ล้างข้อมูล staffs เดิมของ dispatch นี้
        await tx.ems_dispatch_staffs.deleteMany({
          where: { dispatch_id: dispatchId },
        });
      } else {
        const newDispatch = await tx.ems_dispatches.create({
          data: {
            case_id: caseId,
            vehicle_id: parsedVehicleId,
            time_dispatched: new Date(),
          },
        });
        dispatchId = newDispatch.id;
      }

      // 3. เตรียมข้อมูลทีมเจ้าหน้าที่ โดยบันทึกบทบาทลงคอลัมน์ note
      const staffData: { dispatch_id: number; user_id: number; note: string }[] = [];

      if (parsedLeaderId) {
        staffData.push({
          dispatch_id: dispatchId,
          user_id: parsedLeaderId,
          note: "leader",
        });
      }

      if (parsedDriverId) {
        staffData.push({
          dispatch_id: dispatchId,
          user_id: parsedDriverId,
          note: "driver",
        });
      }

      parsedMemberIds.forEach((uid: number) => {
        if (uid !== parsedLeaderId && uid !== parsedDriverId) {
          staffData.push({
            dispatch_id: dispatchId,
            user_id: uid,
            note: "member",
          });
        }
      });

      // 4. บันทึกลง ems_dispatch_staffs
      if (staffData.length > 0) {
        await tx.ems_dispatch_staffs.createMany({
          data: staffData,
        });
      }

      return { updatedCase, dispatchId };
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลการสั่งการและทีมปฏิบัติการเรียบร้อยแล้ว",
      case: result.updatedCase,
      dispatch_id: result.dispatchId,
    });
  } catch (error: any) {
    console.error("CRITICAL ERROR in PATCH /api/cases/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลเคส" },
      { status: 500 }
    );
  }
}