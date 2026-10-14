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
  const [status, setStatus] = useState("pending");
  const [triageLevel, setTriageLevel] = useState("yellow");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [incidentAddress, setIncidentAddress] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");

  // State ข้อมูลรถและเจ้าหน้าที่ปฏิบัติการ
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  useEffect(() => {
    if (!id) return;

    async function loadCaseData() {
      try {
        const res = await fetch(`/api/cases/${id}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setCaseData(data.case);
          setHospitalPt(data.hospital_patient);
          setVehicles(data.vehicles || []);
          setOfficers(data.officers || []);

          setStatus(data.case.status || "pending");
          setTriageLevel(data.case.triage_level || "yellow");
          setChiefComplaint(data.case.chief_complaint || "");
          setIncidentAddress(data.case.incident_address || "");
          setCallerName(data.case.caller_name || "");
          setCallerPhone(data.case.caller_phone || "");

          // โหลดข้อมูลการสั่งการล่าสุด (ถ้ามี)
          if (data.latest_dispatch) {
            setSelectedVehicle(String(data.latest_dispatch.vehicle_id || ""));
            if (data.latest_dispatch.team_members) {
              try {
                const team = typeof data.latest_dispatch.team_members === "string"
                  ? JSON.parse(data.latest_dispatch.team_members)
                  : data.latest_dispatch.team_members;

                if (team.leader_id) setLeaderId(String(team.leader_id));
                if (team.driver_id) setDriverId(String(team.driver_id));
                if (Array.isArray(team.members)) setSelectedMembers(team.members);
              } catch (e) {
                console.error("Error parsing team_members:", e);
              }
            }
          }
        } else {
          alert(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลเคส");
        }
      } catch (err) {
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
        ? prev.filter((id) => id !== officerId)
        : [...prev, officerId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          member_ids: selectedMembers,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("บันทึกข้อมูลการสั่งการและทีมปฏิบัติการสำเร็จ");
        router.refresh();
      } else {
        alert(result.error || "เกิดข้อผิดพลาดในการบันทึก");
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

  const ptName = hospitalPt
    ? hospitalPt.name
    : caseData?.ems_patient
    ? `${caseData.ems_patient.pname || ""}${caseData.ems_patient.fname || ""} ${caseData.ems_patient.lname || ""}`.trim()
    : "ไม่ระบุชื่อ / นิรนาม";

  const ptGender = hospitalPt
    ? hospitalPt.gender
    : caseData?.ems_patient?.gender === "1"
    ? "ชาย"
    : caseData?.ems_patient?.gender === "2"
    ? "หญิง"
    : "ไม่ระบุ";

  const ptAge = hospitalPt
    ? hospitalPt.age
    : caseData?.ems_patient?.age
    ? `${caseData.ems_patient.age} ปี`
    : "-";

  const ptHn = caseData?.patient_hn || "-";
  const hasCoordinates = Boolean(caseData?.latitude && caseData?.longitude);

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-16">
        {/* Header แถบบน */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Link
              href="/cases"
              className="h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                  {caseData?.case_number}
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {caseData?.patient_source}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  รับแจ้งเมื่อ:{" "}
                  {caseData?.created_at
                    ? new Date(caseData.created_at).toLocaleString("th-TH")
                    : "-"}
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
                  <div className="w-28 h-32 rounded-xl border border-dashed border-sky-200 bg-sky-50/30 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {ptHn !== "-" ? (
                      <img
                        src={`/uploads/patient/${ptHn}.webp?v=${ptHn}`}
                        alt="Patient Photo"
                        className={`w-full h-full object-cover ${
                          hospitalPt?.is_deceased ? "grayscale" : ""
                        }`}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <User className="w-10 h-10 text-sky-300 stroke-1" />
                    )}

                    {hospitalPt?.is_deceased && (
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
                      <span className="text-zinc-400 block mb-0.5">HN</span>
                      <span className="font-mono font-bold text-sky-700">{ptHn}</span>
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
                        {hospitalPt?.blood_group || "-"}
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
                {/* 1. เลือกรถพยาบาล (vehicles.plate_number) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Ambulance className="w-4 h-4 text-sky-600" />
                    <span>เลือกรถพยาบาลออกเหตุ (ทะเบียนรถ)</span>
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-sky-300 bg-sky-50/30 text-xs sm:text-sm font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">-- ยังไม่ระบุ / ไม่ได้ส่งรถ --</option>
                    {vehicles.map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        ทะเบียน {v.plate_number} {v.brand ? `(${v.brand})` : ""} {v.vehicle_type ? `[${v.vehicle_type}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. หัวหน้าชุดปฏิบัติการ */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>หัวหน้าชุดปฏิบัติการ</span>
                  </label>
                  <select
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm text-zinc-800 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- เลือกหัวหน้าชุด --</option>
                    {officers.map((u) => (
                      <option key={`leader-${u.id}`} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. พนักงานขับรถ */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-indigo-600" />
                    <span>พนักงานขับรถพยาบาล</span>
                  </label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm text-zinc-800 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- เลือกคนขับรถ --</option>
                    {officers.map((u) => (
                      <option key={`leader-${u.id}`} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. ผู้ร่วมปฏิบัติการ (เลือกได้หลายคน) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>ผู้ร่วมปฏิบัติการ</span>
                    </label>
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      เลือกแล้ว {selectedMembers.length} ท่าน
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 space-y-1.5">
                    {officers.length === 0 ? (
                      <div className="text-center py-3 text-xs text-zinc-400">
                        ไม่มีรายชื่อเจ้าหน้าที่
                      </div>
                    ) : (
                      officers.map((u) => {
                        // กันไม่ให้ซ้ำกับคนที่เลือกเป็นหัวหน้าชุด หรือ คนขับรถ (ถ้าต้องการให้เลือกได้ทุกคน ให้เอาเงื่อนไข isSelectedElsewhere ออกได้ครับ)
                        const isSelectedElsewhere =
                          String(u.id) === String(leaderId) || String(u.id) === String(driverId);
                        const isChecked = selectedMembers.includes(u.id);

                        return (
                          <label
                            key={`member-${u.id}`}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${
                              isChecked
                                ? "bg-amber-100/70 border border-amber-300/80 text-zinc-900 font-semibold"
                                : isSelectedElsewhere
                                ? "opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400"
                                : "hover:bg-white hover:shadow-2xs text-zinc-700 border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isSelectedElsewhere}
                              checked={isChecked}
                              onChange={() => toggleMember(u.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="flex-1 truncate">{u.name}</span>
                            <span className="text-[10px] text-zinc-400 bg-white/80 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                              {isSelectedElsewhere
                                ? String(u.id) === String(leaderId)
                                  ? "หัวหน้าชุด"
                                  : "คนขับรถ"
                                : u.role}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
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

                {/* สถานะเคส (Workflow State) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    สถานะการปฏิบัติการ (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm font-semibold text-zinc-800 focus:bg-white focus:outline-none"
                  >
                    <option value="pending">⏳ รอสั่งการ (Pending)</option>
                    <option value="dispatched">🚑 สั่งการรถแล้ว (Dispatched)</option>
                    <option value="on_scene">📍 ถึงที่เกิดเหตุ (On Scene)</option>
                    <option value="completed">✅ เสร็จสิ้น (Completed)</option>
                    <option value="cancelled">❌ ยกเลิกเคส (Cancelled)</option>
                  </select>
                </div>

                {/* ปุ่มบันทึกการสั่งการ */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>
                    {submitting ? "กำลังบันทึก..." : "บันทึกการสั่งการและทีม"}
                  </span>
                </button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>การลงทะเบียน Dispatch</span>
              </div>
              <p>
                ข้อมูลรถ ทะเบียนรถ และรายชื่อเจ้าหน้าที่ทั้งหัวหน้าชุด คนขับ และผู้ร่วมทีม จะถูกจัดเก็บเป็นบันทึกการสั่งการร่วมกับเคสทันที
              </p>
            </div>
          </div>
        </form>
      </div>
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