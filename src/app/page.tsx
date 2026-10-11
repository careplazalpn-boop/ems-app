import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance, Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* หัวข้อหน้า: ย่อขนาดอัตโนมัติตามหน้าจอ */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            ภาพรวมการปฏิบัติงานวันนี้
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ระบบติดตามรถพยาบาลและการรับส่งผู้ป่วยฉุกเฉิน เทศบาลเมืองลำพูน
          </p>
        </div>

        {/* การ์ดสถิติแบบ Responsive 1 -> 2 -> 4 คอลัมน์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* การ์ด 1: เคสทั้งหมด */}
          <Card className="rounded-2xl border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-zinc-600">เคสทั้งหมดวันนี้</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                <Ambulance className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">0 <span className="text-sm font-normal text-zinc-500">เคส</span></div>
              <p className="text-xs text-zinc-400 mt-1.5">ประจำวันที่เปิดระบบ</p>
            </CardContent>
          </Card>

          {/* การ์ด 2: กำลังปฏิบัติการ */}
          <Card className="rounded-2xl border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-amber-700">กำลังปฏิบัติการ</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 tracking-tight">0 <span className="text-sm font-normal text-amber-500">คัน</span></div>
              <p className="text-xs text-amber-600/80 mt-1.5 font-medium">รถกำลังออกเหตุ / เดินทาง</p>
            </CardContent>
          </Card>

          {/* การ์ด 3: เสร็จสิ้นภารกิจ */}
          <Card className="rounded-2xl border-emerald-200/80 bg-emerald-50/20 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-emerald-700">เสร็จสิ้นภารกิจ</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight">0 <span className="text-sm font-normal text-emerald-500">เคส</span></div>
              <p className="text-xs text-emerald-600/80 mt-1.5 font-medium">ส่งถึงโรงพยาบาลเรียบร้อย</p>
            </CardContent>
          </Card>

          {/* การ์ด 4: รถพยาบาลพร้อมใช้ */}
          <Card className="rounded-2xl border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-zinc-600">รถพยาบาลพร้อมใช้</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">2 <span className="text-sm font-normal text-zinc-500">คัน</span></div>
              <p className="text-xs text-zinc-400 mt-1.5">จอดสแตนด์บายประจำศูนย์ฯ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}