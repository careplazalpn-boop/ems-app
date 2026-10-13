"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Loader2,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Mountain,
  RotateCcw,
  Satellite,
} from "lucide-react";

interface MapEditorProps {
  lat: number | null;
  lng: number | null;
  isEditing: boolean;
  onChange: (lat: number, lng: number) => void;
}

/* -------------------------------------------------------------------------- */
/*  รูปแบบแผนที่ — ใช้งานฟรีทั้งหมด ไม่ต้องมี API key / บัญชี / บัตรเครดิต         */
/*  เพิ่มรูปแบบใหม่ได้โดยเพิ่ม object ในอาร์เรย์ LAYERS                         */
/* -------------------------------------------------------------------------- */
type LayerId = "street" | "terrain" | "satellite";

interface TileSource {
  url: string;
  attribution: string;
  maxNativeZoom: number;
  subdomains?: string;
}

const LAYERS: {
  id: LayerId;
  label: string;
  icon: typeof MapIcon;
  tiles: TileSource[];
}[] = [
  {
    id: "street",
    label: "ถนน",
    icon: MapIcon,
    tiles: [
      {
        // ค่าเดิมของระบบ (OpenStreetMap)
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxNativeZoom: 19,
      },
    ],
  },
  {
    id: "terrain",
    label: "ภูมิประเทศ",
    icon: Mountain,
    tiles: [
      {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        maxNativeZoom: 17,
      },
    ],
  },
  {
    id: "satellite",
    label: "ดาวเทียม",
    icon: Satellite,
    tiles: [
      {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxNativeZoom: 18,
      },
      // ชั้นชื่อถนน/สถานที่ซ้อนทับบนภาพถ่ายดาวเทียม
      {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        attribution: "",
        maxNativeZoom: 18,
      },
    ],
  },
];

const MAP_MAX_ZOOM = 19;
const LAYER_STORAGE_KEY = "patient-map-layer";

