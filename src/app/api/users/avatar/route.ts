import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    let userId: number | null = userIdParam ? parseInt(userIdParam, 10) : null;

    // หากไม่ได้ระบุ userId ใน query ให้ดึงจาก Token ในคุกกี้ปัจจุบัน
    if (!userId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("session_token")?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          userId = Number(payload.userId);
        } catch {
          // Token ไม่ถูกต้อง ปล่อยผ่านไปคืนค่ารูปเริ่มต้น
        }
      }
    }

    if (userId) {
      // ค้นหารูปโปรไฟล์ปัจจุบันของผู้ใช้
      const user = await db.users.findUnique({
        where: { user_id: userId },
        select: { img: true },
      });

      if (user?.img && user.img.length > 0) {
        return new NextResponse(user.img, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          },
        });
      }
    }

    // กรณีไม่มีรูป ให้ส่งรูป Default
    const defaultImagePath = path.join(
      process.cwd(),
      "public",
      "images",
      "avatars",
      "default.png"
    );

    if (fs.existsSync(defaultImagePath)) {
      const defaultImage = fs.readFileSync(defaultImagePath);
      return new NextResponse(defaultImage, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error("Avatar API Error:", error);
    return new NextResponse(null, { status: 500 });
  }
}