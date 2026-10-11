"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, Lock, User, AlertCircle, Loader2, PhoneCall } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* วงแสงไฟตกแต่งด้านหลัง (Emergency Glow) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-2xl">
          {/* แถบสีไฮไลต์ ส้ม-แดง ด้านบน */}
          <div className="h-2.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />

          <div className="p-8 pb-4 text-center">
            {/* โลโก้หน่วยงาน */}
            <div className="flex justify-center mb-4">
              <div className="relative h-24 w-24 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <Image
                  src="/images/logo-org.png"
                  alt="ตราสัญลักษณ์ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน"
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                  priority
                />
              </div>
            </div>

            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full tracking-wide mb-2">
              หน่วยปฏิบัติการแพทย์ฉุกเฉิน (EMS)
            </span>

            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              ระบบงานแพทย์ฉุกเฉิน
            </h1>
            <p className="text-sm font-medium text-zinc-600 mt-1">
              ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน
            </p>
            <p className="text-xs text-zinc-400 font-sans tracking-wide mt-0.5">
              Lamphun Town EMS & Patient Transport System
            </p>
          </div>

          <CardContent className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-zinc-700 text-sm font-medium">
                  ชื่อผู้ใช้งาน
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="off"
                    placeholder="กรอกชื่อผู้ใช้ (Username)"
                    className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 text-zinc-900 rounded-xl"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-700 text-sm font-medium">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 text-zinc-900 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    เข้าสู่ระบบปฏิบัติการ
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                ระบบเครือข่ายพร้อมทำงาน
              </span>
              <span className="flex items-center gap-1 text-zinc-500 font-medium">
                <PhoneCall className="h-3.5 w-3.5 text-orange-600" /> สายด่วน 1669
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}