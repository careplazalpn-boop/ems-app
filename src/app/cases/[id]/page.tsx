"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Siren,
  ArrowLeft,
  User,
  MapPin,
  Clock,
  Phone,
  CreditCard,
  AlertTriangle,
  Ambulance,
  Save,
  ExternalLink,
  ShieldCheck,
  Skull,
  Radio,
  UserCheck,
  Car,
  Users,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function CaseDetailContent() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitalPt, setHospitalPt] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);

  // State ข้อมูลสั่งการเคส
  const [status, setStatus] = useState("dispatched");
  const [triageLevel, setTriageLevel] = useState("yellow");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [incidentAddress, setIncidentAddress] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");

  // State ข้อมูลรถและทีมปฏิบัติการ
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // State สำหรับ Modal ยกเลิกเคส
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("เหตุซ้ำซ้อน / รับแจ้งซ้ำ");
  const [cancelNote, setCancelNote] = useState("");
  const [previousStatus, setPreviousStatus] = useState("dispatched");
  const [cancelling, setCancelling] = useState(false);

  // State ควบคุม Modern Success Modal (สำหรับการบันทึกปกติ)
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const CANCEL_REASONS = [
    "เหตุซ้ำซ้อน / รับแจ้งซ้ำ",
    "ผู้ป่วยหรือญาติปฏิเสธการรักษา/นำส่ง",
    "ผู้ป่วยนำส่งโรงพยาบาลเองก่อนทีมไปถึง",
    "ค้นหาผู้ป่วยหรือจุดเกิดเหตุไม่พบ",
    "แจ้งเหตุเท็จ / ก่อกวน",
    "ศูนย์สั่งการสั่งยกเลิกภารกิจ",
    "อื่นๆ (ระบุในหมายเหตุ)",
  ];

  useEffect(() => {
    if (!id) return;

    setShowSuccessModal(false);
    setShowCancelModal(false);

    async function loadCaseData() {
      try {
        const res = await fetch(`/api/cases/${id}?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setCaseData(data.case);
          setHospitalPt(data.hospital_patient);
          setVehicles(data.vehicles || []);
          setOfficers(data.officers || []);

          setChiefComplaint(data.case?.chief_complaint || "");
          setIncidentAddress(data.case?.incident_address || "");
          setCallerName(data.case?.caller_name || "");
          setCallerPhone(data.case?.caller_phone || "");

          if (data.case?.triage_level) {
            setTriageLevel(data.case.triage_level);
          }
          if (data.case?.status) {
            setStatus(data.case.status);
            setPreviousStatus(data.case.status);
          }

          // จัดการข้อมูล Dispatch ล่าสุด
          if (data.latest_dispatch) {
            const ld = data.latest_dispatch;
            if (ld.vehicle_id) {
              setSelectedVehicle(String(ld.vehicle_id));
            }
            if (ld.leader_id) {
              setLeaderId(String(ld.leader_id));
            }
            if (ld.driver_id) {
              setDriverId(String(ld.driver_id));
            }
            if (Array.isArray(ld.member_ids)) {
              setSelectedMembers(ld.member_ids.map((m: any) => Number(m)));
            }
          }
        } else {
          alert(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลเคส");
        }
      } catch (err) {
        console.error("Load Case Error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลเคสได้");
      } finally {
        setLoading(false);
      }
    }
    loadCaseData();
  }, [id]);

  const toggleMember = (officerId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(officerId)
        ? prev.filter((mid) => mid !== officerId)
        : [...prev, officerId]
    );
  };

  const isLeadersAssigned = Boolean(leaderId && driverId);
  const isFormValid = Boolean(selectedVehicle && leaderId && driverId && status);

  // 🌟 ดักจับการเปลี่ยน Status เพื่อเปิด Modal ยกเลิกเคส
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "cancelled") {
      setPreviousStatus(status);
      setStatus("cancelled");
      setShowCancelModal(true);
    } else {
      setStatus(newStatus);
    }
  };

  // ปิด Modal และคืนค่าสถานะเดิม
  const handleDismissCancelModal = () => {
    setShowCancelModal(false);
    setStatus(previousStatus);
  };

  // 🌟 ยืนยันการยกเลิกเคส บันทึกทันทีและพากลับหน้ารายการเคส (/cases)
  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancellation_reason: cancelReason,
          cancellation_note: cancelNote || null,
          cancelled_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowCancelModal(false);
        router.push("/cases");
      } else {
        const result = await res.json();
        alert(result.error || "เกิดข้อผิดพลาดในการยกเลิกเคส");
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อยกเลิกเคสได้");
    } finally {
      setCancelling(false);
    }
  };

  // บันทึกฟอร์มสั่งการปกติ
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      alert("กรุณาเลือกรถพยาบาล, หัวหน้าชุดปฏิบัติการ, พนักงานขับรถ และสถานะให้ครบถ้วนก่อนบันทึก");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          triage_level: triageLevel,
          chief_complaint: chiefComplaint,
          incident_address: incidentAddress,
          caller_name: callerName,
          caller_phone: callerPhone,
          vehicle_id: selectedVehicle || null,
          leader_id: leaderId || null,
          driver_id: driverId || null,
          member_ids: isLeadersAssigned ? selectedMembers : [],
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        const errMsg =
          typeof result.error === "string"
            ? result.error
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง";
        alert(errMsg);
      }
    } catch (err) {
      alert("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <Siren className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังโหลดรายละเอียดเคส...</p>
        </div>
      </AppLayout>
    );
  }

  // 1. ประมวลผลชื่อและ HN/ID ผู้ป่วย
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

  // 2. ข้อมูลเพศ
  const ptGender =
    hospitalPt?.sex === "1" || hospitalPt?.sex === "M"
      ? "ชาย"
      : hospitalPt?.sex === "2" || hospitalPt?.sex === "F"
      ? "หญิง"
      : caseData?.ems_patient?.gender === "1"
      ? "ชาย"
      : caseData?.ems_patient?.gender === "2"
      ? "หญิง"
      : "ไม่ระบุ";

  // 3. ข้อมูลอายุ
  let ptAge = "-";
  if (hospitalPt?.birthday) {
    const birthYear = new Date(hospitalPt.birthday).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(birthYear)) {
      ptAge = `${currentYear - birthYear} ปี`;
    }
  } else if (caseData?.ems_patient?.age) {
    ptAge = `${caseData.ems_patient.age} ปี`;
  }

  // 4. หมู่เลือด
  const ptBloodGroup = hospitalPt?.bloodgrp || hospitalPt?.blood_group || "-";

  // 5. สถานะเสียชีวิต
  const isDeceased = hospitalPt?.death === "Y" || Boolean(hospitalPt?.is_deceased);
  const hasCoordinates = Boolean(caseData?.latitude && caseData?.longitude);

  // 6. ป้ายสถานะสำหรับแสดงบน Header
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
            {st}
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-16">
        {/* Header แถบบน พร้อมสถานะเคสและข้อมูลผู้ป่วย */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Link
              href="/cases"
              className="h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
                  {caseData?.case_number}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {caseData?.patient_source}
                </span>
                {/* 🌟 แสดงป้ายสถานะของเคสบน Header */}
                {renderStatusBadge(status)}
              </div>

              {/* แสดง HN/ID และชื่อผู้ป่วยตามมาตรฐาน */}
              <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5 font-medium flex-wrap">
                <span className="text-zinc-400 font-mono">
                  {caseData?.patient_source === "HOSPITAL" ? `HN: ${ptHnDisplay}` : ptHnDisplay}
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

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* คอลัมน์ซ้าย (2/3): รายละเอียดเหตุการณ์และผู้ป่วย */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. ข้อมูลผู้ป่วย */}
            <Card className="rounded-2xl border-sky-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-500" />
              <CardHeader className="pb-3 border-b border-zinc-100 bg-sky-50/40">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-sky-600" />
                  <span>ข้อมูลผู้ป่วย / ผู้ประสบเหตุ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-28 h-32 rounded-xl border border-sky-100 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0 relative shadow-2xs">
                    <img
                      src={
                        caseData?.patient_hn && caseData.patient_hn !== "-"
                          ? `/uploads/patient/${caseData.patient_hn}.webp?v=${caseData.patient_hn}`
                          : "/images/avatars/default.png"
                      }
                      alt="Patient Photo"
                      className={`w-full h-full object-cover ${isDeceased ? "grayscale" : ""}`}
                      onError={(e) => {
                        e.currentTarget.src = "/images/avatars/default.png";
                      }}
                    />

                    {isDeceased && (
                      <div className="absolute inset-x-0 bottom-1.5 bg-red-600/90 text-white text-[9px] font-bold text-center py-0.5 flex items-center justify-center gap-0.5">
                        <Skull className="w-2.5 h-2.5" />
                        <span>เสียชีวิตแล้ว</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-zinc-400 block mb-0.5">ชื่อ-นามสกุล</span>
                      <span className="text-sm font-bold text-zinc-900">{ptName}</span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block mb-0.5">
                        {caseData?.patient_source === "HOSPITAL" ? "HN" : "รหัสอ้างอิง"}
                      </span>
                      <span className="font-mono font-bold text-sky-700">{ptHnDisplay}</span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block mb-0.5">เพศ / อายุ</span>
                      <span className="font-medium text-zinc-800">
                        {ptGender} / {ptAge}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block mb-0.5">หมู่เลือด</span>
                      <span className="font-semibold text-rose-600">
                        {ptBloodGroup}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-zinc-400 block mb-0.5">สิทธิการรักษา</span>
                      <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {caseData?.insurance_type || "ไม่ระบุ"} (
                          {caseData?.insurance_code || "ไม่มีเลขที่สิทธิ"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. รายละเอียดสถานที่เกิดเหตุ & อาการสำคัญ */}
            <Card className="rounded-2xl border-amber-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader className="pb-3 border-b border-zinc-100 bg-amber-50/40">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                  <span>ข้อมูลที่เกิดเหตุและอาการแจ้ง</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 pb-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    สถานที่เกิดเหตุ / จุดนัดพบ
                  </label>
                  <input
                    type="text"
                    value={incidentAddress}
                    onChange={(e) => setIncidentAddress(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    อาการสำคัญที่ได้รับแจ้ง (Chief Complaint)
                  </label>
                  <textarea
                    rows={3}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      ชื่อผู้โทรแจ้งเหตุ
                    </label>
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      เบอร์โทรกลับผู้แจ้ง
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none"
                      />
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* คอลัมน์ขวา (1/3): ศูนย์สั่งการ เลือกรถ และเจ้าหน้าที่ปฏิบัติการ */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-zinc-200/80 shadow-md bg-white">
              <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/80">
                <CardTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Radio className="h-4.5 w-4.5 text-red-600" />
                  <span>ศูนย์สั่งการและส่งทีม (Dispatch Control)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 pb-5 space-y-4">
                {/* 1. เลือกรถพยาบาล */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Ambulance className="w-4 h-4 text-sky-600" />
                    <span>เลือกรถพยาบาลออกเหตุ <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-semibold text-zinc-900 focus:bg-white focus:outline-none transition ${
                      !selectedVehicle
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-sky-300 bg-sky-50/20"
                    }`}
                  >
                    <option value="">-- กรุณาเลือกรถพยาบาล --</option>
                    {vehicles.map((v) => (
                      <option key={`veh-${v.vehicle_id}`} value={String(v.vehicle_id)}>
                        {v.plate_number} {v.brand ? `(${v.brand})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. หัวหน้าชุดปฏิบัติการ */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>หัวหน้าชุดปฏิบัติการ <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={leaderId}
                    onChange={(e) => {
                      const newLeader = e.target.value;
                      setLeaderId(newLeader);
                      if (newLeader) {
                        setSelectedMembers((prev) => prev.filter((m) => String(m) !== newLeader));
                      }
                    }}
                    className={`w-full h-10 px-3 rounded-xl border text-xs sm:text-sm text-zinc-800 focus:bg-white focus:outline-none transition ${
                      !leaderId
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-zinc-200 bg-zinc-50/50"
                    }`}
                  >
                    <option value="">-- เลือกหัวหน้าชุด --</option>
                    {officers.map((u) => (
                      <option key={`leader-${u.id}`} value={String(u.id)}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. พนักงานขับรถพยาบาล */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-indigo-600" />
                    <span>พนักงานขับรถพยาบาล <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={driverId}
                    onChange={(e) => {
                      const newDriver = e.target.value;
                      setDriverId(newDriver);
                      if (newDriver) {
                        setSelectedMembers((prev) => prev.filter((m) => String(m) !== newDriver));
                      }
                    }}
                    className={`w-full h-10 px-3 rounded-xl border text-xs sm:text-sm text-zinc-800 focus:bg-white focus:outline-none transition ${
                      !driverId
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-zinc-200 bg-zinc-50/50"
                    }`}
                  >
                    <option value="">-- เลือกคนขับรถ --</option>
                    {officers.map((u) => (
                      <option key={`driver-${u.id}`} value={String(u.id)}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. ผู้ร่วมปฏิบัติการ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>ผู้ร่วมปฏิบัติการ</span>
                    </label>
                    {isLeadersAssigned ? (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        เลือกแล้ว {selectedMembers.length} ท่าน
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        ระบุหัวหน้าและคนขับก่อน
                      </span>
                    )}
                  </div>

                  {!isLeadersAssigned ? (
                    <div className="p-3.5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-400">
                      กรุณาเลือก <b>หัวหน้าชุดปฏิบัติการ</b> และ <b>คนขับรถ</b> ก่อน จึงจะสามารถเลือกผู้ร่วมปฏิบัติการได้
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/30 p-2 space-y-1.5 text-xs">
                      {officers
                        .filter(
                          (u) =>
                            String(u.id) !== String(leaderId) &&
                            String(u.id) !== String(driverId)
                        )
                        .map((u) => {
                          const isChecked = selectedMembers.includes(u.id);
                          return (
                            <label
                              key={`member-${u.id}`}
                              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                                isChecked
                                  ? "bg-amber-100/70 border border-amber-300 font-semibold text-zinc-900"
                                  : "hover:bg-white hover:shadow-2xs text-zinc-700 border border-transparent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleMember(u.id)}
                                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                              <span className="flex-1 truncate">{u.name}</span>
                              <span className="text-[10px] text-zinc-400 bg-white/80 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                                {u.role}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* ระดับความรุนแรง Triage */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    ระดับความรุนแรง (Triage)
                  </label>
                  <select
                    value={triageLevel}
                    onChange={(e) => setTriageLevel(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none ${
                      triageLevel === "red"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : triageLevel === "yellow"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300"
                    }`}
                  >
                    <option value="red">🔴 วิกฤต (Red)</option>
                    <option value="yellow">🟡 เร่งด่วน (Yellow)</option>
                    <option value="green">🟢 ไม่เร่งด่วน (Green)</option>
                    <option value="white">⚪ ทั่วไป (White)</option>
                  </select>
                </div>

                {/* สถานะเคส (เชื่อม handleStatusChange) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    สถานะการปฏิบัติการ (Status) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm font-semibold text-zinc-800 focus:bg-white focus:outline-none"
                  >
                    <option value="pending">⏳ รอสั่งการ (Pending)</option>
                    <option value="dispatched">🚑 สั่งการรถแล้ว (Dispatched)</option>
                    <option value="on_scene">📍 ถึงที่เกิดเหตุ (On Scene)</option>
                    <option value="completed">✅ เสร็จสิ้น (Completed)</option>
                    <option value="cancelled">❌ ยกเลิกเคส (Cancelled)</option>
                  </select>
                </div>

                {!isFormValid && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      ต้องเลือกรถพยาบาล, หัวหน้าชุด, คนขับรถ และสถานะให้ครบก่อน จึงจะสามารถคลิกบันทึกได้
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md ${
                    isFormValid && !submitting
                      ? "bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-white cursor-pointer"
                      : "bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Save className={`w-4 h-4 ${isFormValid ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span>
                    {submitting ? "กำลังบันทึก..." : "บันทึกและไปหน้ารายละเอียดที่เกิดเหตุ"}
                  </span>
                </button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      {/* 🌟 Modal บันทึกรายละเอียดการยกเลิกเคส */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-zinc-100 space-y-4">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  ระบุสาเหตุการยกเลิกเคส ({caseData?.case_number})
                </h3>
                <p className="text-xs text-zinc-500">
                  กรุณาระบุเหตุผลและรายละเอียดเพื่อบันทึกประวัติการยกเลิกภารกิจ
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1.5">
                  สาเหตุการยกเลิก <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1.5">
                  รายละเอียดเพิ่มเติม / ผู้สั่งยกเลิก
                </label>
                <textarea
                  rows={3}
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="ระบุข้อความเพิ่มเติม เช่น เบอร์ติดต่อผู้ยกเลิก หรือเหตุผลประกอบ..."
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={cancelling}
                onClick={handleDismissCancelModal}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition cursor-pointer"
              >
                ยกเลิก (ไม่เปลี่ยนสถานะ)
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? "กำลังบันทึก..." : "ยืนยันการยกเลิกเคส"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Success Modal (สำหรับการสั่งการปกติ) */}      
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-100 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900">
                บันทึกการสั่งการสำเร็จ
              </h3>
              <p className="text-xs text-zinc-500">
                ข้อมูลรถพยาบาลและทีมปฏิบัติการถูกบันทึกเรียบร้อยแล้ว ระบบจะพาคุณไปบันทึกรายละเอียดการรักษาต่อ
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push(`/cases/${id}/treatment`)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Siren className="w-8 h-8 text-rose-500 animate-pulse stroke-1" />
          <span>กำลังเตรียมหน้ารายละเอียดเคส...</span>
        </div>
      }
    >
      <CaseDetailContent />
    </Suspense>
  );
}