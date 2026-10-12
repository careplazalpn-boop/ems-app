import { NextResponse } from "next/server";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

export async function GET(request: Request) {
  // ประกาศ runtime connection สำหรับ Next.js 16 cacheComponents
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    let targetUserId: number | null = userIdParam ? parseInt(userIdParam, 10) : null;

    // หากไม่ได้ระบุ userId มาใน Query ให้ถอดรหัสจาก Session Cookie ปัจจุบัน
    if (!targetUserId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("session_token")?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          targetUserId = (payload.userId as number) || (payload.id as number) || null;
        } catch {
          // Token ไม่ถูกต้อง ให้ข้ามไปใช้ default avatar
        }
      }
    }

    // หากพบ userId ให้ค้นหาข้อมูลรูปจากตาราง user / opduser
    if (targetUserId) {
      const user: any = await db.user.findUnique({
        where: { id: targetUserId },
        select: { avatar: true },
      }).catch(() => null);

      if (user?.avatar) {
        // กรณีเก็บเป็น Binary Buffer / BLOB
        if (Buffer.isBuffer(user.avatar)) {
          return new NextResponse(user.avatar, {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            },
          });
        }

        // กรณีเก็บเป็น Path ไฟล์บนดิสก์
        if (typeof user.avatar === "string") {
          const filePath = path.join(process.cwd(), "public", user.avatar.replace(/^\//, ""));
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            return new NextResponse(fileBuffer, {
              headers: {
                "Content-Type": "image/webp",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
              },
            });
          }
        }
      }
    }

    // ถ้าไม่มีรูป ให้ส่งรูป Default Avatar กลับ
    const defaultAvatarPath = path.join(process.cwd(), "public", "images", "avatars", "default.png");
    if (fs.existsSync(defaultAvatarPath)) {
      const defaultBuffer = fs.readFileSync(defaultAvatarPath);
      return new NextResponse(defaultBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error: any) {
    console.error("Avatar API Error:", error);
    return new NextResponse(null, { status: 500 });
  }
}