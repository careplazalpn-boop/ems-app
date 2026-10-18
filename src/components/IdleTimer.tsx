"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export default function IdleTimer() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // ให้ทำงานเฉพาะเมื่อโหลดขึ้นบน Browser จริงแล้วเท่านั้น ป้องกันชนตอน Build
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!mounted) return;
    if (pathname === "/login") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, mounted]);

  return null;
}