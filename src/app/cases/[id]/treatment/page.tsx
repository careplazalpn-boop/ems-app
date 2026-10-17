"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Heart,
  Wind,
  Eye,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  Building2,
  Save,
  ArrowLeft,
  CheckCircle2,
  Brain,
  Bone,
  Check,
  Siren,
  FileText,
  ChevronDown,
  ChevronUp,
  Skull,
  MapPin,
  Navigation,
  ExternalLink,
} from "lucide-react";

const WOUND_OPTIONS = [
  "ไม่มี",
  "แผลถลอก",
  "ฉีกขาด / ตัด",
  "แผลฟกช้ำ",
  "แผลไหม้",
  "ถูกยิง",
  "ถูกแทง",
  "อวัยวะตัดขาด",
  "ถูกระเบิด",
];

const ORGAN_OPTIONS = [
  "ศีรษะ/คอ",
  "ใบหน้า",
  "สันหลัง/หลัง",
  "หน้าอก/ไหปลาร้า",
  "ช่องท้อง",
  "เชิงกราน",
  "Extremities (แขน/ขา)",
  "ผิวหนัง",
  "Multiple injury back",
];

const PUPIL_OPTIONS = [
  { value: "2mm RTL", label: "2 mm RTL (ปกติ - ตอบสนองต่อแสง)" },
  { value: "3mm RTL", label: "3 mm RTL (ปกติ - ตอบสนองต่อแสง)" },
  { value: "1mm RTL", label: "1 mm RTL (เล็ก - ตอบสนอง)" },
  { value: "4mm RTL", label: "4 mm RTL (โตเล็กน้อย - ตอบสนอง)" },
  { value: "5mm RTL", label: "5 mm RTL (ขยายโต - ตอบสนอง)" },
  { value: "2mm Fixed", label: "2 mm Fixed (ไม่ตอบสนองต่อแสง)" },
  { value: "3mm Fixed", label: "3 mm Fixed (ไม่ตอบสนองต่อแสง)" },
  { value: "4mm Fixed", label: "4 mm Fixed (ขยาย & ไม่ตอบสนอง)" },
  { value: "5mm Fixed", label: "5 mm Fixed (ขยาย & ไม่ตอบสนอง)" },
  { value: "Pinpoint", label: "Pinpoint (<1mm ม่านตาหดเล็กสุด)" },
  { value: "Dilated", label: "Dilated (>6mm ม่านตาขยายสุด)" },
];

const HOSPITAL_OPTIONS = [
  "โรงพยาบาลลำพูน",
  "โรงพยาบาลพริ้นซ์ ลำพูน",
  "โรงพยาบาลลำพูนใกล้หมอ",
  "โรงพยาบาลศิริเวชลำพูน",
  "โรงพยาบาลหริภุญชัย เมโมเรียล",
  "ไม่นำส่งโรงพยาบาล (เสียชีวิต / ปฏิเสธการรักษา)",
];

const HOSPITAL_REASONS = [
  "เหมาะสม/สามารถรักษาได้",
  "อยู่ใกล้",
  "มีหลักประกัน",
  "เป็นผู้ป่วยเก่า",
  "เป็นความประสงค์",
  "ไม่นำส่ง / เสียชีวิต ณ จุดเกิดเหตุ",
];

