import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ambulance, Users, CheckCircle2, AlertTriangle, Activity, HeartPulse, Clock, FileText } from "lucide-react";
import MonthlyChart from "@/components/MonthlyChart";
// TODO: import ระบบเชื่อมต่อ DB ของคุณ เช่น import db from "@/lib/db";

// ฟังก์ชันจำลองการดึงข้อมูล (เปลี่ยนไปใช้ SQL จริงตามคอมเมนต์ได้เลย)
async function getDashboardData() {
  /*
    ตัวอย่าง SQL ที่ต้องใช้ (นำไปประยุกต์กับ db.query ของคุณ):
    
    1. ภาพรวมวันนี้ (Today Status)
    SELECT status, COUNT(*) as count FROM cases WHERE DATE(created_at) = CURDATE() GROUP BY status;
    
    2. ความรุนแรงวันนี้ (ไม่นับยกเลิก)
    SELECT triage, COUNT(*) as count FROM cases WHERE DATE(created_at) = CURDATE() AND status != 'ยกเลิก' GROUP BY triage;
    
    3. กราฟรายเดือน (แยกตาม Triage ไม่นับยกเลิก)
    SELECT DATE_FORMAT(created_at, '%b %Y') as month, triage, COUNT(*) as count 
    FROM cases WHERE status != 'ยกเลิก' GROUP BY month, triage ORDER BY created_at ASC;
    
    4. รถพยาบาลที่พร้อมใช้งาน
    SELECT * FROM vehicles WHERE status = 'พร้อมใช้งาน';
  */

  return {
    today: {
      status: { total: 12, active: 2, completed: 8, cancelled: 2 },
      triage: { red: 1, yellow: 3, green: 5, white: 1 } // รวม 10 เคส (ไม่นับยกเลิก)
    },
    overall: {
      status: { total: 1250, active: 2, completed: 1100, cancelled: 148 },
      triage: { red: 150, yellow: 300, green: 550, white: 100 }
    },
    monthlyData: [
      { month: "ม.ค.", total: 150, red: 20, yellow: 40, green: 80, white: 10 },
      { month: "ก.พ.", total: 120, red: 15, yellow: 35, green: 60, white: 10 },
      { month: "มี.ค.", total: 180, red: 25, yellow: 50, green: 90, white: 15 },
      { month: "เม.ย.", total: 200, red: 30, yellow: 60, green: 95, white: 15 },
    ],
    vehicles: [
      { id: 1, name: "ALS-01", plate: "กข 1234 ลำพูน", type: "ALS (Advance)" },
      { id: 2, name: "BLS-02", plate: "นข 9999 ลำพูน", type: "BLS (Basic)" },
    ]
  };
}

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        
        {/* หัวข้อหน้า */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            ภาพรวมระบบสั่งการ (Dashboard)
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน
          </p>
        </div>

        {/* 1. ภาพรวมการปฏิบัติงานวันนี้ */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-800 border-l-4 border-orange-500 pl-3">
            1. ภาพรวมการปฏิบัติงานวันนี้
          </h3>
          
          {/* 1.1 Status วันนี้ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="เคสทั้งหมดวันนี้" value={data.today.status.total} unit="เคส" icon={FileText} color="zinc" />
            <StatsCard title="กำลังปฏิบัติการ" value={data.today.status.active} unit="เคส" icon={AlertTriangle} color="amber" />
            <StatsCard title="เสร็จสิ้นภารกิจ" value={data.today.status.completed} unit="เคส" icon={CheckCircle2} color="emerald" />
            <StatsCard title="ยกเลิก" value={data.today.status.cancelled} unit="เคส" icon={Activity} color="rose" />
          </div>

          {/* 1.2 Triage วันนี้ (ไม่รวมยกเลิก) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <TriageCard title="วิกฤต (สีแดง)" value={data.today.triage.red} color="bg-red-500" />
            <TriageCard title="เร่งด่วน (สีเหลือง)" value={data.today.triage.yellow} color="bg-yellow-500" />
            <TriageCard title="ไม่รุนแรง (สีเขียว)" value={data.today.triage.green} color="bg-green-500" />
            <TriageCard title="ทั่วไป (สีขาว)" value={data.today.triage.white} color="bg-slate-400" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* คอลัมน์ซ้าย (กินพื้นที่ 2 ส่วน): กราฟรายเดือน และ ภาพรวมทั้งหมด */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 3. กราฟแท่งสรุปสถิติเป็นเดือนๆ */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-800 border-l-4 border-blue-500 pl-3">
                สถิติการออกเหตุรายเดือน (จำแนกตามความรุนแรง)
              </h3>
              <Card className="rounded-2xl border-zinc-200/80 shadow-xs">
                <CardContent className="pt-6">
                  <MonthlyChart data={data.monthlyData} />
                </CardContent>
              </Card>
            </section>

            {/* 2. ภาพรวมการปฏิบัติงานทั้งหมด (All-time) */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-800 border-l-4 border-purple-500 pl-3">
                2. ภาพรวมการปฏิบัติงานสะสม (ทั้งหมด)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-2xl border-zinc-200/80 shadow-xs bg-zinc-50/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">เคสสะสมทั้งหมด</p>
                      <p className="text-2xl font-bold text-zinc-900">{data.overall.status.total.toLocaleString()}</p>
                    </div>
                    <FileText className="h-8 w-8 text-zinc-300" />
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-zinc-200/80 shadow-xs bg-emerald-50/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600">ช่วยเหลือสำเร็จ (สะสม)</p>
                      <p className="text-2xl font-bold text-emerald-700">{data.overall.status.completed.toLocaleString()}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>

          {/* คอลัมน์ขวา (กินพื้นที่ 1 ส่วน): รถพยาบาล */}
          <div className="space-y-8">
            
            {/* 4. ข้อมูลรถพยาบาลฉุกเฉิน ที่พร้อมใช้งาน */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-800 border-l-4 border-emerald-500 pl-3">
                  รถพยาบาลพร้อมใช้งาน
                </h3>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {data.vehicles.length} คัน
                </span>
              </div>
              
              <div className="space-y-3">
                {data.vehicles.length > 0 ? (
                  data.vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="rounded-xl border-emerald-200 shadow-xs hover:border-emerald-300 transition-colors">
                      <CardContent className="p-4 flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Ambulance className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-zinc-900 truncate">{vehicle.name}</h4>
                          <div className="flex items-center text-xs text-zinc-500 mt-1">
                            <span className="truncate">{vehicle.plate}</span>
                            <span className="mx-2">•</span>
                            <span className="text-emerald-600 font-medium">{vehicle.type}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ไม่มีรถว่างในขณะนี้</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// --- Sub-components เพื่อให้โค้ดสะอาดตา ---

function StatsCard({ title, value, unit, icon: Icon, color }: { title: string, value: number, unit: string, icon: any, color: 'zinc' | 'amber' | 'emerald' | 'rose' }) {
  const colors = {
    zinc: "border-zinc-200/80 bg-white text-zinc-900 icon-bg-zinc-100 icon-text-zinc-600",
    amber: "border-amber-200/80 bg-amber-50/30 text-amber-700 icon-bg-amber-100 icon-text-amber-600",
    emerald: "border-emerald-200/80 bg-emerald-50/30 text-emerald-700 icon-bg-emerald-100 icon-text-emerald-600",
    rose: "border-rose-200/80 bg-rose-50/30 text-rose-700 icon-bg-rose-100 icon-text-rose-600",
  };
  const c = colors[color];

  return (
    <Card className={`rounded-2xl shadow-xs transition-all ${c.split(' ')[0]} ${c.split(' ')[1]}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-6">
        <CardTitle className={`text-xs sm:text-sm font-semibold ${c.split(' ')[2]}`}>{title}</CardTitle>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${c.split(' ')[3].replace('icon-', '')} ${c.split(' ')[4].replace('icon-', '')}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${c.split(' ')[2]}`}>
          {value} <span className="text-sm font-normal opacity-70">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TriageCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl border border-zinc-100 bg-white shadow-xs">
      <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full shrink-0 ${color} shadow-sm`} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">{title}</p>
        <p className="text-lg sm:text-xl font-bold text-zinc-900 leading-tight">{value} <span className="text-xs font-normal text-zinc-400">เคส</span></p>
      </div>
    </div>
  );
}