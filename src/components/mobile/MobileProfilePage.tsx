"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight, LogOut, Moon, Sun, Bell, Shield,
  Users, Target, Flame, ChevronLeft, Calendar,
  Award, Camera, Loader2
} from "lucide-react";

interface ProfilePageProps {
  userId?: string;
  userName?: string;
  userRole?: string;
  userTeam?: string;
  totalLeads?: number;
  totalClosing?: number;
  totalHot?: number;
  streak?: number;
  dark?: boolean;
  onToggleDark?: () => void;
  onLogout?: () => void;
  joinedAt?: string;
  onNavigate?: (tab: string) => void;
}

export function MobileProfilePage({
  userId = "",
  userName = "Staff Marketing",
  userRole = "Staff Marketing",
  userTeam = "Tim Alexandria",
  totalLeads = 0,
  totalClosing = 0,
  totalHot = 0,
  streak = 0,
  dark = false,
  onToggleDark,
  onLogout,
  joinedAt,
  onNavigate,
}: ProfilePageProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`avatar_${userId}`);
    return null;
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const initials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const bg = dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
  const sub = dark ? "text-gray-400" : "text-gray-500";
  const statBg = dark ? "bg-gray-700" : "bg-gray-50";
  const itemHover = dark ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const divider = dark ? "border-gray-700" : "border-gray-50";

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setUploadError("Foto max 2MB"); return; }

    setUploading(true);
    setUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      localStorage.setItem(`avatar_${userId}`, url);
    } catch {
      setUploadError("Gagal upload. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  const menuSections = [
    {
      title: "Aktivitas",
      items: [
        { icon: Users, label: "Leads Saya", desc: "Lihat semua leads yang ditangani", tab: "leads", color: "bg-blue-100 text-blue-600" },
        { icon: Calendar, label: "Jadwal Follow-up", desc: "Reminder & jadwal kontak leads", tab: "schedule", color: "bg-purple-100 text-purple-600" },
        { icon: Award, label: "Leaderboard", desc: "Peringkat tim & poin closing", tab: "leaderboard", color: "bg-yellow-100 text-yellow-600" },
      ],
    },
    {
      title: "Akun",
      items: [
        { icon: Bell, label: "Notifikasi", desc: "Atur pengingat & aktivitas", tab: "notif", color: "bg-green-100 text-green-600" },
        { icon: Shield, label: "Privasi", desc: "Visibilitas & keamanan akun", tab: "privacy", color: "bg-indigo-100 text-indigo-600" },
      ],
    },
  ];

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${bg}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 px-5 pt-12 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white/40 overflow-hidden shadow-lg bg-white/20 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100"
            >
              {uploading ? <Loader2 size={13} className="text-blue-600 animate-spin" /> : <Camera size={13} className="text-blue-600" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          {uploadError && <p className="text-red-300 text-xs">{uploadError}</p>}
          <div className="text-center">
            <h2 className="text-white font-bold text-xl">{userName}</h2>
            <p className="text-white/70 text-sm">{userRole}</p>
            <span className="mt-1 inline-block px-3 py-0.5 bg-white/20 rounded-full text-white/90 text-xs font-medium">{userTeam}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className={`${card} border rounded-2xl p-4 shadow-sm`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-500" },
              { label: "Closing", value: totalClosing, icon: Target, color: "text-green-500" },
              { label: "HOT Leads", value: totalHot, icon: Flame, color: "text-orange-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${statBg} rounded-xl p-3 flex flex-col items-center gap-1`}>
                <Icon size={18} className={color} />
                <span className="font-bold text-lg leading-none">{value}</span>
                <span className={`text-xs text-center leading-tight ${sub}`}>{label}</span>
              </div>
            ))}
          </div>
          {streak > 0 && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${dark ? "bg-orange-900/30" : "bg-orange-50"}`}>
              <span className="text-lg">🔥</span>
              <span className={`text-sm font-medium ${dark ? "text-orange-300" : "text-orange-700"}`}>Streak {streak} hari aktif berturut-turut!</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 mt-4 flex flex-col gap-4 pb-8">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-1 ${sub}`}>{section.title}</p>
            <div className={`${card} border rounded-2xl overflow-hidden shadow-sm`}>
              {section.items.map(({ icon: Icon, label, desc, tab, color }, i) => (
                <button
                  key={tab}
                onClick={() => onNavigate?.(tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${itemHover} ${i > 0 ? `border-t ${divider}` : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}><Icon size={18} /></div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{label}</p>
                    <p className={`text-xs ${sub}`}>{desc}</p>
                  </div>
                  <ChevronRight size={16} className={sub} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Dark Mode */}
        <div className={`${card} border rounded-2xl overflow-hidden shadow-sm`}>
          <button onClick={onToggleDark} className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${itemHover}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? "bg-yellow-900/40 text-yellow-400" : "bg-gray-100 text-gray-600"}`}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Mode {dark ? "Terang" : "Gelap"}</p>
              <p className={`text-xs ${sub}`}>Ganti tema tampilan</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${dark ? "bg-blue-600" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${dark ? "left-[22px]" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-semibold text-sm transition-colors hover:bg-red-50 active:bg-red-100"
          >
            <LogOut size={18} /> Keluar dari Akun
          </button>
        ) : (
          <div className={`${card} border border-red-200 rounded-2xl p-4 shadow-sm`}>
            <p className="font-semibold text-center mb-1">Yakin ingin keluar?</p>
            <p className={`text-xs text-center mb-4 ${sub}`}>Kamu perlu login ulang untuk masuk kembali</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${dark ? "bg-gray-700" : "bg-gray-100"}`}>Batal</button>
              <button onClick={onLogout} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white">Ya, Keluar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
