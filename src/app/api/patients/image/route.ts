import { NextResponse } from "next/server";
import { connection } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function GET(request: Request) {
  // ป้องกัน Next.js 16 Prerender Bailout ด้วย connection()
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const hn = (searchParams.get("hn") || "").trim();

    if (!hn) {
      return returnDefaultAvatar();
    }

    // 1. ตรวจสอบ Local Disk Cache ก่อน (ไฟล์ .webp)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "patient");
    const cachedImagePath = path.join(uploadDir, `${hn}.webp`);

    if (fs.existsSync(cachedImagePath)) {
      const cachedBuffer = fs.readFileSync(cachedImagePath);
      return new NextResponse(cachedBuffer, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        },
      });
    }

    // 2. ถ้ายังไม่มีแคช ให้ค้นหาจากตาราง patient_image ในฐานข้อมูล
    const patientImage: any = await db.patient_image.findFirst({
      where: { hn: hn },
      select: { image: true },
    });

    if (!patientImage || !patientImage.image) {
      return returnDefaultAvatar();
    }

    // 3. แปลงภาพ BLOB ต้นทางเป็น WebP คุณภาพสูง ขนาดประหยัด (3–8 KB)
    const rawBuffer = Buffer.from(patientImage.image);
    const webpBuffer = await sharp(rawBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    // 4. บันทึกลงแคชในเครื่อง
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(cachedImagePath, webpBuffer);

    return new NextResponse(webpBuffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Patient Image API Error:", error);
    return returnDefaultAvatar();
  }
}

// ฟังก์ชันส่งภาพสำรอง (Default Avatar)
function returnDefaultAvatar() {
  const defaultPath = path.join(process.cwd(), "public", "images", "avatars", "default.png");
  if (fs.existsSync(defaultPath)) {
    const defaultBuffer = fs.readFileSync(defaultPath);
    return new NextResponse(defaultBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  return new NextResponse(null, { status: 404 });
}