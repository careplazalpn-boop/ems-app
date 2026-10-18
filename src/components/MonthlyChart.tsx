"use client";

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

interface MonthlyData {
  month: string;
  total: number;
  red: number;
  yellow: number;
  green: number;
  white: number;
}

export default function MonthlyChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="red" name="วิกฤต (แดง)" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
          <Bar dataKey="yellow" name="เร่งด่วน (เหลือง)" stackId="a" fill="#eab308" />
          <Bar dataKey="green" name="ไม่รุนแรง (เขียว)" stackId="a" fill="#22c55e" />
          <Bar dataKey="white" name="ทั่วไป (ขาว)" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}