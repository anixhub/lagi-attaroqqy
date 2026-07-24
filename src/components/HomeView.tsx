import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Wallet, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  MoreVertical,
  Building,
  School,
  GraduationCap,
  UserCheck,
  Shield,
  RefreshCw,
  UserPlus,
  Download,
  Smartphone,
  Share2,
  X
} from 'lucide-react';
import { Santri, Surat, KeamananRecord, BendaharaRecord, Kompleks, Kamar } from '../types';
import { INITIAL_KOMPLEKS, INITIAL_KAMAR } from './HumasyView';

interface HomeViewProps {
  santriList: Santri[];
  keamananList: KeamananRecord[];
  bendaharaList: BendaharaRecord[];
  onChangeModule: (mod: string, subTab?: string) => void;
  onResetAllLocalData?: () => void;
}

export default function HomeView({ 
  santriList, 
  keamananList, 
  bendaharaList, 
  onChangeModule,
  onResetAllLocalData
}: HomeViewProps) {
  const [showPwaBanner, setShowPwaBanner] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return localStorage.getItem('smartsantri_pwa_dismissed') === 'true';
  });

  React.useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      return;
    }
    if (isDismissed) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setShowPwaBanner(true);
    }

    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
      setShowPwaBanner(true);
    }

    const handleInstallable = () => {
      setInstallPrompt((window as any).deferredPrompt);
      setShowPwaBanner(true);
    };

    const handleInstalled = () => {
      setShowPwaBanner(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [isDismissed]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User installation decision: ${outcome}`);
    (window as any).deferredPrompt = null;
    setInstallPrompt(null);
    setShowPwaBanner(false);
  };

  const handleDismissPwaBanner = () => {
    setIsDismissed(true);
    localStorage.setItem('smartsantri_pwa_dismissed', 'true');
    setShowPwaBanner(false);
  };

  // Read complexes and rooms from localStorage
  const kompleksList: Kompleks[] = React.useMemo(() => {
    try {
      const local = localStorage.getItem('smartsantri_kompleks');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KOMPLEKS;
  }, []);

  const kamarList: Kamar[] = React.useMemo(() => {
    try {
      const local = localStorage.getItem('smartsantri_kamar');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KAMAR;
  }, []);

  // Format current Indonesian date nicely
  const formattedDate = new Intl.DateTimeFormat('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat pagi';
    if (hours < 15) return 'Selamat siang';
    if (hours < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // 1. Calculate growth/decrease from the last 30 days based on `tanggalMasuk`
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const santriTerakhir30Hari = santriList.filter(s => {
    if (!s.tanggalMasuk) return false;
    const entryDate = new Date(s.tanggalMasuk);
    return entryDate >= thirtyDaysAgo && entryDate <= today;
  }).length;

  const santriSebelum30Hari = santriList.filter(s => {
    if (!s.tanggalMasuk) return true;
    const entryDate = new Date(s.tanggalMasuk);
    return entryDate < thirtyDaysAgo;
  }).length;

  let percentChangeStr = '+0.0%';
  if (santriSebelum30Hari > 0) {
    const changeVal = (santriTerakhir30Hari / santriSebelum30Hari) * 100;
    const sign = changeVal >= 0 ? '+' : '';
    percentChangeStr = `${sign}${changeVal.toFixed(1)}%`;
  } else if (santriTerakhir30Hari > 0) {
    percentChangeStr = `+100.0%`;
  }

  // Compute stats
  const totalSantriReal = santriList.length;

  const activePutra = santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putra');
  const activePutri = santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putri');

  const putraComplexesCount = kompleksList.filter(k => k.gender === 'Putra').length;
  const putriComplexesCount = kompleksList.filter(k => k.gender === 'Putri').length;
  const totalAsramaAccum = kompleksList.length;

  // Kamar Putra Terisi (Dynamic based on active Putra)
  const putraRooms = kamarList.filter(k => {
    const komp = kompleksList.find(c => c.id === k.kompleksId);
    return komp && komp.gender === 'Putra';
  });
  const totalPutraBedsCapacity = putraRooms.reduce((sum, r) => sum + (r.kapasitas || 0), 0);

  const isValidRoomName = (kamarStr?: string) => {
    if (!kamarStr) return false;
    const clean = kamarStr.trim().toLowerCase();
    return clean !== '' && 
           clean !== 'tanpa kamar' && 
           clean !== 'belum diatur' && 
           clean !== 'belum diatur kamar' && 
           clean !== '-';
  };

  const occupiedPutraBeds = activePutra.filter(s => 
    s.statusDomisili !== 'Kampung' && 
    isValidRoomName(s.kamar)
  ).length;
  const occupancyPutraRate = totalPutraBedsCapacity > 0 ? (occupiedPutraBeds / totalPutraBedsCapacity) * 100 : 0;

  // Kamar Putri Terisi (Dynamic based on active Putri)
  const putriRooms = kamarList.filter(k => {
    const komp = kompleksList.find(c => c.id === k.kompleksId);
    return komp && komp.gender === 'Putri';
  });
  const totalPutriBedsCapacity = putriRooms.reduce((sum, r) => sum + (r.kapasitas || 0), 0);
  const occupiedPutriBeds = activePutri.filter(s => 
    s.statusDomisili !== 'Kampung' && 
    isValidRoomName(s.kamar)
  ).length;
  const occupancyPutriRate = totalPutriBedsCapacity > 0 ? (occupiedPutriBeds / totalPutriBedsCapacity) * 100 : 0;

  // 3. Distribusi Santri Donut Chart calculations
  const putraCount = santriList.filter(s => s.gender === 'Putra').length;
  const putriCount = santriList.filter(s => s.gender === 'Putri').length;
  const totalDistributionCount = putraCount + putriCount;

  // Pie chart calculation (SVG stroke dasharray)
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // 251.327

  const putraDash = totalDistributionCount > 0 ? (putraCount / totalDistributionCount) * circumference : 0;
  const putriDash = totalDistributionCount > 0 ? (putriCount / totalDistributionCount) * circumference : 0;

  // Cumulative offsets (negative values for clockwise/counterclockwise SVG segment rendering)
  const putraOffset = 0;
  const putriOffset = -putraDash;

  // Dynamic Recent Activities Builder
  const getRelativeTimeStr = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    const todayRef = new Date();
    const target = new Date(dateStr);
    
    const todayRefDay = new Date(todayRef.getFullYear(), todayRef.getMonth(), todayRef.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    
    const diffTime = todayRefDay.getTime() - targetDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Hari ini';
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else {
      return `${diffDays} hari lalu`;
    }
  };

  const activities: {
    id: string;
    type: 'registrasi' | 'surat' | 'pelanggaran' | 'keuangan';
    title: string;
    desc: string;
    timeStr: string;
    timestamp: number;
  }[] = [];

  // 1. Registrasi Santri Baru
  santriList.forEach(s => {
    if (s.tanggalMasuk) {
      activities.push({
        id: `reg-${s.id}`,
        type: 'registrasi',
        title: 'Registrasi Santri Baru',
        desc: `${s.nama} (${s.gender}) - Kamar: ${s.kamar || 'Belum diatur'}`,
        timeStr: getRelativeTimeStr(s.tanggalMasuk),
        timestamp: new Date(s.tanggalMasuk).getTime()
      });
    }
  });

  // 3. Laporan Pelanggaran
  keamananList.forEach(k => {
    activities.push({
      id: `keamanan-${k.id}`,
      type: 'pelanggaran',
      title: 'Laporan Pelanggaran',
      desc: `${k.namaSantri} - ${k.jenisPelanggaran} (${k.poin} Poin)`,
      timeStr: getRelativeTimeStr(k.tanggal),
      timestamp: new Date(k.tanggal).getTime()
    });
  });

  // 4. Pembayaran Syahriah (Keuangan)
  bendaharaList.filter(b => b.status === 'Lunas').forEach(b => {
    const payDate = b.tanggalBayar || '2026-06-30';
    activities.push({
      id: `spp-${b.id}`,
      type: 'keuangan',
      title: 'Pembayaran Syahriah',
      desc: `${b.namaSantri} - SPP ${b.bulan} (${b.nominal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })})`,
      timeStr: getRelativeTimeStr(payDate),
      timestamp: new Date(payDate).getTime()
    });
  });

  // Sort and select top 6 recent activities
  const recentActivities = activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 px-3 md:px-8 py-4 max-w-7xl mx-auto font-sans"
    >
      {/* Mobile-First Header Info Section */}
      <div className="flex flex-col space-y-1.5 pb-4 border-b border-slate-100">
        <h1 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight">
          {getGreeting()}, Admin
        </h1>
        <div className="flex items-center justify-between w-full">
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            {formattedDate}
          </p>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/30">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Data sinkron</span>
          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      {showPwaBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 md:p-6 shadow-xl border border-emerald-600/30"
        >
          {/* Background decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 select-none pointer-events-none">
            <Smartphone className="h-64 w-64 rotate-12" />
          </div>

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-yellow-300 shrink-0">
                <Smartphone className="h-6 w-6 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-yellow-400 text-emerald-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                    Rekomendasi
                  </span>
                  <h3 className="font-display font-black text-white text-base md:text-lg">
                    Instal Go AttarOkey di HP / Desktop
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
                  {isIOS 
                    ? "Gunakan portal ini lebih cepat, stabil, dan lancar langsung dari layar utama perangkat Apple Anda tanpa harus membuka browser Safari lagi." 
                    : "Simpan aplikasi manajemen pesantren ini ke beranda atau desktop untuk akses instan satu ketukan, kinerja super lancar, dan dukungan mode offline."}
                </p>

                {isIOS && (
                  <div className="mt-3 bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-xs text-emerald-100 flex items-center gap-2.5">
                    <Share2 className="h-4 w-4 text-yellow-300 shrink-0" />
                    <span>
                      Ketuk tombol <strong>Share/Bagikan</strong> di bagian bawah Safari, lalu pilih opsi <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDismissPwaBanner}
              className="text-white/70 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all shrink-0 active:scale-95 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isIOS && installPrompt && (
            <div className="mt-4 flex flex-wrap gap-2.5 relative z-10 justify-end md:justify-start pl-0 md:pl-16">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-emerald-950 font-bold px-5 py-2.5 rounded-2xl text-xs md:text-sm shadow-md transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Instal Aplikasi
              </button>
              <button
                onClick={handleDismissPwaBanner}
                className="bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium px-4 py-2.5 rounded-2xl text-xs md:text-sm transition-all border border-white/10 cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 2x2 grid on mobile, 4-cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-6">
        {/* Card 1: Total Santri */}
        <div id="stat-total-santri" className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/50 transition-all hover:shadow-xs flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider uppercase">TOTAL SANTRI</p>
          <div className="flex items-baseline gap-1 mt-2.5">
            <span className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {totalSantriReal.toLocaleString('id-ID')}
            </span>
            <span className={`text-[10px] md:text-xs font-bold ${percentChangeStr.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {percentChangeStr}
            </span>
          </div>
        </div>

        {/* Card 2: Kompleks Asrama */}
        <div id="stat-kompleks-asrama" className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/50 transition-all hover:shadow-xs flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider uppercase">KOMPLEKS ASRAMA</p>
          <div className="flex items-baseline gap-3 mt-2.5">
            <span className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {totalAsramaAccum}
            </span>
            <div className="flex flex-col text-[10px] text-slate-500 font-semibold leading-tight border-l border-slate-200 pl-2.5">
              <span>{putraComplexesCount} Putra</span>
              <span>{putriComplexesCount} Putri</span>
            </div>
          </div>
        </div>

        {/* Card 3: Kamar Putra Terisi */}
        <div id="stat-kamar-putra-terisi" className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/50 transition-all hover:shadow-xs flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider uppercase">KAMAR PUTRA TERISI</p>
          <div className="flex items-baseline gap-1 mt-2.5">
            <span className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {occupiedPutraBeds}
            </span>
            <span className="text-xs md:text-sm font-semibold text-slate-400 tracking-tight">
              / {totalPutraBedsCapacity}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${occupancyPutraRate}%` }} />
          </div>
        </div>

        {/* Card 4: Kamar Putri Terisi */}
        <div id="stat-kamar-putri-terisi" className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/50 transition-all hover:shadow-xs flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider uppercase">KAMAR PUTRI TERISI</p>
          <div className="flex items-baseline gap-1 mt-2.5">
            <span className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {occupiedPutriBeds}
            </span>
            <span className="text-xs md:text-sm font-semibold text-slate-400 tracking-tight">
              / {totalPutriBedsCapacity}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${occupancyPutriRate}%` }} />
          </div>
        </div>
      </div>



      {/* Two Column Layout: Distribusi Santri & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Distribusi Santri (Donut Chart) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-100/60 bg-white shadow-xs flex flex-col justify-between lg:h-[380px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Distribusi Santri</h3>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Elegant SVG Donut Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Putri (emerald color) */}
                  {putriDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-emerald-500"
                      strokeWidth="10"
                      strokeDasharray={`${putriDash} ${circumference}`}
                      strokeDashoffset={putriOffset}
                      stroke="currentColor"
                      fill="transparent"
                    />
                  )}
                  {/* Putra (violet color) */}
                  {putraDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-violet-600"
                      strokeWidth="10"
                      strokeDasharray={`${putraDash} ${circumference}`}
                      strokeDashoffset={putraOffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  )}
                </svg>
                {/* Inner Label */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-800 tracking-tight">
                    {totalSantriReal}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                    TOTAL
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Putra: {putraCount} Santri</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Putri: {putriCount} Santri</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Underneath Button: Selengkapnya */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => onChangeModule('sekretaris', 'santri')}
              className="w-full px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-center"
            >
              Selengkapnya &rarr;
            </button>
          </div>
        </div>

        {/* Column 2: Aktivitas Terbaru */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-100/60 bg-white shadow-xs flex flex-col justify-between lg:h-[380px]">
          <div className="flex flex-col h-full overflow-hidden w-full">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">Aktivitas Terbaru</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Real-time</span>
            </div>

            {/* Timeline List with separators - Scrollable */}
            <div className="divide-y divide-slate-100 overflow-y-auto pr-1 flex-1">
              {recentActivities.map((act) => {
                let icon = <UserPlus className="h-5 w-5" />;
                let colorClasses = "bg-violet-100 text-violet-600";
                
                if (act.type === 'pelanggaran') {
                  icon = <ShieldAlert className="h-5 w-5" />;
                  colorClasses = "bg-rose-100 text-rose-600";
                } else if (act.type === 'keuangan') {
                  icon = <Wallet className="h-5 w-5" />;
                  colorClasses = "bg-emerald-100 text-emerald-600";
                }

                return (
                  <div key={act.id} className="flex gap-3.5 py-3 first:pt-1 last:pb-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {act.desc}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.timeStr}</p>
                    </div>
                  </div>
                );
              })}

              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">Belum ada aktivitas terbaru.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
