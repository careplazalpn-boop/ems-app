"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Navigation2, 
  WifiOff, 
  Ambulance, 
  Layers, 
  Clock, 
  AlertCircle,
  RotateCcw,
  Globe,
  Map as MapIcon
} from "lucide-react";

export default function TrackingPage() {
  // พิกัดศูนย์กลางเทศบาลเมืองลำพูน
  const defaultLat = 18.5772;
  const defaultLng = 99.0087;

  // State สำหรับจัดการเลเยอร์แผนที่ (standard = ถนนทั่วไป, satellite = ภูมิศาสตร์/ดาวเทียม)
  const [mapMode, setMapMode] = useState<"standard" | "satellite">("standard");
  
  // State Key สำหรับสั่ง Re-render รีเซ็ต iframe แผนที่กลับมาจุดเริ่มต้น
  const [mapKey, setMapKey] = useState<number>(0);

  // ฟังก์ชันรีเซ็ตตำแหน่งแผนที่กลับมายังศูนย์กลางเทศบาลเมืองลำพูน
  const handleResetMap = () => {
    setMapKey((prev) => prev + 1);
  };

  const standbyVehicles = [
    { id: 1, code: "EMS-01", plate: "กข 1234 ลำพูน", type: "ALS (Advance)", status: "waiting_gps" },
    { id: 2, code: "EMS-02", plate: "นข 9999 ลำพูน", type: "BLS (Basic)", status: "waiting_gps" },
  ];

  // URL แหล่งแผนที่ตามโหมดที่เลือก
  const standardMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng - 0.05}%2C${defaultLat - 0.03}%2C${defaultLng + 0.05}%2C${defaultLat + 0.03}&layer=mapnik&marker=${defaultLat}%2C${defaultLng}`;
  
  // โหมดภูมิศาสตร์/ภาพถ่ายดาวเทียมผ่าน OpenStreetMap cycle/topo หรือ ESRI imagery
  const satelliteMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng - 0.05}%2C${defaultLat - 0.03}%2C${defaultLng + 0.05}%2C${defaultLat + 0.03}&layer=cyclemap&marker=${defaultLat}%2C${defaultLng}`;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
        
        {/* แถบหัวเรื่องมาตรฐานระบบ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-200">
                <Navigation2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                  ระบบติดตามพิกัดรถฉุกเฉินแบบเรียลไทม์ (Live Tracking)
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  ศูนย์บริการสาธารณสุข เทศบาลเมืองลำพูน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            อยู่ระหว่างเชื่อมต่อสัญญาณดาวเทียม GPS
          </div>
        </div>

        {/* แถบแจ้งเตือนสถานะการพัฒนา */}
        <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-zinc-900">
              ฟังก์ชันนี้อยู่ระหว่างการเชื่อมต่ออุปกรณ์ GPS Hardware ประจำรถปฏิบัติการ
            </h4>
            <p className="text-xs text-zinc-600 mt-0.5">
              สามารถสลับมุมมองแผนที่แบบภูมิศาสตร์ หรือกดปุ่มรีเซ็ตเพื่อกลับมาศูนย์กลางเทศบาลเมืองลำพูนได้ตลอดเวลา
            </p>
          </div>
        </div>

        {/* ส่วนแสดงแผนที่ และ แถบสถานะรถด้านข้าง */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 1. แผนที่จำลอง (Interactive Map Viewer) */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col min-h-[580px] relative">
            
            {/* แถบเครื่องมือควบคุมแผนที่ด้านบน */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                <Layers className="h-4 w-4 text-orange-600" />
                <span>พื้นที่ปฏิบัติการ: ศูนย์เทศบาลเมืองลำพูน ({defaultLat.toFixed(4)}, {defaultLng.toFixed(4)})</span>
              </div>

              {/* ปุ่มสลับโหมดและรีเซ็ต */}
              <div className="flex items-center gap-2">
                {/* สลับมุมมองแผนที่ */}
                <div className="flex items-center bg-zinc-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMapMode("standard")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      mapMode === "standard" 
                        ? "bg-white text-zinc-900 shadow-xs" 
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    แผนที่ถนน
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode("satellite")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      mapMode === "satellite" 
                        ? "bg-white text-zinc-900 shadow-xs" 
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    ภูมิศาสตร์ / ดาวเทียม
                  </button>
                </div>

                {/* ปุ่มรีเซ็ตพิกัดกลับสู่ค่าเริ่มต้น */}
                <button
                  type="button"
                  onClick={handleResetMap}
                  title="รีเซ็ตตำแหน่งแผนที่กลับมาศูนย์กลาง"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-all shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>รีเซ็ตพิกัด</span>
                </button>
              </div>
            </div>

            {/* หน้าจอแผนที่ */}
            <div className="relative flex-1 w-full h-full min-h-[500px]">
              <iframe
                key={`${mapMode}-${mapKey}`}
                title="Lamphun Interactive Map"
                className="w-full h-full border-0 absolute inset-0"
                src={mapMode === "standard" ? standardMapUrl : satelliteMapUrl}
              />

              {/* ป้ายเตือนสถานะ Telemetry ลอยบนแผนที่ */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-200/80 shadow-lg flex items-center gap-2 pointer-events-none">
                <WifiOff className="h-4 w-4 text-amber-500 animate-bounce" />
                <span className="text-xs font-bold text-zinc-800">
                  กำลังรอสัญญาณ Telemetry จากรถ...
                </span>
              </div>
            </div>
          </div>

          {/* 2. รายชื่อรถที่รอผูกสัญญาณ */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Ambulance className="h-4 w-4 text-orange-600" />
                  รถประจำการในระบบ
                </h3>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {standbyVehicles.length} คัน
                </span>
              </div>

              <div className="space-y-3">
                {standbyVehicles.map((v) => (
                  <div 
                    key={v.id} 
                    className="p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-orange-50/30 hover:border-orange-200 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-900">{v.code}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                        รออุปกรณ์ GPS
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-700">
                      {v.plate}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/40">
                      <span>{v.type}</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="h-3 w-3" /> ออฟไลน์
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
                💡 เมื่อติดตั้งกล่อง GPS Tracker บนตัวรถเรียบร้อย ระบบจะแสดงตำแหน่ง หมุดเคลื่อนที่ และความเร็วรถบนแผนที่โดยอัตโนมัติ
              </div>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}