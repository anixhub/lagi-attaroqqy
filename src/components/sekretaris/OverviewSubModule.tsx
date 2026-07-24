import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend as ChartLegend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  Activity, 
  GraduationCap, 
  UserX,
  Calendar,
  Mars,
  Venus,
  Home,
  MapPin
} from 'lucide-react';
import { Santri } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';

interface OverviewSubModuleProps {
  santriList: Santri[];
}

export default function OverviewSubModule({ santriList }: OverviewSubModuleProps) {
  // Helper for parsing dates robustly
  const getYearMonth = (dateStr: string | undefined | null): string | null => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;
    
    // check for YYYY-MM-DD
    if (/^\d{4}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 7); // YYYY-MM
    }
    
    // check for DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}/.test(trimmed)) {
      const parts = trimmed.split('-');
      return `${parts[2]}-${parts[1]}`; // YYYY-MM
    }
    
    return null;
  };

  const totalSantri = santriList.length;

  // 1. Row 1 calculations
  const totalAktif = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif').length, [santriList]);
  const totalAlumni = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Alumni').length, [santriList]);
  const totalMeninggal = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Meninggal').length, [santriList]);

  const pieDataAll = useMemo(() => [
    { name: 'Aktif', value: totalAktif, color: '#10b981' }, // Emerald 500
    { name: 'Alumni', value: totalAlumni + totalMeninggal, color: '#6366f1' }, // Indigo 500
  ], [totalAktif, totalAlumni, totalMeninggal]);

  // Determine current active/latest month
  const currentMonthStr = useMemo(() => {
    const months = santriList
      .map(s => s.tanggalMasuk)
      .filter(Boolean)
      .map(d => getYearMonth(d))
      .filter(Boolean) as string[];
    
    if (months.length === 0) return '2026-07';
    
    months.sort();
    const latestMonth = months[months.length - 1];
    
    const actualCurrentMonth = '2026-07';
    const hasActualMonth = months.includes(actualCurrentMonth);
    return hasActualMonth ? actualCurrentMonth : latestMonth;
  }, [santriList]);

  const formatMonthIndo = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthsIndo[monthIdx] || '' } ${year}`;
  };

  // Generate 6 months timeline for fluctuations
  const fluctuationData = useMemo(() => {
    const [currYear, currMonth] = currentMonthStr.split('-').map(Number);
    
    const monthsList: string[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = currMonth - i;
      let y = currYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mStr = m < 10 ? `0${m}` : `${m}`;
      monthsList.push(`${y}-${mStr}`);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return monthsList.map(month => {
      const masuk = santriList.filter(s => getYearMonth(s.tanggalMasuk) === month).length;
      const keluar = santriList.filter(s => getYearMonth(s.tanggalKeluar) === month).length;

      const [y, m] = month.split('-');
      const label = `${monthNames[parseInt(m, 10) - 1]} ${y}`;

      return {
        month,
        label,
        'Santri Masuk': masuk,
        'Santri Keluar': keluar,
      };
    });
  }, [santriList, currentMonthStr]);

  // Bottom lists filtering calculations
  const newSantriBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalMasuk && getYearMonth(s.tanggalMasuk) === currentMonthStr);
  }, [santriList, currentMonthStr]);

  const keluarSantriBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalKeluar && getYearMonth(s.tanggalKeluar) === currentMonthStr);
  }, [santriList, currentMonthStr]);

  const masukPutraBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalMasuk && getYearMonth(s.tanggalMasuk) === currentMonthStr && s.gender === 'Putra').length;
  }, [santriList, currentMonthStr]);

  const masukPutriBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalMasuk && getYearMonth(s.tanggalMasuk) === currentMonthStr && s.gender === 'Putri').length;
  }, [santriList, currentMonthStr]);

  const keluarPutraBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalKeluar && getYearMonth(s.tanggalKeluar) === currentMonthStr && s.gender === 'Putra').length;
  }, [santriList, currentMonthStr]);

  const keluarPutriBulanIni = useMemo(() => {
    return santriList.filter(s => s.tanggalKeluar && getYearMonth(s.tanggalKeluar) === currentMonthStr && s.gender === 'Putri').length;
  }, [santriList, currentMonthStr]);

  const [genderFilterBaru, setGenderFilterBaru] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [genderFilterKeluar, setGenderFilterKeluar] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');

  const filteredNewSantri = useMemo(() => {
    let list = newSantriBulanIni;
    if (genderFilterBaru !== 'Semua') {
      list = list.filter(s => s.gender === genderFilterBaru);
    }
    return list;
  }, [newSantriBulanIni, genderFilterBaru]);

  const filteredKeluarSantri = useMemo(() => {
    let list = keluarSantriBulanIni;
    if (genderFilterKeluar !== 'Semua') {
      list = list.filter(s => s.gender === genderFilterKeluar);
    }
    return list;
  }, [keluarSantriBulanIni, genderFilterKeluar]);

  // Row 2 Left: Active Santri Donut Chart (Putra vs Putri)
  const activePutra = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putra').length, [santriList]);
  const activePutri = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putri').length, [santriList]);

  const donutActiveData = useMemo(() => [
    { name: 'Putra', value: activePutra, color: '#3b82f6' }, // Blue
    { name: 'Putri', value: activePutri, color: '#ec4899' }, // Pink
  ], [activePutra, activePutri]);

  // Row 2 Right: Active Domisili (Muqim vs Kampung) Stacked Bar Chart
  const activePutraMuqim = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putra' && (s.statusDomisili === 'Muqim' || !s.statusDomisili)).length, [santriList]);
  const activePutriMuqim = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putri' && (s.statusDomisili === 'Muqim' || !s.statusDomisili)).length, [santriList]);
  const activePutraCampung = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putra' && s.statusDomisili === 'Kampung').length, [santriList]);
  const activePutriCampung = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Aktif' && s.gender === 'Putri' && s.statusDomisili === 'Kampung').length, [santriList]);

  const domisiliActiveBarData = useMemo(() => [
    {
      category: 'Muqim',
      'Putra': activePutraMuqim,
      'Putri': activePutriMuqim,
    },
    {
      category: 'Kampung',
      'Putra': activePutraCampung,
      'Putri': activePutriCampung,
    }
  ], [activePutraMuqim, activePutriMuqim, activePutraCampung, activePutriCampung]);

  // Row 3 Left: Alumni Donut Chart (Putra vs Putri)
  const alumniPutraOnly = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Alumni' && s.gender === 'Putra').length, [santriList]);
  const alumniPutriOnly = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Alumni' && s.gender === 'Putri').length, [santriList]);

  const deceasedPutra = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Meninggal' && s.gender === 'Putra').length, [santriList]);
  const deceasedPutri = useMemo(() => santriList.filter(s => s.statusKeanggotaan === 'Meninggal' && s.gender === 'Putri').length, [santriList]);

  const alumniPutra = useMemo(() => alumniPutraOnly + deceasedPutra, [alumniPutraOnly, deceasedPutra]);
  const alumniPutri = useMemo(() => alumniPutriOnly + deceasedPutri, [alumniPutriOnly, deceasedPutri]);

  const donutAlumniData = useMemo(() => [
    { name: 'Putra', value: alumniPutra, color: '#3b82f6' }, // Blue
    { name: 'Putri', value: alumniPutri, color: '#ec4899' }, // Pink
  ], [alumniPutra, alumniPutri]);

  // Row 3 Right: Alumni & Deceased Horizontal Stacked Bar Chart for "Status Hidup"
  const alumniPutraAlive = alumniPutraOnly;
  const alumniPutriAlive = alumniPutriOnly;

  const statusHidupBarData = useMemo(() => [
    {
      status: 'Hidup',
      'Putra': alumniPutraAlive,
      'Putri': alumniPutriAlive,
    },
    {
      status: 'Meninggal',
      'Putra': deceasedPutra,
      'Putri': deceasedPutri,
    }
  ], [alumniPutraAlive, alumniPutriAlive, deceasedPutra, deceasedPutri]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Aesthetic Pie Chart - All Santri by Status */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Seluruh Data Santri</span>
            <h3 className="text-sm font-bold text-slate-800">Distribusi Status (Total: {totalSantri})</h3>
          </div>

          <div className="relative h-48 w-full flex items-center justify-center my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataAll}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={75}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {pieDataAll.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: any) => [`${value} Santri`, 'Jumlah']} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Details / Legend with counts */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-4 mt-2">
            {pieDataAll.map((item) => (
              <div key={item.name} className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-800 block">{item.value}</span>
                <span className="text-[9px] text-slate-400 font-bold">
                  {totalSantri > 0 ? Math.round((item.value / totalSantri) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rectangular Fluctuation Chart (Area Chart) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Statistik Bulanan</span>
            <h3 className="text-sm font-bold text-slate-800">Fluktuasi Santri Masuk & Keluar</h3>
          </div>

          <div className="h-48 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={fluctuationData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Santri Masuk" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMasuk)" />
                <Area type="monotone" dataKey="Santri Keluar" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorKeluar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed statistics grid under Area Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-50 pt-3 mt-1">
            {/* Box 1: Santri Masuk */}
            <div className="bg-blue-50/30 border border-blue-100 p-2.5 rounded-xl flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">Santri Masuk ({formatMonthIndo(currentMonthStr)})</span>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-lg font-black text-blue-700">{masukPutraBulanIni + masukPutriBulanIni}</span>
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Santri</span>
                </div>
                <div className="flex items-center gap-2.5 mt-1.5 text-[9px] text-slate-500 font-bold leading-none">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Putra: <span className="text-slate-700">{masukPutraBulanIni}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    Putri: <span className="text-slate-700">{masukPutriBulanIni}</span>
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                <UserPlus className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Box 2: Santri Keluar */}
            <div className="bg-rose-50/30 border border-rose-100 p-2.5 rounded-xl flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mb-0.5">Santri Keluar ({formatMonthIndo(currentMonthStr)})</span>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-lg font-black text-rose-700">{keluarPutraBulanIni + keluarPutriBulanIni}</span>
                  <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Santri</span>
                </div>
                <div className="flex items-center gap-2.5 mt-1.5 text-[9px] text-slate-500 font-bold leading-none">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Putra: <span className="text-slate-700">{keluarPutraBulanIni}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    Putri: <span className="text-slate-700">{keluarPutriBulanIni}</span>
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0">
                <UserMinus className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Santri Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Status Keanggotaan</span>
            <h3 className="text-sm font-bold text-slate-800">Santri Aktif (Putra & Putri)</h3>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center my-3">
            <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Aktif</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight">{totalAktif}</span>
              <span className="text-[9px] text-slate-500 font-bold">Santri</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutActiveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutActiveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: any) => [`${value} Santri`, 'Jumlah']} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 mt-2">
            <div className="bg-blue-50/30 border border-blue-100/50 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Mars className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">Putra</span>
                <span className="text-sm font-black text-slate-800 leading-none block">{activePutra}</span>
                <span className="text-[9px] text-blue-600 font-black">
                  {totalAktif > 0 ? Math.round((activePutra / totalAktif) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-pink-50/30 border border-pink-100/50 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Venus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">Putri</span>
                <span className="text-sm font-black text-slate-800 leading-none block">{activePutri}</span>
                <span className="text-[9px] text-pink-600 font-black">
                  {totalAktif > 0 ? Math.round((activePutri / totalAktif) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Horizontal Bar Chart - Status Domisili (Muqim vs Kampung) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Status Keanggotaan</span>
            <h3 className="text-sm font-bold text-slate-800">Status Domisili Santri Aktif</h3>
          </div>

          <div className="h-44 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={domisiliActiveBarData}
                layout="vertical"
                margin={{ top: 10, right: 15, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  type="category"
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                />
                <ChartTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Putra" stackId="domisili" fill="#3b82f6" radius={0} barSize={16} />
                <Bar dataKey="Putri" stackId="domisili" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 mt-2">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Muqim</span>
              <span className="text-sm font-black text-slate-800">{activePutraMuqim + activePutriMuqim}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Kampung</span>
              <span className="text-sm font-black text-slate-800">{activePutraCampung + activePutriCampung}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Alumni Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Status Keanggotaan</span>
            <h3 className="text-sm font-bold text-slate-800">Data Alumni (Putra & Putri)</h3>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center my-3">
            <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Alumni</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight">{totalAlumni + totalMeninggal}</span>
              <span className="text-[9px] text-slate-500 font-bold">Santri</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutAlumniData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutAlumniData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: any) => [`${value} Santri`, 'Jumlah']} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 mt-2">
            <div className="bg-blue-50/30 border border-blue-100/50 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Mars className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">Putra</span>
                <span className="text-sm font-black text-slate-800 leading-none block">{alumniPutra}</span>
                <span className="text-[9px] text-blue-600 font-black">
                  {(totalAlumni + totalMeninggal) > 0 ? Math.round((alumniPutra / (totalAlumni + totalMeninggal)) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-pink-50/30 border border-pink-100/50 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Venus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-0.5">Putri</span>
                <span className="text-sm font-black text-slate-800 leading-none block">{alumniPutri}</span>
                <span className="text-[9px] text-pink-600 font-black">
                  {(totalAlumni + totalMeninggal) > 0 ? Math.round((alumniPutri / (totalAlumni + totalMeninggal)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Horizontal Stacked Bar Chart for "Status Hidup" */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Status Keanggotaan</span>
            <h3 className="text-sm font-bold text-slate-800">Statistik Status Hidup</h3>
          </div>

          <div className="h-44 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusHidupBarData}
                layout="vertical"
                margin={{ top: 10, right: 15, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  type="category"
                  dataKey="status" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                />
                <ChartTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Putra" stackId="hidup" fill="#3b82f6" radius={0} barSize={16} />
                <Bar dataKey="Putri" stackId="hidup" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 mt-2">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Hidup</span>
              <span className="text-sm font-black text-slate-800">{alumniPutraAlive + alumniPutriAlive}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
              <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Meninggal</span>
              <span className="text-sm font-black text-slate-800">{deceasedPutra + deceasedPutri}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Santri Baru & Keluar Bulan Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kotak Daftar Santri Baru */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Daftar Santri Baru Bulan Ini
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Daftar santri yang masuk pada {formatMonthIndo(currentMonthStr)}</p>
            </div>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {filteredNewSantri.length} Santri
            </span>
          </div>

          {/* Gender Filter Toggle */}
          <div className="flex items-center justify-between mb-3 bg-slate-50 border border-slate-100/80 rounded-xl p-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">Filter Gender:</span>
            <div className="flex rounded-lg bg-slate-200/60 p-0.5 text-[10px]">
              <button 
                onClick={() => setGenderFilterBaru('Semua')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterBaru === 'Semua' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setGenderFilterBaru('Putra')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterBaru === 'Putra' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Putra
              </button>
              <button 
                onClick={() => setGenderFilterBaru('Putri')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterBaru === 'Putri' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Putri
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {filteredNewSantri.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs font-bold text-slate-400">Tidak ada santri baru dengan filter ini</p>
              </div>
            ) : (
              filteredNewSantri.map((s, idx) => (
                <div key={s.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0">
                      {renderSantriAvatar(s, "h-full w-full")}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{s.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                        NIS: {s.nis || '-'} • {[s.desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ') || s.asal || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-150 px-2 py-1 rounded-md block">
                      {s.tanggalMasuk || '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kotak Daftar Santri Keluar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Daftar Santri Keluar Bulan Ini
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Daftar santri yang berhenti/alumni/keluar pada {formatMonthIndo(currentMonthStr)}</p>
            </div>
            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
              {filteredKeluarSantri.length} Santri
            </span>
          </div>

          {/* Gender Filter Toggle */}
          <div className="flex items-center justify-between mb-3 bg-slate-50 border border-slate-100/80 rounded-xl p-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">Filter Gender:</span>
            <div className="flex rounded-lg bg-slate-200/60 p-0.5 text-[10px]">
              <button 
                onClick={() => setGenderFilterKeluar('Semua')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterKeluar === 'Semua' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setGenderFilterKeluar('Putra')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterKeluar === 'Putra' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Putra
              </button>
              <button 
                onClick={() => setGenderFilterKeluar('Putri')} 
                className={`px-3 py-1 rounded-md font-bold transition-all ${genderFilterKeluar === 'Putri' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Putri
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {filteredKeluarSantri.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs font-bold text-slate-400">Tidak ada santri keluar dengan filter ini</p>
              </div>
            ) : (
              filteredKeluarSantri.map((s, idx) => (
                <div key={s.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0">
                      {renderSantriAvatar(s, "h-full w-full")}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{s.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                        NIS: {s.nis || '-'} • {[s.desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ') || s.asal || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-150 px-2 py-1 rounded-md block">
                      {s.tanggalKeluar || '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
