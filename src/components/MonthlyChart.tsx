"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";

export interface MonthlyStatsItem {
  month: string;
  total: number;
  red: number;
  yellow: number;
  green: number;
  white: number;
}

export type YearDataRecord = Record<number, MonthlyStatsItem[]>;

interface Props {
  yearData: YearDataRecord;
  availableYears: number[];
  currentYear: number;
}

export default function MonthlyChart({ yearData, availableYears, currentYear }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const data = yearData[selectedYear] || [];

  return (
    <div className="w-full space-y-4">
      {/* ส่วนหัวกราฟและ Dropdown เลือกปี พ.ศ. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <h4 className="text-sm font-bold text-zinc-800">
            กราฟเปรียบเทียบเคสและระดับความรุนแรงรายเดือน (ไม่รวมเคสยกเลิก)
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            แสดงแท่งเคสปฏิบัติการจริงเทียบกับแท่งระดับความรุนแรงแต่ละระดับ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-600">เลือกปี พ.ศ.:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                พ.ศ. {yr + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* กราฟแท่ง Recharts */}
      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={2}
            barCategoryGap="18%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.07)",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "14px" }}
              iconType="circle"
            />

            {/* แท่งที่ 1: เคสจริงทั้งหมด (ไม่รวมยกเลิก) */}
            <Bar dataKey="total" name="เคสทั้งหมด" fill="#0284c7" radius={[4, 4, 0, 0]} />

            {/* แท่งที่ 2 - 5: ระดับความรุนแรง 4 สี แยกแท่งอิสระ */}
            <Bar dataKey="red" name="วิกฤต (แดง)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="yellow" name="เร่งด่วน (เหลือง)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="green" name="ไม่รุนแรง (เขียว)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="white" name="ทั่วไป (ขาว)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}