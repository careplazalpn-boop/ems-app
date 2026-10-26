"use client";

import React, { forwardRef } from "react";

interface CasePdfTemplateProps {
  caseData: any;
  hospitalPt: any;
  dispatchInfo: any;
  treatment: any;
  formatThaiDateTime: (dateString: string) => string;
}

export const CasePdfTemplate = forwardRef<HTMLDivElement, CasePdfTemplateProps>(
  ({ caseData, hospitalPt, dispatchInfo, treatment, formatThaiDateTime }, ref) => {
    if (!caseData) return null;

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
    const leaderName = dispatchInfo?.leader_name || "-";
    const driverName = dispatchInfo?.driver_name || "-";
    const membersList = dispatchInfo?.members || [];

    const bpDisplay = treatment?.sbp || treatment?.dbp 
      ? `${treatment?.sbp || "-"}/${treatment?.dbp || "-"} mmHg` 
      : "-";

    const gcsTotal = (treatment?.gcs_e || 0) + (treatment?.gcs_v || 0) + (treatment?.gcs_m || 0);

    return (
      <div 
        style={{ 
          position: "absolute", 
          left: "-99999px", 
          top: 0,
          colorScheme: "light",
        }}
      >
        <div
          ref={ref}
          id="pdf-render-root"
          style={{
            width: "794px", // เทียบเท่าขนาด A4 ที่ 96 DPI
            minHeight: "1123px",
            backgroundColor: "#ffffff",
            color: "#111827",
            padding: "48px 56px",
            boxSizing: "border-box",
            fontFamily: "Tahoma, 'Noto Sans Thai', 'Segoe UI', Arial, sans-serif",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          {/* ส่วนหัวกระดาษแบบราชการ */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #111827", paddingBottom: "12px", marginBottom: "16px" }}>
            <img
              src="/images/logo-org.png"
              alt="Logo"
              style={{ width: "64px", height: "64px", objectFit: "contain", margin: "0 auto 8px", display: "block" }}
            />
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "2px" }}>
              รายงานการปฏิบัติงานการแพทย์ฉุกเฉิน
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#374151" }}>
              ศูนย์บริการสาธารณสุขเทศบาลเมืองลำพูน
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "#4b5563" }}>
              <span>เลขที่เคส: <strong style={{ color: "#111827", fontFamily: "monospace", fontSize: "13px" }}>{caseData.case_number}</strong></span>
              <span>ระดับความรุนแรง: <strong style={{ color: "#dc2626" }}>{caseData.triage_level?.toUpperCase()}</strong></span>
              <span>วัน-เวลารับแจ้ง: <strong>{formatThaiDateTime(caseData.created_at)}</strong></span>
            </div>
          </div>

          {/* 1. ข้อมูลผู้ป่วยและจุดเกิดเหตุ */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", color: "#0369a1" }}>
              1. ข้อมูลผู้ป่วย / ผู้ประสบเหตุ และสถานที่เกิดเหตุ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px", marginBottom: "6px" }}>
              <div><strong>ชื่อ-สกุล:</strong> {ptName}</div>
              <div><strong>HN/ID:</strong> {ptHn}</div>
              <div><strong>เลขบัตร ปชช.:</strong> {ptCid}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px", marginBottom: "6px" }}>
              <div><strong>อายุ:</strong> {ptAge}</div>
              <div><strong>สิทธิการรักษา:</strong> {caseData.insurance_type || "UC"}</div>
              <div><strong>เบอร์โทร:</strong> {caseData.caller_phone || hospitalPt?.mobile_phone_number || "-"}</div>
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong>สถานที่เกิดเหตุ:</strong> {caseData.incident_address || "-"}
            </div>
            <div style={{ backgroundColor: "#fef2f2", padding: "8px", borderRadius: "6px", border: "1px solid #fecaca", color: "#991b1b" }}>
              <strong>อาการสำคัญ (Chief Complaint):</strong> {caseData.chief_complaint || "ไม่มีบันทึกอาการสำคัญ"}
            </div>
          </div>

          {/* 2. การสั่งการและทีมปฏิบัติการ */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", color: "#4338ca" }}>
              2. ศูนย์สั่งการและทีมปฏิบัติการฉุกเฉิน
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "6px" }}>
              <div><strong>รถพยาบาล:</strong> {vehicleObj ? vehicleObj.plate_number : "-"}</div>
              <div><strong>หัวหน้าชุด:</strong> {leaderName}</div>
              <div><strong>พลขับ:</strong> {driverName}</div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>ผู้ร่วมปฏิบัติการ:</strong> {membersList.length > 0 ? membersList.map((m: any) => m.name).join(", ") : "-"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "11px", color: "#4b5563", borderTop: "1px dashed #e5e7eb", paddingTop: "8px" }}>
              <div>เวลาสั่งการ: <strong>{dispatchInfo?.time_dispatched ? formatThaiDateTime(dispatchInfo.time_dispatched) : "-"}</strong></div>
              <div>เวลาถึงที่เกิดเหตุ: <strong>{dispatchInfo?.time_on_scene ? formatThaiDateTime(dispatchInfo.time_on_scene) : "-"}</strong></div>
              <div>เวลาถึง รพ.: <strong>{dispatchInfo?.time_hospital ? formatThaiDateTime(dispatchInfo.time_hospital) : "-"}</strong></div>
            </div>
          </div>

          {/* 3. สัญญาณชีพและการปฐมพยาบาล */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "12px", marginBottom: "24px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", color: "#047857" }}>
              3. สัญญาณชีพแรกรับและการปฐมพยาบาลเบื้องต้น
            </div>
            {treatment ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", textAlign: "center", marginBottom: "10px" }}>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>ความดัน (BP)</div>
                    <strong style={{ fontSize: "12px" }}>{bpDisplay}</strong>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>ชีพจร (PR)</div>
                    <strong style={{ fontSize: "12px" }}>{treatment.pulse_rate || "-"} bpm</strong>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>การหายใจ (RR)</div>
                    <strong style={{ fontSize: "12px" }}>{treatment.respiratory_rate || "-"} /m</strong>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>ออกซิเจน (SpO2)</div>
                    <strong style={{ color: "#047857", fontSize: "12px" }}>{treatment.spo2 || "-"} %</strong>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>อุณหภูมิ</div>
                    <strong style={{ fontSize: "12px" }}>{treatment.temperature ? `${treatment.temperature}°C` : "-"}</strong>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", padding: "6px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>น้ำตาล (DTX)</div>
                    <strong style={{ fontSize: "12px" }}>{treatment.dtx ? `${treatment.dtx}` : "-"}</strong>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px", backgroundColor: "#f9fafb", padding: "8px", borderRadius: "6px" }}>
                  <div>ระดับความรู้สึกตัว: <strong>{treatment.consciousness || "ไม่ระบุ"}</strong></div>
                  <div>GCS Score: <strong>{gcsTotal > 0 ? `${gcsTotal} คะแนน` : "-"}</strong></div>
                  <div>รูม่านตา (R/L): <strong>{treatment.pupil_right || "-"} / {treatment.pupil_left || "-"}</strong></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", border: "1px solid #e5e7eb", padding: "8px", borderRadius: "6px", marginBottom: "8px" }}>
                  <div>ทางเดินหายใจ: <strong>{treatment.airway_management || "ไม่"}</strong></div>
                  <div>ห้ามเลือด/แผล: <strong>{treatment.wound_management || "ไม่"}</strong></div>
                  <div>ดามกระดูก: <strong>{treatment.splint_management || "ไม่"}</strong></div>
                  <div>CPR: <strong>{treatment.cpr_performed ? "มี" : "ไม่มี"}</strong></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingTop: "4px" }}>
                  <div>ผลลัพธ์การบริบาล: <strong>{treatment.initial_outcome || "คงเดิม/คงที่"}</strong></div>
                  <div>รพ. ปลายทางที่นำส่ง: <strong>{treatment.destination_hospital || "ไม่ได้ส่งต่อ"}</strong></div>
                </div>
              </>
            ) : (
              <div style={{ color: "#6b7280", textAlign: "center", padding: "12px" }}>ไม่มีบันทึกข้อมูลการรักษา</div>
            )}
          </div>

          {/* ช่องลงนามท้ายรายงาน */}
          <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", textAlign: "center" }}>
            <div>
              <div style={{ marginBottom: "50px" }}>ลงชื่อ .............................................................. ผู้บันทึก</div>
              <div>( {driverName !== "-" ? driverName : ".............................................................."} )</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>เจ้าหน้าที่ปฏิบัติการการแพทย์ฉุกเฉิน</div>
            </div>
            <div>
              <div style={{ marginBottom: "50px" }}>ลงชื่อ .............................................................. หัวหน้าชุด</div>
              <div>( {leaderName !== "-" ? leaderName : ".............................................................."} )</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>หัวหน้าชุดปฏิบัติการฉุกเฉิน (ผู้รับรอง)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CasePdfTemplate.displayName = "CasePdfTemplate";