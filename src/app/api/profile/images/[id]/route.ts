import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const imageId = parseInt(resolvedParams.id, 10);

    const imageRecord = await db.users_image.findUnique({
      where: { id: imageId },
      select: { img: true },
    });

    if (!imageRecord || !imageRecord.img) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(Buffer.from(imageRecord.img), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}