import React from 'react';
import { Menu, Bell } from 'lucide-react';
import OnlineUsers from './OnlineUsers';

interface HeaderProps {
  activeModule: string;
  activeSubTab?: string;
  onOpenDrawer: () => void;
}

export default function Header({ activeModule, activeSubTab, onOpenDrawer }: HeaderProps) {
  // Translate module name and sub-tab to hierarchical breadcrumb
  const getBreadcrumbTitle = (mod: string, sub?: string) => {
    let mainTitle = '';
    switch (mod) {
      case 'home': mainTitle = 'Home'; break;
      case 'sekretaris': mainTitle = 'Sekretaris'; break;
      case 'bendahara': mainTitle = 'Bendahara'; break;
      case 'pendidikan': mainTitle = 'Pendidikan'; break;
      case 'humasy': mainTitle = 'Humasy'; break;
      case 'keamanan': mainTitle = 'Keamanan'; break;
      case 'pengaturan': mainTitle = 'Pengaturan'; break;
      default: mainTitle = 'AttarOkey 4.0'; break;
    }

    if (!sub) return mainTitle;

    let subTitle = '';
    switch (sub) {
      case 'dashboard': subTitle = 'Dashboard Utama'; break;
      case 'statistik': subTitle = 'Statistik Ringkas'; break;
      case 'santri': subTitle = 'Data Induk Santri'; break;
      case 'surat': subTitle = 'Surat & Dokumen'; break;
      case 'cetak': subTitle = 'Cetak Dokumen'; break;
      case 'syahriah': subTitle = 'Syahriah Bulanan'; break;
      case 'kas': subTitle = 'Arus Kas Keuangan'; break;
      case 'jadwal': subTitle = 'Jadwal Kelas'; break;
      case 'ustadz': subTitle = 'Daftar Wali Kelas'; break;
      case 'overview': subTitle = 'Overview'; break;
      case 'lembaga': subTitle = 'Aktivitas Akademik'; break;
      case 'rombel': subTitle = 'Rombongan Belajar'; break;
      case 'akademik': subTitle = 'Data Akademik'; break;
      case 'mutasi': subTitle = 'Atur Anggota & Mutasi'; break;
      case 'agenda': subTitle = 'Agenda Kegiatan'; break;
      case 'wali': subTitle = 'Relasi Wali Santri'; break;
      case 'pelanggaran': subTitle = 'Catatan Pelanggaran'; break;
      case 'disiplin': subTitle = 'Ta\'zir & Sanksi'; break;
      case 'kamar': subTitle = 'Kelola Kamar'; break;
      case 'datakamar': subTitle = 'Data Kamar Santri'; break;
      case 'catatan': subTitle = 'Data Pelanggaran'; break;
      case 'riwayat': subTitle = 'Log Kasus'; break;
      case 'bukuinduk': subTitle = 'Buku Induk Sanksi'; break;
      case 'perizinan': subTitle = 'Perizinan'; break;
      case 'akses': subTitle = 'Panel Akses & Otoritas'; break;
      default: break;
    }

    if (subTitle) {
      return `${mainTitle} > ${subTitle}`;
    }
    return mainTitle;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-50/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl">
        
        {/* Mobile Header Layout */}
        <div className="relative flex h-16 w-full items-center justify-between px-4 md:hidden">
          {/* Left Side: Hamburger Menu (No Box) */}
          <button
            id="btn-open-drawer"
            onClick={onOpenDrawer}
            className="inline-flex items-center justify-center text-slate-700 hover:text-emerald-700 active:scale-95 transition-all"
            aria-label="Buka Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Center: App Logo (Centered for mobile) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center">
            <span className="font-display text-lg font-black tracking-tight text-indigo-900">
              AttarOkey 4.0
            </span>
          </div>

          {/* Right Side: Online Users & Bell Notification */}
          <div className="flex items-center gap-2">
            <OnlineUsers />
            <button 
              id="btn-notifications-mobile"
              className="relative flex items-center justify-center p-1.5 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Header Layout */}
        <div className="hidden h-16 w-full items-center justify-between px-6 lg:px-8 md:flex">
          {/* Left: Active Module Breadcrumb */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-50/50 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-emerald-800 tracking-tight">
              {getBreadcrumbTitle(activeModule, activeSubTab)}
            </span>
          </div>

          {/* Right: Online Users & Bell Notification */}
          <div className="flex items-center gap-3">
            <OnlineUsers />
            <div className="h-4 w-px bg-slate-200" />
            <button 
              id="btn-notifications-desktop"
              className="relative flex items-center justify-center p-1.5 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
