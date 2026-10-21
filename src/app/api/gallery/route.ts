import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 1. ดึงข้อมูลรูปภาพทั้งหมดจากตาราง ems_case_attachments
    const allAttachments = await prisma.ems_case_attachments.findMany({
      orderBy: { created_at: "desc" },
    });

    if (allAttachments.length === 0) {
      return NextResponse.json({
        success: true,
        months: [],
        totalMonths: 0,
        page,
        totalPages: 1,
      });
    }

    // 2. ดึง Case IDs ที่เกี่ยวข้องทั้งหมด
    const caseIds = Array.from(
      new Set(allAttachments.map((a) => a.case_id).filter((id): id is number => id !== null))
    );

    // 3. ดึงตารางที่เกี่ยวข้องแบบอิสระ (ไม่ใช้ Nested Include ที่ไม่มีใน Schema เพื่อตัด Error 100%)
    const [relatedCases, dispatches, vehicles, officers, villages] = await Promise.all([
      prisma.ems_cases.findMany({
        where: { id: { in: caseIds } },
        include: {
          ems_patient: true,
        },
      }),
      prisma.ems_dispatches.findMany({
        where: { case_id: { in: caseIds } },
        orderBy: { id: "desc" },
      }),
      prisma.vehicles.findMany().catch(() => []),
      prisma.users.findMany({
        select: { user_id: true, fullname: true },
      }).catch(() => []),
      prisma.village.findMany({
        select: { village_moo: true, village_name: true },
      }).catch(() => []),
    ]);

    // 4. ดึงข้อมูล staffs ประจำ dispatch
    const dispatchIds = dispatches.map((d) => d.id);
    const dispatchStaffs = await prisma.ems_dispatch_staffs.findMany({
      where: { dispatch_id: { in: dispatchIds } },
    }).catch(() => []);

    // 5. ดึงข้อมูลผู้ป่วย รพ. (กรณีมี HN)
    const hnList = Array.from(
      new Set(relatedCases.map((c) => c.patient_hn).filter((hn): hn is string => Boolean(hn)))
    );

    let hospitalPtMap = new Map<string, any>();
    if (hnList.length > 0) {
      const hospitalPts = await prisma.patient.findMany({
        where: { hn: { in: hnList } },
        select: {
          hn: true,
          pname: true,
          fname: true,
          lname: true,
          moopart: true,
          road: true,
          address_full: true,
        },
      }).catch(() => []);

      hospitalPts.forEach((pt) => {
        hospitalPtMap.set(pt.hn.trim(), pt);
      });
    }

    // สร้าง Map ต่างๆ เพื่อความเร็วระดับ O(1)
    const officerMap = new Map(officers.map((o) => [o.user_id, o.fullname]));
    const vehicleMap = new Map(vehicles.map((v: any) => [v.vehicle_id || v.id, v]));
    const villageMap = new Map<string, string>();
    villages.forEach((v: any) => {
      villageMap.set(String(v.village_moo).trim(), v.village_name);
    });
    const caseMap = new Map<number, any>(relatedCases.map((c) => [c.id, c]));

    // แมป dispatch ล่าสุดให้กับแต่ละ case_id
    const latestDispatchByCase = new Map<number, any>();
    dispatches.forEach((d) => {
      if (!latestDispatchByCase.has(d.case_id)) {
        latestDispatchByCase.set(d.case_id, d);
      }
    });

    // แมป staffs ให้กับแต่ละ dispatch_id
    const staffsByDispatch = new Map<number, any[]>();
    dispatchStaffs.forEach((st) => {
      if (!staffsByDispatch.has(st.dispatch_id)) {
        staffsByDispatch.set(st.dispatch_id, []);
      }
      staffsByDispatch.get(st.dispatch_id)!.push(st);
    });

    // 6. จัดกลุ่มรูปภาพตามเดือน (Key: YYYY-MM)
    const monthsGroup: { [key: string]: { label: string; yearCE: number; month: number; items: any[] } } = {};

    for (const att of allAttachments) {
      const d = new Date(att.created_at);

      // กรองวันที่เฉพาะเมื่อผู้ใช้งานระบุช่วงเวลา
      if (startDateParam && d < new Date(startDateParam)) continue;
      if (endDateParam && d > new Date(endDateParam + "T23:59:59.999Z")) continue;

      const yearCE = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthKey = `${yearCE}-${String(monthNum).padStart(2, "0")}`;
      const yearBE = yearCE + 543;
      const monthLabel = `ประจำเดือน ${MONTH_NAMES_TH[d.getMonth()]} ${yearBE}`;

      if (!monthsGroup[monthKey]) {
        monthsGroup[monthKey] = {
          label: monthLabel,
          yearCE,
          month: monthNum,
          items: [],
        };
      }

      const c: any = att.case_id ? caseMap.get(att.case_id) : null;
      const dispatch = c?.id ? latestDispatchByCase.get(c.id) : null;
      const staffs = dispatch?.id ? staffsByDispatch.get(dispatch.id) || [] : [];

      // ดึงข้อมูลรถพยาบาล
      const vehicleObj = dispatch?.vehicle_id ? vehicleMap.get(dispatch.vehicle_id) : null;
      const vehiclePlate = vehicleObj?.plate_number || (dispatch?.vehicle_id ? `รถรหัส ${dispatch.vehicle_id}` : "-");

      // ดึงรายชื่อเจ้าหน้าที่
      const leader = staffs.find(
        (s) => s.note === "leader" || s.role_type === "team_leader" || s.role_type === "leader"
      );
      const driver = staffs.find(
        (s) => s.note === "driver" || s.role_type === "driver"
      );
      const members = staffs.filter((s) => s !== leader && s !== driver);

      const leaderName = leader ? officerMap.get(leader.user_id) || `จนท. ${leader.user_id}` : "-";
      const driverName = driver ? officerMap.get(driver.user_id) || `จนท. ${driver.user_id}` : "-";
      const memberNames = members.length > 0
        ? members.map((m) => officerMap.get(m.user_id) || `จนท. ${m.user_id}`).join(", ")
        : "-";

      // ข้อมูลผู้ป่วย
      let ptName = "ไม่ระบุชื่อ / นิรนาม";
      let ptHn = c?.patient_hn || "-";
      let villageName = "บุคคลนอกเขต";

      if (c?.patient_source === "HOSPITAL" && c?.patient_hn) {
        const hPt = hospitalPtMap.get(c.patient_hn.trim());
        if (hPt) {
          ptName = `${hPt.pname || ""}${hPt.fname || ""} ${hPt.lname || ""}`.trim();
          villageName =
            villageMap.get(String(hPt.moopart).trim()) ||
            (hPt.moopart ? `หมู่ ${hPt.moopart}` : "บุคคลนอกเขต");
        }
      } else if (c?.ems_patient) {
        ptName = `${c.ems_patient.pname || ""}${c.ems_patient.fname || ""} ${c.ems_patient.lname || ""}`.trim();
      }

      if (ptName === "ไม่ระบุชื่อ / นิรนาม" && c?.caller_name) {
        ptName = c.caller_name;
      }

      // Thumbnail Path
      const rawPath = att.file_path || "";
      const lastSlash = rawPath.lastIndexOf("/");
      const dirPath = lastSlash !== -1 ? rawPath.substring(0, lastSlash) : "";
      const filename = lastSlash !== -1 ? rawPath.substring(lastSlash + 1) : rawPath;
      const thumbPath = `${dirPath}/thumbs/thumb-${filename}`;

      monthsGroup[monthKey].items.push({
        id: att.id,
        category: att.category || "overview",
        caption: att.caption || "",
        created_at: att.created_at,
        original_url: rawPath,
        thumb_url: thumbPath,
        file_size_kb: att.file_size ? (att.file_size / 1024).toFixed(1) : "0",
        case: {
          id: c?.id || 0,
          case_number: c?.case_number || "EMS",
          triage_level: c?.triage_level || "white",
          status: c?.status || "completed",
          chief_complaint: c?.chief_complaint || "-",
          incident_address: c?.incident_address || "-",
          patient_name: ptName,
          patient_hn: ptHn,
          village_name: villageName,
          vehicle_plate: vehiclePlate,
          leader_name: leaderName,
          driver_name: driverName,
          member_names: memberNames,
        },
      });
    }

    // 7. จัดกลุ่มเรียงเดือนจากใหม่ไปเก่า และจัดกลุ่มแยกตามเคส (Group by Case)
    const sortedMonthKeys = Object.keys(monthsGroup).sort((a, b) => b.localeCompare(a));
    const totalMonths = sortedMonthKeys.length;
    const paginatedMonthKeys = sortedMonthKeys.slice((page - 1) * limit, page * limit);

    const formattedMonths = paginatedMonthKeys.map((key) => {
      const monthData = monthsGroup[key];
      const caseGroups: { [caseId: number]: { caseInfo: any; photos: any[] } } = {};

      monthData.items.forEach((item) => {
        const cId = item.case.id;
        if (!caseGroups[cId]) {
          caseGroups[cId] = {
            caseInfo: item.case,
            photos: [],
          };
        }
        caseGroups[cId].photos.push(item);
      });

      return {
        key,
        label: monthData.label,
        totalPhotos: monthData.items.length,
        totalCases: Object.keys(caseGroups).length,
        cases: Object.values(caseGroups),
      };
    });

    return NextResponse.json({
      success: true,
      months: formattedMonths,
      totalMonths,
      page,
      limit,
      totalPages: Math.ceil(totalMonths / limit) || 1,
    });
  } catch (error: any) {
    console.error("Gallery API Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Error" }, { status: 500 });
  }
}