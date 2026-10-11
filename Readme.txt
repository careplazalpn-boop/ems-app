โครงสร้างหน้าเว็บ
ms-app/
├── prisma/
│   └── schema.prisma              # โมเดลฐานข้อมูล (ตาราง Users, Patients, Dispatches ฯลฯ)
├── src/
│   ├── app/                       # โครงสร้างหน้าเว็บ (App Router)
│   │   ├── (auth)/                # กลุ่มหน้าที่ไม่ต้องมี Header/Sidebar ทั่วไป
│   │   │   └── login/
│   │   │       └── page.tsx       # หน้า Login
│   │   ├── (dashboard)/           # กลุ่มหน้าหลักของระบบ (ครอบด้วย Layout เดียวกัน)
│   │   │   ├── layout.tsx         # Layout แม่แบบ: ใส่ Header, Sidebar, Footer ที่นี่ (แก้จุดเดียว)
│   │   │   ├── page.tsx           # หน้าหลัก (Dashboard สรุปสถิติ/เคสวันนี้)
│   │   │   ├── cases/             # จัดการเคสฉุกเฉิน
│   │   │   │   ├── page.tsx       # หน้ารายการเคสทั้งหมด
│   │   │   │   └── new/           # หน้าบันทึกรับแจ้งเหตุใหม่
│   │   │   │       └── page.tsx
│   │   │   ├── tracking/          # หน้านำทาง/ดูพิกัดแผนที่ Real-time
│   │   │   │   └── page.tsx
│   │   │   └── reports/           # หน้ารายงานสรุปผล
│   │   │       └── page.tsx
│   │   ├── api/                   # ฝั่ง Backend API
│   │   │   ├── auth/              # API Login / Logout
│   │   │   └── cases/             # API บันทึก/ดึงข้อมูลเคส
│   │   ├── globals.css            # สไตล์ CSS และการตั้งค่าสี shadcn/ui
│   │   └── layout.tsx             # Root layout หลักของทั้งระบบ
│   ├── components/                # ที่เก็บชิ้นส่วน UI ที่นำกลับมาใช้ซ้ำ
│   │   ├── layout/                # ชิ้นส่วน Template (แก้ที่นี่มีผลทั้งเว็บ)
│   │   │   ├── header.tsx         # แถบด้านบน (แสดงชื่อระบบ, ผู้ใช้งานปัจจุบัน)
│   │   │   ├── sidebar.tsx        # แถบเมนูด้านข้าง (ลิงก์ไปหน้าต่างๆ)
│   │   │   └── footer.tsx         # ส่วนท้ายเว็บ
│   │   ├── map/                   # คอมโพเนนต์แผนที่ Leaflet
│   │   │   └── map-view.tsx
│   │   └── ui/                    # คอมโพเนนต์จาก shadcn/ui (button, card, input ฯลฯ)
│   ├── lib/
│   │   ├── db.ts                  # ไฟล์เชื่อมต่อ Prisma เข้ากับ MariaDB (ใช้ไฟล์เดียวทั่วระบบ)
│   │   └── utils.ts               # ฟังก์ชันตัวช่วยทั่วไป
│   └── types/                     # กำหนดชนิดข้อมูล TypeScript
├── .env                           # เก็บ Connection string ของ MariaDB และ Key ลับ
└── package.json