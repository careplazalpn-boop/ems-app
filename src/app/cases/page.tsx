"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Siren,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  Ambulance,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Skull,
  Radio,
} from "lucide-react";

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    dispatched: 0,
    on_scene: 0,
    completed: 0,
    red: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triageFilter, setTriageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // ดึงข้อมูลเคสจาก API
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "12",
        search: search.trim(),
        status: statusFilter,
        triage: triageFilter,
      });

      const res = await fetch(`/api/cases?${query.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCases(data.cases || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCases(data.pagination.total);
        }
      }
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, triageFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // ฟังก์ชันแปลงรูปแบบวันที่/เวลาไทย
  const formatThaiDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  // Badge แสดงระดับความรุนแรง (Triage)
  const renderTriageBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "red":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            วิกฤต (Red)
          </span>
        );
      case "yellow":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            เร่งด่วน (Yellow)
          </span>
        );
      case "green":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ไม่เร่งด่วน (Green)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            ทั่วไป (White)
          </span>
        );
    }
  };

  // Badge แสดงสถานะเคส (Status)
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            รอสั่งการ
          </span>
        );
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Ambulance className="w-3.5 h-3.5 text-sky-500" />
            สั่งการรถแล้ว
          </span>
        );
      case "on_scene":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            ถึงที่เกิดเหตุ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            เสร็จสิ้น
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
            ยกเลิก
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500">{status}</span>;
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header ส่วนหัวของหน้า */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  ศูนย์รับแจ้งเหตุฉุกเฉิน (EMS Cases)
                </h2>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60">
                  Operations
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                รายการเคสรับแจ้งเหตุ การคัดกรอง และสถานะการออกปฏิบัติการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={fetchCases}
              disabled={loading}
              title="รีเฟรชข้อมูล"
              className="h-11 px-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <Link
              href="/cases/new"
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เปิดรับแจ้งเหตุใหม่</span>
            </Link>
          </div>
        </div>

        {/* 1. สรุปภาพรวมสถานะเคส (KPI Summary Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => {
              setStatusFilter("all");
              setTriageFilter("all");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === "all" && triageFilter === "all"
                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                : "bg-white border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="text-xs font-medium opacity-80">เคสทั้งหมด</div>
            <div className="text-2xl font-black mt-1">{summary.total}</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("pending");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-amber-50/50 border-amber-200 text-amber-900 hover:bg-amber-100/50"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>รอสั่งการ</span>
            </div>
            <div className="text-2xl font-black mt-1">{summary.pending}</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("dispatched");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === "dispatched"
                ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                : "bg-sky-50/50 border-sky-200 text-sky-900 hover:bg-sky-100/50"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
              <Ambulance className="w-3.5 h-3.5" />
              <span>สั่งการรถแล้ว</span>
            </div>
            <div className="text-2xl font-black mt-1">{summary.dispatched}</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("on_scene");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === "on_scene"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-indigo-100/50"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>ถึงที่เกิดเหตุ</span>
            </div>
            <div className="text-2xl font-black mt-1">{summary.on_scene}</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("completed");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/50"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>เสร็จสิ้น</span>
            </div>
            <div className="text-2xl font-black mt-1">{summary.completed}</div>
          </div>

          <div
            onClick={() => {
              setTriageFilter("red");
              setPage(1);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              triageFilter === "red"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-rose-50/50 border-rose-200 text-rose-900 hover:bg-rose-100/50"
            }`}
          >
            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>เคสวิกฤต (Red)</span>
            </div>
            <div className="text-2xl font-black mt-1">{summary.red}</div>
          </div>
        </div>

        {/* 2. ส่วนแถบค้นหาและตัวกรองข้อมูล */}
        <Card className="rounded-2xl border-zinc-200/80 shadow-xs bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่เคส, HN, ชื่อผู้ป่วย, เบอร์โทร, สถานที่เกิดเหตุ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:border-red-400"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending">รอสั่งการ</option>
                  <option value="dispatched">สั่งการรถแล้ว</option>
                  <option value="on_scene">ถึงที่เกิดเหตุ</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>

                <select
                  value={triageFilter}
                  onChange={(e) => {
                    setTriageFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:border-red-400"
                >
                  <option value="all">ความรุนแรงทั้งหมด</option>
                  <option value="red">วิกฤต (Red)</option>
                  <option value="yellow">เร่งด่วน (Yellow)</option>
                  <option value="green">ไม่เร่งด่วน (Green)</option>
                  <option value="white">ทั่วไป (White)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. รายการเคส (รองรับทั้ง Card และ Table Responsive) */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto stroke-1" />
            <p className="text-sm text-zinc-400">กำลังโหลดรายการเคสฉุกเฉิน...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
            <Radio className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
            <div className="text-base font-semibold text-zinc-700">ไม่พบรายการเคสที่ค้นหา</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              ลองปรับเงื่อนไขการค้นหา หรือเปิดรับแจ้งเหตุเคสใหม่เพื่อเริ่มบันทึกข้อมูล
            </p>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>เปิดเคสใหม่</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 hover:border-zinc-300 hover:shadow-xs transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* ข้อมูลเคสหลัก */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-sm font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200/80">
                      {item.case_number}
                    </span>
                    {renderTriageBadge(item.triage_level)}
                    {renderStatusBadge(item.status)}
                    <span className="text-xs text-zinc-400 flex items-center gap-1 ml-auto md:ml-0">
                      <Clock className="w-3.5 h-3.5" />
                      {formatThaiDateTime(item.created_at)}
                    </span>
                  </div>

                  {/* ข้อมูลผู้ป่วยและอาการ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2 text-zinc-800">
                      <User className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-semibold text-zinc-900">
                        {item.patient.name}
                      </span>
                      <span className="text-zinc-500">
                        ({item.patient.gender}, {item.patient.age})
                      </span>
                      {item.patient.hn !== "-" && (
                        <span className="font-mono text-[11px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          HN: {item.patient.hn}
                        </span>
                      )}
                      {item.patient.is_deceased && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          <Skull className="w-2.5 h-2.5" /> เสียชีวิต
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-zinc-600 truncate">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        ผู้แจ้ง: <span className="font-medium">{item.caller_name}</span> ({item.caller_phone})
                      </span>
                    </div>

                    <div className="sm:col-span-2 flex items-start gap-2 text-zinc-600">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.incident_address}</span>
                      {item.latitude && item.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5 shrink-0 ml-1"
                        >
                          <span>แผนที่</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex items-start gap-2 text-zinc-700 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-800">อาการสำคัญ: </span>
                        <span>{item.chief_complaint}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ปุ่มจัดการเคส */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
                  <Link
                    href={`/cases/${item.id}`}
                    className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>สั่งการ / รายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {/* ระบบแบ่งหน้า (Pagination) */}
            <div className="flex items-center justify-between pt-4 px-2 text-xs text-zinc-500">
              <div>
                แสดงทั้งหมด <span className="font-bold text-zinc-900">{totalCases}</span> เคส (หน้า {page} จาก {totalPages})
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ก่อนหน้า</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}