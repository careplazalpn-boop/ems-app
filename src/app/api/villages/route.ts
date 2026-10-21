import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const villages = await prisma.village.findMany({
      select: {
        village_moo: true,
        village_name: true,
      },
      orderBy: {
        village_id : "asc",
      },
    });

    return NextResponse.json({
      success: true,
      villages,
    });
  } catch (error: any) {
    console.error("Error fetching villages:", error);
    return NextResponse.json(
      { success: false, villages: [] },
      { status: 500 }
    );
  }
}