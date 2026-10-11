import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

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

    // เงื่อนไขค้นหา: ทุกฟิลด์ใช้ contains (เจอบางส่วนก็แสดงผลทันที)
    const orConditions: any[] = [
      { hn: { contains: query } },
      { cid: { contains: query } },
      { addrpart: { contains: query } },
    ];

    // ค้นหาชื่อ-นามสกุลแบบแยกคำ (เช่น "สม ใจ")
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

    const [patients, total] = await Promise.all([
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
          road: true,
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
    ]);

    const formattedPatients = patients.map((p) => ({
      ...p,
      imageUrl: `/api/patients/image?hn=${p.hn}`,
    }));

    return NextResponse.json({
      patients: formattedPatients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Patient Search API Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการค้นหาข้อมูล", error: error.message }, { status: 500 });
  }
}