export default function PatientMapEditor({
  lat,
  lng,
  isEditing,
  onChange,
}: MapEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const tileLayersRef = useRef<any[]>([]);

  const initialCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: lat || 18.5772,
    lng: lng || 99.0087,
  });

  // เก็บค่าล่าสุดไว้ใน ref เพื่อให้ event handler ของ Leaflet (ผูกครั้งเดียวตอนสร้างแผนที่)
  // เห็นค่า isEditing / onChange ปัจจุบันเสมอ ไม่ใช่ค่าตอน mount
  const isEditingRef = useRef(isEditing);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    isEditingRef.current = isEditing;
    onChangeRef.current = onChange;
  });

  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [layerId, setLayerId] = useState<LayerId>("street");

  /* ------------------------------ สร้างแผนที่ ------------------------------ */
  useEffect(() => {
    // ป้องกันการรันบน Server ตอน Build
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    // นำเข้า Leaflet แบบ Dynamic ฝั่ง Client เท่านั้น
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      leafletRef.current = L;

      const markerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const startLat = initialCoordsRef.current.lat;
      const startLng = initialCoordsRef.current.lng;

      if (!mapInstanceRef.current) {
        // ปิดปุ่มซูมเดิมที่มุมซ้ายบน (ซ้อนกับแถบเลือกแผนที่) แล้วย้ายไปมุมซ้ายล่าง
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(
          [startLat, startLng],
          lat && lng ? 17 : 14
        );
        L.control.zoom({ position: "bottomleft" }).addTo(map);

        // Tile layer ถูกเพิ่มโดย effect ด้านล่าง (ตามรูปแบบแผนที่ที่เลือก)

        const marker = L.marker([startLat, startLng], {
          icon: markerIcon,
          draggable: isEditingRef.current,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current(Number(pos.lat.toFixed(8)), Number(pos.lng.toFixed(8)));
        });

        map.on("click", (e: any) => {
          if (isEditingRef.current) {
            marker.setLatLng(e.latlng);
            onChangeRef.current(
              Number(e.latlng.lat.toFixed(8)),
              Number(e.latlng.lng.toFixed(8))
            );
          }
        });

        // ขนาดกล่องเปลี่ยน (ขยาย/ย่อ/หมุนจอ) → ให้ Leaflet คำนวณใหม่ ไม่ให้แผนที่เทา/เพี้ยน
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(mapContainerRef.current);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      }
    });

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayersRef.current = [];
      }
    };
  }, []);

  /* --------------------------- รูปแบบแผนที่ (Layer) --------------------------- */
  // จำรูปแบบที่ผู้ใช้เลือกไว้ในเครื่อง
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYER_STORAGE_KEY);
      if (saved && LAYERS.some((l) => l.id === saved)) setLayerId(saved as LayerId);
    } catch {
      /* ไม่มี localStorage ก็ใช้ค่าเริ่มต้น */
    }
  }, []);

  const selectLayer = (id: LayerId) => {
    setLayerId(id);
    try {
      localStorage.setItem(LAYER_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const applyBaseLayer = useCallback((id: LayerId) => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    tileLayersRef.current.forEach((layer) => map.removeLayer(layer));

    const def = LAYERS.find((l) => l.id === id) ?? LAYERS[0];
    tileLayersRef.current = def.tiles.map((tile) =>
      L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: MAP_MAX_ZOOM,
        maxNativeZoom: tile.maxNativeZoom,
        subdomains: tile.subdomains ?? "abc",
      }).addTo(map)
    );
  }, []);

  useEffect(() => {
    if (mapReady) applyBaseLayer(layerId);
  }, [mapReady, layerId, applyBaseLayer]);

  /* ------------------------------ ขยาย / ย่อ ------------------------------ */
  // กด Esc เพื่อย่อแผนที่กลับ
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  /* --------------------- ซิงค์โหมดแก้ไขและการย้ายพิกัด --------------------- */
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      if (isEditing) {
        markerRef.current.dragging?.enable();
      } else {
        markerRef.current.dragging?.disable();
      }

      if (lat && lng) {
        markerRef.current.setLatLng([lat, lng]);

        // พิกัดเปลี่ยนจากช่องกรอก Lat/Lng แล้วหมุดหลุดจอ → เลื่อนแผนที่ตามให้เห็นหมุด
        const map = mapInstanceRef.current;
        if (!map.getBounds().contains([lat, lng])) {
          map.panTo([lat, lng]);
        }
      }
    }
  }, [lat, lng, isEditing, mapReady]);

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
        alert("ไม่สามารถระบุพิกัดได้: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // เว้นระยะจาก notch / แถบระบบบนมือถือเมื่อขยายเต็มจอ
  const safeTop = expanded ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-3";
  const safeBottom = expanded
    ? "bottom-[max(1rem,env(safe-area-inset-bottom))]"
    : "bottom-4";

  return (
    <div
      className={`relative isolate w-full overflow-hidden border-zinc-200 bg-zinc-100 ${
        expanded
          ? "fixed inset-0 z-[100] h-dvh rounded-none border-0"
          : "h-[360px] rounded-2xl border"
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* มุมซ้ายบน: เลือกรูปแบบแผนที่ + คำแนะนำโหมดปักหมุด */}
      <div
        className={`absolute left-3 ${safeTop} z-[1000] flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-2`}
      >
        <div
          role="radiogroup"
          aria-label="รูปแบบแผนที่"
          className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/95 p-1 shadow-md ring-1 ring-zinc-900/10 backdrop-blur-xs"
        >
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const active = layer.id === layerId;
            return (
              <button
                key={layer.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectLayer(layer.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500 ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {layer.label}
              </button>
            );
          })}
        </div>

        {isEditing && (
          <div className="bg-black/75 text-white text-xs px-3 py-1.5 rounded-xl shadow-md pointer-events-none backdrop-blur-xs flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <span>คลิกบนแผนที่ หรือคลิกลากหมุดเพื่อปรับตำแหน่ง</span>
          </div>
        )}

        {expanded && lat && lng && (
          <div className="pointer-events-none rounded-lg bg-white/95 px-2.5 py-1 font-mono text-[11px] text-zinc-700 shadow-md ring-1 ring-zinc-900/10">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        )}
      </div>

      {/* มุมขวาบน: ปุ่มขยาย / ย่อแผนที่ */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-pressed={expanded}
        aria-label={expanded ? "ย่อแผนที่" : "ขยายแผนที่เต็มจอ"}
        title={expanded ? "ย่อแผนที่ (Esc)" : "ขยายแผนที่เต็มจอ"}
        className={`absolute right-3 ${safeTop} z-[1000] inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/95 text-zinc-700 shadow-md ring-1 ring-zinc-900/10 backdrop-blur-xs transition-colors hover:bg-white hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500 ${
          expanded ? "px-3 text-xs font-semibold" : "w-10"
        }`}
      >
        {expanded ? (
          <>
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">ย่อแผนที่</span>
          </>
        ) : (
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* มุมขวาล่าง: ปุ่มเดิม (รีเซ็ต / พิกัดปัจจุบัน) */}
      <div className={`absolute ${safeBottom} right-4 z-[1000] flex items-center gap-2`}>
        <button
          type="button"
          onClick={handleResetToOriginal}
          className="bg-white hover:bg-zinc-100 text-zinc-700 font-medium text-xs px-3 py-2.5 rounded-xl shadow-lg border border-zinc-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          title="เลื่อนแผนที่และคืนค่าหมุดกลับตำแหน่งเดิม"
        >
          <RotateCcw className="h-3.5 w-3.5 text-zinc-600" />
          <span>รีเซ็ตค่าเดิม</span>
        </button>

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
