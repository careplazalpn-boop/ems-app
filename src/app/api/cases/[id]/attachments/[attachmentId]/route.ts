import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> | { id: string; attachmentId: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);
    const attachmentId = parseInt(resolvedParams.attachmentId, 10);

    if (isNaN(caseId) || isNaN(attachmentId)) {
      return NextResponse.json({ error: "รหัสเคสหรือรหัสรูปภาพไม่ถูกต้อง" }, { status: 400 });
    }

    // ค้นหาข้อมูลรูปภาพในฐานข้อมูล
    const attachment = await prisma.ems_case_attachments.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "ไม่พบรูปภาพที่ต้องการลบ" }, { status: 404 });
    }

    // ลบไฟล์ต้นฉบับและ Thumbnail จาก Server
    // file_path ตัวอย่าง: /uploads/cases/4/img-123456.webp
    if (attachment.file_path) {
      try {
        const relativePath = attachment.file_path.replace(/^\//, "");
        const fullMainPath = path.join(process.cwd(), "public", relativePath);
        
        // แปลง path เพื่อหาไฟล์ thumb (เช่น /uploads/cases/4/thumbs/thumb-img-123456.webp)
        const parsedPath = path.parse(fullMainPath);
        const thumbFilename = `thumb-${parsedPath.base}`;
        const fullThumbPath = path.join(parsedPath.dir, "thumbs", thumbFilename);

        // ลบไฟล์ต้นฉบับ (ถ้ามี)
        await unlink(fullMainPath).catch(() => {});
        // ลบไฟล์ Thumbnail (ถ้ามี)
        await unlink(fullThumbPath).catch(() => {});
      } catch (fileErr) {
        console.error("Error deleting physical files:", fileErr);
      }
    }

    // ลบข้อมูลออกจากฐานข้อมูล Prisma
    await prisma.ems_case_attachments.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({
      success: true,
      message: "ลบรูปภาพและไฟล์ที่เกี่ยวข้องเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการลบรูปภาพ" },
      { status: 500 }
    );
  }
}
