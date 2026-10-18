import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // ดึง cookie session ที่เราสร้างไว้ตอน login
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. ถ้ายังไม่ได้ล็อกอิน แล้วพยายามเข้าหน้าอื่นๆ (ยกเว้นหน้า /login)
  if (!sessionToken && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. ถ้าล็อกอินอยู่แล้ว แล้วพยายามเข้าหน้า /login ให้ดีดกลับไปหน้าแรก (Home)
  if (sessionToken && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// กำหนดเส้นทางที่ต้องการให้ Middleware ตรวจสอบ
export const config = {
  matcher: [
    /*
     * ตรวจทุกเส้นทาง ยกเว้น:
     * - api routes (ให้ api จัดการสิทธิ์แยกต่างหาก)
     * - uploads (ให้ secure route handler ใน src/app/uploads จัดการสิทธิ์รูปภาพ)
     * - _next/static (ไฟล์ static ของ Next.js)
     * - _next/image (ระบบจัดการรูปภาพ)
     * - favicon.ico, icon.png หรือรูปใน public/images
     */
    "/((?!api|uploads|_next/static|_next/image|images|favicon.ico|icon.png).*)",
  ],
};