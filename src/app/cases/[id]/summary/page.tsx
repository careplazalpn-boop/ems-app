"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Siren,
  ArrowLeft,
  Printer,
  Clock,
  MapPin,
  ExternalLink,
  User,
  PhoneCall,
  Ambulance,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HeartPulse,
  Camera,
  Activity,
  Stethoscope,
  Car,
  Users,
  FileText,
  Calendar,
  Thermometer,
  Gauge,
  Eye,
  Check,
} from "lucide-react";

function CaseSummaryContent() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitalPt, setHospitalPt] = useState<any>(null);
  const [dispatchInfo, setDispatchInfo] = useState<any>(null);
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  const [attachmentsList, setAttachmentsList] = useState<any[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadSummaryData() {
      try {
        const res = await fetch(`/api/cases/${id}?t=${Date.now()}`);
        const data = await res.json();

        if (res.ok && (data.success || data.case)) {
          const c = data.case || data.data || data;
          setCaseData(c);
          setHospitalPt(data.hospital_patient || null);
          setDispatchInfo(data.latest_dispatch || null);
          // ดึง treatments และ attachments จากก้อนที่ API ส่งมา
          setTreatmentsList(data.treatments || c.treatments || []);
          setAttachmentsList(data.attachments || c.attachments || []);
        }
      } catch (err) {
        console.error("Error loading summary:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSummaryData();
  }, [id]);

  const formatThaiDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const renderTriageBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "red":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            วิกฤต (Red)
          </span>
        );
      case "yellow":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            เร่งด่วน (Yellow)
          </span>
        );
      case "green":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ไม่เร่งด่วน (Green)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            ทั่วไป (White)
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            รอสั่งการ
          </span>
        );
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Ambulance className="w-3.5 h-3.5 text-sky-500" />
            สั่งการรถแล้ว
          </span>
        );
      case "on_scene":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            ถึงที่เกิดเหตุ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            เสร็จสิ้นภารกิจ
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            ยกเลิกเคส
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <Siren className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังรวบรวมข้อมูลสรุปเคสฉุกเฉิน...</p>
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout>
        <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200 max-w-lg mx-auto my-12 space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-800">ไม่พบข้อมูลเคสที่ระบุ</h3>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการเคส</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // 1. ประมวลผลชื่อและ HN
  let ptName = "ไม่ระบุชื่อ / นิรนาม";
  let ptHnDisplay = "-";

  if (caseData.patient_source === "HOSPITAL") {
    if (hospitalPt) {
      ptName = `${hospitalPt.pname || ""}${hospitalPt.fname || ""} ${hospitalPt.lname || ""}`.trim();
    }
    ptHnDisplay = caseData.patient_hn || "-";
  } else {
    const ep = caseData.ems_patient;
    if (ep) {
      ptName = `${ep.pname || ""}${ep.fname || ""} ${ep.lname || ""}`.trim();
      ptHnDisplay = ep.id ? `ID: ${ep.id}` : "-";
    }
  }

  if (ptName === "ไม่ระบุชื่อ / นิรนาม" && caseData.caller_name) {
    ptName = caseData.caller_name;
  }

  // 2. ดึงข้อมูลการรักษาล่าสุด (Treatment)
  const treatment = treatmentsList[0] || null;

  // แปลงความดันโลหิต (sbp / dbp)
  const bpDisplay = treatment?.sbp || treatment?.dbp 
    ? `${treatment?.sbp || "-"}/${treatment?.dbp || "-"} mmHg` 
    : treatment?.blood_pressure || "-";

  // รวมคะแนน GCS
  const gcsTotal = (treatment?.gcs_e || 0) + (treatment?.gcs_v || 0) + (treatment?.gcs_m || 0);

  // 3. ข้อมูลรถและทีมปฏิบัติการ (Dispatch)
  const vehicleObj = dispatchInfo?.vehicle || null;
  const leaderName = dispatchInfo?.leader_name || (dispatchInfo?.leader_id ? `เจ้าหน้าที่ ID: ${dispatchInfo.leader_id}` : "ยังไม่ระบุหัวหน้าชุด");
  const driverName = dispatchInfo?.driver_name || (dispatchInfo?.driver_id ? `เจ้าหน้าที่ ID: ${dispatchInfo.driver_id}` : "ยังไม่ระบุพนักงานขับรถ");
  const membersList = dispatchInfo?.members || [];

  const hasCoordinates = Boolean(
    caseData.latitude &&
    caseData.longitude &&
    parseFloat(String(caseData.latitude)) !== 0
  );

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-24">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs"
              title="กลับหน้ารายการเคส"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  สรุปรายงานปฏิบัติการฉุกเฉิน (Run Summary)
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  EMS REPORT
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                เอกสารบันทึกรายละเอียดเหตุการณ์ การสั่งการ และการประเมินอาการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-500" />
              <span>พิมพ์รายงาน</span>
            </button>

            <Link
              href={`/cases/${id}`}
              className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>แก้ไข / บันทึกข้อมูล</span>
            </Link>
          </div>
        </div>

        {/* แถบหัวเรื่องสรุปเคส (Cover Overview Card) */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-white">
                  {caseData.case_number}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-zinc-200 border border-white/20">
                  {caseData.patient_source || "HOSPITAL"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>วัน-เวลารับแจ้ง: {formatThaiDateTime(caseData.created_at)}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {renderTriageBadge(caseData.triage_level)}
              {renderStatusBadge(caseData.status)}
            </div>
          </div>
        </div>

        {/* Grid แสดงผล 3 คอลัมน์ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ข้อมูลผู้ป่วย (คอลัมน์ซ้าย) */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-sky-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-600" />
              <CardHeader className="py-4 px-5 bg-sky-50/40 border-b border-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>ข้อมูลผู้ป่วย / ผู้ประสบเหตุ</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-36 rounded-2xl border-2 border-sky-100 bg-zinc-50 overflow-hidden flex items-center justify-center relative shadow-xs">
                    {caseData.patient_hn && !imageError ? (
                      <img
                        src={`/uploads/patient/${caseData.patient_hn}.webp?v=${caseData.patient_hn}`}
                        alt="Patient Photo"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-3">
                        <User className="w-12 h-12 text-zinc-300 mx-auto" />
                        <span className="text-[11px] text-zinc-400">ไม่มีรูปถ่ายผู้ป่วย</span>
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                    HN: {ptHnDisplay}
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">ชื่อ - สกุล ผู้ป่วย</span>
                    <span className="font-bold text-zinc-900 text-sm">{ptName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-400 block text-[11px]">เพศ</span>
                      <span className="font-medium text-zinc-800">
                        {caseData.ems_patient?.gender === "2" || hospitalPt?.sex === "2"
                          ? "หญิง"
                          : "ชาย / ไม่ระบุ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[11px]">อายุ</span>
                      <span className="font-medium text-zinc-800">
                        {hospitalPt?.birthday
                          ? `${new Date().getFullYear() - new Date(hospitalPt.birthday).getFullYear()} ปี`
                          : caseData.ems_patient?.age
                          ? `${caseData.ems_patient.age} ปี`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[11px]">เบอร์โทรศัพท์</span>
                    <span className="font-medium text-zinc-800">
                      {hospitalPt?.mobile_phone_number || caseData.ems_patient?.patient_phone || caseData.caller_phone || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[11px]">สิทธิการรักษา</span>
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {hospitalPt?.pttype || caseData.insurance_type || "UC (บัตรทอง)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[11px]">ที่อยู่ตามประวัติ</span>
                    <span className="text-zinc-700 leading-relaxed block">
                      {hospitalPt?.address_full ||
                        caseData.ems_patient?.patient_address ||
                        caseData.incident_address ||
                        "ไม่ระบุที่อยู่"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ข้อมูลจุดเกิดเหตุ */}
            <Card className="rounded-2xl border-amber-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader className="py-4 px-5 bg-amber-50/40 border-b border-zinc-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-amber-600" />
                  <span>จุดเกิดเหตุ & การรับแจ้ง</span>
                </CardTitle>

                {hasCoordinates && (
                  <a
                    href={`https://www.google.com/maps?q=${caseData.latitude},${caseData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>แผนที่</span>
                    <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                  </a>
                )}
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">ผู้โทรแจ้งเหตุ</span>
                  <span className="font-semibold text-zinc-800">
                    {caseData.caller_name || "-"} (โทร: {caseData.caller_phone || "-"})
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px] mb-1">สถานที่เกิดเหตุ</span>
                  <p className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-medium text-zinc-800">
                    {caseData.incident_address || "ไม่ระบุสถานที่เกิดเหตุ"}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px] mb-1">อาการสำคัญ (Chief Complaint)</span>
                  <p className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-zinc-900 font-medium">
                    {caseData.chief_complaint || "ไม่มีบันทึกอาการสำคัญ"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนเนื้อหาหลัก (คอลัมน์กลางและขวา) */}
          <div className="lg:col-span-2 space-y-6">
            {/* A: ศูนย์สั่งการและส่งทีม (Dispatch Control) */}
            <Card className="rounded-2xl border-indigo-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-600" />
              <CardHeader className="py-4 px-5 bg-indigo-50/30 border-b border-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-indigo-600" />
                  <span>A. ศูนย์สั่งการและส่งทีมปฏิบัติการ (Dispatch Control)</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 text-xs space-y-5">
                {/* 1. ข้อมูลรถที่ออกเหตุ */}
                <div>
                  <span className="text-zinc-400 block text-[11px] mb-2 font-semibold">
                    1. ข้อมูลรถพยาบาลที่ออกเหตุ
                  </span>
                  {vehicleObj ? (
                    <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-zinc-900 block">
                            ทะเบียน: {vehicleObj.plate_number}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            ประเภท: {vehicleObj.vehicle_type} ({vehicleObj.brand || "EMS"})
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 self-start sm:self-auto">
                        สถานะ: {vehicleObj.status || "พร้อมปฏิบัติการ"}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-400 italic">
                      ไม่ได้ระบุข้อมูลรถพยาบาลที่ออกเหตุ
                    </div>
                  )}
                </div>

                {/* 2, 3, 4: บุคลากรประจำทีมออกเหตุ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 2. หัวหน้าชุดปฏิบัติการ */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      2. หัวหน้าชุดปฏิบัติการ
                    </span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-zinc-900 text-xs">
                        {leaderName}
                      </span>
                    </div>
                  </div>

                  {/* 3. พนักงานขับรถ */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      3. พนักงานขับรถพยาบาล
                    </span>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-zinc-900 text-xs">
                        {driverName}
                      </span>
                    </div>
                  </div>

                  {/* 4. ผู้ร่วมปฏิบัติการ */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      4. ผู้ร่วมปฏิบัติการ
                    </span>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-bold text-zinc-900 text-xs">
                        {membersList.length > 0
                          ? membersList.map((m: any) => m.name).join(", ")
                          : "ไม่มีผู้ร่วมปฏิบัติการ"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* เวลาปฏิบัติการ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block">เวลาสั่งการ:</span>
                    <span className="font-medium text-zinc-800">
                      {dispatchInfo?.time_dispatched ? formatThaiDateTime(dispatchInfo.time_dispatched) : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">เวลาถึงที่เกิดเหตุ:</span>
                    <span className="font-medium text-zinc-800">
                      {dispatchInfo?.time_on_scene ? formatThaiDateTime(dispatchInfo.time_on_scene) : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">เวลาถึงโรงพยาบาล:</span>
                    <span className="font-medium text-zinc-800">
                      {dispatchInfo?.time_hospital ? formatThaiDateTime(dispatchInfo.time_hospital) : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* B: การปฐมพยาบาลและการประเมินผู้ป่วย (Treatment & Vitals) */}
            <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600" />
              <CardHeader className="py-4 px-5 bg-emerald-50/40 border-b border-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <span>B. ข้อมูลการปฐมพยาบาลและการประเมินผู้ป่วย (Assessment & Treatment)</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 text-xs space-y-5">
                {treatment ? (
                  <>
                    {/* สัญญาณชีพ (Vital Signs) */}
                    <div>
                      <span className="text-zinc-500 font-bold block mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        <span>สัญญาณชีพและการประเมินแรกรับ (Vital Signs)</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">ความดัน (BP)</span>
                          <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                            {bpDisplay}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">ชีพจร (PR)</span>
                          <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                            {treatment.pulse_rate || "-"} bpm
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">การหายใจ (RR)</span>
                          <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                            {treatment.respiratory_rate || "-"} /min
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">ออกซิเจน (SpO2)</span>
                          <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                            {treatment.spo2 || "-"} %
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">อุณหภูมิ (Temp)</span>
                          <span className="font-bold text-amber-600 text-xs sm:text-sm">
                            {treatment.temperature ? `${treatment.temperature} °C` : "-"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                          <span className="text-zinc-400 text-[10px] block">น้ำตาล (DTX)</span>
                          <span className="font-bold text-sky-600 text-xs sm:text-sm">
                            {treatment.dtx ? `${treatment.dtx} mg/dL` : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* การประเมินทางระบบประสาท & รูม่านตา */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50/70 border border-zinc-200">
                      <div>
                        <span className="text-zinc-400 text-[10px] block">ระดับความรู้สึกตัว</span>
                        <span className="font-bold text-zinc-800">
                          {treatment.consciousness || "ไม่ระบุ"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] block">GCS Score (E+V+M)</span>
                        <span className="font-bold text-zinc-800">
                          {gcsTotal > 0 ? `${gcsTotal} คะแนน (E${treatment.gcs_e} V${treatment.gcs_v} M${treatment.gcs_m})` : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] block">รูม่านตา (Pupil R / L)</span>
                        <span className="font-bold text-zinc-800">
                          {treatment.pupil_right || "-"} / {treatment.pupil_left || "-"}
                        </span>
                      </div>
                    </div>

                    {/* หัตถการและการรักษา */}
                    <div>
                      <span className="text-zinc-500 font-bold block mb-1.5 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                        <span>การจัดการและการปฐมพยาบาลเบื้องต้น</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                          <span className="text-zinc-400 text-[10px] block">ทางเดินหายใจ:</span>
                          <span className="font-semibold text-zinc-800">{treatment.airway_management || "ไม่"}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                          <span className="text-zinc-400 text-[10px] block">การห้ามเลือด/ทำแผล:</span>
                          <span className="font-semibold text-zinc-800">{treatment.wound_management || "ไม่"}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                          <span className="text-zinc-400 text-[10px] block">การดามกระดูก:</span>
                          <span className="font-semibold text-zinc-800">{treatment.splint_management || "ไม่"}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                          <span className="text-zinc-400 text-[10px] block">การทำ CPR:</span>
                          <span className="font-semibold text-zinc-800">{treatment.cpr_performed ? "มีการทำ CPR" : "ไม่มี"}</span>
                        </div>
                      </div>
                    </div>

                    {/* ผลลัพธ์และ รพ. ปลายทาง */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-emerald-700 block text-[11px] font-semibold">สถานะ / ผลลัพธ์การดูแล</span>
                        <span className="text-base font-bold text-emerald-900 mt-0.5 block">
                          {treatment.initial_outcome || "คงเดิม/คงที่"}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                        <span className="text-sky-700 block text-[11px] font-semibold">โรงพยาบาลปลายทางที่นำส่ง</span>
                        <span className="text-base font-bold text-sky-900 mt-0.5 block flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-sky-600" />
                          {treatment.destination_hospital || "ไม่ได้ส่งต่อ รพ."}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 text-center text-zinc-400 italic">
                    ยังไม่มีการบันทึกข้อมูลการรักษาและการประเมินอาการ
                  </div>
                )}
              </CardContent>
            </Card>

            {/* รูปภาพเหตุการณ์และหลักฐานประกอบ */}
            <Card className="rounded-2xl border-zinc-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="py-4 px-5 bg-zinc-50/70 border-b border-zinc-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>รูปภาพปฏิบัติงานและหลักฐาน ({attachmentsList.length} รูป)</span>
                </CardTitle>
                <Link
                  href={`/cases/${id}/attachments`}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  จัดการรูปภาพ
                </Link>
              </CardHeader>

              <CardContent className="p-5">
                {attachmentsList.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-xs">
                    ไม่มีรูปภาพบันทึกในเคสนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {attachmentsList.map((att: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-video relative group"
                      >
                        <img
                          src={att.file_path}
                          alt={att.caption || "Scene Photo"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-zinc-900/80 text-white text-[9px] font-bold">
                          {att.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Siren className="w-8 h-8 text-rose-500 animate-pulse stroke-1" />
          <span>กำลังเปิดหน้าสรุปรายงานเคส...</span>
        </div>
      }
    >
      <CaseSummaryContent />
    </Suspense>
  );
}