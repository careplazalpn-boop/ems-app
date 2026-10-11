"use client";

import { useEffect, useState, useRef } from "react";
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
  Radio,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfile {
  user_id: number;
  fullname: string;
  username: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
}

const menuItems = [
  { title: "แดชบอร์ดภาพรวม", href: "/", icon: LayoutDashboard },
  { title: "บันทึกรับแจ้งเหตุใหม่", href: "/cases/new", icon: FilePlus },
  { title: "รายการเคสฉุกเฉิน", href: "/cases", icon: ClipboardList },
  { title: "แผนที่ติดตามรถพยาบาล", href: "/tracking", icon: MapPin },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ดึงข้อมูลผู้ใช้งานปัจจุบันจาก /api/profile
  useEffect(() => {
    let isMounted = true;

    async function fetchUserProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (isMounted && data.user) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) setUser(null);
      }
    }

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // ปิด dropdown เมื่อคลิกพื้นที่ภายนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      // 1. เรียก API เพื่อลบ HTTP-only Cookie ฝั่ง Server
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // 2. เคลียร์ Cookie ฝั่ง Client ซ้ำเพื่อความชัวร์
      document.cookie = "session_token=; path=/; max-age=0;";
      
      // 3. ปิด Dropdown (ถ้าเปิดอยู่)
      setDropdownOpen(false);
      
      // 4. นำทางกลับหน้า Login และรีเฟรช State ทั้งหมด
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Sidebar: ธีมดำตัดส้ม/แดง */}
      <aside className="w-64 bg-zinc-950 text-zinc-100 flex flex-col shrink-0 border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 bg-white p-1 rounded-xl shadow-inner">
            <Image
              src="/images/logo-org.png"
              alt="Logo"
              fill
              sizes="44px"
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight text-white truncate">ระบบแพทย์ฉุกเฉิน</h1>
            <p className="text-xs text-orange-400 font-medium">ทม.ลำพูน (EMS)</p>
          </div>
        </div>

        {/* สถานะสแตนด์บายศูนย์วิทยุ */}
        <div className="px-4 py-2.5 mx-3 mt-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            สถานะศูนย์วิทยุ
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            พร้อมรับเหตุ
          </span>
        </div>

        {/* เมนูหลักนำทาง */}
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

        {/* ปุ่มออกจากระบบในแถบ Sidebar ด้านล่าง */}
          <div className="p-3 border-t border-zinc-900">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-900 gap-2.5 rounded-xl text-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header แถบด้านบน */}
        <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-2.5 text-zinc-800 font-semibold text-base">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Ambulance className="h-5 w-5" />
            </div>
            <span>ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน</span>
          </div>

          {/* ส่วนแสดงข้อมูลผู้ใช้งานและเมนู Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200 cursor-pointer focus:outline-none"
            >
              {/* รูป Avatar แสดงผลจากฐานข้อมูล Blob */}
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullname || "User Avatar"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                    }}
                  />
                ) : (
                  <User className="h-5 w-5 text-orange-600" />
                )}
              </div>

              {/* ข้อความชื่อและตำแหน่ง */}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-zinc-800 leading-tight">
                  {user?.fullname || "กำลังโหลด..."}
                </div>
                <div className="text-[11px] text-orange-600 font-medium">
                  {user?.role || "เจ้าหน้าที่"}
                </div>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-zinc-400 ml-0.5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* กล่องเมนู Dropdown เมื่อกดเปิด */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-zinc-100">
                  <p className="text-[11px] text-zinc-400">เข้าสู่ระบบในชื่อ</p>
                  <p className="font-semibold text-zinc-800 truncate">{user?.fullname}</p>
                  <p className="text-xs text-zinc-500 font-mono">@{user?.username}</p>
                </div>

                <div className="p-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-zinc-400 group-hover:text-orange-600" />
                    <span>แก้ไขโปรไฟล์ / เลือกรูป</span>
                  </Link>
                </div>

                <div className="h-px bg-zinc-100 my-1" />

                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* พื้นที่แสดงผลเนื้อหาของแต่ละหน้า */}
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}