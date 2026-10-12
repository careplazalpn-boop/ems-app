"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, RotateCcw } from "lucide-react";

// ตั้งค่าไอคอนหมุด
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapEditorProps {
  lat: number | null;
  lng: number | null;
  isEditing: boolean;
  onChange: (lat: number, lng: number) => void;
}

export default function PatientMapEditor({
  lat,
  lng,
  isEditing,
  onChange,
}: MapEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // เก็บค่าพิกัดตั้งต้น (Original Coordinates) ไว้ใช้รีเซ็ต
  const initialCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: lat || 18.5772,
    lng: lng || 99.0087,
  });

  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const startLat = initialCoordsRef.current.lat;
    const startLng = initialCoordsRef.current.lng;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        [startLat, startLng],
        lat && lng ? 17 : 14
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], {
        icon: markerIcon,
        draggable: isEditing,
      }).addTo(map);

      // Event: ลากหมุดเสร็จแล้วอัปเดตพิกัด
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChange(Number(pos.lat.toFixed(8)), Number(pos.lng.toFixed(8)));
      });

      // Event: คลิกบนแผนที่เพื่อย้ายหมุดในโหมดแก้ไข
      map.on("click", (e) => {
        if (isEditing) {
          marker.setLatLng(e.latlng);
          onChange(Number(e.latlng.lat.toFixed(8)), Number(e.latlng.lng.toFixed(8)));
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // ซิงค์ตำแหน่งและการเปิด/ปิดโหมดลากหมุด
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      if (isEditing) {
        markerRef.current.dragging?.enable();
      } else {
        markerRef.current.dragging?.disable();
      }

      if (lat && lng) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [lat, lng, isEditing]);

  // ฟังก์ชันรีเซ็ตกลับค่าเดิม (Reset to Initial Coords)
  const handleResetToOriginal = () => {
    const origLat = initialCoordsRef.current.lat;
    const origLng = initialCoordsRef.current.lng;

    onChange(origLat, origLng);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([origLat, origLng]);
      mapInstanceRef.current.flyTo([origLat, origLng], 17, {
        duration: 1.0,
      });
    }
  };

  // ฟังก์ชันดึงพิกัด GPS ปัจจุบัน
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(8));
        const newLng = Number(pos.coords.longitude.toFixed(8));

        onChange(newLat, newLng);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.flyTo([newLat, newLng], 17, {
            duration: 1.2,
          });
        }

        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        let msg = "ไม่สามารถระบุพิกัดได้";
        if (err.code === 1) {
          msg = "กรุณาอนุญาต (Allow) การเข้าถึงสิทธิ์ Location บนเบราว์เซอร์";
        } else if (err.code === 2) {
          msg = "ไม่พบสัญญาณดาวเทียมหรือพิกัดตำแหน่ง";
        } else if (err.code === 3) {
          msg = "หมดเวลาการค้นหาพิกัด GPS";
        }
        alert(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-zinc-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* แถบคำแนะนำด้านบน */}
      {isEditing && (
        <div className="absolute top-3 left-3 z-[1000] bg-black/75 text-white text-xs px-3 py-1.5 rounded-xl shadow-md pointer-events-none backdrop-blur-xs flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>คลิกบนแผนที่ หรือคลิกลากหมุดเพื่อปรับตำแหน่ง</span>
        </div>
      )}

      {/* กลุ่มปุ่มควบคุมมุมมองแผนที่ (มุมขวาล่าง) */}
      <div className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2">
        {/* ปุ่มรีเซ็ตกลับค่าเดิม (แสดงทั้งตอนดูและตอนแก้ไข) */}
        <button
          type="button"
          onClick={handleResetToOriginal}
          className="bg-white hover:bg-zinc-100 text-zinc-700 font-medium text-xs px-3 py-2.5 rounded-xl shadow-lg border border-zinc-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          title="เลื่อนแผนที่และคืนค่าหมุดกลับตำแหน่งเดิม"
        >
          <RotateCcw className="h-3.5 w-3.5 text-zinc-600" />
          <span>รีเซ็ตค่าเดิม</span>
        </button>

        {/* ปุ่มดึงพิกัด GPS (แสดงเฉพาะโหมดแก้ไข) */}
        {isEditing && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={gettingLocation}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="ดึงตำแหน่ง GPS ปัจจุบันของอุปกรณ์"
          >
            {gettingLocation ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            <span>{gettingLocation ? "กำลังค้นหา..." : "พิกัดปัจจุบัน"}</span>
          </button>
        )}
      </div>
    </div>
  );
}