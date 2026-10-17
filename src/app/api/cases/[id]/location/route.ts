import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const caseId = parseInt(resolvedParams.id, 10);
    const body = await request.json();

    const { incident_address, latitude, longitude } = body;

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 });
    }

    // อัปเดตเฉพาะพิกัดและที่อยู่ พร้อมเปลี่ยนสถานะเป็น on_scene (ถึงที่เกิดเหตุ)
    const updatedCase = await prisma.ems_cases.update({
      where: { id: caseId },
      data: {
        ...(incident_address !== undefined && { incident_address }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        status: "on_scene",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกพิกัดและสถานที่เกิดเหตุเรียบร้อยแล้ว",
      case: updatedCase,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/cases/[id]/location:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการบันทึกพิกัด" },
      { status: 500 }
    );
  }
}