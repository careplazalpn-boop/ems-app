"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Ambulance, 
  LayoutDashboard, 
  FilePlus, 
  MapPin, 
  ClipboardList, 
  LogOut, 
  User,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "แดชบอร์ดภาพรวม", href: "/", icon: LayoutDashboard },
  { title: "บันทึกรับแจ้งเหตุใหม่", href: "/cases/new", icon: FilePlus },
  { title: "รายการเคสฉุกเฉิน", href: "/cases", icon: ClipboardList },
  { title: "แผนที่ติดตามรถพยาบาล", href: "/tracking", icon: MapPin },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = "session_token=; path=/; max-age=0;";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Sidebar: ดำถ่าน ตัดขอบส้ม/แดง */}
      <aside className="w-64 bg-zinc-950 text-zinc-100 flex flex-col shrink-0 border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 bg-white p-1 rounded-xl shadow-inner">
            <Image
              src="/images/logo-org.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight text-white truncate">ระบบแพทย์ฉุกเฉิน</h1>
            <p className="text-xs text-orange-400 font-medium">ทม.ลำพูน (EMS)</p>
          </div>
        </div>

        {/* สถานะสแตนด์บาย */}
        <div className="px-4 py-2.5 mx-3 mt-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            สถานะศูนย์วิทยุ
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            พร้อมรับเหตุ
          </span>
        </div>

        {/* เมนูหลัก */}
        <nav className="flex-1 p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* ปุ่มออกจากระบบ */}
        <div className="p-3 border-t border-zinc-900">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-900 gap-2.5 rounded-xl text-sm"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-zinc-800 font-semibold text-base">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Ambulance className="h-5 w-5" />
            </div>
            <span>ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-zinc-800">เจ้าหน้าที่กู้ชีพ</div>
              <div className="text-[11px] text-zinc-400">เวรปฏิบัติการ 24 ชม.</div>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}