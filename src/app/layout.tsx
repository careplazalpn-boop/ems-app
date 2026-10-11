import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}