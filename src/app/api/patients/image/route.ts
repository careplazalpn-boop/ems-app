import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "patient");

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

    // 1. ตรวจสอบไฟล์แคช WebP เดิม
    const cachedFilePath = path.join(UPLOAD_DIR, `${hn}.webp`);
    if (fs.existsSync(cachedFilePath)) {
      const fileBuffer = fs.readFileSync(cachedFilePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // 2. ดึงจากฐานข้อมูล
    const record = await db.patient_image.findFirst({
      where: { hn: hn },
      select: { image: true },
      orderBy: { capture_date: "desc" },
    });

    if (!record || !record.image || record.image.length === 0) {
      return getDefaultPatientImage();
    }

    const imageBuffer = Buffer.from(record.image);

    // 3. ใช้ Sharp ย่อขนาดเหลือไม่เกิน 400x400 px และแปลงเป็น WebP (บีบอัดคุณภาพ 80%)
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(400, 400, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 4. บันทึกแคชลงดิสก์
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    fs.writeFileSync(cachedFilePath, optimizedBuffer);

    return new NextResponse(optimizedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Patient Image Fetch Error:", error);
    return getDefaultPatientImage();
  }
}