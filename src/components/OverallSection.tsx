"use client";

import { useState } from "react";
import { 
  History, 
  Calendar, 
  Sparkles, 
  Layers, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Activity 
} from "lucide-react";

export interface StatusCounts {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface TriageCounts {
  red: number;
  yellow: number;
  green: number;
  white: number;
}

export interface YearStatsRecord {
  status: StatusCounts;
  triage: TriageCounts;
}

interface Props {
  allTimeData: YearStatsRecord;
  yearlyData: Record<number, YearStatsRecord>;
  availableYears: number[];
}

export default function OverallSection({ allTimeData, yearlyData, availableYears }: Props) {
  // ค่าเริ่มต้นคือ "all" (สถิติทั้งหมด)
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const currentStats = selectedYear === "all" ? allTimeData : (yearlyData[Number(selectedYear)] || {
    status: { total: 0, active: 0, completed: 0, cancelled: 0 },
    triage: { red: 0, yellow: 0, green: 0, white: 0 },
  });

  return (
    <section className="bg-gradient-to-b from-indigo-50/60 via-white to-white p-6 sm:p-7 rounded-3xl border border-indigo-200/80 shadow-md shadow-indigo-500/5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-200/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm shadow-indigo-600/30">
            <History className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-indigo-950">
              2. ภาพรวมการปฏิบัติงาน{selectedYear === "all" ? "สะสมทั้งหมด" : `ประจำปี พ.ศ. ${Number(selectedYear) + 543}`}
            </h3>
            <p className="text-xs font-medium text-indigo-700/80">
              {selectedYear === "all" 
                ? "ฐานข้อมูลประวัติการออกช่วยเหลือผู้ประสบเหตุทั้งหมดตั้งแต่เริ่มระบบ" 
                : `ข้อมูลสถิติเฉพาะการออกเหตุภายในปี พ.ศ. ${Number(selectedYear) + 543}`}
            </p>
          </div>
        </div>

        {/* Dropdown เลือกปี พ.ศ. หรือ ทั้งหมด */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3.5 py-1.5 rounded-2xl border border-indigo-200 shadow-xs">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-zinc-600">แสดงผล:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent text-xs font-black text-indigo-950 focus:outline-none cursor-pointer"
          >
            <option value="all">ทั้งหมด (All-Time)</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                พ.ศ. {yr + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* สถานะการปฏิบัติการ (Status) */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-indigo-900/60 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> สถานะการปฏิบัติการ (Status)
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardWidget 
            title="เคสทั้งหมด" 
            value={currentStats.status.total} 
            unit="เคส" 
            icon={FileText} 
            bgStyle="bg-white border-indigo-200 text-zinc-800" 
            iconStyle="bg-indigo-100 text-indigo-800" 
          />
          <CardWidget 
            title="กำลังปฏิบัติการ" 
            value={currentStats.status.active} 
            unit="เคส" 
            icon={AlertTriangle} 
            bgStyle="bg-indigo-100/60 border-indigo-300 text-indigo-900" 
            iconStyle="bg-indigo-600 text-white" 
          />
          <CardWidget 
            title="เสร็จสิ้นภารกิจ" 
            value={currentStats.status.completed} 
            unit="เคส" 
            icon={CheckCircle2} 
            bgStyle="bg-emerald-50 border-emerald-200 text-emerald-900" 
            iconStyle="bg-emerald-600 text-white" 
          />
          <CardWidget 
            title="ยกเลิกภารกิจ" 
            value={currentStats.status.cancelled} 
            unit="เคส" 
            icon={Activity} 
            bgStyle="bg-rose-50 border-rose-200 text-rose-900" 
            iconStyle="bg-rose-600 text-white" 
          />
        </div>
      </div>

      {/* ระดับความรุนแรง (Triage - ไม่นับเคสยกเลิก) */}
      <div className="space-y-3 pt-2">
        <p className="text-xs font-extrabold text-indigo-900/60 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-indigo-500" /> ระดับความรุนแรง (Triage - ไม่นับเคสยกเลิก)
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <TriagePill title="วิกฤต (แดง)" value={currentStats.triage.red} dotColor="bg-red-500" containerStyle="bg-red-50/70 border-red-200 text-red-950" />
          <TriagePill title="เร่งด่วน (เหลือง)" value={currentStats.triage.yellow} dotColor="bg-amber-500" containerStyle="bg-amber-50/80 border-amber-200 text-amber-950" />
          <TriagePill title="ไม่รุนแรง (เขียว)" value={currentStats.triage.green} dotColor="bg-emerald-500" containerStyle="bg-emerald-50/70 border-emerald-200 text-emerald-950" />
          <TriagePill title="ทั่วไป (ขาว)" value={currentStats.triage.white} dotColor="bg-slate-400" containerStyle="bg-slate-50 border-slate-200 text-slate-800" />
        </div>
      </div>
    </section>
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