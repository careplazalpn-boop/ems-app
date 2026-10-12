import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

function cleanNumber(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const cleaned = String(val).trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? cleaned : num.toString();
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }
    await jwtVerify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(5, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    if (!query) {
      return NextResponse.json({ patients: [], total: 0, totalPages: 0, page, limit });
    }

    const tokens = query.split(/\s+/).filter(Boolean);

    const orConditions: any[] = [
      { hn: { contains: query } },
      { cid: { contains: query } },
      { addrpart: { contains: query } },
    ];

    if (tokens.length > 0) {
      orConditions.push({
        AND: tokens.map((word) => ({
          OR: [
            { fname: { contains: word } },
            { lname: { contains: word } },
            { pname: { contains: word } },
          ],
        })),
      });
    }

    const whereConditions = { OR: orConditions };

    const [patients, total, allVillages] = await Promise.all([
      db.patient.findMany({
        where: whereConditions,
        select: {
          id: true,
          hn: true,
          pname: true,
          fname: true,
          lname: true,
          cid: true,
          birthday: true,
          addrpart: true,
          moopart: true,
          village_id: true,
          road: true,
          tmbpart: true,
          amppart: true,
          chwpart: true,
          address_full: true,
          bloodgrp: true,
          mobile_phone_number: true,
          hometel: true,
          death: true,
          home_latitude: true,
          home_longitude: true,
        },
        take: limit,
        skip: skip,
        orderBy: { id: "desc" },
      }),
      db.patient.count({ where: whereConditions }),
      db.village.findMany({
        select: {
          village_id: true,
          village_moo: true,
          village_name: true,
        },
      }),
    ]);

    // สร้าง Map สำหรับจับคู่ village ด้วย village_id และ village_moo
    const villageById = new Map<string, string>();
    const villageByMoo = new Map<string, string>();

    allVillages.forEach((v: any) => {
      const name = v.village_name?.trim() || "";
      if (v.village_id) {
        villageById.set(cleanNumber(v.village_id), name);
      }
      if (v.village_moo !== null && v.village_moo !== undefined) {
        villageByMoo.set(cleanNumber(v.village_moo), name);
      }
    });

    const formattedPatients = patients.map((p: any) => {
      // เงื่อนไขในเขตเทศบาลเมืองลำพูน: ต.ในเมือง (01), อ.เมือง (01), จ.ลำพูน (51)
      const isInRegion =
        cleanNumber(p.tmbpart) === "1" &&
        cleanNumber(p.amppart) === "1" &&
        cleanNumber(p.chwpart) === "51";

      let communityName = "นอกเขต";

      if (isInRegion) {
        const vId = cleanNumber(p.village_id);
        const moo = cleanNumber(p.moopart);

        // 1. ลองเทียบจาก village_id ก่อน
        if (vId && villageById.has(vId)) {
          communityName = villageById.get(vId)!;
        } 
        // 2. ถ้าไม่มี village_id ให้เทียบจาก moopart กับ village_moo
        else if (moo && villageByMoo.has(moo)) {
          communityName = villageByMoo.get(moo)!;
        } 
        else {
          communityName = moo ? `ชุมชนหมู่ที่ ${moo}` : "ในเขต (ไม่ระบุชุมชน)";
        }
      }

      return {
        ...p,
        communityName,
        isInRegion,
        imageUrl: `/api/patients/image?hn=${p.hn}`,
      };
    });

    return NextResponse.json({
      patients: formattedPatients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Patient Search API Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการค้นหาข้อมูล", error: error.message },
      { status: 500 }
    );
  }
}