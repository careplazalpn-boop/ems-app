"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Printer, ArrowLeft } from "lucide-react";

function PrintContent() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitalPt, setHospitalPt] = useState<any>(null);
  const [dispatchInfo, setDispatchInfo] = useState<any>(null);
  const [treatment, setTreatment] = useState<any>(null);
  const [officerMap, setOfficerMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const [resCase, resOfficers] = await Promise.all([
          fetch(`/api/cases/${id}?t=${Date.now()}`),
          fetch(`/api/users`).catch(() => null),
        ]);

        const data = await resCase.json();

        if (resOfficers && resOfficers.ok) {
          const offData = await resOfficers.json();
          const userList = offData.users || offData.data || offData || [];
          if (Array.isArray(userList)) {
            const map = new Map<number, string>();
            userList.forEach((u: any) => {
              if (u.user_id && u.fullname) {
                map.set(u.user_id, u.fullname.trim());
              }
            });
            setOfficerMap(map);
          }
        }

        if (resCase.ok && (data.success || data.case)) {
          const c = data.case || data.data || data;
          setCaseData(c);
          setHospitalPt(data.hospital_patient || null);
          setDispatchInfo(data.latest_dispatch || null);
          const tList = data.treatments || c.treatments || [];
          setTreatment(tList[0] || null);
        }
      } catch (err) {
        console.error("Load print data error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const formatThaiDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
        กำลังจัดเตรียมเอกสารพร้อมพิมพ์...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-red-500">
        ไม่พบข้อมูลเคสสำหรับพิมพ์
      </div>
    );
  }

  let ptName = "ไม่ระบุชื่อ / นิรนาม";
  let ptHn = caseData.patient_hn || "-";
  let ptCid = "-";
  let ptAge = "-";

  if (caseData.patient_source === "HOSPITAL" && hospitalPt) {
    ptName = `${hospitalPt.pname || ""}${hospitalPt.fname || ""} ${hospitalPt.lname || ""}`.trim();
    ptCid = hospitalPt.cid || "-";
    if (hospitalPt.birthday) {
      ptAge = `${new Date().getFullYear() - new Date(hospitalPt.birthday).getFullYear()} ปี`;
    }
  } else if (caseData.ems_patient) {
    const ep = caseData.ems_patient;
    ptName = `${ep.pname || ""}${ep.fname || ""} ${ep.lname || ""}`.trim();
    ptHn = ep.id ? `ID: ${ep.id}` : "-";
    ptCid = ep.id_card_no || ep.passport_no || "-";
    ptAge = ep.age ? `${ep.age} ปี` : "-";
  }

  if (ptName === "ไม่ระบุชื่อ / นิรนาม" && caseData.caller_name) {
    ptName = caseData.caller_name;
  }

  const vehicleObj = dispatchInfo?.vehicle || null;

  // หัวหน้าชุด และ พลขับ (แสดงเฉพาะชื่อจริง ถ้าไม่มีให้แสดงขีด -)
  const getCleanOfficerName = (rawName: string | undefined, id: number | undefined) => {
    if (rawName && !rawName.startsWith("เจ้าหน้าที่") && !rawName.startsWith("จนท.")) {
      return rawName;
    }
    if (id && officerMap.has(id)) {
      return officerMap.get(id)!;
    }
    return "-";
  };

  const leaderName = getCleanOfficerName(dispatchInfo?.leader_name, dispatchInfo?.leader_id);
  const driverName = getCleanOfficerName(dispatchInfo?.driver_name, dispatchInfo?.driver_id);

  // 🌟 แสดงเฉพาะชื่อ - สกุลจริงของผู้ร่วมปฏิบัติงาน (ตัด "เจ้าหน้าที่ X" ออก)
  const rawMembers: any[] = dispatchInfo?.members || dispatchInfo?.staffs || [];
  const memberNames = rawMembers
    .filter((m: any) => {
      const isLeader = m.role_type === "team_leader" || m.role_type === "leader" || m.note === "leader";
      const isDriver = m.role_type === "driver" || m.note === "driver";
      return !isLeader && !isDriver;
    })
    .map((m: any) => {
      const realName = officerMap.get(m.user_id) || m.fullname || m.name || "";
      return realName.trim();
    })
    .filter((name: string) => {
      return (
        name !== "" &&
        !name.startsWith("เจ้าหน้าที่") &&
        !name.startsWith("จนท.") &&
        !/^\d+$/.test(name)
      );
    });

  const membersDisplay = memberNames.length > 0 ? memberNames.join(", ") : "-";

  const bpDisplay = treatment?.sbp || treatment?.dbp 
    ? `${treatment?.sbp || "-"}/${treatment?.dbp || "-"} mmHg` 
    : "-";

  const gcsTotal = (treatment?.gcs_e || 0) + (treatment?.gcs_v || 0) + (treatment?.gcs_m || 0);

  return (
    <div className="bg-zinc-100 min-h-screen py-4 print:bg-white print:py-0 print:min-h-0 text-black font-sans">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm 12mm 8mm 12mm;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 280mm !important;
          }
          .signature-box {
            margin-top: 32mm !important;
            padding-top: 6mm !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* แถบควบคุมด้านบน (ซ่อนเวลา Print) */}
      <div className="max-w-[210mm] mx-auto mb-3 flex justify-between items-center px-2 no-print">
        <button
          onClick={() => window.close()}
          className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ปิดหน้านี้</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Printer className="w-3.5 h-3.5 text-white" />
          <span>สั่งพิมพ์ / บันทึก PDF (Print)</span>
        </button>
      </div>

      {/* แผ่นกระดาษ A4 */}
      <div className="print-page max-w-[210mm] mx-auto bg-white p-7 shadow-lg border border-zinc-200 box-border text-[10.5px] leading-tight flex flex-col justify-between h-[280mm]">
        <div>
          {/* ส่วนหัวกระดาษ */}
          <div className="text-center border-b-2 border-zinc-900 pb-2 mb-2">
            <div className="flex justify-center mb-0.5">
              <Image
                src="/images/logo-org.png"
                alt="Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-sm font-bold text-zinc-950 leading-tight">
              รายงานการปฏิบัติงานการแพทย์ฉุกเฉิน
            </h1>
            <h2 className="text-[11px] font-semibold text-zinc-700">
              ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน
            </h2>

            <div className="flex justify-between items-center text-[10px] text-zinc-600 mt-1.5 pt-1 border-t border-zinc-300">
              <span>เลขที่เคส: <strong className="font-mono text-zinc-950 text-xs">{caseData.case_number}</strong></span>
              <span>ระดับความรุนแรง: <strong className="text-red-700 font-bold">{caseData.triage_level?.toUpperCase()}</strong></span>
              <span>วัน-เวลารับแจ้ง: <strong>{formatThaiDateTime(caseData.created_at)}</strong></span>
            </div>
          </div>

          {/* 1. ข้อมูลผู้ป่วยและจุดเกิดเหตุ */}
          <div className="border border-zinc-400 rounded-md p-2 mb-2 bg-white">
            <div className="font-bold text-[11px] text-sky-900 border-b border-zinc-200 pb-0.5 mb-1 flex items-center justify-between">
              <span>1. ข้อมูลผู้ป่วย / ผู้ประสบเหตุ และสถานที่เกิดเหตุ</span>
              <span className="text-[9.5px] font-normal text-zinc-500">สิทธิ: {caseData.insurance_type || "UC"}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              <div className="col-span-2 truncate"><strong>ชื่อ-สกุล:</strong> {ptName}</div>
              <div><strong>HN/ID:</strong> {ptHn}</div>
              <div><strong>อายุ:</strong> {ptAge}</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              <div className="col-span-2"><strong>เลขบัตร ปชช.:</strong> {ptCid}</div>
              <div className="col-span-2"><strong>เบอร์โทร:</strong> {caseData.caller_phone || hospitalPt?.mobile_phone_number || "-"}</div>
            </div>
            <div className="mb-1 truncate">
              <strong>สถานที่เกิดเหตุ:</strong> {caseData.incident_address || "-"}
            </div>
            <div className="bg-zinc-50 border border-zinc-200 p-1.5 rounded text-[10px]">
              <strong>อาการสำคัญ (Chief Complaint):</strong> {caseData.chief_complaint || "ไม่มีบันทึกอาการสำคัญ"}
            </div>
          </div>

          {/* 2. ศูนย์สั่งการและทีมปฏิบัติการ */}
          <div className="border border-zinc-400 rounded-md p-2 mb-2 bg-white">
            <div className="font-bold text-[11px] text-indigo-900 border-b border-zinc-200 pb-0.5 mb-1">
              2. ศูนย์สั่งการและทีมปฏิบัติการฉุกเฉิน
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-1">
              <div><strong>รถพยาบาล:</strong> {vehicleObj ? vehicleObj.plate_number : "-"}</div>
              <div><strong>หัวหน้าชุด:</strong> {leaderName}</div>
              <div><strong>พลขับ:</strong> {driverName}</div>
            </div>
            <div className="mb-1 text-[10px] text-zinc-800 leading-normal">
              <strong>ผู้ร่วมปฏิบัติการ:</strong> {membersDisplay}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-dashed border-zinc-300 text-[9.5px] text-zinc-600">
              <div>เวลาสั่งการ: {dispatchInfo?.time_dispatched ? formatThaiDateTime(dispatchInfo.time_dispatched) : "-"}</div>
              <div>เวลาถึงจุดเกิดเหตุ: {dispatchInfo?.time_on_scene ? formatThaiDateTime(dispatchInfo.time_on_scene) : "-"}</div>
              <div>เวลาถึง รพ.: {dispatchInfo?.time_hospital ? formatThaiDateTime(dispatchInfo.time_hospital) : "-"}</div>
            </div>
          </div>

          {/* 3. สัญญาณชีพและการปฐมพยาบาล */}
          <div className="border border-zinc-400 rounded-md p-2 mb-2 bg-white">
            <div className="font-bold text-[11px] text-emerald-900 border-b border-zinc-200 pb-0.5 mb-1">
              3. สัญญาณชีพแรกรับและการปฐมพยาบาลเบื้องต้น
            </div>
            {treatment ? (
              <>
                <div className="grid grid-cols-6 gap-1 text-center mb-1.5">
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">BP</span>
                    <strong className="text-[10px]">{bpDisplay}</strong>
                  </div>
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">PR</span>
                    <strong className="text-[10px]">{treatment.pulse_rate || "-"} bpm</strong>
                  </div>
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">RR</span>
                    <strong className="text-[10px]">{treatment.respiratory_rate || "-"} /m</strong>
                  </div>
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">SpO2</span>
                    <strong className="text-[10px] text-emerald-800">{treatment.spo2 || "-"} %</strong>
                  </div>
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">Temp</span>
                    <strong className="text-[10px]">{treatment.temperature ? `${treatment.temperature}°C` : "-"}</strong>
                  </div>
                  <div className="border border-zinc-300 py-0.5 px-1 rounded bg-zinc-50">
                    <span className="text-[8.5px] text-zinc-500 block">DTX</span>
                    <strong className="text-[10px]">{treatment.dtx ? `${treatment.dtx}` : "-"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-1 p-1 bg-zinc-50 border border-zinc-200 rounded text-[10px]">
                  <div>ความรู้สึกตัว: <strong>{treatment.consciousness || "ไม่ระบุ"}</strong></div>
                  <div>GCS Score: <strong>{gcsTotal > 0 ? `${gcsTotal} คะแนน` : "-"}</strong></div>
                  <div>รูม่านตา (R/L): <strong>{treatment.pupil_right || "-"} / {treatment.pupil_left || "-"}</strong></div>
                </div>

                <div className="grid grid-cols-4 gap-1 border border-zinc-300 p-1 rounded mb-1 text-[9.5px]">
                  <div>ทางเดินหายใจ: <strong>{treatment.airway_management || "ไม่"}</strong></div>
                  <div>ห้ามเลือด/แผล: <strong>{treatment.wound_management || "ไม่"}</strong></div>
                  <div>ดามกระดูก: <strong>{treatment.splint_management || "ไม่"}</strong></div>
                  <div>CPR: <strong>{treatment.cpr_performed ? "มี" : "ไม่มี"}</strong></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10px]">
                  <div><strong>ผลลัพธ์การบริบาล:</strong> {treatment.initial_outcome || "คงเดิม/คงที่"}</div>
                  <div><strong>รพ. ปลายทางที่นำส่ง:</strong> {treatment.destination_hospital || "ไม่ได้ส่งต่อ"}</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-center py-1">ไม่มีบันทึกข้อมูลการรักษา</div>
            )}
          </div>
        </div>

        {/* ช่องลงนาม */}
        <div className="signature-box border-t border-zinc-400 pt-12 mt-10">
          <div className="grid grid-cols-2 gap-8 text-center text-[10.5px]">
            <div>
              <div className="mb-1">ลงชื่อ .............................................................. ผู้บันทึก</div>
              <div>( {driverName !== "-" ? driverName : ".............................................................."} )</div>
              <div className="text-[9.5px] text-zinc-500 mt-1">เจ้าหน้าที่ปฏิบัติการการแพทย์ฉุกเฉิน</div>
            </div>
            <div>
              <div className="mb-1">ลงชื่อ .............................................................. หัวหน้าชุด</div>
              <div>( {leaderName !== "-" ? leaderName : ".............................................................."} )</div>
              <div className="text-[9.5px] text-zinc-500 mt-1">หัวหน้าชุดปฏิบัติการฉุกเฉิน</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">กำลังเตรียมหน้าพิมพ์...</div>}>
      <PrintContent />
    </Suspense>
  );
}