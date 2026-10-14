import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึงข้อมูลเคส + รถพยาบาล + เจ้าหน้าที่ EMS/Supervisor
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

    // 1. ดึงข้อมูลเคสพร้อมประวัติการส่งรถ (dispatches)
    const emsCase = await prisma.ems_cases.findUnique({
      where: { id: caseId },
      include: {
        ems_patient: true,
        dispatches: {
          orderBy: { id: "desc" },
          take: 1,
        },
      },
    });

    if (!emsCase) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเคสที่ระบุ" }, { status: 404 });
    }

    // 2. ดึงข้อมูลผู้ป่วย รพ. (ถ้ามี patient_hn)
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

          const phone =
            (pt as any).mobile_phone_number?.trim() ||
            (pt as any).hometel?.trim() ||
            (pt as any).informtel?.trim() ||
            "-";

          const address =
            (pt as any).address_full?.trim() ||
            [
              (pt as any).addrpart ? `บ้านเลขที่ ${(pt as any).addrpart}` : "",
              (pt as any).moopart ? `หมู่ ${(pt as any).moopart}` : "",
              (pt as any).road ? `ถ.${(pt as any).road}` : "",
            ]
              .filter(Boolean)
              .join(" ") || "-";

          hospitalPatient = {
            hn: pt.hn,
            name: `${pt.pname || ""}${pt.fname || ""} ${pt.lname || ""}`.trim(),
            gender: pt.sex === "1" ? "ชาย" : pt.sex === "2" ? "หญิง" : "ไม่ระบุ",
            age: calculatedAge !== null ? `${calculatedAge} ปี` : "-",
            blood_group: (pt as any).bloodgrp?.trim() || (pt as any).bloodgroup?.trim() || "-",
            phone: phone,
            address: address,
            is_deceased: pt.death === "Y" || pt.death === "1",
          };
        }
      } catch (err) {
        console.error("Error fetching hospital patient:", err);
      }
    }

    // 3. ดึงรายการรถพยาบาลจากตาราง vehicles (แสดง plate_number)
    let availableVehicles: any[] = [];
    try {
      const vList = await prisma.vehicles.findMany({
        select: {
          vehicle_id: true,
          plate_number: true,
          vehicle_type: true,
          brand: true,
          status: true,
        },
        orderBy: { vehicle_id: "asc" },
      });

      availableVehicles = vList.map((v) => ({
        vehicle_id: v.vehicle_id,
        plate_number: v.plate_number,
        brand: v.brand || "",
        vehicle_type: v.vehicle_type || "",
        status: String(v.status || "active"),
      }));
    } catch (vErr) {
      console.error("Error reading vehicles:", vErr);
    }

    // 4. ดึงเจ้าหน้าที่จากตาราง users กรองเฉพาะ role = 'ems' หรือ 'Supervisor'
   let emsOfficers: any[] = [];
    try {
      const rawUsers = await prisma.users.findMany({
        where: {
          OR: [
            { role: "ems" },
            { role: "Supervisor" },
            { role: "supervisor" },
            { role: "EMS" },
          ],
        },
        // ไม่ต้องระบุ select หรือถ้าใส่ select ให้ระบุ fullname ให้ชัดเจน
        select: {
          user_id: true,
          fullname: true,
          role: true,
          phone: true,
          username: true,
        },
        orderBy: { fullname: "asc" },
      });

      emsOfficers = rawUsers.map((u: any) => {
        // ดึงค่า fullname เป็นหลัก หากไม่มีให้ลองดู u.name หรือ u.username
        const displayName = u.fullname?.trim() || u.name?.trim() || u.username || `เจ้าหน้าที่ ID #${u.user_id}`;

        return {
          id: u.user_id,
          name: displayName, // ส่งค่า displayName ไปเป็น name ให้หน้าบ้าน
          role: u.role,
          phone: u.phone || "-",
        };
      });
    } catch (uErr) {
      console.error("Error reading users:", uErr);
    }
    // แปลง Decimal เป็นตัวเลข เพื่อไม่ให้ JSON Serialize พัง
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
      latest_dispatch: emsCase.dispatches?.[0] || null,
    });
  } catch (error: any) {
    console.error("Error in GET /api/cases/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลเคส" },
      { status: 500 }
    );
  }
}

// PATCH: บันทึกข้อมูลเคส + บันทึกการส่งรถและเจ้าหน้าที่
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
      member_ids, // array ของ id ผู้ร่วมปฏิบัติการ
    } = body;

    // 1. อัปเดตข้อมูลตาราง ems_cases
    const updatedCase = await prisma.ems_cases.update({
      where: { id: caseId },
      data: {
        ...(status && { status }),
        ...(triage_level && { triage_level }),
        ...(chief_complaint && { chief_complaint }),
        ...(incident_address && { incident_address }),
        ...(caller_name && { caller_name }),
        ...(caller_phone && { caller_phone }),
        updated_at: new Date(),
      },
    });

    // 2. ถ้ามีการเลือกรถ หรือระบุเจ้าหน้าที่ ให้บันทึกลง ems_dispatches
    if (vehicle_id || leader_id || driver_id || (member_ids && member_ids.length > 0)) {
      try {
        const teamMembersJson = JSON.stringify({
          leader_id: leader_id ? parseInt(leader_id, 10) : null,
          driver_id: driver_id ? parseInt(driver_id, 10) : null,
          members: Array.isArray(member_ids) ? member_ids.map((m: any) => parseInt(m, 10)) : [],
        });

        await prisma.ems_dispatches.create({
          data: {
            case_id: caseId,
            vehicle_id: vehicle_id ? parseInt(vehicle_id, 10) : null,
            team_members: teamMembersJson,
            dispatched_at: new Date(),
            status: "dispatched",
          },
        });

        // หากสถานะเคสยังเป็น pending ให้ปรับเป็น dispatched อัตโนมัติ
        if (updatedCase.status === "pending" && vehicle_id) {
          await prisma.ems_cases.update({
            where: { id: caseId },
            data: { status: "dispatched" },
          });
        }
      } catch (dispErr) {
        console.error("Error creating dispatch record:", dispErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกการสั่งการและทีมปฏิบัติการเรียบร้อยแล้ว",
      case: updatedCase,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/cases/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
      { status: 500 }
    );
  }
}