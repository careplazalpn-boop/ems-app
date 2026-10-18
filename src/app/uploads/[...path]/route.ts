import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import path from "path";
import fs from "fs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "lamphun-ems-secret-key-2026-secure"
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // 1. ตรวจสอบ Cookie session_token
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return new NextResponse("Unauthorized: กรุณาเข้าสู่ระบบก่อนดูไฟล์", {
        status: 401,
      });
    }

    // 2. ตรวจสอบความถูกต้องของ JWT Token
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      return new NextResponse("Forbidden: เซสชันหมดอายุหรือไม่ถูกต้อง", {
        status: 403,
      });
    }

    // 3. ป้องกัน Path Traversal และประกอบ Path ไฟล์
    const resolvedParams = await context.params;
    const rawSegments = resolvedParams.path || [];

    // ตัด slash ท้ายไฟล์ออก (แก้ปัญหา .webp/ ที่เคยเจอ)
    const sanitizedSegments = rawSegments.map((s) => s.replace(/\/+$/, ""));
    const safePath = sanitizedSegments.join("/").replace(/\.\./g, "");

    const fullPath = path.join(process.cwd(), "public/uploads", safePath);

    // 4. ตรวจสอบว่ามีไฟล์อยู่จริงหรือไม่
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // 5. กำหนด Content-Type และส่งไฟล์ออกไป
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".webp": "image/webp",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // ป้องกันเบราว์เซอร์แคชรูปผู้ป่วยแบบ public
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error serving secure file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}