function TreatmentContent() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);

  // ข้อมูลพิกัดสถานที่เกิดเหตุ
  const [incidentAddress, setIncidentAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  const [openSections, setOpenSections] = useState({
    secLocation: true,
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true,
    sec5: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (isOpen: boolean) => {
    setOpenSections({
      secLocation: isOpen,
      sec1: isOpen,
      sec2: isOpen,
      sec3: isOpen,
      sec4: isOpen,
      sec5: isOpen,
    });
  };

  const [isDeceasedMode, setIsDeceasedMode] = useState(false);
  const [cannotAssessVitals, setCannotAssessVitals] = useState(false);
  const [cannotAssessNeuro, setCannotAssessNeuro] = useState(false);

  // 1. สภาพผู้ป่วย & Vital Signs
  const [patientType, setPatientType] = useState("non_trauma");
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [pulseRate, setPulseRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [dtx, setDtx] = useState("");

  // 2. Neuro Signs & GCS
  const [gcsE, setGcsE] = useState("4");
  const [gcsV, setGcsV] = useState("5");
  const [gcsM, setGcsM] = useState("6");
  const [consciousness, setConsciousness] = useState("รู้สึกตัวดี");
  const [pupilRight, setPupilRight] = useState("2mm RTL");
  const [pupilLeft, setPupilLeft] = useState("2mm RTL");

  // 3. การประเมินร่างกาย บาดแผล และกระดูก
  const [breathingType, setBreathingType] = useState("ปกติ");
  const [selectedWounds, setSelectedWounds] = useState<string[]>(["ไม่มี"]);
  const [deformity, setDeformity] = useState("none");
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);

  // 4. การปฐมพยาบาล & CPR
  const [airwayManagement, setAirwayManagement] = useState("ไม่");
  const [woundManagement, setWoundManagement] = useState("ไม่");
  const [splintManagement, setSplintManagement] = useState("ไม่");
  const [cprPerformed, setCprPerformed] = useState(false);
  const [initialOutcome, setInitialOutcome] = useState("คงเดิม/คงที่");

  // 5. เกณฑ์การตัดสินใจส่งโรงพยาบาล
  const [destinationHospital, setDestinationHospital] = useState("โรงพยาบาลลำพูน");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([
    "เหมาะสม/สามารถรักษาได้",
  ]);
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [caseStatus, setCaseStatus] = useState("completed");

  // 🌟 ป้องกัน Modal ค้าง: กำหนดค่าเริ่มต้นเป็น false เสมอ
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ฟังก์ชันดึงพิกัดปัจจุบันผ่าน Browser GPS
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGettingLocation(false);
        alert("ดึงพิกัดปัจจุบันสำเร็จ!");
      },
      (error) => {
        console.error("Geolocation Error:", error);
        alert("ไม่สามารถดึงพิกัดได้ กรุณาตรวจสอบการอนุญาตเข้าถึงตำแหน่งในเบราว์เซอร์");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleQuickSaveLocation = async () => {
    if (!latitude || !longitude) {
      alert("กรุณาดึงพิกัด GPS ก่อนทำการบันทึก");
      return;
    }

    setSavingLocation(true);
    try {
      const res = await fetch(`/api/cases/${id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_address: incidentAddress,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("บันทึกพิกัดและสถานที่เกิดเหตุลงฐานข้อมูลเรียบร้อยแล้ว!");
      } else {
        alert(data.error || "ไม่สามารถบันทึกพิกัดได้");
      }
    } catch (err) {
      console.error("Quick save location error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleDeceasedPreset = () => {
    if (!isDeceasedMode) {
      setIsDeceasedMode(true);
      setCannotAssessVitals(true);
      setCannotAssessNeuro(true);

      setSbp("0");
      setDbp("0");
      setPulseRate("0");
      setRespiratoryRate("0");
      setSpo2("0");
      setTemperature("");
      setDtx("");

      setGcsE("1");
      setGcsV("1");
      setGcsM("1");
      setConsciousness("หมดสติปลุกไม่ตื่น");
      setPupilRight("Dilated");
      setPupilLeft("Dilated");

      setBreathingType("ไม่หายใจ");
      setCprPerformed(false);
      setInitialOutcome("เสียชีวิต ณ จุดเกิดเหตุ");
      setDestinationHospital("ไม่นำส่งโรงพยาบาล (เสียชีวิต / ปฏิเสธการรักษา)");
      setSelectedReasons(["ไม่นำส่ง / เสียชีวิต ณ จุดเกิดเหตุ"]);
      setCaseStatus("completed");
    } else {
      setIsDeceasedMode(false);
      setCannotAssessVitals(false);
      setCannotAssessNeuro(false);

      setSbp("");
      setDbp("");
      setPulseRate("");
      setRespiratoryRate("");
      setSpo2("");
      setTemperature("");
      setDtx("");
      setBreathingType("ปกติ");

      setGcsE("4");
      setGcsV("5");
      setGcsM("6");
      setConsciousness("รู้สึกตัวดี");
      setPupilRight("2mm RTL");
      setPupilLeft("2mm RTL");

      setInitialOutcome("คงเดิม/คงที่");
      setDestinationHospital("โรงพยาบาลลำพูน");
      setSelectedReasons(["เหมาะสม/สามารถรักษาได้"]);
      setCaseStatus("on_scene");
    }
  };

  useEffect(() => {
    if (!id) return;

    // 🌟 1. ล้างค่า Modal ทันทีที่เปิดหน้านี้หรือกดปุ่มย้อนกลับมา ป้องกัน Modal เด้งค้าง
    setShowSuccessModal(false);

    async function loadData() {
      try {
        const res = await fetch(`/api/cases/${id}/treatment?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setCaseData(data.case);
          setIncidentAddress(data.case.incident_address || "");
          setLatitude(data.case.latitude ? String(data.case.latitude) : "");
          setLongitude(data.case.longitude ? String(data.case.longitude) : "");

          if (data.treatment) {
            const t = data.treatment;
            setPatientType(t.patient_type || "non_trauma");
            setSbp(t.sbp !== null && t.sbp !== undefined ? String(t.sbp) : "");
            setDbp(t.dbp !== null && t.dbp !== undefined ? String(t.dbp) : "");
            setPulseRate(t.pulse_rate !== null && t.pulse_rate !== undefined ? String(t.pulse_rate) : "");
            setRespiratoryRate(t.respiratory_rate !== null && t.respiratory_rate !== undefined ? String(t.respiratory_rate) : "");
            setSpo2(t.spo2 !== null && t.spo2 !== undefined ? String(t.spo2) : "");
            setTemperature(t.temperature ? String(t.temperature) : "");
            setDtx(t.dtx ? String(t.dtx) : "");

            setGcsE(t.gcs_e ? String(t.gcs_e) : "4");
            setGcsV(t.gcs_v ? String(t.gcs_v) : "5");
            setGcsM(t.gcs_m ? String(t.gcs_m) : "6");
            setConsciousness(t.consciousness || "รู้สึกตัวดี");
            setPupilRight(t.pupil_right || "2mm RTL");
            setPupilLeft(t.pupil_left || "2mm RTL");

            setBreathingType(t.breathing_type || "ปกติ");
            setDeformity(t.deformity || "none");
            setAirwayManagement(t.airway_management || "ไม่");
            setWoundManagement(t.wound_management || "ไม่");
            setSplintManagement(t.splint_management || "ไม่");
            setCprPerformed(Boolean(t.cpr_performed));
            setInitialOutcome(t.initial_outcome || "คงเดิม/คงที่");

            setDestinationHospital(t.destination_hospital || "โรงพยาบาลลำพูน");
            setTreatmentNotes(t.treatment_notes || "");

            if (t.initial_outcome?.includes("เสียชีวิต")) {
              setIsDeceasedMode(true);
              setCannotAssessVitals(true);
              setCannotAssessNeuro(true);
            }

            if (t.wound_types) {
              try {
                setSelectedWounds(JSON.parse(t.wound_types));
              } catch (e) {}
            }
            if (t.injured_organs) {
              try {
                setSelectedOrgans(JSON.parse(t.injured_organs));
              } catch (e) {}
            }
            if (t.hospital_decision_reasons) {
              try {
                setSelectedReasons(JSON.parse(t.hospital_decision_reasons));
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error("Error loading treatment:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (item === "ไม่มี") {
      setList(["ไม่มี"]);
      return;
    }
    const cleanList = list.filter((i) => i !== "ไม่มี");
    if (cleanList.includes(item)) {
      const next = cleanList.filter((i) => i !== item);
      setList(next.length === 0 ? ["ไม่มี"] : next);
    } else {
      setList([...cleanList, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/cases/${id}/treatment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_type: patientType,
          sbp: cannotAssessVitals ? null : sbp,
          dbp: cannotAssessVitals ? null : dbp,
          pulse_rate: cannotAssessVitals ? null : pulseRate,
          respiratory_rate: cannotAssessVitals ? null : respiratoryRate,
          spo2: cannotAssessVitals ? null : spo2,
          temperature: cannotAssessVitals ? null : temperature,
          dtx: cannotAssessVitals ? null : dtx,
          gcs_e: cannotAssessNeuro ? null : gcsE,
          gcs_v: cannotAssessNeuro ? null : gcsV,
          gcs_m: cannotAssessNeuro ? null : gcsM,
          consciousness: cannotAssessNeuro ? "ไม่สามารถประเมินได้" : consciousness,
          pupil_right: pupilRight,
          pupil_left: pupilLeft,
          breathing_type: breathingType,
          wound_types: selectedWounds,
          deformity,
          injured_organs: selectedOrgans,
          airway_management: airwayManagement,
          wound_management: woundManagement,
          splint_management: splintManagement,
          cpr_performed: cprPerformed,
          initial_outcome: initialOutcome,
          destination_hospital: destinationHospital,
          hospital_decision_reasons: selectedReasons,
          treatment_notes: treatmentNotes,
          case_status: caseStatus,
          incident_address: incidentAddress,
          latitude: latitude || null,
          longitude: longitude || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // 🌟 2. เปิด Modal สำเร็จเฉพาะเมื่อกดบันทึกสำเร็จจริง ๆ เท่านั้น
        setShowSuccessModal(true);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <Siren className="w-10 h-10 text-rose-500 animate-pulse mx-auto" />
          <p className="text-sm text-zinc-500">กำลังโหลดใบบันทึกการรักษา...</p>
        </div>
      </AppLayout>
    );
  }

  const totalGCS = cannotAssessNeuro
    ? "N/A"
    : (parseInt(gcsE, 10) || 0) + (parseInt(gcsV, 10) || 0) + (parseInt(gcsM, 10) || 0);

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-20">
        {/* Header แถบบน */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/cases/${id}`}
              className="h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
                  {caseData?.case_number}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ใบบันทึกการดูแลรักษา ณ ที่เกิดเหตุ
                </span>
                {isDeceasedMode && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-white flex items-center gap-1">
                    <Skull className="w-3 h-3" />
                    <span>ผู้ป่วยเสียชีวิต</span>
                  </span>
                )}
              </div>
              
              {/* 🌟 แสดง HN และชื่อ-นามสกุลผู้ป่วยต่อกันอย่างชัดเจน */}
              <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="text-zinc-400 font-mono">HN: {caseData?.patient_hn || "-"}</span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-800 font-bold">
                  ผู้ป่วย: {caseData?.hospital_patient?.name || (caseData?.ems_patient ? `${caseData.ems_patient.pname || ""}${caseData.ems_patient.fname || ""} ${caseData.ems_patient.lname || ""}`.trim() : "ไม่ระบุชื่อ")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={toggleDeceasedPreset}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isDeceasedMode
                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300"
              }`}
            >
              <Skull className={`w-3.5 h-3.5 ${isDeceasedMode ? "text-white" : "text-rose-500"}`} />
              <span>{isDeceasedMode ? "ยกเลิกสถานะเสียชีวิต (คืนค่า)" : "ผู้ป่วยเสียชีวิต (DOA)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setAllSections(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition shadow-2xs"
            >
              ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setAllSections(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition shadow-2xs"
            >
              ย่อทั้งหมด
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* ส่วนจัดการพิกัดจุดเกิดเหตุ */}
          <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader
              onClick={() => toggleSection("secLocation")}
              className="py-3.5 px-5 bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    พิกัดและสถานที่เกิดเหตุ (บันทึกด่วนได้)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.secLocation && (
                    <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      {incidentAddress ? incidentAddress : "ยังไม่ได้ระบุสถานที่"} {latitude ? `(${latitude}, ${longitude})` : ""}
                    </span>
                  )}
                  {openSections.secLocation ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
              </div>
            </CardHeader>

            {openSections.secLocation && (
              <CardContent className="pt-5 pb-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    สถานที่เกิดเหตุ / จุดนัดพบ
                  </label>
                  <input
                    type="text"
                    value={incidentAddress}
                    onChange={(e) => setIncidentAddress(e.target.value)}
                    placeholder="ระบุสถานที่เกิดเหตุ..."
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="เช่น 18.5744"
                      className="w-full h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="เช่น 98.9900"
                      className="w-full h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="flex-1 h-9 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{gettingLocation ? "กำลังดึง..." : "ดึงพิกัด GPS"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickSaveLocation}
                      disabled={savingLocation || !latitude}
                      className="flex-1 h-9 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingLocation ? "กำลังบันทึก..." : "บันทึกพิกัดด่วน"}</span>
                    </button>

                    {latitude && longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center"
                        title="เปิดแผนที่ Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* หมวดที่ 1 */}
          <Card className="rounded-2xl border-sky-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-600" />
            <CardHeader
              onClick={() => toggleSection("sec1")}
              className="py-3.5 px-5 bg-sky-50/50 hover:bg-sky-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-5 w-5 text-sky-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    หมวดที่ 1: ประเภทผู้ป่วย & สัญญาณชีพ (Vital Signs)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.sec1 && (
                    <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100/70 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      {cannotAssessVitals ? "ไม่สามารถวัดได้" : `BP: ${sbp || "-"}/${dbp || "-"} | PR: ${pulseRate || "-"}`}
                    </span>
                  )}
                  {openSections.sec1 ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
            </CardHeader>

            {openSections.sec1 && (
              <CardContent className="pt-5 pb-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    ประเภทผู้ป่วย <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                    <button
                      type="button"
                      onClick={() => setPatientType("trauma")}
                      className={`h-12 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        patientType === "trauma"
                          ? "bg-rose-600 border-rose-600 text-white shadow-rose-200"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <AlertCircle className="w-4.5 h-4.5" />
                      <span>บาดเจ็บ / อุบัติเหตุ (Trauma)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientType("non_trauma")}
                      className={`h-12 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        patientType === "non_trauma"
                          ? "bg-sky-600 border-sky-600 text-white shadow-sky-200"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <Stethoscope className="w-4.5 h-4.5" />
                      <span>ป่วยฉุกเฉิน (Non-trauma)</span>
                    </button>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isDeceasedMode ? "bg-rose-50/60 border-rose-200 text-rose-900" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                }`}>
                  <label className={`flex items-center gap-2 text-xs font-bold ${isDeceasedMode ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={cannotAssessVitals}
                      disabled={isDeceasedMode}
                      onChange={(e) => setCannotAssessVitals(e.target.checked)}
                      className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed"
                    />
                    <span>
                      {isDeceasedMode
                        ? "ตรวจพบผู้ป่วยเสียชีวิตชัดเจน (DOA) - ยกเว้นการประเมินสัญญาณชีพ"
                        : "ไม่สามารถวัดสัญญาณชีพได้ / ไม่ได้ประเมิน (เช่น เสียชีวิตชัดเจน, สภาพแวดล้อมไม่ปลอดภัย)"}
                    </span>
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    isDeceasedMode ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {isDeceasedMode ? "ผู้ป่วยเสียชีวิต" : "เว้นว่างสัญญาณชีพ"}
                  </span>
                </div>

                {!cannotAssessVitals && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-2.5 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>สัญญาณชีพแรกรับ (Vital Signs)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">ความดัน (SBP/DBP)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={sbp}
                            onChange={(e) => setSbp(e.target.value)}
                            className="w-full h-10 px-2 rounded-xl border border-zinc-200 text-center font-mono text-sm focus:outline-none focus:border-sky-500 bg-zinc-50/50"
                          />
                          <span className="text-zinc-400">/</span>
                          <input
                            type="number"
                            value={dbp}
                            onChange={(e) => setDbp(e.target.value)}
                            className="w-full h-10 px-2 rounded-xl border border-zinc-200 text-center font-mono text-sm focus:outline-none focus:border-sky-500 bg-zinc-50/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">ชีพจร (PR)</span>
                        <input
                          type="number"
                          value={pulseRate}
                          onChange={(e) => setPulseRate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-center font-mono text-sm focus:outline-none focus:border-sky-500 bg-zinc-50/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">หายใจ (RR)</span>
                        <input
                          type="number"
                          value={respiratoryRate}
                          onChange={(e) => setRespiratoryRate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-center font-mono text-sm focus:outline-none focus:border-sky-500 bg-zinc-50/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">ออกซิเจน (SpO2 %)</span>
                        <input
                          type="number"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-sky-300 bg-sky-50/40 text-center font-mono text-sm focus:outline-none font-bold text-sky-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">อุณหภูมิ (°C)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-center font-mono text-sm focus:outline-none focus:border-sky-500 bg-zinc-50/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">น้ำตาล (DTX)</span>
                        <input
                          type="number"
                          value={dtx}
                          onChange={(e) => setDtx(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-amber-300 bg-amber-50/40 text-center font-mono text-sm font-bold text-amber-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* หมวดที่ 2 */}
          <Card className="rounded-2xl border-purple-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-600" />
            <CardHeader
              onClick={() => toggleSection("sec2")}
              className="py-3.5 px-5 bg-purple-50/50 hover:bg-purple-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Brain className="h-5 w-5 text-purple-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    หมวดที่ 2: ระบบประสาทและความรู้สึกตัว (Neuro Signs)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.sec2 && (
                    <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      {cannotAssessNeuro ? "GCS: N/A" : `GCS: ${totalGCS}`} | {consciousness}
                    </span>
                  )}
                  {openSections.sec2 ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
            </CardHeader>

            {openSections.sec2 && (
              <CardContent className="pt-5 pb-6 space-y-5">
                <div className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isDeceasedMode ? "bg-purple-50/60 border-purple-200 text-purple-900" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                }`}>
                  <label className={`flex items-center gap-2 text-xs font-bold ${isDeceasedMode ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={cannotAssessNeuro}
                      disabled={isDeceasedMode}
                      onChange={(e) => setCannotAssessNeuro(e.target.checked)}
                      className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                    />
                    <span>
                      {isDeceasedMode
                        ? "ตรวจพบผู้ป่วยเสียชีวิตชัดเจน - ยกเว้นการประเมินคะแนน GCS (N/A)"
                        : "ไม่สามารถประเมิน GCS ได้ (เช่น ใส่ท่อช่วยหายใจ, ผู้ป่วยเสียชีวิต, ได้รับยานอนหลับ/แอลกอฮอล์รุนแรง)"}
                    </span>
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    isDeceasedMode ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {isDeceasedMode ? "ผู้ป่วยเสียชีวิต" : "GCS: N/A"}
                  </span>
                </div>

                {!cannotAssessNeuro && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50/30 border border-purple-100 space-y-1">
                      <span className="text-xs font-bold text-purple-900 block">การลืมตา (Eye: E)</span>
                      <select
                        value={gcsE}
                        onChange={(e) => setGcsE(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-purple-200 bg-white text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                      >
                        <option value="4">E4 - ลืมตาได้เอง (Spontaneous)</option>
                        <option value="3">E3 - ลืมตาเมื่อเรียก (To Speech)</option>
                        <option value="2">E2 - ลืมตาเมื่อเจ็บ (To Pain)</option>
                        <option value="1">E1 - ไม่ลืมตา (None)</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/30 border border-purple-100 space-y-1">
                      <span className="text-xs font-bold text-purple-900 block">การตอบสนองคำพูด (Verbal: V)</span>
                      <select
                        value={gcsV}
                        onChange={(e) => setGcsV(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-lg border border-purple-200 bg-white text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                      >
                        <option value="5">V5 - พูดคุยรู้เรื่อง (Oriented)</option>
                        <option value="4">V4 - พูดคุยสับสน (Confused)</option>
                        <option value="3">V3 - พูดคำไม่ต่อเนื่อง (Inappropriate)</option>
                        <option value="2">V2 - ส่งเสียงไม่เป็นคำ (Incomprehensible)</option>
                        <option value="1">V1 - ไม่ส่งเสียง (None)</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/30 border border-purple-100 space-y-1">
                      <span className="text-xs font-bold text-purple-900 block">การเคลื่อนไหว (Motor: M)</span>
                      <select
                        value={gcsM}
                        onChange={(e) => setGcsM(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-purple-200 bg-white text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                      >
                        <option value="6">M6 - ทำตามคำสั่งได้ (Obeys commands)</option>
                        <option value="5">M5 - บอกตำแหน่งเจ็บได้ (Localizes pain)</option>
                        <option value="4">M4 - ชักแขนหนีเจ็บ (Withdrawal)</option>
                        <option value="3">M3 - แขนงอผิดปกติ (Decorticate)</option>
                        <option value="2">M2 - แขนเหยียดผิดปกติ (Decerebrate)</option>
                        <option value="1">M1 - ไม่เคลื่อนไหว (None)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    ระดับความรู้สึกตัว
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["รู้สึกตัวดี", "ซึม", "หมดสติปลุกตื่น", "หมดสติปลุกไม่ตื่น", "เอะอะโวยวาย"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        disabled={isDeceasedMode && item !== "หมดสติปลุกไม่ตื่น"}
                        onClick={() => setConsciousness(item)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                          consciousness === item
                            ? isDeceasedMode
                              ? "bg-zinc-800 text-white border-zinc-800 shadow-sm"
                              : "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        } ${isDeceasedMode ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span>ขนาดและการตอบสนองของรูม่านตา (Pupil)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-500">รูม่านตาขวา (Pupil Rt)</span>
                      <select
                        value={pupilRight}
                        disabled={isDeceasedMode}
                        onChange={(e) => setPupilRight(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm font-semibold text-zinc-800 focus:bg-white focus:outline-none disabled:bg-zinc-100 disabled:cursor-not-allowed"
                      >
                        {PUPIL_OPTIONS.map((opt) => (
                          <option key={`rt-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-500">รูม่านตาซ้าย (Pupil Lt)</span>
                      <select
                        value={pupilLeft}
                        disabled={isDeceasedMode}
                        onChange={(e) => setPupilLeft(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm font-semibold text-zinc-800 focus:bg-white focus:outline-none disabled:bg-zinc-100 disabled:cursor-not-allowed"
                      >
                        {PUPIL_OPTIONS.map((opt) => (
                          <option key={`lt-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* หมวดที่ 3 */}
          <Card className="rounded-2xl border-orange-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
            <CardHeader
              onClick={() => toggleSection("sec3")}
              className="py-3.5 px-5 bg-orange-50/50 hover:bg-orange-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wind className="h-5 w-5 text-orange-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    หมวดที่ 3: การหายใจ บาดแผล และกระดูก (Physical Assessment)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.sec3 && (
                    <span className="text-xs font-semibold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      หายใจ: {breathingType} | กระดูก: {deformity === "none" ? "ปกติ" : "ผิดรูป"}
                    </span>
                  )}
                  {openSections.sec3 ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
            </CardHeader>

            {openSections.sec3 && (
              <CardContent className="pt-5 pb-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    ลักษณะการหายใจ
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["ปกติ", "เร็ว", "ช้า", "ไม่สม่ำเสมอ", "ไม่หายใจ"].map((type) => {
                      const isSelected = breathingType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={isDeceasedMode}
                          onClick={() => setBreathingType(type)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            isSelected
                              ? isDeceasedMode
                                ? "bg-rose-700 text-white border-rose-700 shadow-sm"
                                : "bg-orange-500 text-white border-orange-500 shadow-sm"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          } ${isDeceasedMode ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2 flex items-center gap-1.5">
                    <Bone className="w-4 h-4 text-amber-600" />
                    <span>การตรวจกระดูกผิดรูป (Deformity)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setDeformity("none")}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        deformity === "none"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>ไม่มีกระดูกผิดรูป</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeformity("deformed")}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        deformity === "deformed"
                          ? "bg-rose-600 border-rose-600 text-white shadow-rose-200"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <AlertCircle className="w-4.5 h-4.5" />
                      <span>มีกระดูกผิดรูป</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    ลักษณะบาดแผล (เลือกได้มากกว่า 1 ข้อ)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WOUND_OPTIONS.map((w) => {
                      const active = selectedWounds.includes(w);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => toggleArrayItem(selectedWounds, setSelectedWounds, w)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                              : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 inline mr-1 text-white stroke-[2.5]" />}
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    อวัยวะที่บาดเจ็บ (เลือกได้มากกว่า 1 ข้อ)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50">
                    {ORGAN_OPTIONS.map((org) => {
                      const checked = selectedOrgans.includes(org);
                      return (
                        <label
                          key={org}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                            checked
                              ? "bg-amber-100/80 text-amber-950 font-bold border border-amber-300"
                              : "hover:bg-white text-zinc-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleArrayItem(selectedOrgans, setSelectedOrgans, org)}
                            className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>{org}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* หมวดที่ 4 */}
          <Card className="rounded-2xl border-amber-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
            <CardHeader
              onClick={() => toggleSection("sec4")}
              className="py-3.5 px-5 bg-amber-50/50 hover:bg-amber-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    หมวดที่ 4: การช่วยเหลือและการปฐมพยาบาลเบื้องต้น (Interventions)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.sec4 && (
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      ผล: {initialOutcome}
                    </span>
                  )}
                  {openSections.sec4 ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
            </CardHeader>

            {openSections.sec4 && (
              <CardContent className="pt-5 pb-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      ทางเดินหายใจ / การหายใจ
                    </label>
                    <select
                      value={airwayManagement}
                      onChange={(e) => setAirwayManagement(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs sm:text-sm font-semibold text-zinc-800"
                    >
                      <option value="ไม่">ไม่</option>
                      <option value="เปิดทางเดินหายใจ">เปิดทางเดินหายใจ</option>
                      <option value="ใส่ Oral airway">ใส่ Oral airway</option>
                      <option value="ให้ O2 canula/mask">ให้ O2 canula/mask</option>
                      <option value="Ambu bag">Ambu bag</option>
                      <option value="Pocket Mask">Pocket Mask</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      บาดแผล / การห้ามเลือด
                    </label>
                    <select
                      value={woundManagement}
                      onChange={(e) => setWoundManagement(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs sm:text-sm font-semibold text-zinc-800"
                    >
                      <option value="ไม่">ไม่</option>
                      <option value="การกดห้ามเลือด">การกดห้ามเลือด</option>
                      <option value="ทำแผล">ทำแผล</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      การดามกระดูก
                    </label>
                    <select
                      value={splintManagement}
                      onChange={(e) => setSplintManagement(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs sm:text-sm font-semibold text-zinc-800"
                    >
                      <option value="ไม่">ไม่</option>
                      <option value="เผือกลม/ไม้ดาม/ sling">เผือกลม / ไม้ดาม / Sling</option>
                      <option value="เฝือกดามคอและกระดานรองหลังยาว">
                        เฝือกดามคอและกระดานรองหลังยาว
                      </option>
                      <option value="เฝือกหลังและคอ (KED)">เฝือกหลังและคอ (KED)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-2">
                      การช่วยฟื้นคืนชีพ (CPR)
                    </label>
                    <div className="flex gap-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setCprPerformed(false)}
                        className={`flex-1 h-11 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                          !cprPerformed
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200"
                            : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        <span>ไม่ได้ทำ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCprPerformed(true)}
                        className={`flex-1 h-11 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                          cprPerformed
                            ? "bg-rose-600 border-rose-600 text-white shadow-rose-200"
                            : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        <Heart className="w-4.5 h-4.5" />
                        <span>ทำ CPR</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-2">
                      ผลการดูแลรักษาขั้นต้น
                    </label>
                    <select
                      value={initialOutcome}
                      onChange={(e) => setInitialOutcome(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs sm:text-sm font-bold text-zinc-900"
                    >
                      <option value="ทุเลา">🟢 ทุเลา</option>
                      <option value="คงเดิม/คงที่">🟡 คงเดิม / คงที่</option>
                      <option value="ทรุดหนัก">🔴 ทรุดหนัก</option>
                      <option value="ไม่ยอมให้รักษา">⚪ ไม่ยอมให้รักษา / ปฏิเสธ</option>
                      {isDeceasedMode && <option value="เสียชีวิต ณ จุดเกิดเหตุ">⚫ เสียชีวิต ณ จุดเกิดเหตุ</option>}
                    </select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* หมวดที่ 5 */}
          <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <CardHeader
              onClick={() => toggleSection("sec5")}
              className="py-3.5 px-5 bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer select-none border-b border-zinc-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-bold text-zinc-900">
                    หมวดที่ 5: เกณฑ์การตัดสินใจส่งโรงพยาบาล (Hospital Destination)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {!openSections.sec5 && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
                      {destinationHospital}
                    </span>
                  )}
                  {openSections.sec5 ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
            </CardHeader>

            {openSections.sec5 && (
              <CardContent className="pt-5 pb-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    นำส่งห้องฉุกเฉินโรงพยาบาล <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={destinationHospital}
                    onChange={(e) => setDestinationHospital(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs sm:text-sm font-bold text-emerald-950 focus:bg-white focus:outline-none"
                  >
                    {HOSPITAL_OPTIONS.map((hosp) => (
                      <option key={hosp} value={hosp}>
                        {hosp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    เหตุผลในการเลือกโรงพยาบาล (เลือกได้มากกว่า 1 ข้อ)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HOSPITAL_REASONS.map((reason) => {
                      const active = selectedReasons.includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => toggleArrayItem(selectedReasons, setSelectedReasons, reason)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            active
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 inline mr-1 text-white stroke-[2.5]" />}
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <span>บันทึกเพิ่มเติม / รายละเอียดการรักษา</span>
                  </label>
                  <textarea
                    rows={3}
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    placeholder="ระบุข้อสังเกต สภาพผู้ป่วย หรือรายละเอียดการรักษาเพิ่มเติม..."
                    className="w-full p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    อัปเดตสถานะการปฏิบัติการของเคส
                  </label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                    className="w-full sm:w-64 h-11 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm font-bold text-zinc-800"
                  >
                    <option value="on_scene">📍 ถึงที่เกิดเหตุ (On Scene)</option>
                    <option value="completed">✅ เสร็จสิ้นภารกิจ (Completed)</option>
                  </select>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ปุ่มบันทึกข้อมูลด้านล่าง */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
            <Link
              href={`/cases/${id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs sm:text-sm font-semibold text-zinc-700 text-center transition shadow-2xs"
            >
              ย้อนกลับไปหน้าสั่งการ
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-9 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4.5 h-4.5" />
              <span>{submitting ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลและไปหน้าเพิ่มรูปการปฏิบัติงาน"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🌟 Modern Success Modal (แสดงเฉพาะเมื่อกดบันทึกสำเร็จจริง ๆ เท่านั้น และมีปุ่มเดียวไปหน้า upload รูป) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-100 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900">
                บันทึกข้อมูลสำเร็จ
              </h3>
              <p className="text-xs text-zinc-500">
                ข้อมูลการประเมินและการรักษาถูกบันทึกลงฐานข้อมูลเรียบร้อยแล้ว
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push(`/cases/${id}/attachments`)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📸 ไปหน้าเพิ่มรูปภาพการปฏิบัติงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function TreatmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Siren className="w-8 h-8 text-rose-500 animate-pulse stroke-1" />
          <span>กำลังเตรียมหน้ารักษาพยาบาล...</span>
        </div>
      }
    >
      <TreatmentContent />
    </Suspense>
  );
}