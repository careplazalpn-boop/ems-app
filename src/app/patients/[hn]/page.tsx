"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  Building2, 
  Navigation, 
  FilePlus, 
  AlertCircle, 
  HeartPulse, 
  User, 
  ShieldCheck, 
  Home,
  Edit3,
  Save,
  X,
  Crosshair,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const PatientMapEditor = dynamic(
  () => import("@/components/patient/patient-map-editor"),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[360px] bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 text-xs animate-pulse">
        กำลังโหลดแผนที่...
      </div>
    ) 
  }
);

interface PatientDetail {
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
  tmbpart: string | null;
  amppart: string | null;
  chwpart: string | null;
  address_full: string | null;
  bloodgrp: string | null;
  citizenship: string | null;
  nationality: string | null;
  informname: string | null;
  mobile_phone_number: string | null;
  hometel: string | null;
  death: string | null;
  home_latitude: number | string | null;
  home_longitude: number | string | null;
  comment: string | null;
  communityName: string;
  isInRegion: boolean;
  imageUrl: string;
}

function PatientDetailContent() {
  const router = useRouter();
  const routeParams = useParams();
  const hn = routeParams?.hn as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const loadPatient = async () => {
    if (!hn) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${hn}`);
      const data = await res.json();
      if (res.ok && data.patient) {
        setPatient(data.patient);
        setFormData({
          mobile_phone_number: data.patient.mobile_phone_number || "",
          hometel: data.patient.hometel || "",
          informname: data.patient.informname || "",
          addrpart: data.patient.addrpart || "",
          moopart: data.patient.moopart || "",
          road: data.patient.road || "",
          address_full: data.patient.address_full || "",
          bloodgrp: data.patient.bloodgrp || "",
          comment: data.patient.comment || "",
          home_latitude: data.patient.home_latitude ? Number(data.patient.home_latitude) : null,
          home_longitude: data.patient.home_longitude ? Number(data.patient.home_longitude) : null,
        });
      } else {
        setError(data.message || "ไม่พบข้อมูลผู้ป่วย");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hn) {
      loadPatient();
    }
  }, [hn]);

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return "-";
    const birthDate = new Date(birthday);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const hasValidCoordinates = (lat: any, lng: any) => {
    if (!lat || !lng) return false;
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    return !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/patients");
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev: any) => ({
          ...prev,
          home_latitude: Number(pos.coords.latitude.toFixed(8)),
          home_longitude: Number(pos.coords.longitude.toFixed(8)),
        }));
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาอนุญาตการเข้าถึง Location");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/patients/${hn}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsEditing(false);
        await loadPatient();
      } else {
        const data = await res.json();
        alert(data.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400 text-sm">
        กำลังโหลดรายละเอียดผู้ป่วย...
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900">{error || "ไม่พบข้อมูล"}</h2>
        <Button onClick={handleBack} variant="outline" className="rounded-xl gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const fullName = `${patient.pname || ""}${patient.fname || ""} ${patient.lname || ""}`.trim();
  const currentLat = isEditing ? formData.home_latitude : patient.home_latitude;
  const currentLng = isEditing ? formData.home_longitude : patient.home_longitude;
  const hasMap = hasValidCoordinates(currentLat, currentLng);
  const isDeceased = patient.death === "Y" || patient.death === "1";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ส่วนแถบด้านบน */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-sm font-medium transition-colors shadow-2xs cursor-pointer"
            title="ย้อนกลับไปหน้าเดิม"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ย้อนกลับ</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">รายละเอียดประวัติผู้ป่วย</h1>
            <p className="text-xs text-zinc-500">ข้อมูลเวชระเบียน ทะเบียนบ้าน และพิกัดแผนที่ฉุกเฉิน</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                variant="outline"
                className="rounded-xl gap-1.5 text-xs h-10 border-zinc-300 text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
                ยกเลิก
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 text-xs h-10 shadow-xs cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                บันทึกข้อมูล
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="bg-white hover:bg-zinc-50 border-zinc-200 rounded-xl gap-1.5 text-xs h-10 text-zinc-800 shadow-2xs cursor-pointer"
            >
              <Edit3 className="h-4 w-4 text-orange-600" />
              แก้ไขข้อมูล / พิกัด
            </Button>
          )}

          {hasMap && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 text-xs h-10 cursor-pointer shadow-xs">
                <Navigation className="h-4 w-4" />
                นำทางด้วย Google Maps
              </Button>
            </a>
          )}

          <Link href={`/cases/new?hn=${patient.hn}`}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2 text-xs h-10 cursor-pointer shadow-xs">
              <FilePlus className="h-4 w-4" />
              เปิดรับแจ้งเหตุใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* ข้อมูลประจำตัว */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 shadow-xs">
            <img
              src={patient.imageUrl}
              alt={fullName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/avatars/default.png";
              }}
            />
            {isDeceased && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white font-bold tracking-wider">
                ถึงแก่กรรม
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
                HN: {patient.hn}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                  patient.isInRegion
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>ชุมชน: {patient.communityName}</span>
              </span>

              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-zinc-500">หมู่เลือด:</span>
                  <Input
                    value={formData.bloodgrp}
                    onChange={(e) => setFormData({ ...formData, bloodgrp: e.target.value })}
                    placeholder="เช่น A, B, O, AB"
                    className="h-8 w-24 text-xs font-bold rounded-lg border-zinc-200"
                  />
                </div>
              ) : (
                patient.bloodgrp && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    <HeartPulse className="h-3.5 w-3.5" />
                    หมู่เลือด {patient.bloodgrp}
                  </span>
                )
              )}
            </div>

            <h2 className="text-2xl font-bold text-zinc-900">{fullName}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">เลขประจำตัวประชาชน</p>
                  <p className="font-semibold font-mono text-zinc-800">{patient.cid || "-"}</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">วันเดือนปีเกิด (อายุ)</p>
                  <p className="font-semibold text-zinc-800">
                    {patient.birthday ? new Date(patient.birthday).toLocaleDateString("th-TH") : "-"} ({calculateAge(patient.birthday)} ปี)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-zinc-400">เบอร์โทรศัพท์ติดต่อ</p>
                  {isEditing ? (
                    <Input
                      value={formData.mobile_phone_number}
                      onChange={(e) => setFormData({ ...formData, mobile_phone_number: e.target.value })}
                      placeholder="เบอร์มือถือ"
                      className="h-7 text-xs rounded-lg mt-0.5 border-zinc-200"
                    />
                  ) : (
                    <p className="font-semibold text-zinc-800">
                      {patient.mobile_phone_number || patient.hometel || "ไม่ได้ระบุ"}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <User className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-zinc-400">ผู้ติดต่อฉุกเฉิน / ญาติ</p>
                  {isEditing ? (
                    <Input
                      value={formData.informname}
                      onChange={(e) => setFormData({ ...formData, informname: e.target.value })}
                      placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                      className="h-7 text-xs rounded-lg mt-0.5 border-zinc-200"
                    />
                  ) : (
                    <p className="font-semibold text-zinc-800">{patient.informname || "ไม่ได้ระบุ"}</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">สัญชาติ / เชื้อชาติ</p>
                  <p className="font-semibold text-zinc-800">
                    {patient.nationality || patient.citizenship || "ไทย"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2.5">
                <Home className="h-4 w-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">สถานะพื้นที่รับผิดชอบ</p>
                  <p className={`font-semibold ${patient.isInRegion ? "text-indigo-600" : "text-zinc-600"}`}>
                    {patient.isInRegion ? "ในเขตเทศบาลเมืองลำพูน" : "นอกเขตเทศบาล"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ข้อมูลที่อยู่และแผนที่ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-zinc-900 text-base">
            <MapPin className="h-5 w-5 text-orange-600" />
            <span>ที่อยู่ตามทะเบียนประวัติ</span>
          </div>

          {isEditing ? (
            <div className="space-y-3 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100 text-xs">
              <div>
                <label className="text-[11px] text-zinc-500 font-medium">ที่อยู่เต็ม / ข้อความนำทาง:</label>
                <Input
                  value={formData.address_full}
                  onChange={(e) => setFormData({ ...formData, address_full: e.target.value })}
                  placeholder="เช่น 103 ถ.วังขวา ต.ในเมือง..."
                  className="h-8 text-xs rounded-lg mt-1 border-zinc-200 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium">บ้านเลขที่:</label>
                  <Input
                    value={formData.addrpart}
                    onChange={(e) => setFormData({ ...formData, addrpart: e.target.value })}
                    placeholder="เช่น 103"
                    className="h-8 text-xs rounded-lg mt-1 border-zinc-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium">หมู่ที่:</label>
                  <Input
                    value={formData.moopart}
                    onChange={(e) => setFormData({ ...formData, moopart: e.target.value })}
                    placeholder="เช่น 1"
                    className="h-8 text-xs rounded-lg mt-1 border-zinc-200 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium">ถนน / ซอย:</label>
                <Input
                  value={formData.road}
                  onChange={(e) => setFormData({ ...formData, road: e.target.value })}
                  placeholder="เช่น ถ.วังขวา"
                  className="h-8 text-xs rounded-lg mt-1 border-zinc-200 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium">หมายเหตุเพิ่มเติม:</label>
                <Input
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="เช่น ใกล้ร้านค้า, ซอยแคบ"
                  className="h-8 text-xs rounded-lg mt-1 border-zinc-200 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-700 leading-relaxed bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100 space-y-2">
              <p className="font-medium text-zinc-900">
                {patient.address_full ||
                  `บ้านเลขที่ ${patient.addrpart || "-"} หมู่ที่ ${patient.moopart || "-"} ถนน ${patient.road || "-"}`}
              </p>
              <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-zinc-200/60">
                <p>บ้านเลขที่: {patient.addrpart || "-"}</p>
                <p>หมู่ที่: {patient.moopart || "-"}</p>
                <p>ชุมชนสังกัด: <span className="font-semibold text-zinc-800">{patient.communityName}</span></p>
                {patient.comment && <p className="text-orange-700">หมายเหตุ: {patient.comment}</p>}
              </div>
            </div>
          )}

          <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 text-xs text-orange-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">พิกัดภูมิศาสตร์ (GPS):</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 hover:text-orange-900 bg-white px-2 py-1 rounded-lg border border-orange-200 cursor-pointer shadow-2xs"
                >
                  <Crosshair className="h-3 w-3" />
                  ใช้พิกัดปัจจุบัน
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <label className="text-[10px] text-zinc-500">ละติจูด (Lat)</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.home_latitude ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        home_latitude: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="h-8 text-xs bg-white rounded-lg border-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">ลองจิจูด (Lng)</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.home_longitude ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        home_longitude: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="h-8 text-xs bg-white rounded-lg border-zinc-200"
                  />
                </div>
              </div>
            ) : (
              <div className="font-mono text-zinc-700 space-y-0.5">
                <p>ละติจูด: {patient.home_latitude || "-"}</p>
                <p>ลองจิจูด: {patient.home_longitude || "-"}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-zinc-900 text-base">
              <Navigation className="h-5 w-5 text-emerald-600" />
              <span>แผนที่พิกัดบ้านผู้ป่วย</span>
            </div>
            <div className="flex items-center gap-2">
              {hasMap && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  พิกัดพร้อมนำทาง
                </span>
              )}
              {isEditing && (
                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 animate-pulse">
                  โหมดปักหมุด
                </span>
              )}
            </div>
          </div>

          <PatientMapEditor
            lat={currentLat ? Number(currentLat) : null}
            lng={currentLng ? Number(currentLng) : null}
            isEditing={isEditing}
            onChange={(newLat, newLng) => {
              setFormData((prev: any) => ({
                ...prev,
                home_latitude: newLat,
                home_longitude: newLng,
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="py-24 text-center text-zinc-400 text-sm">
            กำลังโหลดข้อมูลผู้ป่วย...
          </div>
        }
      >
        <PatientDetailContent />
      </Suspense>
    </AppLayout>
  );
}