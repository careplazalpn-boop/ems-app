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

// 1. ดึงข้อมูลรายบุคคล (GET)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hn: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }
    await jwtVerify(token, JWT_SECRET);

    const { hn } = await params;
    if (!hn) {
      return NextResponse.json({ message: "ไม่พบ HN" }, { status: 400 });
    }

    const patient: any = await db.patient.findFirst({
      where: { hn: hn },
    });

    if (!patient) {
      return NextResponse.json({ message: "ไม่พบข้อมูลผู้ป่วย" }, { status: 404 });
    }

    const isInRegion =
      cleanNumber(patient.tmbpart) === "1" &&
      cleanNumber(patient.amppart) === "1" &&
      cleanNumber(patient.chwpart) === "51";

    let communityName = "นอกเขต";

    if (isInRegion) {
      const vId = cleanNumber(patient.village_id);
      const moo = cleanNumber(patient.moopart);

      let village: any = null;
      if (vId) {
        village = await db.village.findFirst({
          where: { village_id: parseInt(vId, 10) },
          select: { village_name: true },
        });
      }

      if (!village && moo) {
        village = await db.village.findFirst({
          where: {
            OR: [{ village_moo: moo }, { village_moo: moo.padStart(2, "0") }],
          },
          select: { village_name: true },
        });
      }

      if (village?.village_name) {
        communityName = village.village_name;
      } else {
        communityName = moo ? `ชุมชนหมู่ที่ ${moo}` : "ในเขต (ไม่ระบุชุมชน)";
      }
    }

    return NextResponse.json({
      patient: {
        ...patient,
        communityName,
        isInRegion,
        imageUrl: `/api/patients/image?hn=${patient.hn}`,
      },
    });
  } catch (error: any) {
    console.error("Patient Detail Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการโหลดข้อมูล", error: error.message },
      { status: 500 }
    );
  }
}

// 2. ปรับปรุงบันทึกข้อมูลและพิกัด (PUT)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ hn: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
    }
    await jwtVerify(token, JWT_SECRET);

    const { hn } = await params;
    if (!hn) {
      return NextResponse.json({ message: "ไม่พบ HN" }, { status: 400 });
    }

    const body = await request.json();

    const updated = await db.patient.updateMany({
      where: { hn: hn },
      data: {
        mobile_phone_number: body.mobile_phone_number || null,
        hometel: body.hometel || null,
        informname: body.informname || null,
        addrpart: body.addrpart || null,
        moopart: body.moopart || null,
        road: body.road || null,
        address_full: body.address_full || null,
        bloodgrp: body.bloodgrp || null,
        comment: body.comment || null,
        home_latitude: body.home_latitude !== null && body.home_latitude !== undefined ? body.home_latitude : null,
        home_longitude: body.home_longitude !== null && body.home_longitude !== undefined ? body.home_longitude : null,
        last_update: new Date(),
      },
    });

    return NextResponse.json({
      message: "บันทึกการแก้ไขข้อมูลสำเร็จ",
      count: updated.count,
    });
  } catch (error: any) {
    console.error("Patient Update Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: error.message },
      { status: 500 }
    );
  }
}