import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const moo = searchParams.get("moo")?.trim() || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = Math.max(0, (page - 1) * limit);

    // 1. เงื่อนไขขอบเขตพื้นที่ (ถ้าเลือกชุมชนเฉพาะเจาะจง)
    const locationCondition: any = {};
    if (moo && moo !== "all") {
      const cleanMoo = String(parseInt(moo, 10));
      const paddedMoo = cleanMoo.padStart(2, "0");

      locationCondition.moopart = { in: [cleanMoo, paddedMoo] };
      locationCondition.tmbpart = "01";
      locationCondition.amppart = "01";
      locationCondition.chwpart = "51";
    }

    // 2. เงื่อนไขการค้นหาบุคคล (q: ชื่อ, สกุล, HN, CID, บ้านเลขที่)
    const searchConditions: any[] = [];
    if (q) {
      const parts = q.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        searchConditions.push({
          AND: [
            { fname: { contains: parts[0] } },
            { lname: { contains: parts[1] } },
          ],
        });
      } else {
        searchConditions.push({
          OR: [
            { fname: { contains: q } },
            { lname: { contains: q } },
            { hn: { contains: q } },
            { cid: { contains: q } },
            { addrpart: { contains: q } },
          ],
        });
      }
    }

    const where: any = {
      ...locationCondition,
    };

    if (searchConditions.length > 0) {
      where.AND = searchConditions;
    }

    // 3. ดึงข้อมูลผู้ป่วย, จำนวนรวม และตารางชุมชนพร้อมกัน (Concurrent Execution)
    const [total, patients, villages] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        select: {
          hn: true,
          cid: true,
          pname: true,
          fname: true,
          lname: true,
          sex: true,
          birthday: true,
          moopart: true,
          road: true,
          addrpart: true,
          address_full: true,
          bloodgrp: true,
          mobile_phone_number: true,
          hometel: true,
          death: true,
          chwpart: true,
          amppart: true,
          tmbpart: true,
          home_latitude: true,
          home_longitude: true,
        },
        orderBy: { hn: "desc" },
      }),
      prisma.village.findMany({
        select: {
          village_moo: true,
          village_name: true,
        },
      }).catch(() => []),
    ]);

    // 4. ทำ Map เชื่อมโยง patient.moopart = village.village_moo
    const villageMap = new Map<string, string>();
    villages.forEach((v: any) => {
      if (v.village_moo !== null && v.village_moo !== undefined) {
        const vMoo = String(v.village_moo).trim();
        villageMap.set(vMoo, v.village_name);
        villageMap.set(String(parseInt(vMoo, 10)), v.village_name);
      }
    });

    // 5. ประกอบข้อมูลให้ตรงตาม Interface ของหน้าบ้าน
    const formattedPatients = patients.map((pt, index) => {
      const ptMoo = pt.moopart ? pt.moopart.trim() : "";
      const matchedVillageName =
        villageMap.get(ptMoo) ||
        villageMap.get(String(parseInt(ptMoo, 10))) ||
        (ptMoo ? `หมู่ที่ ${ptMoo}` : "บุคคลนอกเขต");

      const isInRegion =
        pt.chwpart === "51" && pt.amppart === "01" && pt.tmbpart === "01";

      return {
        id: skip + index + 1,
        hn: pt.hn,
        pname: pt.pname || "",
        fname: pt.fname || "",
        lname: pt.lname || "",
        cid: pt.cid || "",
        birthday: pt.birthday ? pt.birthday.toISOString() : null,
        addrpart: pt.addrpart || null,
        moopart: pt.moopart || null,
        road: pt.road || null,
        address_full: pt.address_full?.trim() || null,
        bloodgrp: pt.bloodgrp || null,
        mobile_phone_number: pt.mobile_phone_number || null,
        hometel: pt.hometel || null,
        death: pt.death || null,
        home_latitude: pt.home_latitude || null,
        home_longitude: pt.home_longitude || null,
        communityName: matchedVillageName,
        isInRegion: isInRegion,
        imageUrl: `/uploads/patient/${pt.hn}.webp?v=${pt.hn}`,
      };
    });

    return NextResponse.json({
      success: true,
      patients: formattedPatients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    console.error("Patients GET error:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย" },
      { status: 500 }
    );
  }
}