"use client";

import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  User, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Lock, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileData {
  user_id: number;
  fullname: string;
  username: string;
  role: string;
  phone: string | null;
  avatars: string | null;
  created_at: string | null;
  avatarUrl: string;
}

interface ImageItem {
  id: number;
  url: string;
  isSelected: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // โหมดแก้ไขข้อมูลทั่วไป
  const [isEditing, setIsEditing] = useState(false);
  const [editFullname, setEditFullname] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // กล่องเปลี่ยนรหัสผ่าน
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // การแจ้งเตือน
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดข้อมูลโปรไฟล์ & คลังรูปภาพ
  const fetchAll = async () => {
    try {
      const [resProfile, resImages] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/profile/images"),
      ]);

      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data.user);
        setEditFullname(data.user.fullname || "");
        setEditPhone(data.user.phone || "");
      }

      if (resImages.ok) {
        const imgData = await resImages.json();
        setImages(imgData.images || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // บันทึกการแก้ไขข้อมูลทั่วไป
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: editFullname,
          phone: editPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

      setMessage({ type: "success", text: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว" });
      setIsEditing(false);
      fetchAll();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingInfo(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");

      setMessage({ type: "success", text: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  // อัปโหลดรูปภาพใหม่เข้าคลัง
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "อัปโหลดรูปภาพไม่สำเร็จ");

      setMessage({ type: "success", text: "อัปโหลดและตั้งเป็นรูปโปรไฟล์ใหม่แล้ว" });
      fetchAll();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // เลือกรูปจากคลังภาพเดิม
  const handleSelectImage = async (imageId: number) => {
    setMessage(null);
    try {
      const res = await fetch("/api/profile/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ไม่สามารถเปลี่ยนรูปได้");

      setMessage({ type: "success", text: "เปลี่ยนรูปประจำตัวเรียบร้อยแล้ว" });
      fetchAll();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center text-zinc-400 text-sm">
          กำลังโหลดข้อมูลโปรไฟล์...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-12">
        {/* หัวข้อหน้า: ปรับ Flex ให้ปุ่มและหัวข้อย่อขยายสวยงามตามจอ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-zinc-200 pb-4 sm:pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              ข้อมูลโปรไฟล์เจ้าหน้าที่
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              จัดการข้อมูลส่วนตัว บัญชีผู้ใช้งาน และรูปภาพประจำตัวสำหรับระบบกู้ชีพ
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 rounded-xl shadow-xs self-stretch sm:self-auto justify-center cursor-pointer text-sm"
            >
              <Edit3 className="h-4 w-4" />
              แก้ไขข้อมูลส่วนตัว
            </Button>
          )}
        </div>

        {/* ข้อความแจ้งเตือนผลลัพธ์ */}
        {message && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
            )}
            <span className="leading-tight">{message.text}</span>
          </div>
        )}

        {/* ส่วนที่ 1: การ์ดข้อมูลทั่วไป */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
              {/* รูปโปรไฟล์: ปรับขนาดและวางกึ่งกลางบนมือถือ */}
              <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-orange-500 shadow-sm">
                  <img
                    src={profile?.avatarUrl}
                    alt={profile?.fullname || "Avatar"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/avatars/default.png";
                    }}
                  />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImage}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-zinc-300 hover:border-orange-500 hover:text-orange-600 gap-2 cursor-pointer w-full max-w-[140px] text-xs h-8"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImage ? "กำลังอัปโหลด..." : "อัปโหลดรูปใหม่"}
                </Button>
              </div>

              {/* รายละเอียดข้อมูล: จัด Grid responsive */}
              <div className="flex-1 w-full">
                {!isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-zinc-50/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                        ชื่อ - นามสกุล
                      </span>
                      <p className="text-base sm:text-lg font-bold text-zinc-900 break-words">
                        {profile?.fullname || "-"}
                      </p>
                    </div>

                    <div className="bg-zinc-50/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                        ชื่อผู้ใช้งาน (Username)
                      </span>
                      <p className="text-sm sm:text-base font-medium text-zinc-700 font-mono">
                        @{profile?.username}
                      </p>
                    </div>

                    <div className="bg-zinc-50/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                        บทบาท / ตำแหน่งปฏิบัติงาน
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{profile?.role || "ผู้ปฏิบัติงาน"}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-50/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                        เบอร์โทรศัพท์ติดต่อ
                      </span>
                      <p className="text-sm sm:text-base text-zinc-800 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 shrink-0" />
                        <span>{profile?.phone || "ยังไม่ได้ระบุ"}</span>
                      </p>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        สร้างบัญชีเมื่อ:{" "}
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                          ชื่อ - นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFullname}
                          onChange={(e) => setEditFullname(e.target.value)}
                          required
                          className="rounded-xl border-zinc-300 focus:border-orange-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                          เบอร์โทรศัพท์ติดต่อ
                        </label>
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="เช่น 0812345678"
                          className="rounded-xl border-zinc-300 focus:border-orange-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1 block">
                          ชื่อผู้ใช้งาน (ไม่สามารถแก้ไขได้)
                        </label>
                        <Input
                          value={profile?.username}
                          disabled
                          className="rounded-xl bg-zinc-100 text-zinc-500 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1 block">
                          ตำแหน่ง / บทบาท (จัดการโดยระบบ)
                        </label>
                        <Input
                          value={profile?.role}
                          disabled
                          className="rounded-xl bg-zinc-100 text-zinc-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setEditFullname(profile?.fullname || "");
                          setEditPhone(profile?.phone || "");
                        }}
                        className="rounded-xl gap-1.5 text-zinc-600 cursor-pointer justify-center text-sm"
                      >
                        <X className="h-4 w-4" />
                        ยกเลิก
                      </Button>
                      <Button
                        type="submit"
                        disabled={savingInfo}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 cursor-pointer justify-center text-sm"
                      >
                        <Save className="h-4 w-4" />
                        {savingInfo ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 2: คลังรูปภาพสำหรับเลือกรูปโปรไฟล์ (Gallery) */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-orange-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">คลังรูปภาพประจำตัว</h2>
            </div>
            <span className="text-xs text-zinc-400 font-normal">
              (คลิกรูปด้านล่างเพื่อเปลี่ยนเป็นรูปโปรไฟล์ปัจจุบัน)
            </span>
          </div>

          {images.length === 0 ? (
            <div className="p-6 sm:p-8 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs sm:text-sm">
              ยังไม่มีรูปภาพในคลัง สามารถกดปุ่ม &quot;อัปโหลดรูปใหม่&quot; ด้านบนเพื่อเพิ่มรูปภาพได้
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleSelectImage(img.id)}
                  className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all active:scale-95 ${
                    img.isSelected
                      ? "border-orange-500 shadow-xs ring-2 ring-orange-400/30"
                      : "border-zinc-200 hover:border-orange-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Image ${img.id}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {img.isSelected && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-orange-600 text-white rounded-full p-0.5 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  )}
                  {/* แสดงแถบเมื่อ Hover หรือ Focus */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] sm:text-[11px] text-white font-medium bg-black/60 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                      {img.isSelected ? "ใช้งานอยู่" : "เลือกรูปนี้"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ส่วนที่ 3: แบบฟอร์มเปลี่ยนรหัสผ่าน */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-red-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">เปลี่ยนรหัสผ่านเข้าสู่ระบบ</h2>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-3.5 sm:space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                รหัสผ่านปัจจุบัน
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="ระบุรหัสผ่านเดิมที่ใช้งานอยู่"
                className="rounded-xl border-zinc-300 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="ระบุรหัสผ่านใหม่"
                className="rounded-xl border-zinc-300 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                ยืนยันรหัสผ่านใหม่อีกครั้ง
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                className="rounded-xl border-zinc-300 focus:border-red-500 text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl gap-2 cursor-pointer shadow-xs w-full sm:w-auto justify-center text-sm"
            >
              <Lock className="h-4 w-4 text-zinc-400" />
              {savingPassword ? "กำลังตรวจสอบ..." : "บันทึกรหัสผ่านใหม่"}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}