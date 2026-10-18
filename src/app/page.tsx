import { AppLayout } from "@/components/layout/app-layout";
import { 
  Ambulance, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  FileText,
  CalendarCheck,
  BarChart3,
  Radio,
  Sparkles,
  Layers
} from "lucide-react";
import MonthlyChart, { YearDataRecord } from "@/components/MonthlyChart";
import OverallSection, { YearStatsRecord } from "@/components/OverallSection";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const activeStatuses = ["pending", "dispatched", "on_scene"];

    const [
      todayCases,
      allCasesRaw,
      availableVehicles,
    ] = await Promise.all([
      // 1. เคสของวันนี้
      prisma.ems_cases.findMany({
        where: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true, triage_level: true },
      }),

      // 2. ดึงเคสทั้งหมดเพื่อประมวลผลหมวดสะสมและกราฟ (ดึงเฉพาะ field สำคัญเพื่อ performance)
      prisma.ems_cases.findMany({
        select: { created_at: true, status: true, triage_level: true },
        orderBy: { created_at: "asc" },
      }),

      // 3. รถพยาบาลพร้อมใช้
      prisma.vehicles.findMany({
        where: { status: "active" },
        select: {
          vehicle_id: true,
          plate_number: true,
          vehicle_type: true,
          brand: true,
        },
      }),
    ]);

    // -------------------------------------------------------------
    // คำนวณสถิติวันนี้
    // -------------------------------------------------------------
    const todayValidCases = todayCases.filter((c) => c.status !== "cancelled");
    const todayStats = {
      status: {
        total: todayCases.length,
        active: todayCases.filter((c) => activeStatuses.includes(c.status)).length,
        completed: todayCases.filter((c) => c.status === "completed").length,
        cancelled: todayCases.filter((c) => c.status === "cancelled").length,
      },
      triage: {
        red: todayValidCases.filter((c) => c.triage_level === "red").length,
        yellow: todayValidCases.filter((c) => c.triage_level === "yellow").length,
        green: todayValidCases.filter((c) => c.triage_level === "green").length,
        white: todayValidCases.filter((c) => c.triage_level === "white").length,
      },
    };

    // -------------------------------------------------------------
    // คำนวณสถิติสะสมทั้งหมด และสถิติแยกตามปี
    // -------------------------------------------------------------
    const allTimeRecord: YearStatsRecord = {
      status: { total: 0, active: 0, completed: 0, cancelled: 0 },
      triage: { red: 0, yellow: 0, green: 0, white: 0 },
    };

    const yearlyDataRecord: Record<number, YearStatsRecord> = {};
    const detectedYears = new Set<number>([currentYear]);

    allCasesRaw.forEach((c) => {
      const yr = new Date(c.created_at).getFullYear();
      detectedYears.add(yr);

      if (!yearlyDataRecord[yr]) {
        yearlyDataRecord[yr] = {
          status: { total: 0, active: 0, completed: 0, cancelled: 0 },
          triage: { red: 0, yellow: 0, green: 0, white: 0 },
        };
      }

      // นับรวม All-time
      allTimeRecord.status.total += 1;
      if (activeStatuses.includes(c.status)) allTimeRecord.status.active += 1;
      if (c.status === "completed") allTimeRecord.status.completed += 1;
      if (c.status === "cancelled") allTimeRecord.status.cancelled += 1;

      if (c.status !== "cancelled") {
        if (c.triage_level === "red") allTimeRecord.triage.red += 1;
        if (c.triage_level === "yellow") allTimeRecord.triage.yellow += 1;
        if (c.triage_level === "green") allTimeRecord.triage.green += 1;
        if (c.triage_level === "white") allTimeRecord.triage.white += 1;
      }

      // นับแยกตามปี
      const yStats = yearlyDataRecord[yr];
      yStats.status.total += 1;
      if (activeStatuses.includes(c.status)) yStats.status.active += 1;
      if (c.status === "completed") yStats.status.completed += 1;
      if (c.status === "cancelled") yStats.status.cancelled += 1;

      if (c.status !== "cancelled") {
        if (c.triage_level === "red") yStats.triage.red += 1;
        if (c.triage_level === "yellow") yStats.triage.yellow += 1;
        if (c.triage_level === "green") yStats.triage.green += 1;
        if (c.triage_level === "white") yStats.triage.white += 1;
      }
    });

    const availableYears = Array.from(detectedYears).sort((a, b) => b - a);

    // -------------------------------------------------------------
    // เตรียมข้อมูลกราฟรายเดือน (ไม่นับยกเลิก)
    // -------------------------------------------------------------
    const monthNames = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const chartYearData: YearDataRecord = {};
    availableYears.forEach((yr) => {
      const thaiYearShort = String((yr + 543) % 100).padStart(2, "0");
      chartYearData[yr] = monthNames.map((m) => ({
        month: `${m} ${thaiYearShort}`,
        total: 0,
        red: 0,
        yellow: 0,
        green: 0,
        white: 0,
      }));
    });

    allCasesRaw.forEach((c) => {
      if (c.status === "cancelled") return; // กราฟไม่นับเคสยกเลิก
      const d = new Date(c.created_at);
      const yr = d.getFullYear();
      const mIdx = d.getMonth();

      if (chartYearData[yr] && chartYearData[yr][mIdx]) {
        const item = chartYearData[yr][mIdx];
        item.total += 1;
        if (c.triage_level === "red") item.red += 1;
        if (c.triage_level === "yellow") item.yellow += 1;
        if (c.triage_level === "green") item.green += 1;
        if (c.triage_level === "white") item.white += 1;
      }
    });

    return {
      today: todayStats,
      allTimeData: allTimeRecord,
      yearlyData: yearlyDataRecord,
      chartYearData,
      availableYears,
      currentYear,
      vehicles: availableVehicles.map((v) => ({
        id: v.vehicle_id,
        name: v.brand || "รถพยาบาล",
        plate: v.plate_number,
        type: v.vehicle_type || "ALS / BLS",
      })),
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return {
      today: { status: { total: 0, active: 0, completed: 0, cancelled: 0 }, triage: { red: 0, yellow: 0, green: 0, white: 0 } },
      allTimeData: { status: { total: 0, active: 0, completed: 0, cancelled: 0 }, triage: { red: 0, yellow: 0, green: 0, white: 0 } },
      yearlyData: {},
      chartYearData: {},
      availableYears: [new Date().getFullYear()],
      currentYear: new Date().getFullYear(),
      vehicles: [],
    };
  }
}

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <AppLayout>
      <div className="space-y-8 pb-14 max-w-[1600px] mx-auto">
        
        {/* แถบหัวกระดาษหลัก */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <Radio className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  ศูนย์รับแจ้งเหตุและสั่งการแพทย์ฉุกเฉิน (EMS Command)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  ระบบติดตามรถพยาบาลและการรับส่งผู้ป่วยฉุกเฉิน เทศบาลเมืองลำพูน[cite: 1]
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300 self-start sm:self-auto backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            ข้อมูลสดแบบ Real-Time
          </div>
        </div>

        {/* 1. ภาพรวมการปฏิบัติงานวันนี้ */}
        <section className="bg-gradient-to-b from-amber-50/70 via-white to-white p-6 sm:p-7 rounded-3xl border border-amber-200/80 shadow-md shadow-amber-500/5 space-y-6">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shadow-amber-500/30">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-amber-950">1. ภาพรวมการปฏิบัติงานวันนี้</h3>
                <p className="text-xs font-medium text-amber-700/80">สรุปความเคลื่อนไหวประจำวันแบบรอบชั่วโมง</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Today Operations
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-extrabold text-amber-900/60 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> สถานะการปฏิบัติการ (Status)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CardWidget title="เคสทั้งหมดวันนี้" value={data.today.status.total} unit="เคส" icon={FileText} bgStyle="bg-white border-amber-200 text-zinc-800" iconStyle="bg-amber-100 text-amber-800" />
              <CardWidget title="กำลังปฏิบัติการ" value={data.today.status.active} unit="เคส" icon={AlertTriangle} bgStyle="bg-amber-100/60 border-amber-300 text-amber-900" iconStyle="bg-amber-500 text-white" />
              <CardWidget title="เสร็จสิ้นภารกิจ" value={data.today.status.completed} unit="เคส" icon={CheckCircle2} bgStyle="bg-emerald-50 border-emerald-200 text-emerald-900" iconStyle="bg-emerald-500 text-white" />
              <CardWidget title="ยกเลิกภารกิจ" value={data.today.status.cancelled} unit="เคส" icon={Activity} bgStyle="bg-rose-50 border-rose-200 text-rose-900" iconStyle="bg-rose-500 text-white" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-amber-900/60 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-500" /> ระดับความรุนแรงวันนี้ (Triage - ไม่นับเคสยกเลิก)[cite: 1]
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <TriagePill title="วิกฤต (แดง)" value={data.today.triage.red} dotColor="bg-red-500" containerStyle="bg-red-50/70 border-red-200 text-red-950" />
              <TriagePill title="เร่งด่วน (เหลือง)" value={data.today.triage.yellow} dotColor="bg-amber-500" containerStyle="bg-amber-50/80 border-amber-200 text-amber-950" />
              <TriagePill title="ไม่รุนแรง (เขียว)" value={data.today.triage.green} dotColor="bg-emerald-500" containerStyle="bg-emerald-50/70 border-emerald-200 text-emerald-950" />
              <TriagePill title="ทั่วไป (ขาว)" value={data.today.triage.white} dotColor="bg-slate-400" containerStyle="bg-slate-50 border-slate-200 text-slate-800" />
            </div>
          </div>
        </section>

        {/* 2. ภาพรวมการปฏิบัติงาน (มี Dropdown เลือกปี พ.ศ. หรือ ทั้งหมด) */}
        <OverallSection
          allTimeData={data.allTimeData}
          yearlyData={data.yearlyData}
          availableYears={data.availableYears}
        />

        {/* แถวล่าง: กราฟ (สัดส่วน 2) + รถพยาบาล (สัดส่วน 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. สถิติเปรียบเทียบรายเดือน */}
          <section className="lg:col-span-2 bg-gradient-to-b from-sky-50/60 via-white to-white p-6 sm:p-7 rounded-3xl border border-sky-200/80 shadow-md shadow-sky-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-sm shadow-sky-600/30">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-sky-950">3. สถิติเปรียบเทียบรายเดือน</h3>
                  <p className="text-xs font-medium text-sky-700/80">แนวโน้มเคสและระดับความรุนแรงตามรอบปี พ.ศ.</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                Monthly Trends
              </span>
            </div>

            <MonthlyChart
              yearData={data.chartYearData}
              availableYears={data.availableYears}
              currentYear={data.currentYear}
            />
          </section>

          {/* 4. รถพยาบาลพร้อมใช้งาน */}
          <section className="bg-gradient-to-b from-emerald-50/60 via-white to-white p-6 sm:p-7 rounded-3xl border border-emerald-200/80 shadow-md shadow-emerald-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm shadow-emerald-600/30">
                  <Ambulance className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">4. รถพยาบาลพร้อมใช้</h3>
                  <p className="text-xs font-medium text-emerald-700/80">สแตนด์บายประจำศูนย์ฯ[cite: 1]</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm shadow-emerald-600/30">
                {data.vehicles.length} คัน
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {data.vehicles.length > 0 ? (
                data.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl border border-emerald-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Ambulance className="h-6 w-6" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-zinc-900 truncate">{v.name}</h4>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          พร้อมออกเหตุ
                        </span>
                      </div>
                      <p className="text-xs font-bold text-emerald-950 mt-1">{v.plate}</p>
                      <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{v.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-200">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p className="text-xs font-bold text-zinc-500">ไม่มีรถพร้อมใช้งานในขณะนี้</p>
                </div>
              )}
            </div>
          </section>

        </div>

      </div>
    </AppLayout>
  );
}

function CardWidget({
  title,
  value,
  unit,
  icon: Icon,
  bgStyle,
  iconStyle,
}: {
  title: string;
  value: number;
  unit: string;
  icon: any;
  bgStyle: string;
  iconStyle: string;
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${bgStyle}`}>
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-bold opacity-80">{title}</span>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-xs ${iconStyle}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight">
        {value.toLocaleString()} <span className="text-xs sm:text-sm font-normal opacity-70">{unit}</span>
      </div>
    </div>
  );
}

function TriagePill({
  title,
  value,
  dotColor,
  containerStyle,
}: {
  title: string;
  value: number;
  dotColor: string;
  containerStyle: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border shadow-xs ${containerStyle}`}>
      <span className={`h-3 w-3 rounded-full shrink-0 ${dotColor} ring-4 ring-white/80`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold opacity-75 truncate">{title}</p>
        <p className="text-lg font-black leading-tight mt-0.5">
          {value.toLocaleString()} <span className="text-xs font-normal opacity-70">เคส</span>
        </p>
      </div>
    </div>
  );
}