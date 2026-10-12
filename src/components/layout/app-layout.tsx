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
  UserCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UserSearch,
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
  { title: "ค้นหาข้อมูลผู้ป่วย", href: "/patients", icon: UserSearch },  
  { title: "บันทึกรับแจ้งเหตุใหม่", href: "/cases/new", icon: FilePlus },
  { title: "รายการเคสฉุกเฉิน", href: "/cases", icon: ClipboardList },
  { title: "แผนที่ติดตามรถพยาบาล", href: "/tracking", icon: MapPin },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Ignored
    }
    document.cookie = "session_token=; path=/; max-age=0;";
    setDropdownOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-50 overflow-hidden relative">
      {/* ---------------- MOBILE OVERLAY BACKDROP ---------------- */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* ---------------- SIDEBAR (ตรึงเต็มความสูงหน้าจอตลอดเวลา) ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col border-r border-zinc-800 transition-all duration-300 ease-in-out lg:static lg:h-full shrink-0 relative overflow-hidden ${
          mobileMenuOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${desktopCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* โลโก้การแพทย์ฉุกเฉินเป็นพื้นหลังลายน้ำ (Watermark Background) จัดตำแหน่งกึ่งกลางแถบ Sidebar ด้านล่าง */}
        <div className="absolute bottom-30 left-1/2 -translate-x-1/2 w-44 h-44 pointer-events-none opacity-35 z-0 select-none flex items-center justify-center transition-all duration-300">
          <Image
            src="/images/logo_ems.png"
            alt="EMS Background Logo"
            fill
            sizes="176px"
            className="object-contain p-2"
            priority
          />
        </div>

        {/* ปุ่มพับ/กางเมนูลอยตรงกึ่งกลางขอบ Sidebar สำหรับ Desktop */}
        <button
          type="button"
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="hidden lg:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-orange-600 hover:border-orange-500 shadow-md transition-all duration-200 z-50 cursor-pointer group"
          title={desktopCollapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
          aria-label={desktopCollapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
        >
          {desktopCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform group-hover:scale-110" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
        </button>

        {/* ส่วนหัว Sidebar: โลโก้หน่วยงาน */}
        <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0 z-10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 bg-white p-1 rounded-xl shadow-inner">
              <Image
                src="/images/logo-org.png"
                alt="Logo"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            {(!desktopCollapsed || mobileMenuOpen) && (
              <div className="min-w-0 truncate">
                <h1 className="font-bold text-sm leading-tight text-white truncate">
                  ระบบการแพทย์ฉุกเฉิน
                </h1>
                <p className="text-xs text-orange-400 font-medium truncate">ทม.ลำพูน (EMS)</p>
              </div>
            )}
          </div>

          {/* ปุ่มปิดเฉพาะบนหน้าจอมือถือ */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ป้ายสถานะศูนย์วิทยุ */}
        {(!desktopCollapsed || mobileMenuOpen) ? (
          <div className="px-3.5 py-2 mx-3 mt-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between shrink-0 z-10 relative">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium truncate">
              <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse shrink-0" />
              ศูนย์วิทยุ
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/50 shrink-0">
              พร้อมรับเหตุ
            </span>
          </div>
        ) : (
          <div className="mt-3 flex justify-center shrink-0 z-10 relative" title="สถานะศูนย์วิทยุ: พร้อมรับเหตุ">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-950" />
          </div>
        )}

        {/* เมนูหลักนำทาง (z-10 เพื่อให้อยู่บนสุดเสมอ) */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto z-10 relative">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={desktopCollapsed && !mobileMenuOpen ? item.title : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20"
                    : "text-zinc-300 hover:bg-zinc-900/90 hover:text-white"
                } ${desktopCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                {(!desktopCollapsed || mobileMenuOpen) && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ปุ่มออกจากระบบด้านล่างสุด */}
        <div className="p-3 border-t border-zinc-900 shrink-0 z-10 relative bg-zinc-950/80 backdrop-blur-sm">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full text-red-400 hover:text-red-300 hover:bg-zinc-900 gap-2.5 rounded-xl text-sm cursor-pointer ${
              desktopCollapsed && !mobileMenuOpen ? "justify-center px-0" : "justify-start"
            }`}
            title="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!desktopCollapsed || mobileMenuOpen) && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Hamburger Button สำหรับ Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="เปิดเมนูนำทาง"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* โลโก้และชื่อศูนย์บริการ */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Ambulance className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm sm:text-base text-zinc-800 truncate">
                <span className="hidden md:inline">ศูนย์บริการสาธารณสุข</span>เทศบาลเมืองลำพูน
              </span>
            </div>
          </div>

          {/* User Profile & Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200 cursor-pointer focus:outline-none"
            >
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
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
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                )}
              </div>

              <div className="text-left hidden md:block max-w-[130px] lg:max-w-[180px]">
                <div className="text-xs font-semibold text-zinc-800 leading-tight truncate">
                  {user?.fullname || "กำลังโหลด..."}
                </div>
                <div className="text-[11px] text-orange-600 font-medium truncate">
                  {user?.role || "เจ้าหน้าที่"}
                </div>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Items */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
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
                    <UserCheck className="h-4 w-4 text-zinc-400" />
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

        {/* พื้นที่ Content ด้านใน */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}