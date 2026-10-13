import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

async function ensurePatientImage(hn: string): Promise<string | null> {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "patient");
    const filePath = path.join(uploadDir, `${hn}.webp`);

    if (fs.existsSync(filePath)) {
      return `/uploads/patient/${hn}.webp`;
    }

    const ptImg = await prisma.patient_image.findFirst({
      where: { hn: hn },
    });

    if (ptImg && ptImg.image) {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(filePath, Buffer.from(ptImg.image));
      return `/uploads/patient/${hn}.webp`;
    }
  } catch (err) {
    console.error("Error writing patient image:", err);
  }
  return null;
}

function cleanCoordinate(val: any): string | null {
  if (val === null || val === undefined || val === "") return null;
  const num = parseFloat(String(val).trim());
  if (isNaN(num) || num === 0) return null;
  return String(val).trim();
}

// ฟังก์ชันคำนวณอายุเต็มปีจากวันเกิด
function calculateAge(birthday: Date | string | null): number | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

async function formatHospitalPatient(pt: any) {
  await ensurePatientImage(pt.hn);

  // 1. ดึงสัญชาติ
  let nationalityName = "ไทย";
  if (pt.nationality) {
    const natCode = String(pt.nationality).trim();
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT CONVERT(name USING utf8mb4) AS name 
        FROM nationality 
        WHERE nationality = ${natCode} 
           OR nhso_code = ${natCode}
           OR nationality = LPAD(${natCode}, 3, '0')
        LIMIT 1
      `;
      if (result && result.length > 0 && result[0].name) {
        nationalityName = result[0].name.trim();
      }
    } catch (e) {
      console.error("Error reading nationality:", e);
    }
  }

  // 2. ดึงชื่อชุมชน / ตรวจสอบนอกเขต
  let villageName = "บุคคลนอกเขต";
  if (pt.chwpart && pt.amppart && pt.tmbpart && pt.moopart) {
    try {
      const chw = String(pt.chwpart).padStart(2, "0");
      const amp = String(pt.amppart).padStart(2, "0");
      const tmb = String(pt.tmbpart).padStart(2, "0");
      const moo = String(pt.moopart).padStart(2, "0");
      const villageCode = `${chw}${amp}${tmb}${moo}`;

      const vRecord: any[] = await prisma.$queryRaw`
        SELECT CONVERT(village_name USING utf8mb4) AS village_name 
        FROM village 
        WHERE village_code = ${villageCode} 
        LIMIT 1
      `;
      if (vRecord && vRecord.length > 0 && vRecord[0].village_name) {
        villageName = vRecord[0].village_name.trim();
      }
    } catch (vErr) {
      console.error("Error reading village:", vErr);
    }
  }

  // 3. ตรวจสอบสถานะเสียชีวิต
  const isDeceased =
    pt.death === "Y" ||
    pt.death === "1" ||
    Boolean(pt.death_date) ||
    Boolean(pt.deathday);

  // 4. เบอร์โทรศัพท์
  const phone =
    pt.mobile_phone_number?.trim() ||
    pt.hometel?.trim() ||
    pt.informtel?.trim() ||
    "";

  // 5. คำนวณอายุจาก birthday (ถ้าไม่มี ใช้อายุที่บันทึกไว้ใน pt.age_y)
  const calculatedAge = calculateAge(pt.birthday) ?? (pt.age_y ? parseInt(String(pt.age_y)) : null);

  // 6. ประกอบที่อยู่ patient.address_full (ถ้าไม่มีในฟิลด์ address_full ให้รวมที่อยู่อัตโนมัติ)
  const road = pt.road ? `ถ.${pt.road}`.trim() : "";
  const addressFull =
    pt.address_full?.trim() ||
    [
      pt.addrpart ? `บ้านเลขที่ ${pt.addrpart}` : "",
      pt.moopart ? `หมู่ ${pt.moopart}` : "",
      road,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  const lat = cleanCoordinate(pt.home_latitude);
  const lng = cleanCoordinate(pt.home_longitude);

  return {
    source: "HOSPITAL",
    hn: pt.hn,
    cid: pt.cid || "",
    pname: pt.pname || "",
    fname: pt.fname || "",
    lname: pt.lname || "",
    gender: pt.sex === "1" ? "male" : pt.sex === "2" ? "female" : "other",
    age: calculatedAge ? String(calculatedAge) : "",
    birthday: pt.birthday ? pt.birthday.toISOString().split("T")[0] : "",
    blood_group: pt.bloodgrp?.trim() || pt.bloodgroup?.trim() || "",
    road: pt.road?.trim() || "-",
    phone: phone,
    nationality: nationalityName,
    village_name: villageName,
    is_deceased: isDeceased,
    address: addressFull,
    insurance_type: pt.pttype || "",
    latitude: lat,
    longitude: lng,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hn = searchParams.get("hn")?.trim();
    const cid = searchParams.get("cid")?.trim();
    const query = searchParams.get("query")?.trim();

    if (hn) {
      const hospitalPt = await prisma.patient.findFirst({
        where: { hn: hn },
      });

      if (hospitalPt) {
        const formatted = await formatHospitalPatient(hospitalPt);
        return NextResponse.json({
          found: true,
          total: 1,
          hasMore: false,
          patients: [formatted],
          data: formatted,
          source: "HOSPITAL",
        });
      }

      return NextResponse.json({
        found: false,
        total: 0,
        hasMore: false,
        patients: [],
        message: "ไม่พบข้อมูลผู้ป่วย",
      });
    }

    if (cid && cid.length !== 13) {
      return NextResponse.json(
        { error: "การค้นหาด้วยเลขประจำตัวประชาชนต้องกรอกให้ครบ 13 หลักเท่านั้น" },
        { status: 400 }
      );
    }

    if (!cid && (!query || query.length < 2)) {
      return NextResponse.json(
        { error: "กรุณาระบุคำค้นหาชื่อ-สกุลอย่างน้อย 2 ตัวอักษร หรือระบุเลขบัตรประชาชนให้ครบ 13 หลัก" },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    if (cid && cid.length === 13) {
      whereClause = { cid: cid };
    } else if (query) {
      const terms = query.split(/\s+/).filter((t) => t.length > 0);
      whereClause = {
        AND: terms.map((term) => ({
          OR: [
            { fname: { contains: term } },
            { lname: { contains: term } },
          ],
        })),
      };
    }

    const totalCount = await prisma.patient.count({
      where: whereClause,
    });

    if (totalCount === 0) {
      if (cid && cid.length === 13) {
        const emsPt = await prisma.ems_patients.findFirst({
          where: { id_card_no: cid },
        });

        if (emsPt) {
          const emsFormatted = {
            source: "TEMPORARY",
            ems_patient_id: emsPt.id,
            cid: emsPt.id_card_no || "",
            passport_no: emsPt.passport_no || "",
            pname: emsPt.pname || "",
            fname: emsPt.fname,
            lname: emsPt.lname || "",
            gender: emsPt.gender || "male",
            age: emsPt.age ? String(emsPt.age) : "",
            blood_group: "",
            road: "-",
            phone: emsPt.phone || "",
            address: emsPt.address_full || "",
            village_name: "บุคคลนอกเขต",
            nationality: emsPt.nationality || "ไทย",
            latitude: null,
            longitude: null,
            is_deceased: false,
          };

          return NextResponse.json({
            found: true,
            total: 1,
            hasMore: false,
            patients: [emsFormatted],
            data: emsFormatted,
            source: "TEMPORARY",
          });
        }
      }

      return NextResponse.json({
        found: false,
        total: 0,
        hasMore: false,
        patients: [],
        message: "ไม่พบข้อมูลประวัติผู้ป่วย",
      });
    }

    const rawPatients = await prisma.patient.findMany({
      where: whereClause,
      take: 30,
      orderBy: { hn: "desc" },
    });

    const formattedList = await Promise.all(
      rawPatients.map((pt) => formatHospitalPatient(pt))
    );

    return NextResponse.json({
      found: true,
      total: totalCount,
      hasMore: totalCount > 30,
      patients: formattedList,
      data: formattedList.length === 1 ? formattedList[0] : undefined,
      source: formattedList.length === 1 ? "HOSPITAL" : undefined,
    });
  } catch (error: any) {
    console.error("Patient search error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ป่วย" },
      { status: 500 }
    );
  }
}