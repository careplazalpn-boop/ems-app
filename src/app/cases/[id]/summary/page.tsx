"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping print:hidden" />
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
            <Clock className="w-3.5 h-3.5 text-amber-500 print:hidden" />
            รอสั่งการ
          </span>
        );
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Ambulance className="w-3.5 h-3.5 text-sky-500 print:hidden" />
            สั่งการรถแล้ว
          </span>
        );
      case "on_scene":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 print:hidden" />
            ถึงที่เกิดเหตุ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:hidden" />
            เสร็จสิ้นภารกิจ
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600 print:hidden" />
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
        <div className="py-24 text-center space-y-3 print:hidden">
          <Siren className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังรวบรวมข้อมูลสรุปเคสฉุกเฉิน...</p>
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout>
        <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200 max-w-lg mx-auto my-12 space-y-4 print:hidden">
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

  // 2. ข้อมูลการรักษาล่าสุด (Treatment)
  const treatment = treatmentsList[0] || null;

  const bpDisplay = treatment?.sbp || treatment?.dbp 
    ? `${treatment?.sbp || "-"}/${treatment?.dbp || "-"} mmHg` 
    : treatment?.blood_pressure || "-";

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
      {/* 🌟 CSS Print Styling สำหรับกระดาษ A4 โดยเฉพาะ */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* ซ่อนส่วนตกแต่งที่ไม่จำเป็น */
          aside, header, nav, button, a[href^="/cases/"] {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="w-full space-y-6 pb-24 print:pb-0 print:space-y-4">
        {/* ============================================================== */}
        {/* 🌟 ส่วนหัวกระดาษแบบเป็นทางการสำหรับพิมพ์ออก A4 (แสดงเฉพาะตอน Print) 🌟 */}
        {/* ============================================================== */}
        <div className="hidden print:flex flex-col items-center justify-center text-center border-b-2 border-zinc-800 pb-3 mb-2">
          <div className="relative w-16 h-16 mb-1">
            <Image
              src="/images/logo-org.png"
              alt="Logo"
              width={64}
              height={64}
              className="object-contain mx-auto"
              priority
            />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 leading-tight">
            รายงานการปฏิบัติงานการแพทย์ฉุกเฉิน
          </h1>
          <h2 className="text-sm font-semibold text-zinc-700">
            ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน
          </h2>
          <div className="w-full flex justify-between items-center text-[11px] text-zinc-600 mt-2 pt-1 border-t border-zinc-300">
            <span>เลขที่คำขอ/เคส: <strong className="font-mono text-zinc-900">{caseData.case_number}</strong></span>
            <span>ระดับความรุนแรง: <strong>{caseData.triage_level?.toUpperCase()}</strong></span>
            <span>วัน-เวลารับแจ้ง: <strong>{formatThaiDateTime(caseData.created_at)}</strong></span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Header Action Bar สำหรับหน้าจอทั่วไป (ซ่อนเมื่อ Print) */}
        {/* ============================================================== */}
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
              type="button"
              onClick={() => window.open(`/cases/${id}/summary/print`, "_blank")}
              className="h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>พิมพ์รายงาน (PDF / A4)</span>
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

        {/* แถบหัวเรื่องสรุปเคส (Cover Overview Card - ซ่อนเมื่อ Print เพื่อใช้หัวกระดาษราชการ) */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden print:hidden">
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

        {/* Grid แสดงผล 3 คอลัมน์ (ปรับเป็น Print Layout ที่สะอาดตา)[cite: 13] */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3">
          {/* ข้อมูลผู้ป่วย (คอลัมน์ซ้าย)[cite: 13] */}
          <div className="space-y-6 print:space-y-3">
            <Card className="rounded-2xl border-sky-100 shadow-sm overflow-hidden bg-white print:border print:border-zinc-300 print:shadow-none">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-600 print:hidden" />
              <CardHeader className="py-4 px-5 bg-sky-50/40 border-b border-zinc-100 print:py-1.5 print:px-3 print:bg-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 print:text-xs">
                  <User className="w-4 h-4 text-sky-600 print:hidden" />
                  <span>ข้อมูลผู้ป่วย / ผู้ประสบเหตุ</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4 print:p-3 print:space-y-2">
                <div className="flex flex-col items-center print:flex-row print:gap-3">
                  <div className="w-28 h-32 rounded-xl border-2 border-sky-100 bg-zinc-50 overflow-hidden flex items-center justify-center relative shadow-xs print:w-16 print:h-20 print:border-zinc-300">
                    {caseData.patient_hn && !imageError ? (
                      <img
                        src={`/uploads/patient/${caseData.patient_hn}.webp?v=${caseData.patient_hn}`}
                        alt="Patient Photo"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <User className="w-8 h-8 text-zinc-300 mx-auto" />
                        <span className="text-[10px] text-zinc-400">ไม่มีรูปถ่าย</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center print:text-left mt-2 print:mt-0">
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 print:bg-white print:text-zinc-900 print:border-none">
                      HN: {ptHnDisplay}
                    </span>
                    <div className="font-bold text-zinc-900 text-sm print:text-xs mt-1">{ptName}</div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs print:text-[11px] print:space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">เพศ:</span>
                      <span className="font-medium text-zinc-800">
                        {caseData.ems_patient?.gender === "2" || hospitalPt?.sex === "2" ? "หญิง" : "ชาย / ไม่ระบุ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">อายุ:</span>
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
                    <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">เบอร์โทรศัพท์:</span>
                    <span className="font-medium text-zinc-800">
                      {hospitalPt?.mobile_phone_number || caseData.ems_patient?.phone || caseData.caller_phone || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">สิทธิการรักษา:</span>
                    <span className="font-semibold text-purple-700 print:text-zinc-900">
                      {hospitalPt?.pttype || caseData.insurance_type || "UC (บัตรทอง)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">ที่อยู่ตามประวัติ:</span>
                    <span className="text-zinc-700 leading-relaxed block text-[11px]">
                      {hospitalPt?.address_full || caseData.ems_patient?.address_full || caseData.incident_address || "ไม่ระบุที่อยู่"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ข้อมูลจุดเกิดเหตุ[cite: 13] */}
            <Card className="rounded-2xl border-amber-100 shadow-sm overflow-hidden bg-white print:border print:border-zinc-300 print:shadow-none">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 print:hidden" />
              <CardHeader className="py-4 px-5 bg-amber-50/40 border-b border-zinc-100 flex flex-row items-center justify-between print:py-1.5 print:px-3 print:bg-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 print:text-xs">
                  <PhoneCall className="w-4 h-4 text-amber-600 print:hidden" />
                  <span>จุดเกิดเหตุ & การรับแจ้ง</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs print:p-3 print:space-y-1.5 print:text-[11px]">
                <div>
                  <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">ผู้โทรแจ้งเหตุ:</span>
                  <span className="font-semibold text-zinc-800">
                    {caseData.caller_name || "-"} (โทร: {caseData.caller_phone || "-"})
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">สถานที่เกิดเหตุ:</span>
                  <p className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 font-medium text-zinc-800 print:bg-white print:border-none print:p-0">
                    {caseData.incident_address || "ไม่ระบุสถานที่เกิดเหตุ"}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 print:text-zinc-500 block text-[10px]">อาการสำคัญ (Chief Complaint):</span>
                  <p className="p-2 rounded-lg bg-rose-50/50 border border-rose-200 text-zinc-900 font-medium print:bg-white print:border-none print:p-0 print:text-zinc-900">
                    {caseData.chief_complaint || "ไม่มีบันทึกอาการสำคัญ"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนเนื้อหาหลัก (คอลัมน์กลางและขวา)[cite: 13] */}
          <div className="lg:col-span-2 space-y-6 print:col-span-2 print:space-y-3">
            {/* A: ศูนย์สั่งการและส่งทีม (Dispatch Control)[cite: 13] */}
            <Card className="rounded-2xl border-indigo-100 shadow-sm overflow-hidden bg-white print:border print:border-zinc-300 print:shadow-none">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 print:hidden" />
              <CardHeader className="py-4 px-5 bg-indigo-50/30 border-b border-zinc-100 print:py-1.5 print:px-3 print:bg-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 print:text-xs">
                  <Ambulance className="w-4 h-4 text-indigo-600 print:hidden" />
                  <span>A. ศูนย์สั่งการและส่งทีมปฏิบัติการ (Dispatch Control)</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 text-xs space-y-4 print:p-3 print:space-y-2 print:text-[11px]">
                {/* 1. รถพยาบาล[cite: 13] */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 print:pb-1">
                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">รถพยาบาลที่ออกเหตุ:</span>
                    <strong className="text-sm print:text-xs text-zinc-900">
                      {vehicleObj ? `ทะเบียน ${vehicleObj.plate_number} (${vehicleObj.vehicle_type || "รถตู้พยาบาล"})` : "ไม่ได้ระบุรถพยาบาล"}
                    </strong>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 print:border-none">
                    สถานะ: {caseData.status === "completed" ? "เสร็จสิ้นภารกิจ" : caseData.status}
                  </span>
                </div>

                {/* 2, 3, 4: บุคลากรประจำทีม[cite: 13] */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:grid-cols-3 print:gap-2">
                  <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 print:bg-white print:p-1.5">
                    <span className="text-zinc-400 print:text-zinc-500 text-[10px] block font-bold">หัวหน้าชุดปฏิบัติการ</span>
                    <strong className="text-xs print:text-[11px] text-zinc-900">{leaderName}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 print:bg-white print:p-1.5">
                    <span className="text-zinc-400 print:text-zinc-500 text-[10px] block font-bold">พนักงานขับรถ</span>
                    <strong className="text-xs print:text-[11px] text-zinc-900">{driverName}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 print:bg-white print:p-1.5">
                    <span className="text-zinc-400 print:text-zinc-500 text-[10px] block font-bold">ผู้ร่วมปฏิบัติการ</span>
                    <span className="text-xs print:text-[11px] text-zinc-800">
                      {membersList.length > 0 ? membersList.map((m: any) => m.name).join(", ") : "ไม่มีผู้ร่วมปฏิบัติการ"}
                    </span>
                  </div>
                </div>

                {/* เวลาปฏิบัติการ[cite: 13] */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-100 text-[11px] print:text-[10px]">
                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 block">เวลาสั่งการ:</span>
                    <span className="font-semibold">{dispatchInfo?.time_dispatched ? formatThaiDateTime(dispatchInfo.time_dispatched) : "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 block">เวลาถึงที่เกิดเหตุ:</span>
                    <span className="font-semibold">{dispatchInfo?.time_on_scene ? formatThaiDateTime(dispatchInfo.time_on_scene) : "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 print:text-zinc-500 block">เวลาถึงโรงพยาบาล:</span>
                    <span className="font-semibold">{dispatchInfo?.time_hospital ? formatThaiDateTime(dispatchInfo.time_hospital) : "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* B: การปฐมพยาบาลและการประเมินผู้ป่วย (Treatment & Vitals)[cite: 13] */}
            <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white print:border print:border-zinc-300 print:shadow-none">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600 print:hidden" />
              <CardHeader className="py-4 px-5 bg-emerald-50/40 border-b border-zinc-100 print:py-1.5 print:px-3 print:bg-zinc-100">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2 print:text-xs">
                  <HeartPulse className="w-4 h-4 text-emerald-600 print:hidden" />
                  <span>B. ข้อมูลการปฐมพยาบาลและการประเมินผู้ป่วย (Assessment & Treatment)</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 text-xs space-y-4 print:p-3 print:space-y-2 print:text-[11px]">
                {treatment ? (
                  <>
                    {/* สัญญาณชีพ (Vital Signs)[cite: 13] */}
                    <div>
                      <span className="text-zinc-500 print:text-zinc-700 font-bold block mb-1.5 text-[11px]">
                        สัญญาณชีพแรกรับ (Vital Signs):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 print:grid-cols-6 print:gap-1.5">
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">BP (ความดัน)</span>
                          <span className="font-bold text-zinc-900">{bpDisplay}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">PR (ชีพจร)</span>
                          <span className="font-bold text-zinc-900">{treatment.pulse_rate || "-"} bpm</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">RR (หายใจ)</span>
                          <span className="font-bold text-zinc-900">{treatment.respiratory_rate || "-"} /min</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">SpO2 (ออกซิเจน)</span>
                          <span className="font-bold text-emerald-700">{treatment.spo2 || "-"} %</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">Temp (อุณหภูมิ)</span>
                          <span className="font-bold text-amber-700">{treatment.temperature ? `${treatment.temperature} °C` : "-"}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-center print:bg-white print:p-1">
                          <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">DTX (น้ำตาล)</span>
                          <span className="font-bold text-sky-700">{treatment.dtx ? `${treatment.dtx} mg/dL` : "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* การประเมินทางระบบประสาท & GCS[cite: 13] */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200 print:bg-white print:p-1.5 print:border-zinc-300">
                      <div>
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">ระดับความรู้สึกตัว:</span>
                        <strong className="text-zinc-800">{treatment.consciousness || "ไม่ระบุ"}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">GCS Score (E+V+M):</span>
                        <strong className="text-zinc-800">{gcsTotal > 0 ? `${gcsTotal} คะแนน (E${treatment.gcs_e} V${treatment.gcs_v} M${treatment.gcs_m})` : "-"}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">รูม่านตา (R / L):</span>
                        <strong className="text-zinc-800">{treatment.pupil_right || "-"} / {treatment.pupil_left || "-"}</strong>
                      </div>
                    </div>

                    {/* หัตถการปฐมพยาบาล[cite: 13] */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 print:grid-cols-4 print:gap-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 print:bg-white print:p-1">
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">ทางเดินหายใจ:</span>
                        <span className="font-medium text-zinc-900">{treatment.airway_management || "ไม่"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 print:bg-white print:p-1">
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">ห้ามเลือด/ทำแผล:</span>
                        <span className="font-medium text-zinc-900">{treatment.wound_management || "ไม่"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 print:bg-white print:p-1">
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">ดามกระดูก:</span>
                        <span className="font-medium text-zinc-900">{treatment.splint_management || "ไม่"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 print:bg-white print:p-1">
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">CPR:</span>
                        <span className="font-medium text-zinc-900">{treatment.cpr_performed ? "มีการทำ CPR" : "ไม่มี"}</span>
                      </div>
                    </div>

                    {/* ผลลัพธ์และ รพ. ปลายทาง[cite: 13] */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 text-[11px]">
                      <div>
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">ผลลัพธ์การบริบาล:</span>
                        <strong className="text-zinc-900">{treatment.initial_outcome || "คงเดิม/คงที่"}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 print:text-zinc-500 text-[10px] block">รพ. ปลายทางที่นำส่ง:</span>
                        <strong className="text-zinc-900">{treatment.destination_hospital || "ไม่ได้ส่งต่อ รพ."}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-50 text-center text-zinc-400 italic print:bg-white">
                    ยังไม่มีการบันทึกข้อมูลการรักษาและการประเมินอาการ
                  </div>
                )}
              </CardContent>
            </Card>

            {/* รูปภาพหลักฐาน (แสดงบนหน้าจอ แต่ตัดออกเมื่อ Print เพื่อประหยัดหมึกและไม่ดันให้ล้นหน้า A4)[cite: 13] */}
            <Card className="rounded-2xl border-zinc-200 shadow-sm overflow-hidden bg-white print:hidden">
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

        {/* ============================================================== */}
        {/* 🌟 ช่องสำหรับลงลายมือชื่อ (แสดงเฉพาะตอน Print ขนาด A4) 🌟 */}
        {/* ============================================================== */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-6 mt-4 border-t border-zinc-400 text-center text-xs text-zinc-800 print-section">
          <div className="space-y-1">
            <p className="font-semibold text-[11px]">ผู้บันทึกรายงาน / ผู้ให้การบริบาล</p>
            <div className="pt-8">...........................................................................</div>
            <p className="font-medium text-[11px]">( {driverName || "..................................................."} )</p>
            <p className="text-[10px] text-zinc-500">เจ้าหน้าที่ปฏิบัติการการแพทย์ฉุกเฉิน</p>
            <p className="text-[10px] text-zinc-500">วันที่ ......../......../............</p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-[11px]">หัวหน้าชุดปฏิบัติการ (ผู้ตรวจทานและรับรอง)</p>
            <div className="pt-8">...........................................................................</div>
            <p className="font-medium text-[11px]">( {leaderName || "..................................................."} )</p>
            <p className="text-[10px] text-zinc-500">หัวหน้าชุดปฏิบัติการฉุกเฉิน</p>
            <p className="text-[10px] text-zinc-500">วันที่ ......../......../............</p>
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
        <div className="p-12 text-center text-sm text-zinc-400 flex flex-col items-center justify-center gap-2 print:hidden">
          <Siren className="w-8 h-8 text-rose-500 animate-pulse stroke-1" />
          <span>กำลังเปิดหน้าสรุปรายงานเคส...</span>
        </div>
      }
    >
      <CaseSummaryContent />
    </Suspense>
  );
}