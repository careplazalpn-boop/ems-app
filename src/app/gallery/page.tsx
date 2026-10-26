"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RotateCcw,
  Filter,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  ArrowRight,
  Siren,
  Camera,
  Layers,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "lucide-react";

interface PhotoItem {
  id: number;
  category: string;
  caption: string;
  created_at: string;
  original_url: string;
  thumb_url: string;
  file_size_kb: string;
  case: any;
}

interface CaseGroup {
  caseInfo: any;
  photos: PhotoItem[];
}

interface MonthGroup {
  key: string;
  label: string;
  totalPhotos: number;
  totalCases: number;
  cases: CaseGroup[];
}

function GalleryContent() {
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<MonthGroup[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalMonths, setTotalMonths] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/gallery?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setMonths(data.months || []);
        setTotalMonths(data.totalMonths || 0);
        setTotalPages(data.totalPages || 1);

        if (data.months && data.months.length > 0) {
          const autoExpanded: { [key: string]: boolean } = {};
          data.months.forEach((m: MonthGroup) => {
            autoExpanded[m.key] = true;
          });
          setExpandedMonths(autoExpanded);
        }
      }
    } catch (err) {
      console.error("Load gallery error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [page, limit]);

  // 🌟 รวมรูปภาพทั้งหมดที่แสดงในหน้านี้เป็นอาร์เรย์เดียวแบบเรียงลำดับ สำหรับเลื่อนดูรูปต่อเนื่อง
  const allFlatPhotos = useMemo(() => {
    const list: PhotoItem[] = [];
    months.forEach((m) => {
      m.cases.forEach((c) => {
        c.photos.forEach((p) => {
          list.push(p);
        });
      });
    });
    return list;
  }, [months]);

  // หา Index ของรูปที่กำลังเปิดอยู่
  const currentPhotoIndex = useMemo(() => {
    if (!activePhoto) return -1;
    return allFlatPhotos.findIndex((p) => p.id === activePhoto.id);
  }, [activePhoto, allFlatPhotos]);

  // ฟังก์ชันเลื่อนไปยังรูปก่อนหน้า
  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setActivePhoto(allFlatPhotos[currentPhotoIndex - 1]);
      setZoomScale(1);
    }
  };

  // ฟังก์ชันเลื่อนไปยังรูปถัดไป
  const handleNextPhoto = () => {
    if (currentPhotoIndex < allFlatPhotos.length - 1) {
      setActivePhoto(allFlatPhotos[currentPhotoIndex + 1]);
      setZoomScale(1);
    }
  };

  // รองรับการกดปุ่มบนคีย์บอร์ด (ลูกศรซ้าย/ขวา และ Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePhoto) return;
      if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      } else if (e.key === "ArrowRight") {
        handleNextPhoto();
      } else if (e.key === "Escape") {
        setActivePhoto(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto, currentPhotoIndex, allFlatPhotos]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadGallery();
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setLimit(10);
    setPage(1);
    setTimeout(loadGallery, 50);
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const getTriageBadge = (triage: string) => {
    switch (triage?.toLowerCase()) {
      case "red":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">วิกฤต (Red)</span>;
      case "yellow":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">เร่งด่วน (Yellow)</span>;
      case "green":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">ไม่เร่งด่วน (Green)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">ทั่วไป (White)</span>;
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-24">
        {/* หัวกระดาษ Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  คลังภาพอัลบั้มการปฏิบัติงาน (Mission Gallery)
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
                  ALBUM ARCHIVE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                รวบรวมภาพปฏิบัติการฉุกเฉิน แยกรายเดือนและจัดเรียงตามเคส พร้อมข้อมูลโดยสังเขป
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/cases"
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Layers className="w-4 h-4 text-zinc-500" />
              <span>รายการเคสฉุกเฉิน</span>
            </Link>
          </div>
        </div>

        {/* แถบตัวกรองวันที่ และ แสดงหน้าละ */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>ตั้งแต่วันที่</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>ถึงวันที่</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">แสดงหน้าละ</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value={1}>1 เดือน</option>
                <option value={3}>3 เดือน</option>
                <option value={5}>5 เดือน</option>
                <option value={6}>6 เดือน</option>
                <option value={10}>10 เดือน</option>
                <option value={12}>12 เดือน</option>
                <option value={24}>24 เดือน</option>
              </select>
            </div>

            <div className="sm:col-span-4 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/20 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>กรองข้อมูล</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilter}
                className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างค่า</span>
              </button>
            </div>
          </form>
        </div>

        {/* รายการ Accordion แต่ละเดือน */}
        {loading ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-zinc-200">
            <Siren className="w-10 h-10 text-orange-500 animate-pulse mx-auto" />
            <p className="text-sm text-zinc-500">กำลังดึงข้อมูลคลังภาพอัลบั้ม...</p>
          </div>
        ) : months.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200 p-8 space-y-2">
            <ImageIcon className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-zinc-800">ไม่พบรูปภาพในระบบ</h3>
            <p className="text-xs text-zinc-400">ยังไม่มีการบันทึกรูปภาพในเคสฉุกเฉิน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {months.map((m) => {
              const isOpen = Boolean(expandedMonths[m.key]);

              return (
                <div
                  key={m.key}
                  className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  <div
                    onClick={() => toggleMonth(m.key)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/50">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm sm:text-base text-zinc-900 block sm:inline">
                          {m.label}
                        </span>
                        <span className="text-xs text-zinc-400 sm:ml-2">
                          ({m.totalCases} เคสปฏิบัติการ)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white bg-orange-600 px-3 py-1 rounded-lg shadow-2xs">
                        {m.totalPhotos} รูปภาพ
                      </span>
                      <div className="text-zinc-400">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-4 sm:p-6 border-t border-zinc-100 bg-zinc-50/40 space-y-5 animate-in fade-in duration-150">
                      {m.cases.map((group, idx) => {
                        const c = group.caseInfo;

                        return (
                          <div
                            key={c.id || idx}
                            className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm text-zinc-900">
                                  {c.case_number}
                                </span>
                                {getTriageBadge(c.triage_level)}
                                <span className="text-xs text-zinc-500 font-medium">
                                  | ผู้ป่วย: <strong className="text-zinc-800">{c.patient_name}</strong>
                                </span>
                                <span className="text-xs text-zinc-400">
                                  (HN: {c.patient_hn} - {c.village_name})
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-zinc-500 w-full sm:w-auto justify-between sm:justify-end">
                                <span>รถพยาบาล: <strong className="text-zinc-700">{c.vehicle_plate}</strong></span>
                                <Link
                                  href={`/cases/${c.id}/summary`}
                                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                                >
                                  <span>ดูสรุปเคส</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
                              {group.photos.map((photo) => (
                                <div
                                  key={photo.id}
                                  onClick={() => {
                                    setActivePhoto(photo);
                                    setZoomScale(1);
                                  }}
                                  className="group aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 relative cursor-pointer shadow-2xs hover:border-orange-400 transition"
                                >
                                  <img
                                    src={photo.thumb_url}
                                    alt={photo.caption || "Thumbnail"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (target.src.includes("/thumbs/")) {
                                        target.src = photo.original_url;
                                      } else {                                        
                                        target.onerror = null;
                                        target.src = "/images/avatars/default.png";
                                      }
                                    }}
                                  />
                                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-medium backdrop-blur-xs">
                                    {photo.category}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  หน้า {page} จากทั้งหมด {totalPages} หน้า (รวม {totalMonths} เดือน)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="text-xs font-bold font-mono px-2">{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Lightbox พร้อมระบบเลื่อนรูปก่อนหน้า - ถัดไป ข้ามเคสได้ต่อเนื่อง */}
        {activePhoto && (
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 select-none animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-zinc-950 rounded-3xl overflow-hidden max-w-6xl w-full max-h-[94vh] border border-zinc-800 flex flex-col shadow-2xl"
            >
              {/* Header Lightbox */}
              <div className="flex items-center justify-between p-3.5 px-5 border-b border-zinc-800 bg-zinc-900/95 text-white z-10">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-orange-400">
                    {activePhoto.case.case_number}
                  </span>
                  <span className="text-xs text-zinc-500">|</span>
                  <span className="text-xs text-zinc-300">
                    {formatThaiDate(activePhoto.created_at)}
                  </span>
                  {currentPhotoIndex !== -1 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 ml-1">
                      รูปที่ {currentPhotoIndex + 1} / {allFlatPhotos.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.max(prev - 0.25, 1))}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    title="ย่อภาพ"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-zinc-300 w-10 text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.min(prev + 0.25, 4))}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    title="ขยายภาพ"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-zinc-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white cursor-pointer transition"
                    title="ปิด (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Container */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-black">
                {/* ฝั่งซ้าย: รูปภาพใหญ่ พร้อมปุ่มลูกศรเลื่อนซ้าย-ขวา */}
                <div className="md:col-span-8 h-[45vh] md:h-[68vh] flex items-center justify-center p-4 overflow-hidden relative group">
                  <img
                    src={activePhoto.original_url}
                    alt="Mission Photo"
                    style={{ transform: `scale(${zoomScale})` }}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition duration-150"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "/images/avatars/default.png";
                    }}
                  />

                  {/* 🌟 ปุ่มเลื่อนรูปภาพก่อนหน้า (Previous) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPhoto();
                    }}
                    disabled={currentPhotoIndex <= 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/60 hover:bg-orange-600 text-white border border-white/20 backdrop-blur-md transition disabled:opacity-20 disabled:hover:bg-black/60 cursor-pointer shadow-lg z-20"
                    title="รูปก่อนหน้า (ปุ่มลูกศรซ้าย ←)"
                  >
                    <PrevIcon className="w-6 h-6" />
                  </button>

                  {/* 🌟 ปุ่มเลื่อนรูปภาพถัดไป (Next) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPhoto();
                    }}
                    disabled={currentPhotoIndex >= allFlatPhotos.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/60 hover:bg-orange-600 text-white border border-white/20 backdrop-blur-md transition disabled:opacity-20 disabled:hover:bg-black/60 cursor-pointer shadow-lg z-20"
                    title="รูปถัดไป (ปุ่มลูกศรขวา →)"
                  >
                    <NextIcon className="w-6 h-6" />
                  </button>

                  {activePhoto.caption && (
                    <div className="absolute bottom-3 inset-x-16 text-center pointer-events-none">
                      <span className="inline-block bg-black/80 backdrop-blur-xs text-white text-xs px-3.5 py-1.5 rounded-xl border border-zinc-800">
                        {activePhoto.caption}
                      </span>
                    </div>
                  )}
                </div>

                {/* ฝั่งขวา: ข้อมูลสรุปเคส (อัปเดตอัตโนมัติตามรูปที่เลื่อนไป) */}
                <div className="md:col-span-4 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 p-5 overflow-y-auto space-y-4 text-xs text-zinc-300">
                  <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold block mb-0.5">
                        สรุปข้อมูลเคสฉุกเฉิน
                      </span>
                      <h3 className="text-base font-bold text-white font-mono">
                        {activePhoto.case.case_number}
                      </h3>
                    </div>
                    {getTriageBadge(activePhoto.case.triage_level)}
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <p className="font-bold text-white text-xs">
                      ผู้ป่วย: {activePhoto.case.patient_name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      HN: {activePhoto.case.patient_hn} | ชุมชน: {activePhoto.case.village_name}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1">
                    <span className="text-zinc-500 block text-[10px]">สถานที่เกิดเหตุ:</span>
                    <p className="text-zinc-200">{activePhoto.case.incident_address}</p>
                    <span className="text-zinc-500 block text-[10px] pt-1">อาการสำคัญ:</span>
                    <p className="text-amber-300 font-medium">{activePhoto.case.chief_complaint}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">รถพยาบาล:</span>
                      <span className="text-white font-bold">{activePhoto.case.vehicle_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">หัวหน้าชุด:</span>
                      <span className="text-zinc-200">{activePhoto.case.leader_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">พลขับ:</span>
                      <span className="text-zinc-200">{activePhoto.case.driver_name}</span>
                    </div>
                  </div>

                  <Link
                    href={`/cases/${activePhoto.case.id}/summary`}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>ดูรายงานสรุปเคสนี้ฉบับเต็ม</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <Siren className="w-10 h-10 text-orange-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังเตรียมหน้าคลังภาพอัลบั้ม...</p>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}