import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "patient");
const SEARCH_LIMIT = 100; // 🌟 กำหนด Limit สูงสุดที่แนะนำ

async function ensurePatientImage(hn: string): Promise<string> {
  const cleanHn = hn.trim();
  const filePath = path.join(UPLOAD_DIR, `${cleanHn}.webp`);
  const publicUrl = `/uploads/patient/${cleanHn}.webp?v=${cleanHn}`;

  if (fs.existsSync(filePath)) {
    return publicUrl;
  }

  try {
    const patientImgRecord = await (prisma as any).patient_image?.findFirst({
      where: {
        OR: [
          { hn: cleanHn },
          { hn: cleanHn.padStart(9, "0") },
          { hn: cleanHn.padStart(7, "0") },
          { hn: String(parseInt(cleanHn, 10)) },
        ],
      },
    }).catch(() => null);

    const imageBuffer = patientImgRecord?.image || patientImgRecord?.img || null;

    if (imageBuffer && Buffer.isBuffer(imageBuffer)) {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      fs.writeFileSync(filePath, imageBuffer);
      return publicUrl;
    }
  } catch (err) {
    console.error(`Error generating image for HN ${cleanHn}:`, err);
  }

  return publicUrl;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const cid = searchParams.get("cid")?.trim() || "";
    const hn = searchParams.get("hn")?.trim() || "";
    const moo = searchParams.get("moo")?.trim() || "all";

    const locationCondition: any = {};
    if (moo && moo !== "all") {
      const cleanMoo = String(parseInt(moo, 10));
      const paddedMoo = cleanMoo.padStart(2, "0");

      locationCondition.moopart = { in: [cleanMoo, paddedMoo] };
      locationCondition.tmbpart = "01";
      locationCondition.amppart = "01";
      locationCondition.chwpart = "51";
    }

    const searchConditions: any[] = [];

    if (hn) {
      searchConditions.push({
        OR: [
          { hn: hn },
          { hn: hn.padStart(9, "0") },
          { hn: hn.padStart(7, "0") },
          { hn: String(parseInt(hn, 10)) },
        ],
      });
    }

    if (cid) {
      searchConditions.push({ cid: cid });
    }

    if (query) {
      const parts = query.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        searchConditions.push({
          AND: [
            { fname: { contains: parts[0] } },
            { lname: { contains: parts[1] } },
          ],
        });
      } else {
        searchConditions.push({
          OR: [
            { fname: { contains: query } },
            { lname: { contains: query } },
            { hn: { contains: query } },
            { cid: { contains: query } },
          ],
        });
      }
    }

    const where: any = {
      ...locationCondition,
    };

    if (searchConditions.length > 0) {
      where.AND = searchConditions;
    }

    // 🌟 นับจำนวนรวมจริงใน DB (totalCount) พร้อมดึงข้อมูลจำกัดตาม SEARCH_LIMIT
    const [totalCount, patients, villages] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        take: SEARCH_LIMIT,
        select: {
          hn: true,
          cid: true,
          pname: true,
          fname: true,
          lname: true,
          sex: true,
          birthday: true,
          moopart: true,
          road: true,
          addrpart: true,
          address_full: true,
          mobile_phone_number: true,
          hometel: true,
          death: true,
          pttype: true,
          home_latitude: true,
          home_longitude: true,
        },
        orderBy: {
          hn: "desc",
        },
      }),
      prisma.village.findMany({
        select: {
          village_moo: true,
          village_name: true,
        },
      }).catch(() => []),
    ]);

    const villageMap = new Map<string, string>();
    villages.forEach((v: any) => {
      if (v.village_moo !== null && v.village_moo !== undefined) {
        const vMoo = String(v.village_moo).trim();
        villageMap.set(vMoo, v.village_name);
        villageMap.set(String(parseInt(vMoo, 10)), v.village_name);
      }
    });

    const formattedPatients = await Promise.all(
      patients.map(async (pt) => {
        const ptMoo = pt.moopart ? pt.moopart.trim() : "";
        const villageName =
          villageMap.get(ptMoo) ||
          villageMap.get(String(parseInt(ptMoo, 10))) ||
          (ptMoo ? `หมู่ที่ ${ptMoo}` : "บุคคลนอกเขต");

        let age = null;
        if (pt.birthday) {
          const birthDate = new Date(pt.birthday);
          const ageDifMs = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDifMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        const lat = pt.home_latitude ? parseFloat(String(pt.home_latitude)) : null;
        const lng = pt.home_longitude ? parseFloat(String(pt.home_longitude)) : null;
        const imageUrl = await ensurePatientImage(pt.hn);

        return {
          source: "HOSPITAL",
          hn: pt.hn,
          cid: pt.cid || "",
          pname: pt.pname || "",
          fname: pt.fname || "",
          lname: pt.lname || "",
          gender: pt.sex || "1",
          age: age,
          phone: pt.mobile_phone_number || pt.hometel || "",
          road: pt.road || "",
          village_name: villageName,
          address:
            pt.address_full?.trim() ||
            `${pt.addrpart ? `${pt.addrpart} ` : ""}${pt.moopart ? `ม.${pt.moopart} ` : ""}${pt.road ? `ถ.${pt.road} ` : ""}ต.ในเมือง อ.เมืองลำพูน`,
          is_deceased: pt.death === "Y",
          insurance_type: pt.pttype || "UC",
          latitude: !isNaN(lat as number) ? lat : null,
          longitude: !isNaN(lng as number) ? lng : null,
          imageUrl: imageUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      found: formattedPatients.length > 0,
      total: totalCount, // 🌟 จำนวนทั้งหมดที่ค้นพบในฐานข้อมูลจริง
      displayed: formattedPatients.length, // จำนวนที่ตัดมาแสดง
      limit: SEARCH_LIMIT, // เพดาน Limit
      isExceeded: totalCount > SEARCH_LIMIT, // แฟล็กบอกว่าเกิน Limit หรือไม่
      patients: formattedPatients,
    });
  } catch (error: any) {
    console.error("Patient search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "เกิดข้อผิดพลาดในการค้นหาผู้ป่วย",
      },
      { status: 500 }
    );
  }
}