import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

// ฟังก์ชันส่งคืนรูปค่าเริ่มต้น (Default Avatar)
function getDefaultAvatarResponse() {
  const defaultImagePath = path.join(
    process.cwd(),
    "public",
    "images",
    "avatars",
    "default.png"
  );

  if (fs.existsSync(defaultImagePath)) {
    const fileBuffer = fs.readFileSync(defaultImagePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new NextResponse(null, { status: 404 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    let targetUserId: number | null = userIdParam ? parseInt(userIdParam, 10) : null;

    // ถ้าไม่ได้ส่ง userId มาใน Query String ให้ดึงจาก Token ใน Cookie ของคนที่ล็อกอินอยู่
    if (!targetUserId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("session_token")?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          targetUserId = Number(payload.userId);
        } catch {
          // Token ไม่ถูกต้อง
        }
      }
    }

    if (!targetUserId) {
      return getDefaultAvatarResponse();
    }

    // 1. ดึงข้อมูล users เพื่อเช็คฟิลด์ avatars
    const user = await db.users.findUnique({
      where: { user_id: targetUserId },
      select: {
        user_id: true,
        avatars: true,
      },
    });

    if (!user || !user.avatars) {
      return getDefaultAvatarResponse();
    }

    // 2. ตรวจสอบรูปแบบ db_xxx ด้วย Regular Expression
    const match = user.avatars.match(/^db_(\d+)$/);

    // ถ้าไม่ตรงกับรูปแบบ db_xxx (เงื่อนไขข้อ 2) -> ใช้รูปเริ่มต้น
    if (!match) {
      return getDefaultAvatarResponse();
    }

    const imageId = parseInt(match[1], 10);

    // 3. ถ้าเท่ากับ db_xxx -> ดึงรูปจากตาราง users_image (เงื่อนไขข้อ 3)
    // users.user_id = users_image.users_id AND users_image.id = imageId
    const userImage = await db.users_image.findFirst({
      where: {
        id: imageId,
        users_id: user.user_id,
      },
      select: {
        img: true,
      },
    });

    // หากพบรูปในตาราง users_image และมีข้อมูลไบนารี
    if (userImage && userImage.img && userImage.img.length > 0) {
      // แปลง Buffer ให้พร้อมส่งคืนกลับเป็น Image Stream
      const imageBuffer = Buffer.from(userImage.img);
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
        },
      });
    }

    // กรณีหาแถวใน users_image ไม่พบ หรือ img ว่าง
    return getDefaultAvatarResponse();
  } catch (error) {
    console.error("Avatar Route Error:", error);
    return getDefaultAvatarResponse();
  }
}