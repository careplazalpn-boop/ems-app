import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง (Invalid JSON)" },
        { status: 400 }
      );
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบการเชื่อมต่อกับ MariaDB ผ่าน Prisma
    let user;
    try {
      user = await db.users.findFirst({
        where: { username: String(username).trim() },
      });
    } catch (dbError: any) {
      console.error("DATABASE ERROR:", dbError);
      return NextResponse.json(
        { 
          message: `ฐานข้อมูล MariaDB ขัดข้อง: ${dbError?.message || "ไม่สามารถเชื่อมต่อได้"}`,
          detail: String(dbError)
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (user.is_active === false) {
      return NextResponse.json(
        { message: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    // 2. ตรวจสอบรหัสผ่าน (รองรับ hash และ plain text)
    let isPasswordValid = false;
    try {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        isPasswordValid = user.password === password;
      }
    } catch (err) {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // 3. สร้าง Cookie Session
    try {
      const token = await new SignJWT({
        userId: user.user_id,
        fullname: user.fullname,
        role: user.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(JWT_SECRET);

      const cookieStore = await cookies();
      cookieStore.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    } catch (jwtError: any) {
      console.error("JWT/Cookie Error:", jwtError);
      return NextResponse.json(
        { message: `สร้างเซสชันไม่สำเร็จ: ${jwtError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.user_id,
        fullname: user.fullname,
        role: user.role,
      },
    });

  } catch (error: any) {
    console.error("UNEXPECTED ERROR:", error);
    return NextResponse.json(
      { message: `เกิดข้อผิดพลาด: ${error?.message || "Internal Server Error"}` },
      { status: 500 }
    );
  }
}