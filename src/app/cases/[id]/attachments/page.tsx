"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Siren,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Clock,
  Ambulance,
  CheckCircle2,
  XCircle,
} from "lucide-react";

async function processImageToWebP(
  file: File,
  maxDimension: number = 1280,
  maxSizeKB: number = 250
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/webp", quality);

        while (dataUrl.length > maxSizeKB * 1024 * 1.33 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/webp", quality);
        }

        const arr = dataUrl.split(",");
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || "image";
        const webpFile = new File([u8arr], `${baseName}.webp`, { type: "image/webp" });
        resolve(webpFile);
      };
    };
  });
}

function AttachmentsContent() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  // 🌟 เพิ่ม State สำหรับเก็บข้อมูลเคสและผู้ป่วยเพื่อแสดงบน Header
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitalPt, setHospitalPt] = useState<any>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedThumbs, setSelectedThumbs] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [category, setCategory] = useState("overview");
  const [caption, setCaption] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // State สำหรับ Lightbox ดูรูปภาพขนาดใหญ่และการซูม/ลาก
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // State สำหรับ Modal ยืนยันการลบรูปภาพ
  const [imageToDelete, setImageToDelete] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        // 🌟 ดึงข้อมูลรายละเอียดเคสและข้อมูลรูปภาพพร้อมกัน
        const [caseRes, attRes] = await Promise.all([
          fetch(`/api/cases/${id}?t=${Date.now()}`),
          fetch(`/api/cases/${id}/attachments?t=${Date.now()}`),
        ]);

        const caseJson = await caseRes.json();
        const attJson = await attRes.json();

        if (caseRes.ok && caseJson.success) {
          setCaseData(caseJson.case);
          setHospitalPt(caseJson.hospital_patient);
        }

        if (attRes.ok && attJson.success) {
          setAttachments(attJson.attachments || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const processedFiles: File[] = [];
    const processedThumbs: File[] = [];
    const previews: string[] = [];

    for (const file of filesArray) {
      const mainWebp = await processImageToWebP(file, 1280, 250);
      const thumbWebp = await processImageToWebP(file, 300, 40);

      processedFiles.push(mainWebp);
      processedThumbs.push(thumbWebp);
      previews.push(URL.createObjectURL(thumbWebp));
    }

    setSelectedFiles((prev) => [...prev, ...processedFiles]);
    setSelectedThumbs((prev) => [...prev, ...processedThumbs]);
    setPreviewUrls((prev) => [...prev, ...previews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedThumbs((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    selectedThumbs.forEach((thumb) => formData.append("thumbs", thumb));
    formData.append("category", category);
    formData.append("caption", caption);

    try {
      const res = await fetch(`/api/cases/${id}/attachments`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAttachments((prev) => [...data.attachments, ...prev]);
        setSelectedFiles([]);
        setSelectedThumbs([]);
        setPreviewUrls([]);
        setCaption("");
        setShowSuccessModal(true);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปโหลด");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดได้");
    } finally {
      setUploading(false);
    }
  };

  // ดำเนินการลบรูปภาพจริงหลังจากกดยืนยันใน Modal
  const confirmDeleteAttachment = async () => {
    if (!imageToDelete) return;

    try {
      const res = await fetch(`/api/cases/${id}/attachments/${imageToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAttachments((prev) => prev.filter((item) => item.id !== imageToDelete.id));
        setActiveImageIndex(null);
        setImageToDelete(null);
      } else {
        alert(data.error || "ไม่สามารถลบรูปภาพได้");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบรูปภาพ");
    }
  };

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((prev) => {
      const newZoom = Math.min(Math.max(prev + zoomFactor, 0.5), 5);
      if (newZoom <= 1) {
        setPanX(0);
        setPanY(0);
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getThumbnailPath = (filePath: string) => {
    const parsed = filePath.substring(0, filePath.lastIndexOf('/'));
    const filename = filePath.substring(filePath.lastIndexOf('/') + 1);
    return `${parsed}/thumbs/thumb-${filename}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <Siren className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังโหลดแกลเลอรีรูปภาพ...</p>
        </div>
      </AppLayout>
    );
  }

  // 🌟 ประมวลผลชื่อผู้ป่วยและ HN/ID ให้เป็นมาตรฐานเดียวกัน
  let ptName = "ไม่ระบุชื่อ / นิรนาม";
  let ptHnDisplay = "-";

  if (caseData?.patient_source === "HOSPITAL") {
    if (hospitalPt) {
      if (hospitalPt.name) {
        ptName = hospitalPt.name;
      } else {
        const combined = `${hospitalPt.pname || ""}${hospitalPt.fname || ""} ${hospitalPt.lname || ""}`.trim();
        ptName = combined || "ไม่ระบุชื่อ";
      }
    }
    ptHnDisplay = caseData?.patient_hn || "-";
  } else {
    const ep = caseData?.ems_patient;
    if (ep) {
      const combined = `${ep.pname || ""}${ep.fname || ""} ${ep.lname || ""}`.trim();
      ptName = combined || "ไม่ระบุชื่อ";
      ptHnDisplay = ep.id ? `ID: ${ep.id}` : "-";
    }
  }

  // 🌟 เรนเดอร์ป้ายสถานะมาตรฐาน
  const renderStatusBadge = (st: string) => {
    switch (st) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            รอสั่งการ
          </span>
        );
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Ambulance className="w-3 h-3 text-sky-500" />
            สั่งการรถแล้ว
          </span>
        );
      case "on_scene":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <MapPin className="w-3 h-3 text-indigo-500" />
            ถึงที่เกิดเหตุ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            เสร็จสิ้น
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            ยกเลิกเคส
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            {st || "-"}
          </span>
        );
    }
  };

  const hasCoordinates = Boolean(caseData?.latitude && caseData?.longitude);

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-24">
        {/* Header แถบบน ปรับปรุงให้เป็นมาตรฐานเดียวกับทุกหน้า */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/cases/${id}`}
              className="h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs cursor-pointer"
              title="ย้อนกลับไปหน้ารายละเอียดเคส"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
                  {caseData?.case_number || "..."}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {caseData?.patient_source || "HOSPITAL"}
                </span>
                {renderStatusBadge(caseData?.status || "pending")}
              </div>

              {/* แสดง HN/ID และชื่อผู้ป่วยตามมาตรฐานเดียวกัน */}
              <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5 font-medium flex-wrap">
                <span className="text-zinc-400 font-mono">
                  {caseData?.patient_source === "HOSPITAL"
                    ? `HN: ${ptHnDisplay}`
                    : ptHnDisplay}
                </span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-800 font-bold">
                  ผู้ป่วย: {ptName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {hasCoordinates && (
              <a
                href={`https://www.google.com/maps?q=${caseData.latitude},${caseData.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>เปิดแผนที่นำทาง</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
              </a>
            )}
          </div>
        </div>

        {/* ฟอร์มเลือกและอัปโหลดรูป */}
        <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardHeader className="py-4 px-5 bg-emerald-50/40 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Camera className="w-4.5 h-4.5 text-emerald-600" />
              <span>เลือกรูปภาพปฏิบัติงาน (อัปโหลดได้หลายรูปพร้อมกัน)</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-5 pb-6">
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    หมวดหมู่รูปภาพ
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm font-semibold text-zinc-800"
                  >
                    <option value="overview">🖼️ ภาพรวมทั้งหมด (Overview)</option>
                    <option value="scene">📍 ที่เกิดเหตุ (Scene)</option>
                    <option value="patient_wound">🩺 บาดแผล (Patient Wound)</option>
                    <option value="treatment">💉 ขณะปฐมพยาบาล (Treatment)</option>
                    <option value="handover">🤝 ส่งมอบ รพ. (Handover)</option>
                    <option value="other">📁 อื่นๆ (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    คำอธิบายเพิ่มเติม (Caption สำหรับทุกรูปที่เลือก)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="เช่น ภาพขณะปฐมพยาบาลเบื้องต้น..."
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-6 text-center transition relative cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-zinc-800">
                      คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      ระบบจะสร้าง Thumbnail และไฟล์ WebP อัตโนมัติ (ขนาดไฟล์ไม่เกิน 250 KB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview ก่อนอัปโหลด */}
              {previewUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700">
                      รูปภาพที่เลือกเตรียมอัปโหลด ({previewUrls.length} รูป)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles([]);
                        setSelectedThumbs([]);
                        setPreviewUrls([]);
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ล้างทั้งหมด
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-square bg-zinc-100 shadow-2xs">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4.5 h-4.5" />
                    <span>{uploading ? "กำลังบีบอัดและอัปโหลด..." : `ยืนยันอัปโหลดรูปภาพ (${selectedFiles.length} รูป)`}</span>
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* แกลเลอรีรูปภาพที่อัปโหลดแล้ว */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <ImageIcon className="w-4.5 h-4.5 text-sky-600" />
              <span>แกลเลอรีรูปภาพปฏิบัติงานทั้งหมด ({attachments.length})</span>
            </h3>
          </div>

          {attachments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-400 text-xs space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-zinc-300 stroke-1" />
              <p>ยังไม่มีรูปภาพการปฏิบัติงานในเคสนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {attachments.map((att, idx) => (
                <div key={att.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs flex flex-col group">
                  <div
                    onClick={() => handleOpenLightbox(idx)}
                    className="aspect-video bg-zinc-100 relative overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getThumbnailPath(att.file_path)}
                      alt={att.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/70 text-white text-[10px] font-bold backdrop-blur-xs">
                      {att.category}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-semibold text-zinc-800 line-clamp-2">
                      {att.caption || "ไม่มีคำอธิบาย"}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                      <span className="text-[10px] text-zinc-400">
                        {(att.file_size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageToDelete(att)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="ลบรูปภาพ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {activeImageIndex !== null && attachments[activeImageIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-hidden select-none">
            <div className="absolute top-5 inset-x-5 flex items-center justify-between z-20">
              <div className="text-white text-xs sm:text-sm font-semibold bg-zinc-800/80 px-3.5 py-1.5 rounded-full border border-zinc-700">
                รูปที่ {activeImageIndex + 1} จาก {attachments.length} ({attachments[activeImageIndex].category})
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-mono bg-zinc-800/80 px-3.5 py-1.5 rounded-full hidden sm:inline-block">
                  💡 Scroll เพื่อซูม / คลิกค้างแล้วลากเพื่อเลื่อนรูป
                </span>
                <span className="text-white text-xs font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-full">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className="text-white bg-zinc-800/80 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs transition cursor-pointer"
                >
                  รีเซ็ต
                </button>
                <button
                  onClick={() => {
                    setActiveImageIndex(null);
                    setZoomLevel(1);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className="text-white bg-rose-600 hover:bg-rose-700 p-2 rounded-full transition cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {activeImageIndex > 0 && (
              <button
                onClick={() => {
                  setActiveImageIndex(activeImageIndex - 1);
                  setZoomLevel(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-zinc-800/80 hover:bg-zinc-700 p-3 rounded-full transition cursor-pointer z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {activeImageIndex < attachments.length - 1 && (
              <button
                onClick={() => {
                  setActiveImageIndex(activeImageIndex + 1);
                  setZoomLevel(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-zinc-800/80 hover:bg-zinc-700 p-3 rounded-full transition cursor-pointer z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-full flex items-center justify-center overflow-hidden pt-16 pb-12 ${
                zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`}
            >
              <div
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="flex flex-col items-center"
              >
                <img
                  src={attachments[activeImageIndex].file_path}
                  alt="Original Zoomable & Draggable"
                  draggable={false}
                  className="max-h-[70vh] object-contain rounded-xl shadow-2xl pointer-events-none"
                />
                <p className="text-white text-xs sm:text-sm font-medium mt-4 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 pointer-events-auto">
                  {attachments[activeImageIndex].caption || "ไม่มีคำอธิบาย"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-100 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-900">
                  อัปโหลดรูปภาพสำเร็จ
                </h3>
                <p className="text-xs text-zinc-500">
                  ระบบบันทึกรูปภาพเรียบร้อยแล้ว คุณสามารถดูรูปภาพในแกลเลอรีหรืออัปโหลดเพิ่มได้ทันที
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Delete Confirmation Modal */}
        {imageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-100 text-center space-y-5">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-900">
                  ยืนยันการลบรูปภาพ?
                </h3>
                <p className="text-xs text-zinc-500">
                  รูปภาพต้นฉบับ, ไฟล์ Thumbnail และข้อมูลในฐานข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setImageToDelete(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAttachment}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  ยืนยันลบรูปภาพ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function AttachmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Siren className="w-8 h-8 text-rose-500 animate-pulse stroke-1" />
          <span>กำลังเตรียมหน้าอัปโหลดรูปภาพ...</span>
        </div>
      }
    >
      <AttachmentsContent />
    </Suspense>
  );
}