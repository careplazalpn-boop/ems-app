export default function TrackingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
        GPS
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-2">
        ระบบติดตามพิกัดรถฉุกเฉิน (Tracking)
      </h1>
      <p className="text-slate-500 text-sm max-w-sm">
        ฟังก์ชันนี้อยู่ระหว่างการพัฒนาและเชื่อมต่อสัญญาณ GPS ประจำรถปฏิบัติการ
      </p>
    </div>
  );
}
