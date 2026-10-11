"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  FilePlus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Maximize2,
  Navigation
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Patient {
  id: number;
  hn: string;
  pname: string;
  fname: string;
  lname: string;
  cid: string;
  birthday: string | null;
  addrpart: string | null;
  moopart: string | null;
  road: string | null;
  address_full: string | null;
  bloodgrp: string | null;
  mobile_phone_number: string | null;
  hometel: string | null;
  death: string | null;
  home_latitude: number | string | null;
  home_longitude: number | string | null;
  imageUrl: string;
}

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // สถานะ Modal ขยายดูรูปภาพ
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; hn: string } | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return "-";
    const birthDate = new Date(birthday);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // ตรวจสอบความถูกต้องของพิกัด (ไม่ว่าง และไม่เป็น 0)
  const hasValidCoordinates = (lat: number | string | null, lng: number | string | null) => {
    if (lat === null || lng === null || lat === undefined || lng === undefined) return false;
    const numLat = typeof lat === "string" ? parseFloat(lat) : Number(lat);
    const numLng = typeof lng === "string" ? parseFloat(lng) : Number(lng);
    return !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;
  };

  const fetchPatients = async (searchQuery: string, pageNum: number, limitNum: number) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/patients?q=${encodeURIComponent(searchQuery.trim())}&page=${pageNum}&limit=${limitNum}`
      );
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setPage(data.page || 1);
      } else {
        setPatients([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch {
      setPatients([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchPatients(query, 1, limit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchPatients(query, newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchPatients(query, 1, newLimit);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const fromRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = Math.min(page * limit, total);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        {/* หัวข้อหน้า */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            ค้นหาข้อมูลประวัติผู้ป่วย
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ค้นหาข้อมูลตามชื่อ-นามสกุล, เลขประจำตัวประชาชน, เลข HN (พิมพ์บางส่วนได้) หรือบ้านเลขที่
          </p>
        </div>

        {/* กล่องค้นหา */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-xs">
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ สกุล, HN (เช่น 21), เลขบัตร ปชช. หรือบ้านเลขที่..."
                className="pl-10 pr-9 rounded-xl border-zinc-200 focus:border-orange-500 h-11 text-sm bg-zinc-50/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPatients([]);
                    setSearched(false);
                    setTotal(0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 px-5 gap-2 shadow-xs cursor-pointer font-medium"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">ค้นหา</span>
            </Button>
          </form>
        </div>

        {/* แถบสรุปผลด้านบน */}
        {searched && total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500 px-1">
            <div>
              กำลังแสดงรายการที่ <span className="font-semibold text-zinc-800">{fromRecord} - {toRecord}</span> จากทั้งหมด{" "}
              <span className="font-semibold text-zinc-800">{total}</span> รายการ
            </div>

            <div className="flex items-center gap-2">
              <span>แสดงต่อหน้า:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={30}>30 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
          </div>
        )}

        {/* แสดงผลการค้นหา */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            กำลังค้นหาข้อมูลในระบบฐานข้อมูล...
          </div>
        ) : searched && patients.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200 p-8">
            <AlertCircle className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-700 font-semibold text-base">ไม่พบข้อมูลผู้ป่วยที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-zinc-400 mt-1">โปรดตรวจสอบคำค้นหาหรือลองค้นหาด้วยเลข HN บางส่วน</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map((p) => {
                const fullName = `${p.pname || ""}${p.fname || ""} ${p.lname || ""}`.trim();
                const isDeceased = p.death === "Y" || p.death === "1";
                const hasMap = hasValidCoordinates(p.home_latitude, p.home_longitude);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4 items-start">
                      {/* รูปภาพผู้ป่วย (คลิกขยายได้) */}
                      <div
                        onClick={() =>
                          setPreviewImage({
                            url: p.imageUrl,
                            title: fullName,
                            hn: p.hn,
                          })
                        }
                        className="group relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 cursor-pointer shadow-2xs"
                        title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                      >
                        <img
                          src={p.imageUrl}
                          alt={fullName}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                          }}
                        />

                        {/* ไอคอน Overlay ขยายรูป */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="h-5 w-5 text-white" />
                        </div>

                        {isDeceased && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold tracking-wider">
                            ถึงแก่กรรม
                          </div>
                        )}
                      </div>

                      {/* ข้อมูลประจำตัว */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
                            HN: {p.hn}
                          </span>
                          {p.bloodgrp && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                              หมู่เลือด {p.bloodgrp}
                            </span>
                          )}
                          {/* สัญลักษณ์และปุ่มนำทางพิกัดบ้าน */}
                          {hasMap && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${p.home_latitude},${p.home_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title={`พิกัด: ${p.home_latitude}, ${p.home_longitude} (คลิกเพื่อนำทางด้วย Google Maps)`}
                            >
                              <Navigation className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>มีพิกัดนำทาง</span>
                            </a>
                          )}
                        </div>

                        <h2 className="text-base font-bold text-zinc-900 truncate">
                          {fullName}
                        </h2>

                        <div className="text-xs text-zinc-500 space-y-1 pt-1">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="font-mono">{p.cid || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>อายุ {calculateAge(p.birthday)} ปี</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>{p.mobile_phone_number || p.hometel || "ไม่มีเบอร์โทร"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ที่อยู่และปุ่มเปิดเคส */}
                    <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-zinc-600 flex items-start gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="truncate">
                          {p.address_full ||
                            `บ้านเลขที่ ${p.addrpart || "-"} ม.${p.moopart || "-"} ${p.road || ""}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        {/* ปุ่มนำทางด่วนหากมีพิกัด */}
                        {hasMap && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${p.home_latitude},${p.home_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            <span>นำทาง</span>
                          </a>
                        )}

                        <Link href={`/cases/new?hn=${p.hn}`} className="flex-1 sm:flex-none">
                          <Button
                            size="sm"
                            className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl gap-1.5 text-xs w-full sm:w-auto cursor-pointer"
                          >
                            <FilePlus className="h-3.5 w-3.5" />
                            เปิดเคสฉุกเฉิน
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <div className="text-xs text-zinc-500 order-2 sm:order-1">
                  หน้า <span className="font-semibold text-zinc-800">{page}</span> จากทั้งหมด{" "}
                  <span className="font-semibold text-zinc-800">{totalPages}</span> หน้า
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(1)}
                    className="h-8 w-8 p-0 rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer disabled:opacity-40"
                    title="หน้าแรกสุด"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="h-8 w-8 p-0 rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer disabled:opacity-40"
                    title="ก่อนหน้า"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((pNum, idx) => {
                    if (pNum === "...") {
                      return (
                        <span key={`dots-${idx}`} className="px-1 text-xs text-zinc-400 select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = pNum === page;
                    return (
                      <button
                        key={`page-${pNum}`}
                        type="button"
                        onClick={() => handlePageChange(Number(pNum))}
                        className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-orange-600 text-white shadow-xs font-bold"
                            : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="h-8 w-8 p-0 rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer disabled:opacity-40"
                    title="ถัดไป"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="h-8 w-8 p-0 rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer disabled:opacity-40"
                    title="หน้าสุดท้าย"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= LIGHTBOX MODAL ดูรูปภาพขนาดใหญ่ ================= */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-200"
            >
              {/* ส่วนหัว Modal */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">{previewImage.title}</h3>
                  <p className="text-xs text-orange-600 font-mono">HN: {previewImage.hn}</p>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* รูปภาพใหญ่ */}
              <div className="p-4 bg-zinc-950 flex items-center justify-center">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}