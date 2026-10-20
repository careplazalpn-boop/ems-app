"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  User,
  CreditCard,
  AlertTriangle,
  Send,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  MapPin,
  MapPinOff,
  ExternalLink,
  Users,
  X,
  AlertCircle,
  PhoneCall,
  ShieldCheck,
  Siren,
  Building2,
  Skull,
  Droplet,
} from "lucide-react";

const initialFormState = {
  patient_source: "NEW",
  hn: "",
  ems_patient_id: null as number | null,
  id_type: "CID",
  cid: "",
  passport_no: "",
  nationality: "ไทย",
  pname: "นาย",
  fname: "",
  lname: "",
  gender: "1", 
  age: "",  
  blood_group: "",
  patient_phone: "",
  patient_address: "",
  village_name: "บุคคลนอกเขต",
  is_deceased: false,
  latitude: null as number | string | null,
  longitude: null as number | string | null,

  // สิทธิการรักษา
  insurance_type: "UC",
  insurance_code: "",

  // การแจ้งเหตุ
  caller_name: "",
  caller_phone: "",
  incident_address: "",
  chief_complaint: "",
  triage_level: "yellow",
};

function NewCaseFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHn = searchParams.get("hn") || "";

  const [searchInput, setSearchInput] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchSource, setSearchSource] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasValidCoordinates = Boolean(
    formData.latitude &&
    formData.longitude &&
    parseFloat(String(formData.latitude)) !== 0 &&
    parseFloat(String(formData.longitude)) !== 0
  );

  useEffect(() => {
    if (initialHn) {
      executeSearch({ hn: initialHn }).then(() => {
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, [initialHn]);

  const handleResetForm = () => {
    if (confirm("คุณต้องการล้างข้อมูลในแบบฟอร์มทั้งหมดใช่หรือไม่?")) {
      setFormData(initialFormState);
      setSearchInput("");
      setSearchSource("");
      setImageError(false);
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const applyPatientData = (pt: any) => {
    setSearchSource(pt.source);
    setImageError(false);

    if (pt.is_deceased) {
      alert("⚠️ คำเตือน: ผู้ป่วยรายนี้มีประวัติระบุว่า 'เสียชีวิตแล้ว' ในระบบโรงพยาบาล");
    }

    // แปลงค่าเพศให้เป็น "1" หรือ "2"
  let formattedGender = "1";
  const rawGender = String(pt.gender || pt.sex || "").trim();
  if (rawGender === "1" || rawGender.toLowerCase() === "male") {
    formattedGender = "1";
  } else if (rawGender === "2" || rawGender.toLowerCase() === "female") {
    formattedGender = "2";
  }
    setFormData((prev) => ({
      ...prev,
      patient_source: pt.source,
      hn: pt.hn || "",
      ems_patient_id: pt.ems_patient_id || null,
      cid: pt.cid || "",
      passport_no: pt.passport_no || "",
      pname: pt.pname || prev.pname,
      fname: pt.fname || "",
      lname: pt.lname || "",     
      gender: formattedGender,
      age: pt.age ? String(pt.age) : prev.age,
      blood_group: pt.blood_group || prev.blood_group,
      patient_phone: pt.phone || prev.patient_phone,
      patient_address: pt.address || prev.patient_address,
      village_name: pt.village_name || "บุคคลนอกเขต",
      is_deceased: Boolean(pt.is_deceased),
      insurance_type: pt.insurance_type || prev.insurance_type,
      nationality: pt.nationality || "ไทย",
      latitude: pt.latitude || null,
      longitude: pt.longitude || null,
      incident_address: prev.incident_address || pt.address || "",
    }));
    setIsModalOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();

    if (!query) {
      alert("กรุณากรอกคำค้นหา");
      return;
    }

    const isNumeric = /^\d+$/.test(query);
    if (isNumeric) {
      if (query.length !== 13) {
        alert("การค้นหาด้วยเลขประจำตัวประชาชนต้องกรอกให้ครบ 13 หลักเท่านั้น");
        return;
      }
      executeSearch({ cid: query });
    } else {
      if (query.length < 2) {
        alert("กรุณาระบุคำค้นหาชื่อ-สกุลอย่างน้อย 2 ตัวอักษร");
        return;
      }
      executeSearch({ query });
    }
  };

  const executeSearch = async (params: { hn?: string; cid?: string; query?: string }) => {
    setLoadingSearch(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.hn) queryParams.set("hn", params.hn);
      if (params.cid) queryParams.set("cid", params.cid);
      if (params.query) queryParams.set("query", params.query);

      const res = await fetch(`/api/patients/search?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการค้นหา");
        return;
      }

      if (data.found && data.patients.length > 0) {
        if (data.patients.length === 1) {
          applyPatientData(data.patients[0]);
        } else {
          setPatientResults(data.patients);
          setTotalFound(data.total);
          setIsModalOpen(true);
        }
      } else {
        setSearchSource("NOT_FOUND");
        alert("ไม่พบข้อมูลประวัติเดิม สามารถกรอกข้อมูลเพื่อสร้างประวัติใหม่ได้ทันที");
        setFormData((prev) => ({
          ...prev,
          patient_source: "NEW",
          cid: params.cid || prev.cid,
          hn: params.hn || prev.hn,
        }));
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoadingSearch(false);
    }
  };

  const openGoogleMaps = () => {
    if (!hasValidCoordinates) return;
    window.open(
      `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`,
      "_blank"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fname || !formData.incident_address) {
      alert("กรุณาระบุชื่อผู้ป่วย และสถานที่เกิดเหตุ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && (data.success || data.id || data.case_number)) {
        // ดึงเลขที่ใบงานอย่างปลอดภัย รองรับ data.case_number, data.case?.case_number หรือ data.data?.case_number
        const caseNo = data.case_number || data.case?.case_number || data.data?.case_number || "EMS";
        alert(`บันทึกเคสฉุกเฉินสำเร็จ! เลขที่ใบงาน: ${caseNo}`);
        router.push("/cases");
      } else {
        alert(data.error || data.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      console.error("Save case error:", err);
      alert(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* หัวกระดาษ Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  เปิดรับแจ้งเหตุฉุกเฉินใหม่
                </h2>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60">
                  Emergency Intake
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                ศูนย์รับแจ้งเหตุ สั่งการ และประสานงานทีมแพทย์กู้ชีพ (EMS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {searchSource === "HOSPITAL" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ฐานข้อมูล รพ. (HN: {formData.hn})</span>
              </span>
            )}
            {searchSource === "TEMPORARY" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>ประวัติหน้างาน EMS</span>
              </span>
            )}
            {(searchSource === "NOT_FOUND" || searchSource === "") && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <span>เคสผู้ป่วยใหม่</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetForm}
              title="ล้างข้อมูลในฟอร์ม"
              className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-rose-600 text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </div>

        {/* 1. CARD ค้นหา: โทนสีส้มอ่อนนวลตา */}
        <Card className="rounded-2xl border-amber-200/80 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/70 shadow-xs">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                <label className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span>ค้นหาประวัติผู้ป่วยเดิม</span>
                </label>
                <span className="text-xs text-amber-800/80 font-medium">
                  ค้นด้วยชื่อ-สกุล (เช่น <span className="font-semibold text-amber-900">"สม มา"</span>) หรือเลขบัตร 13 หลัก
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ นามสกุล หรือเลขประจำตัวประชาชน 13 หลัก..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-amber-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition"
                  />
                  <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                </div>
                <button
                  type="submit"
                  disabled={loadingSearch}
                  className="w-full sm:w-auto h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:bg-zinc-300 disabled:text-zinc-500 cursor-pointer"
                >
                  {loadingSearch ? "กำลังค้นหา..." : "ค้นหาประวัติ"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2. CARD ข้อมูลผู้ป่วย */}
          <Card className="rounded-2xl border-sky-100/90 shadow-sm overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
            <CardHeader className="pb-3 border-b border-zinc-100 bg-sky-50/40 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-200/50">
                  <User className="h-4.5 w-4.5" />
                </div>
                <span>1. ข้อมูลผู้ป่วย / ผู้ประสบเหตุ</span>
              </CardTitle>

              {hasValidCoordinates ? (
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold transition shadow-2xs cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เปิด Google Maps นำทาง</span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-400 border border-zinc-200 text-xs font-medium cursor-not-allowed">
                  <MapPinOff className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ไม่มีพิกัดแผนที่</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* รูปถ่ายผู้ป่วย */}
                <div className="flex flex-col items-center gap-2 shrink-0 w-full md:w-auto">
                  <div className="w-36 h-40 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/30 overflow-hidden flex items-center justify-center shadow-xs relative group">
                    {formData.hn && !imageError ? (
                      <img
                        key={formData.hn} // เพิ่ม key เพื่อบังคับให้ re-mount element เมื่อ HN เปลี่ยน
                        src={`/uploads/patient/${formData.hn}.webp?v=${formData.hn}`}
                        alt={`รูปผู้ป่วย HN ${formData.hn}`}
                        className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                          formData.is_deceased ? "grayscale contrast-125" : ""
                        }`}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-400 p-3 text-center">
                        <User className="w-12 h-12 mb-1.5 stroke-1 text-sky-300" />
                        <span className="text-[11px] font-medium text-zinc-500">ไม่มีรูปถ่ายผู้ป่วย</span>
                      </div>
                    )}

                    {formData.is_deceased && (
                      <div className="absolute inset-x-0 bottom-3 bg-red-600/90 text-white text-[11px] font-bold text-center py-1 tracking-wider shadow-sm flex items-center justify-center gap-1">
                        <Skull className="w-3 h-3" />
                        <span>เสียชีวิตแล้ว</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    {formData.hn ? (
                      <span className="text-xs font-mono font-bold text-sky-700 bg-sky-100/80 px-2.5 py-1 rounded-lg border border-sky-200">
                        HN: {formData.hn}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">ยังไม่มี HN</span>
                    )}
                    {formData.is_deceased && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        สถานะ: เสียชีวิต
                      </span>
                    )}
                  </div>
                </div>

                {/* Field ข้อมูลผู้ป่วย */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">ประเภทเอกสาร</label>
                    <select
                      value={formData.id_type}
                      onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    >
                      <option value="CID">บัตรประชาชนไทย (CID)</option>
                      <option value="PASSPORT">หนังสือเดินทาง (Passport)</option>
                      <option value="FOREIGN_ID">บัตรชมพู / ต่างด้าว</option>
                      <option value="UNKNOWN">ไม่ทราบชื่อ / นิรนาม</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">เลขบัตร / เลขพาสปอร์ต</label>
                    <input
                      type="text"
                      placeholder="เลข 13 หลัก หรือพาสปอร์ต"
                      value={formData.id_type === "PASSPORT" ? formData.passport_no : formData.cid}
                      onChange={(e) =>
                        formData.id_type === "PASSPORT"
                          ? setFormData({ ...formData, passport_no: e.target.value })
                          : setFormData({ ...formData, cid: e.target.value })
                      }
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">สัญชาติ</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">HN (ระบบ รพ.)</label>
                    <input
                      type="text"
                      readOnly={formData.patient_source === "HOSPITAL"}
                      placeholder="เช่น 000051916"
                      value={formData.hn}
                      onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                      className={`w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-800 focus:outline-none ${
                        formData.patient_source === "HOSPITAL"
                          ? "bg-zinc-100 text-zinc-500 font-mono"
                          : "bg-zinc-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">คำนำหน้า</label>
                    <input
                      type="text"
                      placeholder="นาย, นาง, น.ส."
                      value={formData.pname}
                      onChange={(e) => setFormData({ ...formData, pname: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      ชื่อจริง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ระบุชื่อจริง"
                      value={formData.fname}
                      onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">นามสกุล</label>
                    <input
                      type="text"
                      placeholder="ระบุนามสกุล"
                      value={formData.lname}
                      onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 font-medium focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">เพศ</label>
                      <select
                        value={formData.gender} // 💡 หากใน State ของคุณเปลี่ยนชื่อเป็น formData.sex ให้แก้ตรงนี้ด้วยครับ
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="1">ชาย</option>
                        <option value="2">หญิง</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">อายุ (ปี)</label>
                      <input
                        type="number"
                        placeholder="คำนวณอัตโนมัติ"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      <span>หมู่เลือด (Blood Group)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น A, B, O, AB"
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">เบอร์โทรศัพท์ผู้ป่วย</label>
                    <input
                      type="text"
                      placeholder="เบอร์มือถือ หรือเบอร์ติดต่อ"
                      value={formData.patient_phone}
                      onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>ชุมชน / หมู่บ้าน</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุชื่อชุมชน หรือบุคคลนอกเขต..."
                      value={formData.village_name}
                      onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      ที่อยู่ผู้ป่วย (patient.address_full)
                    </label>
                    <input
                      type="text"
                      placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล..."
                      value={formData.patient_address}
                      onChange={(e) => setFormData({ ...formData, patient_address: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. CARD สิทธิการรักษา */}
          <Card className="rounded-2xl border-purple-100/90 shadow-sm overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500" />
            <CardHeader className="pb-3 border-b border-zinc-100 bg-purple-50/40">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-200/50">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <span>2. สิทธิการรักษา ณ ขณะเกิดเหตุ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">ประเภทสิทธิการรักษา</label>
                  <select
                    value={formData.insurance_type}
                    onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                    className="w-full h-10 rounded-xl border border-purple-200/80 bg-purple-50/20 px-3 text-sm text-zinc-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition"
                  >
                    <option value="UC">บัตรทอง / ประกันสุขภาพถ้วนหน้า (UC)</option>
                    <option value="SSS">ประกันสังคม (SSS)</option>
                    <option value="OFC">สิทธิข้าราชการ/รัฐวิสาหกิจ (OFC)</option>
                    <option value="ACT">พ.ร.บ.คุ้มครองผู้ประสบภัยจากรถ</option>
                    <option value="FOREIGNER">ประกันสุขภาพต่างด้าว</option>
                    <option value="PAYMENT">ชำระเงินเอง</option>
                    <option value="OTHER">อื่นๆ</option>
                  </select>
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    เลขที่สิทธิ / หมายเหตุสิทธิการรักษา
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เลขบัตร รพ.ต้นสังกัด หรือเลขที่เคลม พ.ร.บ."
                    value={formData.insurance_code}
                    onChange={(e) => setFormData({ ...formData, insurance_code: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. CARD รายละเอียดการรับแจ้งเหตุ */}
          <Card className="rounded-2xl border-amber-200/90 shadow-sm overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            <CardHeader className="pb-3 border-b border-zinc-100 bg-amber-50/40">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <span>3. รายละเอียดการรับแจ้งเหตุและการคัดกรอง (Triage)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-zinc-400" />
                    <span>ชื่อผู้โทรแจ้งเหตุ</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อผู้แจ้ง หรือ พยานที่พบเห็น"
                    value={formData.caller_name}
                    onChange={(e) => setFormData({ ...formData, caller_name: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">เบอร์โทรศัพท์ผู้แจ้ง</label>
                  <input
                    type="text"
                    placeholder="เบอร์โทรกลับฉุกเฉิน"
                    value={formData.caller_phone}
                    onChange={(e) => setFormData({ ...formData, caller_phone: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    ระดับความรุนแรง (Triage Level)
                  </label>
                  <select
                    value={formData.triage_level}
                    onChange={(e) => setFormData({ ...formData, triage_level: e.target.value })}
                    className={`w-full h-10 rounded-xl border px-3 text-sm font-bold tracking-wide transition focus:outline-none ${
                      formData.triage_level === "red"
                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                        : formData.triage_level === "yellow"
                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                    }`}
                  >
                    <option value="red">🔴 วิกฤต (Red - Resuscitation)</option>
                    <option value="yellow">🟡 เร่งด่วน (Yellow - Emergency)</option>
                    <option value="green">🟢 ไม่เร่งด่วน (Green - Urgent)</option>
                    <option value="white">⚪ ทั่วไป (White - Non-Urgent)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    สถานที่เกิดเหตุ / จุดนัดพบ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ระบุสถานที่สำคัญ จุดสังเกต ถนน ซอย หรือพิกัดจุดนัดพบของรถพยาบาล..."
                      value={formData.incident_address}
                      onChange={(e) => setFormData({ ...formData, incident_address: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition"
                    />
                    <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    อาการสำคัญที่ได้รับแจ้ง (Chief Complaint)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="เช่น หมดสติ ปลุกไม่ตื่น หายใจเฮือก, อุบัติเหตุรถชนมีบาดแผลฉีกขาดขนาดใหญ่และกระดูกหัก..."
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm text-zinc-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar ล่างสุด */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200">
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลจะถูกเข้ารหัสและบันทึกลงสู่ระบบการแพทย์ฉุกเฉิน PTS ทันที</span>
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ยกเลิก</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2.5 shadow-md shadow-zinc-900/20 disabled:bg-zinc-300 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>{submitting ? "กำลังเปิดเคส..." : "บันทึกและเปิดเคสฉุกเฉิน"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Popup เลือกผู้ป่วย พร้อมระบบ Scroll แนวนอนบนมือถือ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="p-4 px-5 sm:px-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm sm:text-base">เลือกประวัติผู้ป่วย</h3>
                  <p className="text-xs text-zinc-500">
                    พบทั้งหมด {totalFound} รายการ (แสดง {patientResults.length} รายการแรก)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* คำแนะนำสำหรับมือถือ & แจ้งเตือนรายการเกิน */}
            <div className="px-4 sm:px-6 pt-3 space-y-2">
              {/* ข้อความบอกผู้ใช้มือถือว่าเลื่อนข้างได้ */}
              <div className="sm:hidden flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span>👈 เลื่อนซ้าย-ขวา เพื่อดูข้อมูลเพิ่มเติม 👉</span>
              </div>

              {totalFound > 30 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">พบข้อมูลมากเกินไป ({totalFound} รายการ):</span>{" "}
                    แสดงผลเพียง 30 รายการแรก เพื่อความรวดเร็ว กรุณาระบุคำค้นหาให้แคบลง เช่น พิมพ์ชื่อและนามสกุลเต็ม หรือค้นหาด้วยเลขประจำตัวประชาชน
                  </div>
                </div>
              )}
            </div>

            {/* ส่วนตาราง: รองรับเลื่อนแนวตั้ง (overflow-y-auto) และแนวนอน (overflow-x-auto) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="border border-zinc-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">HN</th>
                      <th className="py-3 px-3 w-36 whitespace-nowrap">เลขประจำตัวประชาชน</th>
                      <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">ชื่อ - สกุล</th>
                      <th className="py-3 px-3 w-16 whitespace-nowrap">อายุ</th>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">ถนน</th>
                      <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">ชุมชน / หมู่บ้าน</th>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">เบอร์โทรศัพท์</th>
                      <th className="py-3 px-3 text-right w-20 whitespace-nowrap sticky right-0 bg-zinc-50">เลือก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {patientResults.map((pt) => (
                      <tr
                        key={pt.hn || pt.cid}
                        className={`hover:bg-amber-50/50 transition cursor-pointer ${
                          pt.is_deceased ? "bg-red-50/30" : ""
                        }`}
                        onClick={() => applyPatientData(pt)}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                          {pt.hn}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-600 whitespace-nowrap">
                          {pt.cid || "-"}
                        </td>
                        <td className="py-3 px-3 font-medium text-zinc-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{pt.pname}{pt.fname} {pt.lname}</span>
                            {pt.is_deceased && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                <Skull className="w-2.5 h-2.5" /> เสียชีวิต
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-zinc-700 whitespace-nowrap">
                          {pt.age ? `${pt.age} ปี` : "-"}
                        </td>
                        <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">
                          {pt.road || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border text-[11px] ${
                              pt.village_name === "บุคคลนอกเขต"
                                ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                : "bg-sky-50 text-sky-700 border-sky-100"
                            }`}
                          >
                            <Building2 className="w-3 h-3 text-sky-500 shrink-0" />
                            {pt.village_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">
                          {pt.phone || "-"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPatientData(pt);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-600 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            เลือก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 sm:px-6 border-t border-zinc-100 flex justify-end bg-zinc-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold transition cursor-pointer"
              >
                ปิดหน้าต่าง
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">กำลังเตรียมหน้าฟอร์ม...</div>}>
      <NewCaseFormContent />
    </Suspense>
  );
}