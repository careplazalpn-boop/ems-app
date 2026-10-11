import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

async function getAuthUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Number(payload.userId);
  } catch {
    return null;
  }
}

// 1. ดึงข้อมูลโปรไฟล์
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const user = await db.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        fullname: true,
        username: true,
        role: true,
        phone: true,
        avatars: true,
        created_at: true,
      },
    });

    if (!user) return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });

    return NextResponse.json({
      user: {
        ...user,
        avatarUrl: `/api/avatar?userId=${user.user_id}&t=${Date.now()}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 2. แก้ไขข้อมูลทั่วไป (ชื่อ, เบอร์โทร)
export async function PATCH(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const body = await request.json();
    const { fullname, phone } = body;

    if (!fullname || !fullname.trim()) {
      return NextResponse.json({ message: "กรุณาระบุชื่อ-นามสกุล" }, { status: 400 });
    }

    const updatedUser = await db.users.update({
      where: { user_id: userId },
      data: {
        fullname: fullname.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        user_id: true,
        fullname: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 3. เปลี่ยนรหัสผ่าน (พร้อมตรวจสอบรหัสผ่านปัจจุบัน)
export async function PUT(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: "กรุณากรอกรหัสผ่านให้ครบทุกช่อง" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const user = await db.users.findUnique({
      where: { user_id: userId },
      select: { password: true },
    });

    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

    // ตรวจสอบรหัสผ่านปัจจุบัน
    let isCurrentValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      isCurrentValid = user.password === currentPassword;
    }

    if (!isCurrentValid) {
      return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    }

    // เข้ารหัสรหัสผ่านใหม่ด้วย bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.users.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}