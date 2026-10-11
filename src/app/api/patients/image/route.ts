import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "patient");

// ฟังก์ชันส่งคืนรูปเริ่มต้น
function getDefaultPatientImage() {
  const defaultPath = path.join(process.cwd(), "public", "images", "avatars", "default.png");
  if (fs.existsSync(defaultPath)) {
    const buffer = fs.readFileSync(defaultPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  }
  return new NextResponse(null, { status: 404 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hn = searchParams.get("hn")?.trim();

    if (!hn) return getDefaultPatientImage();

    // 1. ตรวจสอบว่ามีไฟล์แคชใน /public/uploads/patient/{hn}.png แล้วหรือยัง
    const cachedFilePath = path.join(UPLOAD_DIR, `${hn}.png`);
    if (fs.existsSync(cachedFilePath)) {
      const fileBuffer = fs.readFileSync(cachedFilePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // 2. ถ้ายังไม่มี ให้ดึงจากตาราง patient_image
    const record = await db.patient_image.findFirst({
      where: { hn: hn },
      select: { image: true },
      orderBy: { capture_date: "desc" },
    });

    if (!record || !record.image || record.image.length === 0) {
      return getDefaultPatientImage();
    }

    const imageBuffer = Buffer.from(record.image);

    // 3. สร้างโฟลเดอร์ถ้ายังไม่มี และเขียนไฟล์เก็บลงดิสก์
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    fs.writeFileSync(cachedFilePath, imageBuffer);

    // 4. ส่งคืนรูปภาพกลับไปให้ Client
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Patient Image Fetch Error:", error);
    return getDefaultPatientImage();
  }
}