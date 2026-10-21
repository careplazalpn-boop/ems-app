"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  Eye,
  Filter
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
  communityName: string;
  isInRegion: boolean;
  imageUrl: string;
}

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [selectedVillageMoo, setSelectedVillageMoo] = useState("all");
  const [villagesList, setVillagesList] = useState<any[]>([]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // สเตตสำหรับ Filter เสริม
  const [regionFilter, setRegionFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [mapFilter, setMapFilter] = useState<"ALL" | "HAS_MAP" | "NO_MAP">("ALL");

  // สเตต Lightbox
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; hn: string } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ดึงรายชื่อชุมชนจากตาราง village
  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await fetch("/api/villages");
        const data = await res.json();
        if (res.ok && data.villages) {
          setVillagesList(data.villages);
        }
      } catch (err) {
        console.error("Load villages error:", err);
      }
    }
    loadVillages();
  }, []);

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return "-";
    const birthDate = new Date(birthday);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const hasValidCoordinates = (lat: number | string | null, lng: number | string | null) => {
    if (lat === null || lng === null || lat === undefined || lng === undefined) return false;
    const numLat = typeof lat === "string" ? parseFloat(lat) : Number(lat);
    const numLng = typeof lng === "string" ? parseFloat(lng) : Number(lng);
    return !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;
  };

  const fetchPatients = async (searchQuery: string, villageMoo: string, pageNum: number, limitNum: number) => {
    if (!searchQuery.trim() && villageMoo === "all") return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/patients?q=${encodeURIComponent(searchQuery.trim())}&moo=${villageMoo}&page=${pageNum}&limit=${limitNum}`
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
    fetchPatients(query, selectedVillageMoo, 1, limit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchPatients(query, selectedVillageMoo, newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchPatients(query, selectedVillageMoo, 1, newLimit);
  };

  // กรองข้อมูลตามเงื่อนไขที่เลือก (ในเขต / นอกเขต / มีพิกัด)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (regionFilter === "IN" && !p.isInRegion) return false;
      if (regionFilter === "OUT" && p.isInRegion) return false;

      const hasCoords = hasValidCoordinates(p.home_latitude, p.home_longitude);
      if (mapFilter === "HAS_MAP" && !hasCoords) return false;
      if (mapFilter === "NO_MAP" && hasCoords) return false;

      return true;
    });
  }, [patients, regionFilter, mapFilter]);

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

  const openModal = (patient: { url: string; title: string; hn: string }) => {
    setPreviewImage(patient);
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setPreviewImage(null);
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.3, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            ค้นหาข้อมูลประวัติผู้ป่วย
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ค้นหาข้อมูลตามชื่อ-นามสกุล, เลขประจำตัวประชาชน, เลข HN, บ้านเลขที่ พร้อมระบุชุมชน
          </p>
        </div>

        {/* กล่องค้นหา (เพิ่มช่องเลือกชุมชน) */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 sm:gap-3">
            {/* ตัวเลือกชุมชน */}
            <div className="relative md:w-64">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <select
                value={selectedVillageMoo}
                onChange={(e) => setSelectedVillageMoo(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
              >
                <option value="all">🏘️ ทุกชุมชน (ทั้งหมด)</option>
                {villagesList.map((v) => (
                  <option key={v.village_moo} value={v.village_moo}>
                    ม.{v.village_moo} {v.village_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ช่องกรอกข้อความค้นหา */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ สกุล, HN, เลขบัตร ปชช. หรือบ้านเลขที่..."
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
              disabled={loading || (!query.trim() && selectedVillageMoo === "all")}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 px-6 gap-2 shadow-xs cursor-pointer font-medium"
            >
              <Search className="h-4 w-4" />
              <span>ค้นหา</span>
            </Button>
          </form>
        </div>

        {/* แถบตัวกรองเพิ่มเติม (Filter Chips) */}
        {searched && patients.length > 0 && (
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-600 font-medium">
                <Filter className="h-3.5 w-3.5 text-orange-600" />
                <span>ตัวกรองผลลัพธ์:</span>
              </div>

              {(regionFilter !== "ALL" || mapFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setRegionFilter("ALL");
                    setMapFilter("ALL");
                  }}
                  className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline underline-offset-2"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/70">
                <button
                  type="button"
                  onClick={() => setRegionFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    regionFilter === "ALL"
                      ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ทุกพื้นที่
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("IN")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    regionFilter === "IN"
                      ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  เฉพาะในเขต
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("OUT")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    regionFilter === "OUT"
                      ? "bg-zinc-800 text-white shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  เฉพาะนอกเขต
                </button>
              </div>

              <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/70">
                <button
                  type="button"
                  onClick={() => setMapFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mapFilter === "ALL"
                      ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  พิกัดทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setMapFilter("HAS_MAP")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    mapFilter === "HAS_MAP"
                      ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Navigation className="h-3 w-3" />
                  เฉพาะมีพิกัดบ้าน
                </button>
                <button
                  type="button"
                  onClick={() => setMapFilter("NO_MAP")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mapFilter === "NO_MAP"
                      ? "bg-amber-600 text-white shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ยังไม่มีพิกัด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* แถบสรุปผล */}
        {searched && total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500 px-1">
            <div>
              กำลังแสดง <span className="font-semibold text-zinc-800">{filteredPatients.length}</span> คน
              {(regionFilter !== "ALL" || mapFilter !== "ALL") && " (กรองจากหน้านี้)"} จากรายการที่ดึงมา{" "}
              <span className="font-semibold text-zinc-800">{patients.length}</span> คน (ทั้งหมด {total} รายการ)
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
        ) : searched && filteredPatients.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200 p-8">
            <AlertCircle className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-700 font-semibold text-base">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</p>
            <p className="text-xs text-zinc-400 mt-1">
              ลองเลือกตัวกรองเป็น "ทุกชุมชน" หรือ "ทุกพื้นที่" เพื่อดูรายการอื่น
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((p) => {
                const fullName = `${p.pname || ""}${p.fname || ""} ${p.lname || ""}`.trim();
                const isDeceased = p.death === "Y" || p.death === "1";
                const hasMap = hasValidCoordinates(p.home_latitude, p.home_longitude);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4 items-start">
                      <div
                        onClick={() => openModal({ url: p.imageUrl, title: fullName, hn: p.hn })}
                        className="group relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 cursor-pointer shadow-2xs"
                        title="คลิกเพื่อดูรูปภาพขนาดใหญ่และซูม"
                      >
                        <img
                          src={p.imageUrl}
                          alt={fullName}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                          }}
                        />

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="h-5 w-5 text-white" />
                        </div>

                        {isDeceased && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold tracking-wider">
                            ถึงแก่กรรม
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
                            HN: {p.hn}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              p.isInRegion
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{p.communityName}</span>
                          </span>

                          {p.bloodgrp && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                              {p.bloodgrp}
                            </span>
                          )}

                          {hasMap && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${p.home_latitude},${p.home_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title={`พิกัด: ${p.home_latitude}, ${p.home_longitude}`}
                            >
                              <Navigation className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>มีพิกัด</span>
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

                    <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-zinc-600 flex items-start gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="truncate">
                          {p.address_full ||
                            `บ้านเลขที่ ${p.addrpart || "-"} ม.${p.moopart || "-"} ${p.road || ""}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <Link href={`/patients/${p.hn}`} className="flex-1 sm:flex-none">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 gap-1.5 text-xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            ดูประวัติ
                          </Button>
                        </Link>

                        <Link href={`/cases/new?hn=${p.hn}`} className="flex-1 sm:flex-none">
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl gap-1.5 text-xs cursor-pointer"
                          >
                            <FilePlus className="h-3.5 w-3.5" />
                            เปิดเคส
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

        {/* Modal Lightbox */}
        {previewImage && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-zinc-950 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-zinc-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/90 text-white z-10">
                <div className="min-w-0 pr-2">
                  <h3 className="font-bold text-sm sm:text-base truncate">{previewImage.title}</h3>
                  <p className="text-xs text-orange-400 font-mono">HN: {previewImage.hn}</p>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomScale <= 1}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 cursor-pointer transition-colors"
                    title="ย่อขนาด (-)"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>

                  <span className="text-[11px] font-mono font-semibold px-1.5 text-zinc-300 min-w-[42px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomScale >= 4}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 cursor-pointer transition-colors"
                    title="ขยายขนาด (+)"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    disabled={zoomScale === 1 && position.x === 0 && position.y === 0}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 cursor-pointer transition-colors"
                    title="รีเซ็ตขนาดเดิม (100%)"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-zinc-700 mx-1" />

                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    title="ปิดหน้าต่าง"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative w-full h-[65vh] sm:h-[70vh] bg-black/95 flex items-center justify-center overflow-hidden ${
                  zoomScale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                }`}
              >
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  draggable={false}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale})`,
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                  }}
                  className="max-h-full max-w-full object-contain pointer-events-none select-none rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                  }}
                />

                <div className="absolute bottom-2.5 px-3 py-1 bg-black/60 backdrop-blur-xs text-[11px] text-zinc-400 rounded-full pointer-events-none">
                  หมุนลูกกลิ้งเมาส์เพื่อซูม {zoomScale > 1 && "• คลิกค้างเพื่อลากเลื่อนมุมมอง"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}