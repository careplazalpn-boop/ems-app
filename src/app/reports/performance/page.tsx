"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Siren,
  Building2,
  Car,
  User,
  ShieldCheck,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";

// ดึงวันที่ปัจจุบัน YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PerformanceReportPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    red: 0,
    yellow: 0,
    green: 0,
    white: 0,
    cancelled: 0,
  });

  // ตัวกรองช่วงเวลา (เริ่มต้นเป็นวันนี้)
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

  // ค้นหาผู้รับบริการ (HN, CID, ชื่อ-สกุล)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // กรองตาม Triage และ Status
  const [triageFilter, setTriageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination (10, 20, 30, 50, 100)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ดึงข้อมูลรายงาน
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        triage: triageFilter,
        status: statusFilter,
      });

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/reports/performance?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRecords(data.records || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) {
          setTotalRecords(data.pagination.total || 0);
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate, searchQuery, triageFilter, statusFilter]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setStartDate(getTodayDateString());
    setEndDate(getTodayDateString());
    setSearchInput("");
    setSearchQuery("");
    setTriageFilter("all");
    setStatusFilter("all");
    setLimit(10);
    setPage(1);
  };

  const handleSelectAllTime = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const isTodayActive = useMemo(() => {
    const today = getTodayDateString();
    return startDate === today && endDate === today;
  }, [startDate, endDate]);

  const isAllTimeActive = useMemo(() => {
    return startDate === "" && endDate === "";
  }, [startDate, endDate]);

  const formatThaiDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const renderTriageBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "red":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">วิกฤต (Red)</span>;
      case "yellow":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">เร่งด่วน (Yellow)</span>;
      case "green":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">ไม่เร่งด่วน (Green)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">ทั่วไป (White)</span>;
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-5 pb-20">
        {/* ส่วนหัว Title & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  รายงานผลการปฏิบัติงานการแพทย์ฉุกเฉิน
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  EMS REPORT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                สรุปสถิติผลการปฏิบัติการ การคัดกรองความรุนแรง และข้อมูลผู้รับบริการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-500" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              type="button"
              onClick={fetchReportData}
              disabled={loading}
              className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* 1. การ์ดสรุปสถิติตามระดับความรุนแรง (Triage Cards) - ผันแปรตามช่วงเวลา */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* ทั้งหมด */}
          <div
            onClick={() => {
              setTriageFilter("all");
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              triageFilter === "all" && statusFilter === "all"
                ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-80 flex items-center justify-between">
              <span>เคสปฏิบัติการ</span>
              <Siren className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.total}</div>
            <div className="text-[10px] opacity-70 mt-0.5">เสร็จสิ้น {summary.completed} เคส</div>
          </div>

          {/* วิกฤต (Red) */}
          <div
            onClick={() => {
              setTriageFilter("red");
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              triageFilter === "red" && statusFilter !== "cancelled"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-rose-50/50 border-rose-200 text-rose-900 hover:bg-rose-100/60 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                วิกฤต (Red)
              </span>
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.red}</div>
            <div className="text-[10px] opacity-80 mt-0.5">ความเร่งด่วนสูงสุด</div>
          </div>

          {/* เร่งด่วน (Yellow) */}
          <div
            onClick={() => {
              setTriageFilter("yellow");
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              triageFilter === "yellow" && statusFilter !== "cancelled"
                ? "bg-amber-500 text-white border-amber-500 shadow-md"
                : "bg-amber-50/50 border-amber-200 text-amber-900 hover:bg-amber-100/60 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center justify-between">
              <span>เร่งด่วน (Yellow)</span>
              <AlertTriangle className="w-3.5 h-3.5 opacity-80" />
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.yellow}</div>
            <div className="text-[10px] opacity-80 mt-0.5">การบริบาลฉุกเฉิน</div>
          </div>

          {/* ไม่เร่งด่วน (Green) */}
          <div
            onClick={() => {
              setTriageFilter("green");
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              triageFilter === "green" && statusFilter !== "cancelled"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/60 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center justify-between">
              <span>ไม่เร่งด่วน (Green)</span>
              <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.green}</div>
            <div className="text-[10px] opacity-80 mt-0.5">ปฐมพยาบาลเบื้องต้น</div>
          </div>

          {/* ทั่วไป (White) */}
          <div
            onClick={() => {
              setTriageFilter("white");
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              triageFilter === "white" && statusFilter !== "cancelled"
                ? "bg-zinc-700 text-white border-zinc-700 shadow-md"
                : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center justify-between">
              <span>ทั่วไป (White)</span>
              <Clock className="w-3.5 h-3.5 opacity-80" />
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.white}</div>
            <div className="text-[10px] opacity-80 mt-0.5">ตรวจประเมินทั่วไป</div>
          </div>

          {/* ยกเลิกเคส */}
          <div
            onClick={() => {
              setTriageFilter("all");
              setStatusFilter("cancelled");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
              statusFilter === "cancelled"
                ? "bg-rose-700 text-white border-rose-700 shadow-md"
                : "bg-rose-100/40 border-rose-200 text-rose-800 hover:bg-rose-100/70 shadow-2xs"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center justify-between">
              <span>ยกเลิกเคส</span>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-black mt-1.5">{summary.cancelled}</div>
            <div className="text-[10px] opacity-80 mt-0.5">เหตุซ้ำซ้อน/ยกเลิก</div>
          </div>
        </div>

        {/* 2. กล่องควบคุม: กรองช่วงเวลา + ค้นหาผู้รับบริการ (HN, เลขบัตร, ชื่อ-สกุล) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/90 shadow-xs print:hidden space-y-3.5">
          {/* แถวที่ 1: กรองช่วงเวลา */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-800">ช่วงเวลาที่รายงาน:</span>
              <span className="text-xs text-zinc-500 font-medium">
                {isTodayActive
                  ? "วันนี้"
                  : isAllTimeActive
                  ? "ข้อมูลทั้งหมดตั้งแต่เริ่มต้น"
                  : `${startDate || "เริ่มต้น"} ถึง ${endDate || "ปัจจุบัน"}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-zinc-500">จาก:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-zinc-500">ถึง:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const today = getTodayDateString();
                  setStartDate(today);
                  setEndDate(today);
                  setPage(1);
                }}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isTodayActive
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>วันนี้</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAllTime}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isAllTimeActive
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>ข้อมูลทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* แถวที่ 2: ช่องค้นหาผู้รับบริการ (HN, CID, ชื่อ-สกุล) & ตัวเลือกแถว */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-7 relative">
              <input
                type="text"
                placeholder="ค้นหาผู้รับบริการ (เลข HN, เลขบัตร 13 หลัก, หรือชื่อ - นามสกุล)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>

            <div className="md:col-span-2">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                title="จำนวนแถวต่อหน้า"
              >
                <option value={10}>10 รายการ / หน้า</option>
                <option value={20}>20 รายการ / หน้า</option>
                <option value={30}>30 รายการ / หน้า</option>
                <option value={50}>50 รายการ / หน้า</option>
                <option value={100}>100 รายการ / หน้า</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                title="ล้างค่าตัวกรองทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. ตารางแสดงรายการรายงานผลการปฏิบัติงาน */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto stroke-1" />
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">กำลังรวบรวมข้อมูลรายงานผล...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
              <div className="text-base font-bold text-zinc-700">ไม่พบข้อมูลรายงานตามเงื่อนไข</div>
              <p className="text-xs text-zinc-400">ลองขยายช่วงเวลา หรือพิมพ์คำค้นหาชื่อ-สกุลใหม่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-3.5 px-3.5 w-12 text-center">ลำดับ</th>
                    <th className="py-3.5 px-3 w-32 whitespace-nowrap">เลขที่เคส</th>
                    <th className="py-3.5 px-3 w-32 whitespace-nowrap">วัน-เวลารับแจ้ง</th>
                    <th className="py-3.5 px-3 w-28 text-center whitespace-nowrap">ความรุนแรง</th>
                    <th className="py-3.5 px-3 min-w-[180px] whitespace-nowrap">ผู้รับบริการ (ผู้ป่วย)</th>
                    <th className="py-3.5 px-3 min-w-[180px]">สถานที่เกิดเหตุ / ชุมชน</th>
                    <th className="py-3.5 px-3 w-36 whitespace-nowrap">ทีม & รถพยาบาล</th>
                    <th className="py-3.5 px-3 w-32 whitespace-nowrap">ผลลัพธ์ / ส่งต่อ</th>
                    <th className="py-3.5 px-3 text-right w-20 whitespace-nowrap print:hidden">สรุป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {records.map((r, index) => {
                    const rowNumber = (page - 1) * limit + index + 1;
                    const isCancelled = r.status === "cancelled";

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-zinc-50/80 transition ${
                          isCancelled ? "bg-rose-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5 text-center font-mono text-zinc-400 font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/80">
                            {r.case_number}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-zinc-600 whitespace-nowrap">
                          {formatThaiDateTime(r.created_at)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isCancelled ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-200 text-zinc-700">
                              ยกเลิกเคส
                            </span>
                          ) : (
                            renderTriageBadge(r.triage_level)
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-zinc-900 flex items-center gap-1">
                            <span>{r.patient.name}</span>
                            {r.patient.is_deceased && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-normal">
                                เสียชีวิต
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 space-x-1 font-mono">
                            <span>HN: {r.patient.hn}</span>
                            <span>• ปชช: {r.patient.cid}</span>
                            <span>• อายุ {r.patient.age} ปี</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="line-clamp-1 font-medium text-zinc-800">{r.incident_address}</p>
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {r.patient.village_name} | อาการ: {r.chief_complaint}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-zinc-800 flex items-center gap-1">
                            <Car className="w-3 h-3 text-zinc-400" />
                            <span>{r.dispatch.vehicle_plate}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            หัวหน้า: {r.dispatch.leader_name}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-zinc-800">
                            {r.treatment.outcome}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[130px]">
                            {r.treatment.destination_hospital}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap print:hidden">
                          <Link
                            href={`/cases/${r.id}/summary`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition"
                            title="ดูเอกสารสรุปเคส"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span>สรุป</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* แถบควบคุมการแบ่งหน้า (Pagination) */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 print:hidden">
              <div>
                กำลังแสดงรายการที่ <span className="font-bold text-zinc-800">{(page - 1) * limit + 1}</span> ถึง{" "}
                <span className="font-bold text-zinc-800">{Math.min(page * limit, totalRecords)}</span> จากทั้งหมด{" "}
                <span className="font-bold text-zinc-800">{totalRecords.toLocaleString()}</span> รายการ
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  title="หน้าแรก"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  title="ก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 text-xs font-bold font-mono text-zinc-800">
                  {page} / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  title="ถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  title="หน้าสุดท้าย"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}