"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

// ตั้งเวลา Idle Timeout (เช่น 15 นาที = 15 * 60 * 1000 มิลลิวินาที)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export default function IdleTimer() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Auto logout error:", err);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    // หากอยู่ที่หน้า login ไม่ต้องเริ่มนับเวลา
    if (pathname === "/login") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // อีเวนต์ที่ถือว่าผู้ใช้ยังใช้งานระบบอยู่
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    // ผูก Event Listener ดักจับพฤติกรรม
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // เริ่มนับเวลาตั้งแต่เปิดหน้าเว็บ
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname]);

  return null;
}