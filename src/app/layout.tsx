import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import IdleTimer from "@/components/IdleTimer";
import { Suspense } from "react"; // 1. import Suspense เพิ่ม

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบงานแพทย์ฉุกเฉิน - ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน",
  description: "Lamphun Town EMS & Patient Transport System",  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${promptFont.className} antialiased selection:bg-orange-500 selection:text-white`}>
        {/* 2. หุ้ม Suspense รอบ IdleTimer เพื่อไม่ให้กระทบการ Build หน้ารายละเอียดเคส */}
        <Suspense fallback={null}>
          <IdleTimer />
        </Suspense>
        {children}
      </body>
    </html>
  );
}