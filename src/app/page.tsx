import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance, Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            ภาพรวมการปฏิบัติงานวันนี้
          </h2>
          <p className="text-sm text-slate-500">
            ระบบติดตามรถพยาบาลและการรับส่งผู้ป่วยฉุกเฉิน
          </p>
        </div>

        {/* การ์ดสถิติต่างๆ */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">เคสทั้งหมดวันนี้</CardTitle>
              <Ambulance className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">0 เคส</div>
              <p className="text-xs text-slate-500 mt-1">ประจำวันที่เปิดระบบ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">กำลังปฏิบัติการ</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">0 คัน</div>
              <p className="text-xs text-slate-500 mt-1">รถกำลังออกเหตุ / เดินทาง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">เสร็จสิ้นภารกิจ</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">0 เคส</div>
              <p className="text-xs text-slate-500 mt-1">ส่งถึงโรงพยาบาลเรียบร้อย</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">รถพยาบาลพร้อมใช้</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">2 คัน</div>
              <p className="text-xs text-slate-500 mt-1">จอดประจำศูนย์ฯ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}