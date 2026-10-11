import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

// 1. ดึงรายการ ID รูปภาพทั้งหมดของ User
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const images = await db.users_image.findMany({
      where: { users_id: userId },
      select: { id: true },
      orderBy: { id: "desc" },
    });

    const user = await db.users.findUnique({
      where: { user_id: userId },
      select: { avatars: true },
    });

    return NextResponse.json({
      images: images.map((img) => ({
        id: img.id,
        url: `/api/profile/images/${img.id}`,
        isSelected: user?.avatars === `db_${img.id}`,
      })),
      currentAvatar: user?.avatars,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 2. อัปโหลดรูปภาพใหม่เข้าคลัง users_image
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // บันทึกลง users_image
    const newImage = await db.users_image.create({
      data: {
        users_id: userId,
        img: buffer,
      },
    });

    // อัปเดตรูปประจำตัวเป็นรูปใหม่ทันที (db_xxx)
    await db.users.update({
      where: { user_id: userId },
      data: {
        avatars: `db_${newImage.id}`,
        img: buffer,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปโหลดรูปภาพและตั้งเป็นโปรไฟล์สำเร็จ",
      imageId: newImage.id,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 3. เลือกรูปเดิมจากคลังเพื่อตั้งเป็นโปรไฟล์
export async function PATCH(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ message: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

    const body = await request.json();
    const { imageId } = body; // ส่ง id ของ users_image ที่ต้องการเลือก

    if (!imageId) {
      return NextResponse.json({ message: "กรุณาระบุรูปภาพที่ต้องการ" }, { status: 400 });
    }

    // ตรวจสอบว่ารูปนี้เป็นของ User คนนี้จริง
    const targetImage = await db.users_image.findFirst({
      where: { id: Number(imageId), users_id: userId },
    });

    if (!targetImage) {
      return NextResponse.json({ message: "ไม่พบรูปภาพนี้ในบัญชีของคุณ" }, { status: 404 });
    }

    // อัปเดต users.avatars เป็น db_xxx พร้อมสำรองข้อมูลลง users.img
    await db.users.update({
      where: { user_id: userId },
      data: {
        avatars: `db_${targetImage.id}`,
        img: targetImage.img,
      },
    });

    return NextResponse.json({ success: true, message: "เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}