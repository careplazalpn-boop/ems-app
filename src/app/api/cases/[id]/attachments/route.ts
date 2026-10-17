import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: ดึงรายการรูปภาพทั้งหมดของเคสนี้
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 });
    }

    const attachments = await prisma.ems_case_attachments.findMany({
      where: { case_id: caseId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, attachments });
  } catch (error: any) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({ error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ" }, { status: 500 });
  }
}

// POST: อัปโหลดรูปภาพ (รองรับหลายรูป พร้อมแยกเก็บไฟล์หลักและ Thumbnail .webp)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 });
    }

    const formData = await request.formData();
    const category = (formData.get("category") as string) || "scene";
    const caption = (formData.get("caption") as string) || "";

    // ดึงไฟล์ทั้งหมดที่ส่งมา (คู่กันระหว่างไฟล์หลักและ thumbnail)
    const files = formData.getAll("files") as File[];
    const thumbs = formData.getAll("thumbs") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    // กำหนด Path โฟลเดอร์ public/uploads/cases/[id]/thumbs
    const uploadDir = path.join(process.cwd(), "public", "uploads", "cases", String(caseId));
    const thumbDir = path.join(uploadDir, "thumbs");

    await mkdir(uploadDir, { recursive: true });
    await mkdir(thumbDir, { recursive: true });

    const savedRecords = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const thumbFile = thumbs[i] || file; // ถ้าไม่มี thumb ให้ใช้ไฟล์หลักแทน

      const buffer = Buffer.from(await file.arrayBuffer());
      const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `img-${uniqueSuffix}.webp`;
      const thumbFilename = `thumb-${filename}`;

      const filePath = path.join(uploadDir, filename);
      const thumbPath = path.join(thumbDir, thumbFilename);

      // บันทึกไฟล์ลง Server
      await writeFile(filePath, buffer);
      await writeFile(thumbPath, thumbBuffer);

      const dbFilePath = `/uploads/cases/${caseId}/${filename}`;

      // บันทึกลงฐานข้อมูล Prisma
      const newAttachment = await prisma.ems_case_attachments.create({
        data: {
          case_id: caseId,
          category: category,
          file_name: filename,
          file_path: dbFilePath,
          file_size: buffer.length,
          caption: caption || null,
        },
      });

      savedRecords.push(newAttachment);
    }

    return NextResponse.json({
      success: true,
      message: `อัปโหลดรูปภาพสำเร็จ ${savedRecords.length} รูป`,
      attachments: savedRecords,
    });
  } catch (error: any) {
    console.error("Error uploading attachments:", error);
    return NextResponse.json({ error: error?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 });
  }
}