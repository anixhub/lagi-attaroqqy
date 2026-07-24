import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Award, 
  AlertTriangle, 
  Book, 
  ListOrdered,
  FileSpreadsheet,
  Info,
  Share2,
  Printer,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreVertical,
  Filter,
  Check,
  ArrowLeft,
  Gavel,
  Smartphone,
  Calendar,
  RotateCcw,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  Cell
} from 'recharts';
import {
  Tick02Icon,
  CodeIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { KeamananRecord, Santri, KatalogPelanggaranItem, RuleRepetisi, PerizinanRecord } from '../types';
import { INITIAL_PERIZINAN } from '../data';
import SantriDetailModal from './sekretaris/SantriDetailModal';
import { BirthDatePicker } from './sekretaris/BirthDatePicker';
import { getPesantrenProfile } from './SekretarisHelper';
import { fetchTableData, insertTableRow, updateTableRow, deleteTableRow, getSupabaseClient, snakeToCamel } from '../lib/api';
import { DEFAULT_ROLES } from '../lib/permissions';

const springTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.22,
} as const;

interface RiwayatIzinRowProps {
  key?: React.Key;
  rec: PerizinanRecord;
  santriList: Santri[];
}

function RiwayatIzinRow({ rec, santriList }: RiwayatIzinRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    isOverdue: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ isOverdue: false, days: 0, hours: 0, minutes: 0, seconds: 0 });

  const isReturned = rec.status === 'Sudah Kembali';

  useEffect(() => {
    if (isReturned) return;

    const calculateTime = () => {
      const targetTime = new Date(rec.tanggalSelesai).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      const isOverdue = diff < 0;
      const absDiff = Math.abs(diff);

      const seconds = Math.floor((absDiff / 1000) % 60);
      const minutes = Math.floor((absDiff / 1000 / 60) % 60);
      const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

      setTimeLeft({ isOverdue, days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [rec.tanggalSelesai, isReturned]);

  const { isOverdue, days, hours, minutes, seconds } = timeLeft;
  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${days > 0 ? `${days} Hari ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const sObj = santriList.find(x => rec.santriId ? x.id === rec.santriId : x.nama === rec.namaSantri);
  const fallbackPhoto = rec.gender === 'Putra' 
    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' 
    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
  const photoUrl = sObj?.filePasFoto || fallbackPhoto;

  let durationStr = '';
  if (rec.isCabut && rec.tanggalKembali) {
    const startStr = rec.tanggalCabut || rec.tanggalMulai;
    if (startStr) {
      const startTime = new Date(startStr).getTime();
      const endTime = new Date(rec.tanggalKembali).getTime();
      const diffMs = Math.max(0, endTime - startTime);
      
      const minutesCount = Math.floor((diffMs / 1000 / 60) % 60);
      const hoursCount = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const daysCount = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const durationParts = [];
      if (daysCount > 0) durationParts.push(`${daysCount} hari`);
      if (hoursCount > 0) durationParts.push(`${hoursCount} jam`);
      if (minutesCount > 0 || durationParts.length === 0) durationParts.push(`${minutesCount} menit`);
      durationStr = durationParts.join(' ');
    }
  }

  return (
    <div className="p-3 hover:bg-slate-50/50 transition-colors flex flex-col gap-2.5">
      {/* Initial View: Avatar, Name, Address & Remaining Time / Status */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full overflow-hidden border border-indigo-100 bg-indigo-50 shrink-0 flex items-center justify-center">
          <img
            src={photoUrl}
            alt={rec.namaSantri}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-800 truncate">{rec.namaSantri}</span>
            
            {/* Right side: sisa waktu or status */}
            {rec.isCabut && isReturned ? (
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-250 flex items-center gap-1 shrink-0 shadow-xs">
                <svg className="h-2 w-2 text-emerald-500 fill-emerald-500 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 20l9-16H3z" />
                </svg>
                <span>Masuk</span>
              </span>
            ) : rec.isCabut ? (
              <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0 shadow-xs">
                <svg className="h-2 w-2 text-rose-500 fill-rose-500 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 4l9 16H3z" />
                </svg>
                <span>Keluar</span>
              </span>
            ) : !isReturned ? (
              <span className="text-[9px] font-black bg-amber-50 text-amber-750 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0 shadow-xs">
                <svg className="h-2 w-2 text-amber-500 fill-amber-500 animate-pulse shrink-0" viewBox="0 0 24 24">
                  <path d="M12 4l9 16H3z" />
                </svg>
                <span>Keluar</span>
              </span>
            ) : (
              (() => {
                let isLate = false;
                if (rec.tanggalKembali) {
                  if (rec.tanggalKembali.includes('T')) {
                    isLate = new Date(rec.tanggalKembali).getTime() > new Date(rec.tanggalSelesai).getTime();
                  } else {
                    const targetDay = rec.tanggalSelesai.split('T')[0];
                    isLate = rec.tanggalKembali > targetDay;
                  }
                }

                if (isLate) {
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-250 flex items-center gap-1 shrink-0 shadow-xs">
                        <svg className="h-2 w-2 text-emerald-500 fill-emerald-500 shrink-0" viewBox="0 0 24 24">
                          <path d="M12 20l9-16H3z" />
                        </svg>
                        <span>Masuk</span>
                      </span>
                      <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0 shadow-xs">
                        <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                        <span>Telat</span>
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-250 flex items-center gap-1 shrink-0 shadow-xs">
                      <svg className="h-2 w-2 text-emerald-500 fill-emerald-500 shrink-0" viewBox="0 0 24 24">
                        <path d="M12 20l9-16H3z" />
                      </svg>
                      <span>Masuk</span>
                    </span>
                  );
                }
              })()
            )}
          </div>

          <p className="text-[10px] text-slate-400 font-bold truncate">
            {sObj 
              ? `Desa ${sObj.desa || '-'}, Kec. ${sObj.kecamatan || '-'}, Kab. ${sObj.kabupaten || '-'}`
              : `Kelas ${rec.kelas} • Kamar ${rec.kamar}`
            }
          </p>
        </div>
      </div>

      {/* Button to expand/collapse details */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-98"
      >
        <span>{isExpanded ? 'Sembunyikan Detail' : 'Perluas Detail'}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Expanded details container */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="space-y-2 overflow-hidden pt-1"
          >
            {rec.isCabut && (
              <div className="p-2.5 bg-rose-50/50 border-2 border-rose-400 rounded-xl space-y-1 text-left shadow-xs">
                <span className="text-[8px] text-rose-600 block font-bold uppercase tracking-wider">Keterangan</span>
                <p className="text-[10.5px] text-slate-800 font-extrabold leading-normal">{rec.alasanCabut || '-'}</p>
                {isReturned ? (
                  <p className="mt-1.5 pt-1.5 border-t border-rose-200/60 text-[10px] text-slate-650 font-bold leading-normal">
                    Keluar: <span className="text-rose-700 font-extrabold">{formatIndonesianDate(rec.tanggalCabut || rec.tanggalMulai)}</span><br />
                    Kembali: <span className="text-emerald-700 font-extrabold">{formatIndonesianDate(rec.tanggalKembali || '')}</span> ({durationStr})
                  </p>
                ) : (
                  <p className="mt-1.5 pt-1.5 border-t border-rose-200/60 text-[10px] text-slate-650 font-bold leading-normal">
                    Keluar sejak: <span className="text-rose-700 font-extrabold">{formatIndonesianDate(rec.tanggalCabut || rec.tanggalMulai)}</span>
                  </p>
                )}
              </div>
            )}
            {!rec.isCabut && (
              <>
                {/* Box 1: Alasan / keterangan / perpanjangan */}
                <div className="p-2.5 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-1 text-left">
                  <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Keterangan Izin</span>
                  <div className="space-y-0.5">
                    {rec.keterangan.split('\n').map((line, idx) => {
                      if (line.trim().startsWith('[Perpanjang')) {
                        return (
                          <div key={idx} className="inline-flex items-center gap-1 mt-0.5 text-[8px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                            <Clock className="h-2.5 w-2.5 text-indigo-500" />
                            <span>{line.replace(/[\[\]]/g, '')}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-[10.5px] text-slate-600 leading-normal font-semibold">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Box 2: Dates info */}
                <div className="p-2.5 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-1 text-left">
                  <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Batas Waktu Izin</span>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{formatIndonesianDate(rec.tanggalMulai)} s.d {formatIndonesianDate(rec.tanggalSelesai)}</span>
                  </div>
                </div>

                {/* Box 3: Return info */}
                {rec.status === 'Sudah Kembali' && rec.tanggalKembali && (() => {
                  let isLate = false;
                  let lateDurationStr = '';
                  if (rec.tanggalKembali) {
                    if (rec.tanggalKembali.includes('T')) {
                      isLate = new Date(rec.tanggalKembali).getTime() > new Date(rec.tanggalSelesai).getTime();
                    } else {
                      const targetDay = rec.tanggalSelesai.split('T')[0];
                      isLate = rec.tanggalKembali > targetDay;
                    }
                  }

                  if (isLate && rec.tanggalKembali && rec.tanggalSelesai) {
                    const diffMs = new Date(rec.tanggalKembali).getTime() - new Date(rec.tanggalSelesai).getTime();
                    if (diffMs > 0) {
                      const totalMin = Math.floor(diffMs / 60000);
                      const days = Math.floor(totalMin / (24 * 60));
                      const hours = Math.floor((totalMin % (24 * 60)) / 60);
                      const minutes = totalMin % 60;
                      lateDurationStr = formatDuration(days, hours, minutes);
                    }
                  }

                  return (
                    <div className="p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-1 text-left">
                      <span className="text-[8px] text-emerald-600 block font-bold uppercase tracking-wider">Waktu Kembali Realisasi</span>
                      <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {formatIndonesianDate(rec.tanggalKembali)}
                          {isLate && lateDurationStr && (
                            <span className="text-rose-600 font-extrabold ml-1"> (Telat {lateDurationStr})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActiveSantriIzinCardProps {
  key?: React.Key;
  rec: PerizinanRecord;
  santriList: Santri[];
  handleReturnToPondok: (id: string) => void;
  onExtendDuration: (id: string, days: number, hours: number, minutes: number, reason: string) => void;
  onDeletePerizinan: (id: string) => void;
  onRevokeIzin: (id: string) => void;
  canWriteCurrent?: boolean;
}

function ActiveSantriIzinCard({ rec, santriList, handleReturnToPondok, onExtendDuration, onDeletePerizinan, onRevokeIzin, canWriteCurrent = true }: ActiveSantriIzinCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    isOverdue: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ isOverdue: false, days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [showExtend, setShowExtend] = useState(false);
  const [extendDays, setExtendDays] = useState(0);
  const [extendHours, setExtendHours] = useState(0);
  const [extendMinutes, setExtendMinutes] = useState(0);
  const [extendReason, setExtendReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      let diff = 0;
      let isOverdue = false;

      if (rec.isCabut && rec.tanggalCabut) {
        const cabutTime = new Date(rec.tanggalCabut).getTime();
        const now = new Date().getTime();
        diff = now - cabutTime; // Count UP since revocation
        isOverdue = true;
      } else {
        const targetTime = new Date(rec.tanggalSelesai).getTime();
        const now = new Date().getTime();
        diff = targetTime - now;
        isOverdue = diff < 0;
      }

      const absDiff = Math.abs(diff);

      const seconds = Math.floor((absDiff / 1000) % 60);
      const minutes = Math.floor((absDiff / 1000 / 60) % 60);
      const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

      setTimeLeft({ isOverdue, days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [rec.tanggalSelesai, rec.isCabut, rec.tanggalCabut]);

  const { isOverdue, days, hours, minutes, seconds } = timeLeft;

  const pad = (num: number) => String(num).padStart(2, '0');

  const formattedTime = rec.isCabut
    ? `Ilegal ${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${days > 0 ? `${days} Hari ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const sObj = santriList.find(x => rec.santriId ? x.id === rec.santriId : x.nama === rec.namaSantri);
  const fallbackPhoto = rec.gender === 'Putra' 
    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' 
    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
  const photoUrl = sObj?.filePasFoto || fallbackPhoto;

  const handleQuickExtend = (daysVal: number, hoursVal: number) => {
    if (!extendReason.trim()) {
      alert("Alasan perpanjangan wajib diisi!");
      return;
    }
    onExtendDuration(rec.id, daysVal, hoursVal, 0, extendReason.trim());
    setExtendReason('');
    setShowExtend(false);
  };

  const handleManualExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendReason.trim()) {
      alert("Alasan perpanjangan wajib diisi!");
      return;
    }
    if (extendDays === 0 && extendHours === 0 && extendMinutes === 0) return;
    onExtendDuration(rec.id, extendDays, extendHours, extendMinutes, extendReason.trim());
    setExtendDays(0);
    setExtendHours(0);
    setExtendMinutes(0);
    setExtendReason('');
    setShowExtend(false);
  };

  return (
    <div 
      className={`p-4 border rounded-xl flex flex-col justify-between gap-3 shadow-xs transition-all hover:shadow-sm ${
        isOverdue || rec.isCabut
          ? 'bg-rose-50/40 border-rose-200' 
          : 'bg-slate-50/50 border-slate-200'
      }`}
    >
      <div className="space-y-3">
        {/* Header info dengan foto, nama, dan sisa waktu */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Foto lingkaran di kiri */}
          <div className="h-11 w-11 rounded-full overflow-hidden border border-indigo-200 bg-indigo-100 shrink-0 flex items-center justify-center">
            <img
              src={photoUrl}
              alt={rec.namaSantri}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Detail di sebelah kanan */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-extrabold text-slate-800 truncate">{rec.namaSantri}</h4>
              {rec.isCabut ? (
                <span className="text-[10px] font-mono font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0 animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>{formattedTime}</span>
                </span>
              ) : isOverdue ? (
                <span className="text-[10px] font-mono font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0 animate-pulse">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Telat {formattedTime}</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Sisa {formattedTime}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              NIS: {sObj?.nis || '-'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              {sObj 
                ? `Desa ${sObj.desa || '-'}, Kec. ${sObj.kecamatan || '-'}, Kab. ${sObj.kabupaten || '-'}`
                : `Kelas ${rec.kelas} • Kamar ${rec.kamar}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Button to expand/collapse details */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-98"
      >
        <span>{isExpanded ? 'Sembunyikan Detail & Aksi' : 'Perluas Detail & Aksi'}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Expandable details container */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="space-y-3 overflow-hidden pt-1"
          >
            {rec.isCabut ? (
              <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1 text-left">
                <p className="text-[9px] text-rose-600 font-extrabold tracking-wider uppercase">Keterangan</p>
                <p className="text-[11px] text-slate-755 font-bold leading-relaxed">{rec.alasanCabut || '-'}</p>
              </div>
            ) : (
              <>
                <div className="p-2.5 bg-white rounded-lg border border-slate-100 space-y-1 text-left">
                  <p className="text-[9px] text-indigo-600 font-extrabold tracking-wider uppercase">Alasan Perizinan</p>
                  <div className="space-y-1">
                    {rec.keterangan.split('\n').map((line, idx) => {
                      if (line.trim().startsWith('[Perpanjang')) {
                        return (
                          <div key={idx} className="block">
                            <div className="inline-flex items-center gap-1 mt-0.5 text-[8.5px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                              <Clock className="h-2.5 w-2.5 text-indigo-500" />
                              <span>{line.replace(/[\[\]]/g, '')}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-500">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Waktu Izin</span>
                    <span className="text-slate-700 font-bold">
                      <span>{formatIndonesianDate(rec.tanggalMulai)}</span>
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-slate-200 pl-3">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Batas Waktu Izin</span>
                    <span className="text-slate-700 font-bold">
                      <span>{formatIndonesianDate(rec.tanggalSelesai)}</span>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Slide-down Extender */}
            <AnimatePresence>
              {showExtend && !rec.isCabut && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.05 } }}
                  transition={{ duration: 0.2 }}
                  className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">Perpanjang Durasi</span>
                    <button 
                      type="button" 
                      onClick={() => setShowExtend(false)} 
                      className="text-slate-400 hover:text-slate-655 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mandat Alasan Perpanjangan */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Alasan Perpanjangan <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Wajib diisi, misal: Masih ada acara keluarga, bus terlambat, dll..."
                      value={extendReason}
                      onChange={(e) => setExtendReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-250 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 placeholder:text-slate-350"
                    />
                  </div>

                  {/* Quick Extend Buttons */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pilihan Cepat</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(0, 1)}
                        className="py-1 px-2 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        +1 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(0, 3)}
                        className="py-1 px-2 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        +3 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(1, 0)}
                        className="py-1 px-2 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        +1 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(3, 0)}
                        className="py-1 px-2 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        +3 Hari
                      </button>
                    </div>
                  </div>

                  {/* Custom Extend Inputs */}
                  <form onSubmit={handleManualExtendSubmit} className="space-y-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sesuaikan Durasi</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-0.5">HARI</label>
                        <input
                          type="number"
                          min="0"
                          value={extendDays}
                          onChange={(e) => setExtendDays(Math.max(0, parseInt(e.target.value) || 0))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-0.5">JAM</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={extendHours}
                          onChange={(e) => setExtendHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-0.5">MENIT</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={extendMinutes}
                          onChange={(e) => setExtendMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Tambahkan Durasi Custom
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {canWriteCurrent && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReturnToPondok(rec.id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Kembali</span>
                  </button>
                  {!rec.isCabut && (
                    <button
                      type="button"
                      onClick={() => setShowExtend(!showExtend)}
                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all active:scale-98"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Tambah Durasi</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!rec.isCabut && (
                    <button
                      type="button"
                      onClick={() => onRevokeIzin(rec.id)}
                      className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all active:scale-98"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Cabut Izin</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeletePerizinan(rec.id)}
                    className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all active:scale-98"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  let partsT = dateStr.split('T');
  let actualDateStr = partsT[0];
  let timeStr = partsT[1] || '';

  if (!timeStr && actualDateStr.includes(' ')) {
    const spaceParts = actualDateStr.split(' ');
    actualDateStr = spaceParts[0];
    timeStr = spaceParts[1] || '';
  }

  if (!timeStr) {
    timeStr = '08:00';
  }

  const parts = actualDateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10).toString();
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const monthName = months[monthIdx] || parts[1];
  const formattedDate = `${day} ${monthName} ${year}`;

  const timeParts = timeStr.split(':');
  if (timeParts.length >= 2) {
    return `${formattedDate} ${timeParts[0]}:${timeParts[1]}`;
  }
  return formattedDate;
}

function formatIndonesianDateOnly(dateStr: string): string {
  if (!dateStr) return '';
  let partsT = dateStr.split('T');
  let actualDateStr = partsT[0];
  if (actualDateStr.includes(' ')) {
    actualDateStr = actualDateStr.split(' ')[0];
  }
  const parts = actualDateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10).toString();
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const monthName = months[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
}

function getYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYYYYMMDDTHHMM(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hours}:${minutes}`;
}

function isRecordForStudent(
  rec: { namaSantri?: string; santriId?: string },
  student: { nama?: string; id?: string }
): boolean {
  if (rec.santriId && student.id) {
    return rec.santriId === student.id;
  }
  const recName = (rec.namaSantri || '').trim().toLowerCase();
  const studName = (student.nama || '').trim().toLowerCase();
  if (!recName || !studName) return false;
  return recName === studName;
}

function findStudentForRecord(
  rec: { namaSantri?: string; santriId?: string },
  students: Santri[]
): Santri | undefined {
  if (rec.santriId) {
    const s = students.find(x => x.id === rec.santriId);
    if (s) return s;
  }
  const recName = (rec.namaSantri || '').trim().toLowerCase();
  if (!recName) return undefined;
  return students.find(x => (x.nama || '').trim().toLowerCase() === recName);
}

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
}

function DateTimePicker({
  value,
  onChange,
  min
}: DateTimePickerProps) {
  const [day, setDay] = useState('dd');
  const [month, setMonth] = useState('mm');
  const [year, setYear] = useState('tttt');
  const [hour, setHour] = useState('jj');
  const [minute, setMinute] = useState('mn');

  const [activeSegment, setActiveSegment] = useState<'day' | 'month' | 'year' | 'hour' | 'minute' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      const [datePart, timePart] = value.split('T');
      const [y, m, d] = datePart.split('-');
      const [h, minPart] = timePart.split(':');
      setDay(d);
      setMonth(m);
      setYear(y);
      setHour(h);
      setMinute(minPart);
    } else if (!value) {
      setDay('dd');
      setMonth('mm');
      setYear('tttt');
      setHour('jj');
      setMinute('mn');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSegment(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateAndClampDateTime = (dStr: string, mStr: string, yStr: string, hStr: string, mnStr: string) => {
    let yNum = parseInt(yStr) || currentYear;
    let mNum = parseInt(mStr) || 1;
    let dNum = parseInt(dStr) || 1;
    let hNum = parseInt(hStr) || 0;
    let mnNum = parseInt(mnStr) || 0;

    if (mNum < 1) mNum = 1;
    if (mNum > 12) mNum = 12;

    if (yNum < 1900) yNum = 1900;
    if (yNum > currentYear + 15) yNum = currentYear + 15;

    const maxDays = new Date(yNum, mNum, 0).getDate();
    if (dNum < 1) dNum = 1;
    if (dNum > maxDays) dNum = maxDays;

    if (hNum < 0) hNum = 0;
    if (hNum > 23) hNum = 23;

    if (mnNum < 0) mnNum = 0;
    if (mnNum > 59) mnNum = 59;

    return {
      d: String(dNum).padStart(2, '0'),
      m: String(mNum).padStart(2, '0'),
      y: String(yNum).padStart(4, '0'),
      h: String(hNum).padStart(2, '0'),
      mn: String(mnNum).padStart(2, '0')
    };
  };

  const checkAndPublish = (dVal: string, mVal: string, yVal: string, hVal: string, mnVal: string) => {
    const dClean = dVal === 'dd' ? '' : dVal;
    const mClean = mVal === 'mm' ? '' : mVal;
    const yClean = yVal === 'tttt' ? '' : yVal;
    const hClean = hVal === 'jj' ? '' : hVal;
    const mnClean = mnVal === 'mn' ? '' : mnVal;

    if (dClean.length === 2 && mClean.length === 2 && yClean.length === 4 && hClean.length === 2 && mnClean.length === 2) {
      const { d, m, y, h, mn } = validateAndClampDateTime(dClean, mClean, yClean, hClean, mnClean);
      setDay(d);
      setMonth(m);
      setYear(y);
      setHour(h);
      setMinute(mn);
      onChange(`${y}-${m}-${d}T${h}:${mn}`);
    } else if (!dClean && !mClean && !yClean && !hClean && !mnClean) {
      onChange('');
    }
  };

  const formatSegmentOnBlurOrSwitch = (val: string, type: 'day' | 'month' | 'year' | 'hour' | 'minute') => {
    if (type === 'day') {
      if (!val || val === 'dd') return 'dd';
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 'dd';
      const clamped = Math.max(1, Math.min(31, parsed));
      return String(clamped).padStart(2, '0');
    }
    if (type === 'month') {
      if (!val || val === 'mm') return 'mm';
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 'mm';
      const clamped = Math.max(1, Math.min(12, parsed));
      return String(clamped).padStart(2, '0');
    }
    if (type === 'year') {
      if (!val || val === 'tttt') return 'tttt';
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 'tttt';
      let clamped = parsed;
      if (clamped < 1900) clamped = 1900;
      if (clamped > currentYear + 15) clamped = currentYear + 15;
      return String(clamped).padStart(4, '0');
    }
    if (type === 'hour') {
      if (!val || val === 'jj') return 'jj';
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 'jj';
      const clamped = Math.max(0, Math.min(23, parsed));
      return String(clamped).padStart(2, '0');
    }
    if (type === 'minute') {
      if (!val || val === 'mn') return 'mn';
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 'mn';
      const clamped = Math.max(0, Math.min(59, parsed));
      return String(clamped).padStart(2, '0');
    }
    return val;
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw.startsWith('dd')) raw = raw.replace('dd', '');
    else if (raw.endsWith('dd')) raw = raw.replace('dd', '');

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const dNum = parseInt(val);
      if (dNum >= 4) {
        const padded = '0' + val;
        setDay(padded);
        monthRef.current?.focus();
        checkAndPublish(padded, month, year, hour, minute);
        return;
      }
    } else if (val.length === 2) {
      let dNum = parseInt(val);
      if (dNum < 1) dNum = 1;
      if (dNum > 31) dNum = 31;
      const formatted = String(dNum).padStart(2, '0');
      setDay(formatted);
      monthRef.current?.focus();
      checkAndPublish(formatted, month, year, hour, minute);
      return;
    }
    setDay(val || 'dd');
    checkAndPublish(val || 'dd', month, year, hour, minute);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw.startsWith('mm')) raw = raw.replace('mm', '');
    else if (raw.endsWith('mm')) raw = raw.replace('mm', '');

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const mNum = parseInt(val);
      if (mNum >= 2) {
        const padded = '0' + val;
        setMonth(padded);
        yearRef.current?.focus();
        checkAndPublish(day, padded, year, hour, minute);
        return;
      }
    } else if (val.length === 2) {
      let mNum = parseInt(val);
      if (mNum < 1) mNum = 1;
      if (mNum > 12) mNum = 12;
      const formatted = String(mNum).padStart(2, '0');
      setMonth(formatted);
      yearRef.current?.focus();
      checkAndPublish(day, formatted, year, hour, minute);
      return;
    }
    setMonth(val || 'mm');
    checkAndPublish(day, val || 'mm', year, hour, minute);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw.startsWith('tttt')) raw = raw.replace('tttt', '');
    else if (raw.endsWith('tttt')) raw = raw.replace('tttt', '');

    let val = raw.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);

    setYear(val || 'tttt');
    if (val.length === 4) {
      hourRef.current?.focus();
      checkAndPublish(day, month, val, hour, minute);
    } else {
      if (value) onChange('');
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw.startsWith('jj')) raw = raw.replace('jj', '');
    else if (raw.endsWith('jj')) raw = raw.replace('jj', '');

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const hNum = parseInt(val);
      if (hNum >= 3) {
        const padded = '0' + val;
        setHour(padded);
        minuteRef.current?.focus();
        checkAndPublish(day, month, year, padded, minute);
        return;
      }
    } else if (val.length === 2) {
      let hNum = parseInt(val);
      if (hNum < 0) hNum = 0;
      if (hNum > 23) hNum = 23;
      const formatted = String(hNum).padStart(2, '0');
      setHour(formatted);
      minuteRef.current?.focus();
      checkAndPublish(day, month, year, formatted, minute);
      return;
    }
    setHour(val || 'jj');
    checkAndPublish(day, month, year, val || 'jj', minute);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw.startsWith('mn')) raw = raw.replace('mn', '');
    else if (raw.endsWith('mn')) raw = raw.replace('mn', '');

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const mnNum = parseInt(val);
      if (mnNum >= 6) {
        const padded = '0' + val;
        setMinute(padded);
        checkAndPublish(day, month, year, hour, padded);
        return;
      }
    } else if (val.length === 2) {
      let mnNum = parseInt(val);
      if (mnNum < 0) mnNum = 0;
      if (mnNum > 59) mnNum = 59;
      const formatted = String(mnNum).padStart(2, '0');
      setMinute(formatted);
      checkAndPublish(day, month, year, hour, formatted);
      return;
    }
    setMinute(val || 'mn');
    checkAndPublish(day, month, year, hour, val || 'mn');
  };

  const handleBlur = (type: 'day' | 'month' | 'year' | 'hour' | 'minute') => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (
        activeEl !== dayRef.current &&
        activeEl !== monthRef.current &&
        activeEl !== yearRef.current &&
        activeEl !== hourRef.current &&
        activeEl !== minuteRef.current
      ) {
        setActiveSegment(null);
      }

      if (type === 'day') {
        setDay(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'day');
          setTimeout(() => checkAndPublish(nextVal, month, year, hour, minute), 0);
          return nextVal;
        });
      } else if (type === 'month') {
        setMonth(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'month');
          setTimeout(() => checkAndPublish(day, nextVal, year, hour, minute), 0);
          return nextVal;
        });
      } else if (type === 'year') {
        setYear(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'year');
          setTimeout(() => checkAndPublish(day, month, nextVal, hour, minute), 0);
          return nextVal;
        });
      } else if (type === 'hour') {
        setHour(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'hour');
          setTimeout(() => checkAndPublish(day, month, year, nextVal, minute), 0);
          return nextVal;
        });
      } else if (type === 'minute') {
        setMinute(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'minute');
          setTimeout(() => checkAndPublish(day, month, year, hour, nextVal), 0);
          return nextVal;
        });
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, current: 'day' | 'month' | 'year' | 'hour' | 'minute') => {
    if (e.key === 'ArrowRight') {
      if (current === 'day') {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (current === 'month') {
        e.preventDefault();
        yearRef.current?.focus();
      } else if (current === 'year') {
        e.preventDefault();
        hourRef.current?.focus();
      } else if (current === 'hour') {
        e.preventDefault();
        minuteRef.current?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (current === 'month') {
        e.preventDefault();
        dayRef.current?.focus();
      } else if (current === 'year') {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (current === 'hour') {
        e.preventDefault();
        yearRef.current?.focus();
      } else if (current === 'minute') {
        e.preventDefault();
        hourRef.current?.focus();
      }
    } else if (e.key === 'Backspace') {
      const target = e.target as HTMLInputElement;
      if (target.value === '' || target.value === 'dd' || target.value === 'mm' || target.value === 'tttt' || target.value === 'jj' || target.value === 'mn') {
        if (current === 'month') {
          e.preventDefault();
          dayRef.current?.focus();
          const nextDay = day === 'dd' ? '' : day.slice(0, -1);
          setDay(nextDay || 'dd');
          checkAndPublish(nextDay || 'dd', month, year, hour, minute);
        } else if (current === 'year') {
          e.preventDefault();
          monthRef.current?.focus();
          const nextMonth = month === 'mm' ? '' : month.slice(0, -1);
          setMonth(nextMonth || 'mm');
          checkAndPublish(day, nextMonth || 'mm', year, hour, minute);
        } else if (current === 'hour') {
          e.preventDefault();
          yearRef.current?.focus();
          const nextYear = year === 'tttt' ? '' : year.slice(0, -1);
          setYear(nextYear || 'tttt');
          checkAndPublish(day, month, nextYear || 'tttt', hour, minute);
        } else if (current === 'minute') {
          e.preventDefault();
          hourRef.current?.focus();
          const nextHour = hour === 'jj' ? '' : hour.slice(0, -1);
          setHour(nextHour || 'jj');
          checkAndPublish(day, month, year, nextHour || 'jj', minute);
        }
      }
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
      const [datePart, timePart] = val.split('T');
      const [y, m, d] = datePart.split('-');
      const [h, mn] = timePart.split(':');
      setDay(d);
      setMonth(m);
      setYear(y);
      setHour(h);
      setMinute(mn);
      onChange(val);
    } else {
      setDay('dd');
      setMonth('mm');
      setYear('tttt');
      setHour('jj');
      setMinute('mn');
      onChange('');
    }
  };

  const handleBoxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (document.activeElement === dayRef.current || 
        document.activeElement === monthRef.current || 
        document.activeElement === yearRef.current ||
        document.activeElement === hourRef.current ||
        document.activeElement === minuteRef.current) {
      return;
    }
    
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-btn')) {
      return;
    }

    dayRef.current?.focus();
  };

  return (
    <div 
      onClick={handleBoxClick}
      ref={containerRef}
      className={`flex items-center justify-between w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:bg-white cursor-text ${
        activeSegment !== null ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white' : 'border-slate-300 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-0.5 font-semibold text-slate-700 h-5 leading-none select-none">
        <input
          ref={dayRef}
          type="text"
          value={day}
          onChange={handleDayChange}
          onKeyDown={(e) => handleKeyDown(e, 'day')}
          onFocus={() => { 
            setActiveSegment('day'); 
            setTimeout(() => dayRef.current?.select(), 0); 
          }}
          onBlur={() => handleBlur('day')}
          className={`w-5 text-center bg-transparent border-none outline-none p-0 focus:text-indigo-600 focus:font-bold h-5 leading-none ${
            day === 'dd' ? 'text-slate-300 font-normal' : 'text-slate-800'
          }`}
        />
        <span className="text-slate-300 h-5 leading-none flex items-center">/</span>
        <input
          ref={monthRef}
          type="text"
          value={month}
          onChange={handleMonthChange}
          onKeyDown={(e) => handleKeyDown(e, 'month')}
          onFocus={() => { 
            setActiveSegment('month'); 
            setTimeout(() => monthRef.current?.select(), 0); 
          }}
          onBlur={() => handleBlur('month')}
          className={`w-5 text-center bg-transparent border-none outline-none p-0 focus:text-indigo-600 focus:font-bold h-5 leading-none ${
            month === 'mm' ? 'text-slate-300 font-normal' : 'text-slate-800'
          }`}
        />
        <span className="text-slate-300 h-5 leading-none flex items-center">/</span>
        <input
          ref={yearRef}
          type="text"
          value={year}
          onChange={handleYearChange}
          onKeyDown={(e) => handleKeyDown(e, 'year')}
          onFocus={() => { 
            setActiveSegment('year'); 
            setTimeout(() => yearRef.current?.select(), 0); 
          }}
          onBlur={() => handleBlur('year')}
          className={`w-8 text-center bg-transparent border-none outline-none p-0 focus:text-indigo-600 focus:font-bold h-5 leading-none ${
            year === 'tttt' ? 'text-slate-300 font-normal' : 'text-slate-800'
          }`}
        />
        
        <span className="text-slate-400 font-normal mx-1 h-5 leading-none flex items-center">-</span>

        <input
          ref={hourRef}
          type="text"
          value={hour}
          onChange={handleHourChange}
          onKeyDown={(e) => handleKeyDown(e, 'hour')}
          onFocus={() => { 
            setActiveSegment('hour'); 
            setTimeout(() => hourRef.current?.select(), 0); 
          }}
          onBlur={() => handleBlur('hour')}
          className={`w-5 text-center bg-transparent border-none outline-none p-0 focus:text-indigo-600 focus:font-bold h-5 leading-none ${
            hour === 'jj' ? 'text-slate-300 font-normal' : 'text-slate-800'
          }`}
        />
        <span className="text-slate-300 h-5 leading-none flex items-center">:</span>
        <input
          ref={minuteRef}
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onKeyDown={(e) => handleKeyDown(e, 'minute')}
          onFocus={() => { 
            setActiveSegment('minute'); 
            setTimeout(() => minuteRef.current?.select(), 0); 
          }}
          onBlur={() => handleBlur('minute')}
          className={`w-5 text-center bg-transparent border-none outline-none p-0 focus:text-indigo-600 focus:font-bold h-5 leading-none ${
            minute === 'mn' ? 'text-slate-300 font-normal' : 'text-slate-800'
          }`}
        />
      </div>

      <div className="interactive-btn relative p-0.5 rounded-md hover:bg-slate-100 hover:text-slate-600 text-slate-400 transition-colors flex items-center justify-center cursor-pointer w-5 h-5">
        <input
          type="datetime-local"
          value={value || ''}
          min={min}
          onChange={handleNativeChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <Calendar size={14} />
      </div>
    </div>
  );
}

function formatToDDMMYYYY(valStr: string): string {
  if (!valStr) return '';
  const cleanStr = valStr.replace('T', ' ');
  const parts = cleanStr.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '';
  
  const dParts = datePart.split('-');
  if (dParts.length !== 3) return valStr;
  
  const year = dParts[0];
  const month = dParts[1];
  const day = dParts[2];
  
  const formattedDate = `${day}/${month}/${year}`;
  if (timePart) {
    const tParts = timePart.split(':');
    return `${formattedDate} ${tParts[0]}:${tParts[1]}`;
  }
  return formattedDate;
}

function formatDuration(days: number, hours: number = 0, minutes: number = 0) {
  const parts = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);
  return parts.length > 0 ? parts.join(' ') : '0 Menit';
}

function getOrdinalIndonesian(num: number): string {
  const mapping: Record<number, string> = {
    1: "pertama",
    2: "kedua",
    3: "ketiga",
    4: "keempat",
    5: "kelima",
    6: "keenam",
    7: "ketujuh",
    8: "kedelapan",
    9: "kesembilan",
    10: "kesepuluh"
  };
  return `Pelanggaran ${mapping[num] || `ke-${num}`}`;
}

interface KeamananViewProps {
  keamananList: KeamananRecord[];
  onAddKeamanan: (newRec: KeamananRecord) => void;
  onDeleteKeamanan: (id: string) => void;
  santriList: Santri[];
  activeSubTab?: string;
  onChangeSubTab?: (tab: string) => void;
}

const DEFAULT_KATALOG: KatalogPelanggaranItem[] = [
  {
    id: 'PEL-001',
    nama: 'Membawa HP / Perangkat Elektronik Tanpa Izin',
    kategori: 'Berat',
    deskripsi: 'Membawa smartphone, laptop, tablet, konsol game, atau perangkat komunikasi/elektronik lainnya tanpa izin tertulis dari pengasuh pesantren.',
    defaultPoin: 15,
    defaultTazir: 'Penyitaan barang selama 1 bulan + menghafal Juz Amma (Surah An-Naba s.d Al-Inshiqaq)',
    rules: [
      { id: 'R2', kaliKe: 2, poin: 30, tazir: 'Penyitaan HP selama 3 bulan + menghafal Surah Al-Kahfi ayat 1-20' },
      { id: 'R3', kaliKe: 3, poin: 50, tazir: 'Penyitaan HP selamanya + pemanggilan orang tua & pembuatan surat perjanjian bermaterai' },
      { id: 'R4', kaliKe: 4, poin: 100, tazir: 'Sidang Majelis Pengasuh + Skorsing 1 minggu / Pemulangan paksa sementara' }
    ]
  },
  {
    id: 'PEL-002',
    nama: 'Tidak Mengikuti Sholat Berjamaah / Kegiatan Wajib',
    kategori: 'Ringan',
    deskripsi: 'Tidak hadir di masjid saat shalat fardhu berjamaah, pengajian kitab kuning, atau kegiatan wajib lainnya tanpa uzur syar\'i.',
    defaultPoin: 5,
    defaultTazir: 'Teguran lisan & berdiri di shaf belakang selama zikir',
    rules: [
      { id: 'R6', kaliKe: 2, poin: 10, tazir: 'Membersihkan tempat wudhu / teras masjid setelah shalat' },
      { id: 'R7', kaliKe: 3, poin: 20, tazir: 'Menulis kalimat istighfar sebanyak 100 kali + membersihkan kamar mandi kompleks' }
    ]
  },
  {
    id: 'PEL-003',
    nama: 'Keluar Lingkungan Pesantren Tanpa Izin (Bolos / Kabur)',
    kategori: 'Sangat Berat',
    deskripsi: 'Keluar dari batas area pesantren tanpa membawa surat izin tertulis (surat perizinan jalan) resmi dari bagian keamanan.',
    defaultPoin: 25,
    defaultTazir: 'Hukuman kebersihan lingkungan pondok selama 3 hari + menghafal Surah Yasin',
    rules: [
      { id: 'R9', kaliKe: 2, poin: 50, tazir: 'Gundul rambut (putra) + pemanggilan orang tua + kurungan asrama selama 2 hari' },
      { id: 'R10', kaliKe: 3, poin: 100, tazir: 'Sidang Majelis Pengasuh + Skorsing 1 bulan atau Diberhentikan' }
    ]
  },
  {
    id: 'PEL-004',
    nama: 'Merokok di Lingkungan Pesantren',
    kategori: 'Sedang',
    deskripsi: 'Mengonsumsi atau memiliki rokok, rokok elektrik (vape), pod, atau zat adiktif sejenis di dalam batas area pesantren.',
    defaultPoin: 15,
    defaultTazir: 'Membersihkan selokan kompleks asrama + menghafal Surah Al-Mulk',
    rules: [
      { id: 'R12', kaliKe: 2, poin: 30, tazir: 'Kerja bakti kebersihan massal + denda semen 2 sak untuk pembangunan' },
      { id: 'R13', kaliKe: 3, poin: 50, tazir: 'Pemanggilan orang tua + gundul rambut + surat pernyataan pemecatan bersyarat' }
    ]
  },
  {
    id: 'PEL-005',
    nama: 'Terlambat Kembali Setelah Perizinan Pulang',
    kategori: 'Ringan',
    deskripsi: 'Terlambat kembali ke pesantren melewati batas waktu yang tertera pada surat izin pulang tanpa alasan darurat atau konfirmasi wali.',
    defaultPoin: 5,
    defaultTazir: 'Teguran lisan + membersihkan halaman asrama',
    rules: [
      { id: 'R15', kaliKe: 2, poin: 10, tazir: 'Membersihkan kamar mandi asrama + menulis istighfar 100 kali' },
      { id: 'R16', kaliKe: 3, poin: 20, tazir: 'Penahanan surat izin keluar berikutnya selama 2 bulan + denda buku perpustakaan' }
    ]
  }
];

// Conduct indicator categorization based on points (dynamic based on period duration)
const getDisciplineIndicatorDynamic = (points: number, daysCount: number): { text: string; color: string; bg: string; border: string } => {
  const faktor = daysCount / 365;
  const batasBaik = Math.round(25 * faktor);
  const batasCukup = Math.round(40 * faktor);
  const batasKurang = Math.round(70 * faktor);
  const batasMbulet = Math.round(90 * faktor);

  if (points === 0) {
    return { 
      text: 'Sangat Baik', 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200' 
    };
  } else if (points <= batasBaik) {
    return { 
      text: 'Baik', 
      color: 'text-teal-700', 
      bg: 'bg-teal-50', 
      border: 'border-teal-200' 
    };
  } else if (points <= batasCukup) {
    return { 
      text: 'Cukup Baik', 
      color: 'text-amber-700', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200' 
    };
  } else if (points <= batasKurang) {
    return { 
      text: 'Kurang Baik', 
      color: 'text-orange-700', 
      bg: 'bg-orange-50', 
      border: 'border-orange-200' 
    };
  } else if (points <= batasMbulet) {
    return { 
      text: 'Mbulet', 
      color: 'text-rose-700', 
      bg: 'bg-rose-50', 
      border: 'border-rose-200' 
    };
  } else {
    return { 
      text: 'Mbulet Akut', 
      color: 'text-purple-700', 
      bg: 'bg-purple-50', 
      border: 'border-purple-200' 
    };
  }
};

export default function KeamananView({ 
  keamananList, 
  onAddKeamanan, 
  onDeleteKeamanan, 
  santriList = [],
  activeSubTab = 'catatan',
  onChangeSubTab
}: KeamananViewProps) {
  // 1. Load permissions first
  let canViewPutra = true;
  let canViewPutri = true;
  let canWritePutra = true;
  let canWritePutri = true;

  try {
    const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
    if (activeRole !== 'superadmin') {
      const permissionsStr = localStorage.getItem('smartsantri_roles_permissions');
      let roleObj;
      if (permissionsStr) {
        try {
          const parsedRoles = JSON.parse(permissionsStr);
          if (Array.isArray(parsedRoles)) {
            roleObj = parsedRoles.find((r: any) => r.id === activeRole);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!roleObj) {
        roleObj = DEFAULT_ROLES.find((r: any) => r.id === activeRole);
      }

      if (roleObj && roleObj.permissions) {
        canViewPutra = !!roleObj.permissions['keamanan_putra.view'];
        canViewPutri = !!roleObj.permissions['keamanan_putri.view'];
        canWritePutra = !!roleObj.permissions['keamanan_putra.write'];
        canWritePutri = !!roleObj.permissions['keamanan_putri.write'];
      } else {
        canViewPutra = false;
        canViewPutri = false;
        canWritePutra = false;
        canWritePutri = false;
      }
    }
  } catch (e) {
    console.error('Error parsing permissions in KeamananView:', e);
  }

  const canSwitchGender = canViewPutra && canViewPutri;

  const profile = getPesantrenProfile();
  // Map activeSubTab ('overview', 'catatan', 'riwayat', 'bukuinduk', or 'perizinan') to local active view
  const displayTab = activeSubTab === 'overview' ? 'overview' : activeSubTab === 'bukuinduk' ? 'katalog' : activeSubTab === 'riwayat' ? 'riwayat' : activeSubTab === 'perizinan' ? 'perizinan' : 'catatan';
  const [katalog, setKatalog] = useState<KatalogPelanggaranItem[]>([]);

  // Perizinan Submodule states
  const [perizinanList, setPerizinanList] = useState<PerizinanRecord[]>(() => {
    const saved = localStorage.getItem('smartsantri_perizinan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing perizinan', e);
      }
    }
    return INITIAL_PERIZINAN;
  });

  // Load perizinanList from Supabase with local storage fallback and set up background polling
  useEffect(() => {
    let isMounted = true;
    const loadPerizinan = async () => {
      try {
        const data = await fetchTableData<PerizinanRecord>('perizinan', 'smartsantri_perizinan', INITIAL_PERIZINAN);
        if (isMounted) {
          setPerizinanList(data);
        }
      } catch (err) {
        console.error("Gagal memuat data perizinan dari Supabase:", err);
      }
    };

    loadPerizinan();

    // Set up Realtime Websocket Sync
    let supabaseClient: any = null;
    let activeChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          console.warn("Supabase client is not initialized. Realtime sync is disabled.");
          return;
        }
        supabaseClient = supabase;
        if (!isMounted) return;

        const uniqueChannelName = `perizinan-db-changes-${Math.random().toString(36).substring(2, 9)}`;
        activeChannel = supabase.channel(uniqueChannelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'perizinan' }, (payload: any) => {
            console.log('Realtime perizinan:', payload);
            if (!isMounted) return;
            if (payload.eventType === 'INSERT') {
              const newRow = snakeToCamel(payload.new);
              setPerizinanList(prev => {
                if (prev.some(item => item.id === newRow.id)) {
                  return prev.map(item => item.id === newRow.id ? newRow : item);
                }
                return [newRow, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = snakeToCamel(payload.new);
              setPerizinanList(prev => prev.map(item => item.id === updatedRow.id ? updatedRow : item));
            } else if (payload.eventType === 'DELETE') {
              const oldId = payload.old.id;
              setPerizinanList(prev => prev.filter(item => item.id !== oldId));
            }
          })
          .subscribe();
      } catch (err) {
        console.error("Gagal memulai koneksi realtime perizinan:", err);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (supabaseClient && activeChannel) {
        supabaseClient.removeChannel(activeChannel);
      }
    };
  }, []);

  // Delete perizinan modal states
  const [deleteIzinModalOpen, setDeleteIzinModalOpen] = useState(false);
  const [deleteIzinId, setDeleteIzinId] = useState<string | null>(null);
  const [deleteIzinReason, setDeleteIzinReason] = useState<'salah_input' | 'lainnya'>('salah_input');
  const [deleteIzinCustomReason, setDeleteIzinCustomReason] = useState('');

  // Revoke perizinan modal states
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeIzinId, setRevokeIzinId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Dropdown & Detail Modal states
  const [activeDropdownStudentId, setActiveDropdownStudentId] = useState<string | null>(null);
  const [activeDropdownRiwayatId, setActiveDropdownRiwayatId] = useState<string | null>(null);
  const [viewingDetailSantri, setViewingDetailSantri] = useState<Santri | null>(null);
  const [viewingHistorySantri, setViewingHistorySantri] = useState<Santri | null>(null);
  const [expandedViolationId, setExpandedViolationId] = useState<string | null>(null);
  const [viewingRecordDetail, setViewingRecordDetail] = useState<KeamananRecord | null>(null);

  // Search & Filter state for 'santri' summary table (Like Kamar Santri view)
  const [searchSantri, setSearchSantri] = useState('');
  const [filterGender, setFilterGender] = useState<'Putra' | 'Putri'>(() => {
    if (canViewPutra && !canViewPutri) return 'Putra';
    if (!canViewPutra && canViewPutri) return 'Putri';
    const saved = localStorage.getItem('smartsantri_keamanan_gender');
    return (saved === 'Putra' || saved === 'Putri') ? saved : 'Putra';
  });

  const canWriteCurrent = (() => {
    if (filterGender === 'Putra') return canWritePutra;
    if (filterGender === 'Putri') return canWritePutri;
    return canWritePutra || canWritePutri;
  })();

  // Sync gender to localStorage
  useEffect(() => {
    localStorage.setItem('smartsantri_keamanan_gender', filterGender);
  }, [filterGender]);

  // Perizinan form states
  const [perizinanMode, setPerizinanMode] = useState<'resmi' | 'ilegal'>('resmi');
  const [selectedSantriIdForIzin, setSelectedSantriIdForIzin] = useState('');
  const [jenisIzin, setJenisIzin] = useState<string>('');
  const [tanggalMulaiIzin, setTanggalMulaiIzin] = useState(() => getYYYYMMDDTHHMM(new Date()));
  const [tanggalSelesaiIzin, setTanggalSelesaiIzin] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return getYYYYMMDDTHHMM(d);
  });
  const [keteranganIzin, setKeteranganIzin] = useState('');
  const [searchIzin, setSearchIzin] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'semua' | 'keluar' | 'masuk'>('semua');
  const handleJumpToHistoryDate = (selectedDateStr: string) => {
    if (!selectedDateStr) return;
    const container = document.getElementById('history-scroll-container');
    const element = document.getElementById(`history-group-${selectedDateStr}`);
    if (container && element) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: relativeTop - 8, behavior: 'smooth' });
    } else {
      alert(`Data untuk tanggal ${formatIndonesianDateOnly(selectedDateStr)} tidak ditemukan dalam daftar riwayat saat ini.`);
    }
  };
  const [searchActiveIzin, setSearchActiveIzin] = useState('');
  const [searchSantriForIzin, setSearchSantriForIzin] = useState('');
  const [showIzinSantriDropdown, setShowIzinSantriDropdown] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Preset perizinan list
  const [presetIzinList, setPresetIzinList] = useState<{nama: string, durasiDays: number, durasiHours?: number, durasiMinutes?: number}[]>(() => {
    const saved = localStorage.getItem('smartsantri_preset_izin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { nama: 'Pulang Bulanan', durasiDays: 3, durasiHours: 0, durasiMinutes: 0 },
      { nama: 'Sakit', durasiDays: 2, durasiHours: 0, durasiMinutes: 0 },
      { nama: 'Keperluan Keluarga', durasiDays: 3, durasiHours: 0, durasiMinutes: 0 },
      { nama: 'Lainnya', durasiDays: 1, durasiHours: 0, durasiMinutes: 0 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('smartsantri_preset_izin', JSON.stringify(presetIzinList));
  }, [presetIzinList]);

  // Modal Preset states
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState(false);
  const [newPresetNama, setNewPresetNama] = useState('');
  const [newPresetHari, setNewPresetHari] = useState(0);
  const [newPresetJam, setNewPresetJam] = useState(0);
  const [newPresetMenit, setNewPresetMenit] = useState(0);

  // Click outside references
  const izinDropdownRef = useRef<HTMLDivElement>(null);
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (izinDropdownRef.current && !izinDropdownRef.current.contains(event.target as Node)) {
        setShowIzinSantriDropdown(false);
      }
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter santri for Perizinan form candidates
  const filteredIzinCandidates = useMemo(() => {
    if (!searchSantriForIzin.trim()) return [];
    const activeOutNames = new Set(
      perizinanList
        .filter(p => p.status === 'Izin Aktif')
        .map(p => p.namaSantri)
    );
    const searchLower = searchSantriForIzin.toLowerCase();
    return santriList.filter(s => 
      s.statusKeanggotaan === 'Aktif' && 
      s.gender === filterGender && 
      !activeOutNames.has(s.nama) &&
      (
        (s.nama || '').toLowerCase().includes(searchLower) ||
        (s.nis && s.nis.toLowerCase().includes(searchLower))
      )
    ).slice(0, 5);
  }, [santriList, filterGender, searchSantriForIzin, perizinanList]);

  const handleAddPerizinan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriIdForIzin) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }
    const targetSantri = santriList.find(s => s.id === selectedSantriIdForIzin);
    if (!targetSantri) return;

    const isIlegal = perizinanMode === 'ilegal';

    if (!isIlegal && !jenisIzin) {
      alert('Silakan tentukan jenis izin terlebih dahulu.');
      return;
    }

    if (isIlegal && !keteranganIzin.trim()) {
      alert('Silakan isi keterangan / kronologi keluar ilegal.');
      return;
    }

    if (!isIlegal && tanggalSelesaiIzin && tanggalMulaiIzin && tanggalSelesaiIzin < tanggalMulaiIzin) {
      alert('Tanggal selesai tidak boleh kurang dari tanggal mulai.');
      return;
    }

    const newRecord: PerizinanRecord = {
      id: 'P-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      namaSantri: targetSantri.nama,
      kelas: targetSantri.kelas || 'Umum',
      kamar: targetSantri.kamar || 'Belum diatur',
      jenisIzin: isIlegal ? 'Lainnya' : (jenisIzin as any),
      tanggalMulai: tanggalMulaiIzin,
      tanggalSelesai: isIlegal ? tanggalMulaiIzin : tanggalSelesaiIzin,
      keterangan: isIlegal 
        ? (keteranganIzin.trim() || 'Keluar Ilegal / Kabur')
        : (jenisIzin.trim().toLowerCase().startsWith('izin') ? jenisIzin.trim() : 'Izin ' + jenisIzin.trim()),
      status: 'Izin Aktif',
      gender: targetSantri.gender,
      isCabut: isIlegal ? true : undefined,
      alasanCabut: isIlegal ? (keteranganIzin.trim() || 'Keluar Ilegal / Kabur') : undefined,
      tanggalCabut: isIlegal ? tanggalMulaiIzin : undefined,
      santriId: targetSantri.id,
      nis: targetSantri.nis
    };

    try {
      await insertTableRow<PerizinanRecord>('perizinan', 'smartsantri_perizinan', newRecord);
      setPerizinanList(prev => [newRecord, ...prev]);
      // reset form
      setSelectedSantriIdForIzin('');
      setKeteranganIzin('');
      setSearchSantriForIzin('');
    } catch (err: any) {
      alert(`Gagal menyimpan data perizinan ke database: ${err.message}`);
    }
  };

  const handleReturnToPondok = async (id: string) => {
    const originalRec = perizinanList.find(rec => rec.id === id);
    if (!originalRec) return;

    const nowStr = getYYYYMMDDTHHMM(new Date());
    let returnKeterangan = `Kembali ke Pondok dari Izin ${originalRec.jenisIzin}`;
    let returnExtra: Partial<PerizinanRecord> = {};

    if (originalRec.isCabut) {
      const startTime = new Date(originalRec.tanggalCabut || originalRec.tanggalMulai).getTime();
      const endTime = new Date().getTime();
      const diffMs = Math.max(0, endTime - startTime);
      
      const seconds = Math.floor((diffMs / 1000) % 60);
      const minutes = Math.floor((diffMs / 1000 / 60) % 60);
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const durationParts = [];
      if (days > 0) durationParts.push(`${days} hari`);
      if (hours > 0) durationParts.push(`${hours} jam`);
      if (minutes > 0 || durationParts.length === 0) durationParts.push(`${minutes} menit`);
      const durationStr = durationParts.join(' ');

      returnKeterangan = `Kembali ke Pondok (Keterangan: Keluar ilegal selama ${durationStr})`;
      returnExtra = {
        isCabut: true,
        alasanCabut: originalRec.alasanCabut,
        tanggalCabut: originalRec.tanggalCabut
      };
    }
    
    const newReturnRecord: PerizinanRecord = {
      id: 'P-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-KEM',
      namaSantri: originalRec.namaSantri,
      kelas: originalRec.kelas,
      kamar: originalRec.kamar,
      jenisIzin: originalRec.jenisIzin,
      tanggalMulai: originalRec.tanggalMulai,
      tanggalSelesai: originalRec.tanggalSelesai,
      keterangan: returnKeterangan,
      status: 'Sudah Kembali',
      tanggalKembali: nowStr,
      gender: originalRec.gender,
      ...returnExtra
    };

    try {
      await updateTableRow<PerizinanRecord>('perizinan', 'smartsantri_perizinan', id, { status: 'Keluar Selesai' as any });
      await insertTableRow<PerizinanRecord>('perizinan', 'smartsantri_perizinan', newReturnRecord);

      setPerizinanList(prev => {
        const updatedList = prev.map(rec => {
          if (rec.id === id) {
            return {
              ...rec,
              status: 'Keluar Selesai' as any
            };
          }
          return rec;
        });
        return [newReturnRecord, ...updatedList];
      });
    } catch (err: any) {
      alert(`Gagal menyimpan kepulangan ke database: ${err.message}`);
    }
  };

  const handleExtendDuration = async (id: string, days: number, hours: number, minutes: number, reason: string) => {
    const rec = perizinanList.find(r => r.id === id);
    if (!rec) return;

    const d = new Date(rec.tanggalSelesai);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    d.setMinutes(d.getMinutes() + minutes);

    const timeAddedParts = [];
    if (days > 0) timeAddedParts.push(`${days} Hari`);
    if (hours > 0) timeAddedParts.push(`${hours} Jam`);
    if (minutes > 0) timeAddedParts.push(`${minutes} Menit`);
    const timeAddedStr = timeAddedParts.join(' ');

    const now = new Date();
    const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const note = `\n[Perpanjang +${timeAddedStr} pada ${nowFormatted} - Alasan: ${reason}]`;
    const updatedData = {
      tanggalSelesai: getYYYYMMDDTHHMM(d),
      keterangan: rec.keterangan + note
    };

    try {
      await updateTableRow<PerizinanRecord>('perizinan', 'smartsantri_perizinan', id, updatedData);
      setPerizinanList(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            ...updatedData
          };
        }
        return r;
      }));
    } catch (err: any) {
      alert(`Gagal menyimpan perpanjangan izin di database: ${err.message}`);
    }
  };

  const confirmDeletePerizinan = (id: string) => {
    setDeleteIzinId(id);
    setDeleteIzinReason('salah_input');
    setDeleteIzinCustomReason('');
    setDeleteIzinModalOpen(true);
  };

  const handleExecuteDeletePerizinan = async () => {
    if (!deleteIzinId) return;
    
    let reasonText = '';
    if (deleteIzinReason === 'salah_input') {
      reasonText = 'Salah Input Data';
    } else {
      if (!deleteIzinCustomReason.trim()) {
        alert('Mohon isi alasan lainnya!');
        return;
      }
      reasonText = deleteIzinCustomReason.trim();
    }
    
    try {
      await deleteTableRow('perizinan', 'smartsantri_perizinan', deleteIzinId);
      setPerizinanList(prev => prev.filter(rec => rec.id !== deleteIzinId));
      alert(`Catatan perizinan berhasil dihapus dengan alasan: "${reasonText}"`);
      setDeleteIzinModalOpen(false);
      setDeleteIzinId(null);
    } catch (err: any) {
      alert(`Gagal menghapus data perizinan di database: ${err.message}`);
    }
  };

  const handleRevokeIzin = (id: string) => {
    setRevokeIzinId(id);
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const handleExecuteRevoke = async () => {
    if (!revokeIzinId) return;
    if (!revokeReason.trim()) {
      alert('Alasan pencabutan izin wajib diisi!');
      return;
    }
    
    const updatedData = {
      isCabut: true,
      alasanCabut: `Izin dicabut karena ${revokeReason.trim()}`,
      tanggalCabut: new Date().toISOString()
    };

    try {
      await updateTableRow<PerizinanRecord>('perizinan', 'smartsantri_perizinan', revokeIzinId, updatedData);
      setPerizinanList(prev => prev.map(rec => {
        if (rec.id === revokeIzinId) {
          return {
            ...rec,
            ...updatedData
          };
        }
        return rec;
      }));
      setRevokeModalOpen(false);
      setRevokeIzinId(null);
      alert('Izin berhasil dicabut! Status santri berubah menjadi keluar secara ilegal.');
    } catch (err: any) {
      alert(`Gagal mencabut izin di database: ${err.message}`);
    }
  };

  // Predefined periodes
  const PREDEFINED_PERIODES = useMemo(() => [
    { id: 'Semua', nama: 'Semua Periode' },
  ], []);

  const [periodes, setPeriodes] = useState<{ id: string; nama: string; startDate?: string; endDate?: string; }[]>(() => {
    const saved = localStorage.getItem('smartsantri_custom_periodes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return [...PREDEFINED_PERIODES, ...parsed];
        }
      } catch (e) {
        return PREDEFINED_PERIODES;
      }
    }
    return PREDEFINED_PERIODES;
  });

  const [selectedPeriode, setSelectedPeriode] = useState<string>('Semua');

  useEffect(() => {
    let isMounted = true;
    const loadPeriods = async (isFirstLoad: boolean) => {
      try {
        const data = await fetchTableData<{ id: string; nama: string; startDate?: string; endDate?: string; isActive?: boolean }>('periode', 'smartsantri_custom_periodes');
        if (!isMounted) return;
        const customOnly = data.filter(p => p.id !== 'Semua');
        setPeriodes([...PREDEFINED_PERIODES, ...customOnly]);

        if (isFirstLoad) {
          const activeP = data.find(p => p.isActive);
          if (activeP) {
            setSelectedPeriode(activeP.id);
          } else {
            setSelectedPeriode('Semua');
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi data periode dengan database Supabase:", err);
      }
    };
    
    loadPeriods(true);

    // Set up Realtime Websocket Sync
    let supabaseClient: any = null;
    let activeChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          console.warn("Supabase client is not initialized. Realtime sync is disabled.");
          return;
        }
        supabaseClient = supabase;
        if (!isMounted) return;

        const uniqueChannelName = `periode-db-changes-${Math.random().toString(36).substring(2, 9)}`;
        activeChannel = supabase.channel(uniqueChannelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'periode' }, (payload: any) => {
            console.log('Realtime periode:', payload);
            if (!isMounted) return;
            if (payload.eventType === 'INSERT') {
              const newRow = snakeToCamel(payload.new);
              setPeriodes(prev => {
                const customOnly = prev.filter(p => p.id !== 'Semua');
                if (customOnly.some(item => item.id === newRow.id)) {
                  const updatedCustom = customOnly.map(item => item.id === newRow.id ? newRow : item);
                  return [...PREDEFINED_PERIODES, ...updatedCustom];
                }
                return [...PREDEFINED_PERIODES, ...customOnly, newRow];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = snakeToCamel(payload.new);
              setPeriodes(prev => {
                const customOnly = prev.filter(p => p.id !== 'Semua');
                const updatedCustom = customOnly.map(item => item.id === updatedRow.id ? updatedRow : item);
                return [...PREDEFINED_PERIODES, ...updatedCustom];
              });
              if (updatedRow.isActive) {
                setSelectedPeriode(updatedRow.id);
              }
            } else if (payload.eventType === 'DELETE') {
              const oldId = payload.old.id;
              setPeriodes(prev => {
                const customOnly = prev.filter(p => p.id !== 'Semua' && p.id !== oldId);
                return [...PREDEFINED_PERIODES, ...customOnly];
              });
              setSelectedPeriode(prev => prev === oldId ? 'Semua' : prev);
            }
          })
          .subscribe();
      } catch (err) {
        console.error("Gagal memulai koneksi realtime periode:", err);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (supabaseClient && activeChannel) {
        supabaseClient.removeChannel(activeChannel);
      }
    };
  }, [PREDEFINED_PERIODES]);
  const activePeriodeObj = useMemo(() => {
    return periodes.find(p => p.id === selectedPeriode && p.startDate && p.endDate);
  }, [selectedPeriode, periodes]);
  const hasActivePeriode = !!activePeriodeObj;
  const canRecord = hasActivePeriode || selectedPeriode === 'Semua';

  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isPeriodConfigModalOpen, setIsPeriodConfigModalOpen] = useState(false);

  const [pendingSelectedPeriode, setPendingSelectedPeriode] = useState<string>('Semua');
  const [editingPeriode, setEditingPeriode] = useState<{ id: string; nama: string; startDate?: string; endDate?: string; } | null>(null);
  const [showPeriodConfirmDialog, setShowPeriodConfirmDialog] = useState(false);

  const [isPeriodeModalOpen, setIsPeriodeModalOpen] = useState(false);
  const [newPeriodeNama, setNewPeriodeNama] = useState('');
  const [newPeriodeStart, setNewPeriodeStart] = useState('');
  const [newPeriodeEnd, setNewPeriodeEnd] = useState('');
  const [periodeError, setPeriodeError] = useState('');

  // Sync pending selected period with the actual selected period when modal opens
  useEffect(() => {
    if (isPeriodConfigModalOpen) {
      setPendingSelectedPeriode(selectedPeriode);
    }
  }, [isPeriodConfigModalOpen, selectedPeriode]);

  const handleSavePeriode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodeNama) return;

    if (!newPeriodeStart || !newPeriodeEnd) {
      setPeriodeError('Silakan lengkapi Tanggal Mulai dan Tanggal Selesai.');
      return;
    }

    if (newPeriodeEnd < newPeriodeStart) {
      setPeriodeError('Tanggal Selesai tidak boleh kurang dari Tanggal Mulai.');
      return;
    }

    setPeriodeError('');
    
    const customOnly = periodes.filter(p => !PREDEFINED_PERIODES.some(pre => pre.id === p.id));
    
    if (editingPeriode) {
      // Edit mode
      const updatedItem = {
        nama: newPeriodeNama,
        startDate: newPeriodeStart || undefined,
        endDate: newPeriodeEnd || undefined
      };
      try {
        await updateTableRow<{ id: string; nama: string; startDate?: string; endDate?: string; isActive?: boolean }>('periode', 'smartsantri_custom_periodes', editingPeriode.id, updatedItem);
        const updatedCustom = customOnly.map(p => {
          if (p.id === editingPeriode.id) {
            return {
              ...p,
              ...updatedItem
            };
          }
          return p;
        });
        setPeriodes([...PREDEFINED_PERIODES, ...updatedCustom]);
        setEditingPeriode(null);
      } catch (err: any) {
        setPeriodeError(`Gagal memperbarui database: ${err.message}`);
        return;
      }
    } else {
      // Create mode
      const newId = 'P-' + String(Date.now()).slice(-4);
      const newPeriode = {
        id: newId,
        nama: newPeriodeNama,
        startDate: newPeriodeStart || undefined,
        endDate: newPeriodeEnd || undefined,
        isActive: false
      };
      try {
        await insertTableRow<{ id: string; nama: string; startDate?: string; endDate?: string; isActive?: boolean }>('periode', 'smartsantri_custom_periodes', newPeriode);
        const updatedCustom = [...customOnly, newPeriode];
        setPeriodes([...PREDEFINED_PERIODES, ...updatedCustom]);
        setPendingSelectedPeriode(newId);
      } catch (err: any) {
        setPeriodeError(`Gagal menyimpan ke database: ${err.message}`);
        return;
      }
    }
    
    // Close modal & reset
    setIsPeriodeModalOpen(false);
    setNewPeriodeNama('');
    setNewPeriodeStart('');
    setNewPeriodeEnd('');
  };

  const handleDeletePeriode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (PREDEFINED_PERIODES.some(pre => pre.id === id)) return;
    
    const targetPeriod = periodes.find(p => p.id === id);
    const namaPeriode = targetPeriod ? targetPeriod.nama : 'periode kustom ini';

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Periode Kustom',
      message: `Apakah Anda yakin ingin menghapus periode "${namaPeriode}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          await deleteTableRow('periode', 'smartsantri_custom_periodes', id);
          const updated = periodes.filter(p => p.id !== id);
          setPeriodes(updated);

          if (selectedPeriode === id) {
            setSelectedPeriode('Semua');
          }
          if (pendingSelectedPeriode === id) {
            setPendingSelectedPeriode('Semua');
          }
        } catch (err: any) {
          alert(`Gagal menghapus periode: ${err.message}`);
        }
        
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditPeriode = (p: { id: string; nama: string; startDate?: string; endDate?: string; }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPeriode(p);
    setNewPeriodeNama(p.nama);
    setNewPeriodeStart(p.startDate ? p.startDate.slice(0, 10) : '');
    setNewPeriodeEnd(p.endDate ? p.endDate.slice(0, 10) : '');
    setPeriodeError('');
    setIsPeriodeModalOpen(true);
  };

  const openAddPeriodeModal = () => {
    setEditingPeriode(null);
    setNewPeriodeNama('');
    setNewPeriodeStart('');
    setNewPeriodeEnd('');
    setPeriodeError('');
    setIsPeriodeModalOpen(true);
  };

  // Filtered keamananList based on selected period with quick filter slider options
  const [riwayatPeriodOption, setRiwayatPeriodOption] = useState<"Semua" | "Hari Ini" | "7 Hari" | "30 Hari" | "Custom">("Semua");
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [highlightedRiwayatId, setHighlightedRiwayatId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      from: today,
      to: today
    };
  });

  const activeKeamananList = useMemo(() => {
    let list = keamananList;

    // Filter by selectedPeriode if it is not 'Semua'
    if (selectedPeriode !== 'Semua') {
      const activeP = periodes.find(p => p.id === selectedPeriode);
      if (activeP && activeP.startDate && activeP.endDate) {
        list = list.filter(rec => rec.tanggal >= activeP.startDate! && rec.tanggal <= activeP.endDate!);
      }
    }

    // Apply quick filter riwayatPeriodOption if selectedPeriode is 'Semua'
    if (selectedPeriode === 'Semua') {
      if (riwayatPeriodOption === 'Hari Ini') {
        const todayDate = new Date();
        const todayStr = getYYYYMMDD(todayDate);
        list = list.filter(rec => rec.tanggal === todayStr);
      } else if (riwayatPeriodOption === '7 Hari') {
        const todayDate = new Date();
        const todayStr = getYYYYMMDD(todayDate);
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(todayDate.getDate() - 7);
        const sevenDaysAgoStr = getYYYYMMDD(sevenDaysAgo);
        list = list.filter(rec => {
          return rec.tanggal >= sevenDaysAgoStr && rec.tanggal <= todayStr;
        });
      } else if (riwayatPeriodOption === '30 Hari') {
        const todayDate = new Date();
        const todayStr = getYYYYMMDD(todayDate);
        const thirtyDaysAgo = new Date(todayDate);
        thirtyDaysAgo.setDate(todayDate.getDate() - 30);
        const thirtyDaysAgoStr = getYYYYMMDD(thirtyDaysAgo);
        list = list.filter(rec => {
          return rec.tanggal >= thirtyDaysAgoStr && rec.tanggal <= todayStr;
        });
      } else if (riwayatPeriodOption === 'Custom') {
        if (customDateRange && customDateRange.from) {
          const fromStr = getYYYYMMDD(customDateRange.from);
          const toStr = customDateRange.to 
            ? getYYYYMMDD(customDateRange.to) 
            : fromStr;
          list = list.filter(rec => {
            return rec.tanggal >= fromStr && rec.tanggal <= toStr;
          });
        }
      }
    }

    return list;
  }, [keamananList, selectedPeriode, periodes, riwayatPeriodOption, customDateRange]);

  // Hitung jumlah hari aktif dari filter periode terpilih secara dinamis
  const activeDaysCount = useMemo(() => {
    let startDateStr = '';
    let endDateStr = '';

    if (selectedPeriode !== 'Semua') {
      const activeP = periodes.find(p => p.id === selectedPeriode);
      if (activeP && activeP.startDate && activeP.endDate) {
        startDateStr = activeP.startDate;
        endDateStr = activeP.endDate;
      }
    } else {
      if (riwayatPeriodOption === 'Hari Ini') {
        const todayStr = getYYYYMMDD(new Date());
        startDateStr = todayStr;
        endDateStr = todayStr;
      } else if (riwayatPeriodOption === '7 Hari') {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        startDateStr = getYYYYMMDD(sevenDaysAgo);
        endDateStr = getYYYYMMDD(today);
      } else if (riwayatPeriodOption === '30 Hari') {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        startDateStr = getYYYYMMDD(thirtyDaysAgo);
        endDateStr = getYYYYMMDD(today);
      } else if (riwayatPeriodOption === 'Custom') {
        if (customDateRange && customDateRange.from) {
          startDateStr = getYYYYMMDD(customDateRange.from);
          endDateStr = customDateRange.to ? getYYYYMMDD(customDateRange.to) : startDateStr;
        }
      } else {
        // 'Semua' - cari dari data keamananList
        if (keamananList.length > 0) {
          const dates = keamananList.map(rec => rec.tanggal).filter(Boolean).sort();
          if (dates.length > 0) {
            startDateStr = dates[0];
            endDateStr = dates[dates.length - 1];
          }
        }
      }
    }

    if (startDateStr && endDateStr) {
      try {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 365;
      } catch (e) {
        return 365;
      }
    }

    return 365; // fallback 1 tahun
  }, [selectedPeriode, periodes, riwayatPeriodOption, customDateRange, keamananList]);

  // Pembungkus fungsi indikator kedisiplinan lokal yang reaktif terhadap activeDaysCount
  const getDisciplineIndicator = useCallback((points: number) => {
    return getDisciplineIndicatorDynamic(points, activeDaysCount);
  }, [activeDaysCount]);

  const [filterClass, setFilterClass] = useState<string>('Semua');
  const [filterIndicator, setFilterIndicator] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Aktif');
  const [filterKamar, setFilterKamar] = useState<string>('Semua');
  const [showCatatanFilters, setShowCatatanFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [showPageJumpDropdown, setShowPageJumpDropdown] = useState(false);
  const [sortKey, setSortKey] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search & Filter state for 'kasus' chronological table
  const [searchRiwayat, setSearchRiwayat] = useState('');
  const [filterKategoriRiwayat, setFilterKategoriRiwayat] = useState<string>('Semua');
  const [isTingkatDropdownOpen, setIsTingkatDropdownOpen] = useState(false);

  // Search & Filter state for 'katalog' table
  const [searchKatalog, setSearchKatalog] = useState('');
  const [filterKategoriKatalog, setFilterKategoriKatalog] = useState<string>('Semua');
  const [bukuIndukGender, setBukuIndukGender] = useState<'Putra' | 'Putri'>(() => {
    if (canViewPutra && !canViewPutri) return 'Putra';
    if (!canViewPutra && canViewPutri) return 'Putri';
    const saved = localStorage.getItem('smartsantri_buku_induk_gender');
    return (saved === 'Putra' || saved === 'Putri') ? saved : 'Putra';
  });

  const canWriteBukuInduk = (() => {
    if (bukuIndukGender === 'Putra') return canWritePutra;
    if (bukuIndukGender === 'Putri') return canWritePutri;
    return canWritePutra || canWritePutri;
  })();
  const [expandedKatalog, setExpandedKatalog] = useState<Record<string, boolean>>({});

  // Sync gender to localStorage
  useEffect(() => {
    localStorage.setItem('smartsantri_buku_induk_gender', bukuIndukGender);
  }, [bukuIndukGender]);

  const handleExportExcelXML = (filename: string, sheetName: string, headers: string[], rows: string[][]) => {
    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach(row => {
        const val = row[colIndex];
        const valLen = val ? String(val).length : 0;
        if (valLen > maxLen) {
          maxLen = valLen;
        }
      });
      return Math.max(maxLen * 7.2 + 25, 65);
    });

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#334155"/>
   <Interior/>
   <NumberFormat ss:Format="@"/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>`;

    colWidths.forEach(width => {
      xml += `\n   <Column ss:Width="${width.toFixed(0)}"/>`;
    });

    xml += `\n   <Row ss:Height="26">`;
    headers.forEach(header => {
      xml += `\n    <Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>`;
    });
    xml += `\n   </Row>`;

    rows.forEach(row => {
      xml += `\n   <Row ss:Height="20">`;
      row.forEach(val => {
        const cleanVal = String(val || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        xml += `\n    <Cell><Data ss:Type="String">${cleanVal}</Data></Cell>`;
      });
      xml += `\n   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportExcelCatatan = () => {
    const headers = [
      'No',
      'Nama Santri',
      'NIS',
      'Alamat',
      'Status Keaktifan',
      'Jumlah Pelanggaran',
      'Total Poin Sanksi',
      'Indikator Kedisiplinan'
    ];

    const rows = sortedSantriList.map((student, idx) => {
      const stats = getStudentStats(student.nama, student.id);
      const ind = getDisciplineIndicator(stats.points);
      const alamatStr = [student.desa, student.kecamatan, student.kabupaten].filter(Boolean).join(', ') || '-';
      
      return [
        String(idx + 1),
        student.nama,
        student.nis || '-',
        alamatStr,
        student.status || 'Aktif',
        String(stats.count),
        String(stats.points),
        ind.text
      ];
    });

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    handleExportExcelXML(
      `Buku_Induk_Pelanggaran_${filterGender}_${dateStr}.xls`,
      `Buku Induk ${filterGender}`,
      headers,
      rows
    );
  };

  const handleExportExcelOverview = () => {
    const totalKasus = activeKeamananList.filter(rec => {
      const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
      return !student || student.gender === filterGender;
    }).length;

    const totalPoin = activeKeamananList.filter(rec => {
      const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
      return !student || student.gender === filterGender;
    }).reduce((acc, curr) => acc + curr.poin, 0);

    const pelanggaranTerbanyak = (() => {
      const list = activeKeamananList.filter(rec => {
        const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
        return !student || student.gender === filterGender;
      });
      const counts: { [key: string]: number } = {};
      list.forEach(rec => { counts[rec.jenisPelanggaran] = (counts[rec.jenisPelanggaran] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : 'Belum ada data';
    })();

    const activePeriodName = periodes.find(p => p.id === selectedPeriode)?.nama || 'Semua Periode';
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const formattedDate = formatIndonesianDateOnly(dateStr);

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <!-- Default / Normal Body Style -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat ss:Format="@"/>
   <Protection/>
  </Style>

  <!-- Centered body text -->
  <Style ss:ID="CenterText">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
  </Style>

  <!-- Zebra light gray row background -->
  <Style ss:ID="ZebraRow">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>

  <!-- Zebra centered light gray row background -->
  <Style ss:ID="ZebraCenterText">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>

  <!-- Main Report Title -->
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#047857"/>
  </Style>

  <!-- Subtitle with report parameters -->
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
  </Style>

  <!-- Modern emerald green header bar for sections -->
  <Style ss:ID="SectionHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
  </Style>

  <!-- Standard table column header -->
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
  </Style>

  <!-- KPI card label style -->
  <Style ss:ID="KpiLabel">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>

  <!-- KPI general value style -->
  <Style ss:ID="KpiValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>

  <!-- KPI red warning value style (e.g. for high points) -->
  <Style ss:ID="KpiValueDanger">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
  </Style>

  <!-- KPI green success value style (e.g. for types) -->
  <Style ss:ID="KpiValueSuccess">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
  </Style>

  <!-- Status indicators (Aman, Peringatan, Bahaya) -->
  <Style ss:ID="StatusAman">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="StatusPeringatan">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="StatusBahaya">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>

  <!-- Signatures styles -->
  <Style ss:ID="SignatureTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#334155"/>
  </Style>

  <Style ss:ID="SignatureRole">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#475569"/>
  </Style>

  <Style ss:ID="SignatureName">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Overview Keamanan">
  <Table>
   <Column ss:Width="45"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>

   <!-- Title -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">LAPORAN OVERVIEW KEAMANAN &amp; KEDISIPLINAN SANTRI</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="6" ss:StyleID="SubTitle"><Data ss:Type="String">Pondok Pesantren ${profile.namaPesantren || 'SMARTSANTRI'} | Gender: ${filterGender} | Periode: ${activePeriodName} | Tanggal Cetak: ${formattedDate}</Data></Cell>
   </Row>
   <Row ss:Height="15"/>

   <!-- Section 1: Ringkasan Statistik -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="SectionHeader"><Data ss:Type="String">I. RINGKASAN STATISTIK UTAMA</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">TOTAL KASUS PELANGGARAN</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">AKUMULASI POIN SANKSI</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiLabel"><Data ss:Type="String">PELANGGARAN PALING SERING</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValue"><Data ss:Type="String">${totalKasus} Kasus</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValueDanger"><Data ss:Type="String">${totalPoin} Poin</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueSuccess"><Data ss:Type="String">${pelanggaranTerbanyak}</Data></Cell>
   </Row>
   <Row ss:Height="20"/>

   <!-- Section 2: Top 5 Santri Paling Melanggar -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="SectionHeader"><Data ss:Type="String">II. TOP 5 SANTRI DENGAN PELANGGARAN TERTINGGI</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rank</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Santri</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kelas</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kamar</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Jumlah Kasus</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Poin</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status Kedisiplinan</Data></Cell>
   </Row>`;

    if (topViolators.length === 0) {
      xml += `\n   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="CenterText"><Data ss:Type="String">Tidak ada data pelanggaran pada periode ini.</Data></Cell>
   </Row>`;
    } else {
      topViolators.forEach((item, idx) => {
        const discipline = getDisciplineIndicator(item.points);
        const isZebra = idx % 2 === 1;
        const rowStyle = isZebra ? 'ZebraRow' : 'Default';
        const centerStyle = isZebra ? 'ZebraCenterText' : 'CenterText';
        const statusStyle = item.points < 15 ? 'StatusAman' : item.points < 50 ? 'StatusPeringatan' : 'StatusBahaya';

        xml += `\n   <Row ss:Height="22">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${item.nama}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${item.santri?.kelas || '-'}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${item.santri?.kamar || '-'}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${item.count} Kasus</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${item.points} Poin</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${discipline.text}</Data></Cell>
   </Row>`;
      });
    }

    xml += `\n   <Row ss:Height="20"/>

   <!-- Section 3: Grafik / Frekuensi Pelanggaran Terbanyak -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="SectionHeader"><Data ss:Type="String">III. DIAGRAM/FREKUENSI PELANGGARAN PALING SERING</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="Header"><Data ss:Type="String">Bentuk Pelanggaran</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="Header"><Data ss:Type="String">Frekuensi Kasus</Data></Cell>
   </Row>`;

    if (violationsChartData.length === 0) {
      xml += `\n   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="CenterText"><Data ss:Type="String">Belum ada data grafik pelanggaran pada periode ini.</Data></Cell>
   </Row>`;
    } else {
      violationsChartData.forEach((item, idx) => {
        const isZebra = idx % 2 === 1;
        const rowStyle = isZebra ? 'ZebraRow' : 'Default';
        const centerStyle = isZebra ? 'ZebraCenterText' : 'CenterText';

        xml += `\n   <Row ss:Height="22">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${idx + 1}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="${rowStyle}"><Data ss:Type="String">${item.name}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="${centerStyle}"><Data ss:Type="String">${item.count} Kali</Data></Cell>
   </Row>`;
      });
    }

    xml += `\n   <Row ss:Height="24"/>
   <Row ss:Height="24"/>

   <!-- Section 4: Tanda Tangan Formal -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="SignatureTitle"><Data ss:Type="String">Mengetahui,</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="SignatureTitle"><Data ss:Type="String">${profile.kotaTandaTangan || 'Semarang'}, ${formattedDate}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="SignatureRole"><Data ss:Type="String">Ketua Pondok</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="SignatureRole"><Data ss:Type="String">Ketua Keamanan</Data></Cell>
   </Row>
   <Row ss:Height="24"/>
   <Row ss:Height="24"/>
   <Row ss:Height="24"/>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="SignatureName"><Data ss:Type="String">${profile.namaKetuaPondok && profile.namaKetuaPondok.trim() ? profile.namaKetuaPondok.trim() : '_________________________'}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="SignatureName"><Data ss:Type="String">${profile.namaKetuaKeamanan && profile.namaKetuaKeamanan.trim() ? profile.namaKetuaKeamanan.trim() : '_________________________'}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Overview_Keamanan_${filterGender}_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDFKeamanan = () => {
    const activePeriodName = periodes.find(p => p.id === selectedPeriode)?.nama || 'Semua Periode';
    const formattedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const printedBy = localStorage.getItem('smartsantri_username') || 'Petugas Keamanan';

    const logoHTML = profile.logoUrl && profile.logoUrl.trim()
      ? `<img src="${profile.logoUrl.trim()}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" referrerPolicy="no-referrer" />`
      : `<svg viewBox="0 0 100 100" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="#1e293b" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <path d="M50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30 Z" fill="#1e293b" />
          <path d="M50 35 L53 43 L62 43 L55 48 L58 56 L50 51 L42 56 L45 48 L38 43 L47 43 Z" fill="#ffffff" />
        </svg>`;

    const contactParts = [];
    if (profile.telepon && profile.telepon.trim()) {
      contactParts.push(`Telp: ${profile.telepon.trim()}`);
    }
    if (profile.email && profile.email.trim()) {
      contactParts.push(`Email: ${profile.email.trim()}`);
    }
    if (profile.website && profile.website.trim()) {
      contactParts.push(`Web: ${profile.website.trim()}`);
    }
    const contactHTML = contactParts.length > 0 ? contactParts.join(' | ') : '';

    // Calculate stats
    const totalKasus = activeKeamananList.filter(rec => {
      const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
      return !student || student.gender === filterGender;
    }).length;

    const totalPoin = activeKeamananList.filter(rec => {
      const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
      return !student || student.gender === filterGender;
    }).reduce((acc, curr) => acc + curr.poin, 0);

    const pelanggaranTerbanyak = (() => {
      const list = activeKeamananList.filter(rec => {
        const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
        return !student || student.gender === filterGender;
      });
      const counts: { [key: string]: number } = {};
      list.forEach(rec => { counts[rec.jenisPelanggaran] = (counts[rec.jenisPelanggaran] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : 'Belum ada data';
    })();

    // HTML Building
    let reportContentHTML = '';

    if (displayTab === 'overview') {
      // Top 5 violators rows
      let violatorsRowsHTML = '';
      if (topViolators.length === 0) {
        violatorsRowsHTML = `
          <tr>
            <td colspan="7" class="p-2 text-center text-slate-400 italic" style="border: 1px solid #cbd5e1;">
              Tidak ada data pelanggaran pada periode ini.
            </td>
          </tr>
        `;
      } else {
        topViolators.forEach((item, idx) => {
          const discipline = getDisciplineIndicator(item.points);
          violatorsRowsHTML += `
            <tr>
              <td class="p-2 text-center font-mono" style="border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td class="p-2 font-black" style="border: 1px solid #cbd5e1;">${item.nama}</td>
              <td class="p-2 text-center" style="border: 1px solid #cbd5e1;">${item.santri?.kelas || '-'}</td>
              <td class="p-2 text-center" style="border: 1px solid #cbd5e1;">${item.santri?.kamar || '-'}</td>
              <td class="p-2 text-center text-rose-600 font-black" style="border: 1px solid #cbd5e1;">${item.count} Kasus</td>
              <td class="p-2 text-center font-black" style="border: 1px solid #cbd5e1;">${item.points} Poin</td>
              <td class="p-2 text-center" style="border: 1px solid #cbd5e1;">${discipline.text}</td>
            </tr>
          `;
        });
      }

      // Chart visual bars
      let chartHTML = '';
      if (violationsChartData.length === 0) {
        chartHTML = `<p class="text-center text-slate-400 italic py-6">Belum ada data grafik pelanggaran pada periode ini.</p>`;
      } else {
        chartHTML = '<div class="space-y-3.5">';
        violationsChartData.forEach((item, index) => {
          const maxVal = Math.max(...violationsChartData.map(v => v.count)) || 1;
          const percentage = Math.min(100, Math.max(8, (item.count / maxVal) * 100));
          const color = [
            '#f43f5e', '#f59e0b', '#ec4899', '#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6'
          ][index % 8];
          chartHTML += `
            <div class="space-y-1 text-xs" style="margin-bottom: 12px;">
              <div class="flex justify-between font-bold text-slate-700" style="display: flex; justify-content: space-between;">
                <span>${item.name}</span>
                <span class="font-mono text-rose-600 font-black" style="font-family: monospace; color: #be123c;">${item.count} Kali</span>
              </div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
              </div>
            </div>
          `;
        });
        chartHTML += '</div>';
      }

      reportContentHTML = `
        <div class="space-y-6">
          <!-- Section 1: Quick Stats -->
          <div class="space-y-3" style="margin-bottom: 24px;">
            <h3 class="text-sm font-extrabold uppercase text-slate-800 border-b pb-1" style="font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px;">I. RINGKASAN STATISTIK UTAMA</h3>
            <div class="grid grid-cols-3 gap-4" style="display: flex; gap: 16px;">
              <div class="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50" style="flex: 1; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; background-color: #f8fafc;">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block" style="font-size: 10px; color: #64748b; text-transform: uppercase;">Total Kasus Pelanggaran</span>
                <span class="text-xl font-black text-slate-800 mt-1 block" style="font-size: 20px; font-weight: 900; margin-top: 4px; display: block;">${totalKasus} Kasus</span>
              </div>
              <div class="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50" style="flex: 1; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; background-color: #f8fafc;">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block" style="font-size: 10px; color: #64748b; text-transform: uppercase;">Akumulasi Poin Sanksi</span>
                <span class="text-xl font-black text-rose-700 mt-1 block" style="font-size: 20px; font-weight: 900; color: #be123c; margin-top: 4px; display: block;">${totalPoin} Poin</span>
              </div>
              <div class="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50" style="flex: 1; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; background-color: #f8fafc;">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block" style="font-size: 10px; color: #64748b; text-transform: uppercase;">Pelanggaran Terbanyak</span>
                <span class="text-xs font-black text-slate-800 mt-1 block truncate" style="font-size: 12px; font-weight: 800; margin-top: 4px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pelanggaranTerbanyak}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Top 5 Violators -->
          <div class="space-y-3" style="margin-bottom: 24px;">
            <h3 class="text-sm font-extrabold uppercase text-slate-800 border-b pb-1" style="font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px;">II. TOP 5 SANTRI DENGAN PELANGGARAN TERTINGGI</h3>
            <table class="w-full border-collapse border border-slate-300 text-left text-xs" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 12px;">
              <thead>
                <tr class="bg-slate-100 font-bold text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <th class="p-2 text-center w-12" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 48px;">No</th>
                  <th class="p-2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Nama Santri</th>
                  <th class="p-2 text-center" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Kelas</th>
                  <th class="p-2 text-center" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Kamar</th>
                  <th class="p-2 text-center" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Jumlah Kasus</th>
                  <th class="p-2 text-center" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Total Poin Sanksi</th>
                  <th class="p-2 text-center" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Status Kedisiplinan</th>
                </tr>
              </thead>
              <tbody class="font-semibold text-slate-800" style="font-weight: 600; color: #1e293b;">
                ${violatorsRowsHTML}
              </tbody>
            </table>
          </div>

          <!-- Section 3: Visual Chart -->
          <div class="space-y-3" style="margin-bottom: 24px;">
            <h3 class="text-sm font-extrabold uppercase text-slate-800 border-b pb-1" style="font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px;">III. DIAGRAM/FREKUENSI PELANGGARAN PALING SERING</h3>
            <div class="border border-slate-200 p-5 rounded-2xl bg-white space-y-4" style="border: 1px solid #cbd5e1; padding: 20px; border-radius: 16px; background-color: white;">
              ${chartHTML}
            </div>
          </div>
        </div>
      `;
    } else {
      // displayTab === 'catatan'
      let santriRowsHTML = '';
      if (sortedSantriList.length === 0) {
        santriRowsHTML = `
          <tr>
            <td colspan="8" class="p-4 text-center text-slate-400 italic" style="border: 1px solid #cbd5e1;">
              Tidak ada data santri ditemukan.
            </td>
          </tr>
        `;
      } else {
        sortedSantriList.forEach((student, idx) => {
          const stats = getStudentStats(student.nama, student.id);
          const ind = getDisciplineIndicator(stats.points);
          const alamatStr = [student.desa, student.kecamatan, student.kabupaten].filter(Boolean).join(', ') || '-';
          santriRowsHTML += `
            <tr>
              <td class="p-1-5 text-center font-mono" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace;">${idx + 1}</td>
              <td class="p-1-5 font-bold text-slate-900" style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #0f172a;">${student.nama}</td>
              <td class="p-1-5 text-center font-mono" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace;">${student.nis || '-'}</td>
              <td class="p-1-5 truncate max-w-[150px]" style="border: 1px solid #cbd5e1; padding: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${alamatStr}</td>
              <td class="p-1-5 text-center" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${student.status || 'Aktif'}</td>
              <td class="p-1-5 text-center" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${stats.count}</td>
              <td class="p-1-5 text-center font-bold text-rose-700" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: #be123c;">${stats.points}</td>
              <td class="p-1-5 text-center" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${ind.text}</td>
            </tr>
          `;
        });
      }

      reportContentHTML = `
        <div class="space-y-6">
          <!-- Section 1: Buku Induk -->
          <div class="space-y-3">
            <h3 class="text-sm font-extrabold uppercase text-slate-800 border-b pb-1" style="font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px;">I. DAFTAR DATA INDUK PELANGGARAN SANTRI</h3>
            <table class="w-full border-collapse border border-slate-300 text-left text-[10px]" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px;">
              <thead>
                <tr class="bg-slate-100 font-bold text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <th class="p-2 text-center w-8" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 32px;">No</th>
                  <th class="p-2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Nama Lengkap</th>
                  <th class="p-2 text-center w-20" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 80px;">NIS</th>
                  <th class="p-2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Alamat / Asal</th>
                  <th class="p-2 text-center w-20" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 80px;">Status</th>
                  <th class="p-2 text-center w-12" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 48px;">Kasus</th>
                  <th class="p-2 text-center w-16" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 64px;">Poin Sanksi</th>
                  <th class="p-2 text-center w-20" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 80px;">Kedisiplinan</th>
                </tr>
              </thead>
              <tbody class="font-semibold text-slate-800" style="font-weight: 600; color: #1e293b;">
                ${santriRowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const html = `
      <html>
      <head>
        <title>${displayTab === 'overview' ? 'Overview' : 'Buku Induk'} Keamanan - ${profile.namaPesantren}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: auto;
            margin: 1.5cm;
          }
          body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background: white;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.5px; }
          .tracking-wide { letter-spacing: 0.5px; }
          
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-cols: 1fr 1fr; }
          .grid-cols-3 { grid-template-cols: 1fr 1fr 1fr; }
          .gap-4 { gap: 16px; }
          .gap-12 { gap: 48px; }
          
          .border-b-4 { border-bottom: 4px solid #1e293b; }
          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border { border: 1px solid #cbd5e1; }
          .p-4 { padding: 16px; }
          .p-2 { padding: 8px; }
          .p-1-5 { padding: 6px; }
          .pb-4 { padding-bottom: 16px; }
          .pb-1 { padding-bottom: 4px; }
          .pt-12 { padding-top: 48px; }
          
          .bg-slate-50\\/50 { background-color: #f8fafc; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .rounded-xl { border-radius: 12px; }
          .rounded-2xl { border-radius: 16px; }
          .border-slate-200 { border-color: #e2e8f0; }
          .border-slate-300 { border-color: #cbd5e1; }
          .text-slate-400 { color: #94a3b8; }
          .text-slate-500 { color: #64748b; }
          .text-slate-600 { color: #475569; }
          .text-slate-700 { color: #334155; }
          .text-slate-800 { color: #1e293b; }
          .text-slate-900 { color: #0f172a; }
          .text-rose-600 { color: #e11d48; }
          .text-rose-700 { color: #be123c; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .text-lg { font-size: 16px; }
          .text-xl { font-size: 18px; }
          .text-2xl { font-size: 22px; }
          .block { display: block; }
          .inline-block { display: inline-block; }
          .min-w-\\[180px\\] { min-width: 180px; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .max-w-\\[150px\\] { max-width: 150px; }
          .w-8 { width: 32px; }
          .w-12 { width: 48px; }
          .w-16 { width: 64px; }
          .w-20 { width: 80px; }
          .w-full { width: 100%; }
          .border-collapse { border-collapse: collapse; }
          
          .logo-box {
            height: 60px;
            width: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
          }
          .logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          
          .bar-container {
            width: 100%;
            height: 12px;
            background: #f1f5f9;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            margin-top: 4px;
            margin-bottom: 8px;
          }
          .bar-fill {
            height: 100%;
            border-radius: 0 4px 4px 0;
          }
        </style>
      </head>
      <body>
        <div style="margin: 0; padding: 0;">
          <!-- Letterhead (Kop Surat) -->
          <div style="display: flex; align-items: center; border-bottom: 4px solid #1e293b; padding-bottom: 16px;">
            <div class="logo-box">
              ${logoHTML}
            </div>
            <div style="text-align: left; flex: 1;">
              ${profile.namaYayasan && profile.namaYayasan.trim() ? `<span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block;">${profile.namaYayasan}</span>` : ''}
              <h2 style="font-size: 22px; font-weight: 900; color: #1e293b; text-transform: uppercase; margin: 4px 0 0 0;">${profile.namaPesantren || 'SMARTSANTRI'}</h2>
              <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; line-height: 1.4;">
                ${[
                  profile.alamat,
                  profile.desa ? `Ds. ${profile.desa}` : '',
                  profile.kecamatan ? `Kec. ${profile.kecamatan}` : '',
                  profile.kabupaten ? `Kab. ${profile.kabupaten}` : '',
                  profile.provinsi
                ].filter(Boolean).join(', ')}
              </p>
              ${contactHTML ? `<p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; font-family: monospace; letter-spacing: -0.2px;">${contactHTML}</p>` : ''}
            </div>
          </div>

          <!-- Report Title -->
          <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
            <h1 style="font-size: 18px; font-weight: 900; color: #1e293b; text-transform: uppercase; margin: 0;">
              ${displayTab === 'overview' 
                ? 'LAPORAN OVERVIEW KEAMANAN & KEDISIPLINAN SANTRI' 
                : 'LAPORAN BUKU INDUK DATA PELANGGARAN & KEDISIPLINAN SANTRI'}
            </h1>
            <p style="font-size: 12px; font-weight: 600; color: #475569; margin: 4px 0 0 0;">
              Kategori Gender: <span style="font-weight: 900; color: #0f172a;">${filterGender}</span> | Periode: <span style="font-weight: 900; color: #0f172a;">${activePeriodName}</span>
            </p>
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">
              Tanggal Cetak: ${formattedDate} | Dicetak oleh: ${printedBy}
            </p>
          </div>

          ${reportContentHTML}

          <!-- Signature Section -->
          <div style="margin-top: 48px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; text-align: center;">
            <div style="width: 45%;">
              <p style="margin: 0; font-weight: bold;">Mengetahui,</p>
              <p style="margin: 4px 0 64px 0; font-weight: bold; font-size: 11px; color: #475569; text-transform: uppercase;">Ketua Pondok</p>
              <div>
                <p style="border-bottom: 1px solid #1e293b; margin: 0; display: inline-block; min-width: 180px; font-weight: 800; padding-bottom: 4px;">${profile.namaKetuaPondok && profile.namaKetuaPondok.trim() ? profile.namaKetuaPondok.trim() : '_________________________'}</p>
              </div>
            </div>
            <div style="width: 45%;">
              <p style="margin: 0;">${profile.kotaTandaTangan || 'Semarang'}, ${formattedDate}</p>
              <p style="margin: 4px 0 64px 0; font-weight: bold; font-size: 11px; color: #475569; text-transform: uppercase;">Ketua Keamanan</p>
              <div>
                <p style="border-bottom: 1px solid #1e293b; margin: 0; display: inline-block; min-width: 180px; font-weight: 800; padding-bottom: 4px;">${profile.namaKetuaKeamanan && profile.namaKetuaKeamanan.trim() ? profile.namaKetuaKeamanan.trim() : '_________________________'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Gagal membuka jendela cetak. Pop-up mungkin diblokir oleh peramban Anda.');
    }
  };


  // Modal states: Log Violation
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSearchSantri, setLogSearchSantri] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [selectedKatalogItem, setSelectedKatalogItem] = useState<KatalogPelanggaranItem | null>(null);
  const [logTanggal, setLogTanggal] = useState(() => getYYYYMMDD(new Date()));
  const [logPoin, setLogPoin] = useState<number>(0);
  const [logTindakan, setLogTindakan] = useState('');
  const [showSantriDropdown, setShowSantriDropdown] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState<number>(0);
  const [selectedCustomViolation, setSelectedCustomViolation] = useState(false);
  const [customViolationName, setCustomViolationName] = useState('');
  const [katalogSearchQuery, setKatalogSearchQuery] = useState('');
  const [showKatalogDropdown, setShowKatalogDropdown] = useState(false);

  const studentSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target as Node)) {
        setShowSantriDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Modal states: Print Disciplinary Card (Kartu Disiplin)
  const [printingSantri, setPrintingSantri] = useState<Santri | null>(null);

  // Modal states: Add/Edit Catalog Item
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogToEdit, setCatalogToEdit] = useState<KatalogPelanggaranItem | null>(null);
  const [catNama, setCatNama] = useState('');
  const [catKategori, setCatKategori] = useState<'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat'>('Ringan');
  const [catDeskripsi, setCatDeskripsi] = useState('');
  const [catDefaultPoin, setCatDefaultPoin] = useState<number>(10);
  const [catDefaultTazir, setCatDefaultTazir] = useState('');
  const [catRules, setCatRules] = useState<RuleRepetisi[]>([]);
  const [catRepetitionStrategy, setCatRepetitionStrategy] = useState<'repeat_1_2' | 'same_as_2' | 'custom'>('same_as_2');

  // Detailed modal for catalog item
  const [selectedCatalogDetail, setSelectedCatalogDetail] = useState<KatalogPelanggaranItem | null>(null);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);

  // General Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalActive = !!(
      isLogModalOpen ||
      isCatalogModalOpen ||
      isPeriodConfigModalOpen ||
      isPeriodeModalOpen ||
      isAddPresetModalOpen ||
      deleteIzinModalOpen ||
      revokeModalOpen ||
      selectedCatalogDetail ||
      viewingDetailSantri ||
      printingSantri ||
      viewingRecordDetail ||
      viewingHistorySantri
    );

    if (isAnyModalActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isLogModalOpen,
    isCatalogModalOpen,
    isPeriodConfigModalOpen,
    isPeriodeModalOpen,
    isAddPresetModalOpen,
    deleteIzinModalOpen,
    revokeModalOpen,
    selectedCatalogDetail,
    viewingDetailSantri,
    printingSantri,
    viewingRecordDetail,
    viewingHistorySantri
  ]);

  // Load / Save Katalog Sanksi
  useEffect(() => {
    let isMounted = true;
    const loadKatalog = async () => {
      try {
        const data = await fetchTableData<KatalogPelanggaranItem>('katalog_pelanggaran', 'smartsantri_katalog_pelanggaran', DEFAULT_KATALOG);
        if (isMounted && data && data.length > 0) {
          setKatalog(data);
        }
      } catch (err) {
        console.error("Gagal memuat katalog pelanggaran (Buku Induk) dari Supabase:", err);
      }
    };

    loadKatalog();

    // Set up Realtime Websocket Sync
    let supabaseClient: any = null;
    let activeChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          console.warn("Supabase client is not initialized. Realtime sync is disabled.");
          return;
        }
        supabaseClient = supabase;
        if (!isMounted) return;

        const uniqueChannelName = `katalog-db-changes-${Math.random().toString(36).substring(2, 9)}`;
        activeChannel = supabase.channel(uniqueChannelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'katalog_pelanggaran' }, (payload: any) => {
            console.log('Realtime katalog_pelanggaran:', payload);
            if (!isMounted) return;
            if (payload.eventType === 'INSERT') {
              const newRow = snakeToCamel(payload.new);
              setKatalog(prev => {
                if (prev.some(item => item.id === newRow.id)) {
                  return prev.map(item => item.id === newRow.id ? newRow : item);
                }
                return [...prev, newRow];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = snakeToCamel(payload.new);
              setKatalog(prev => prev.map(item => item.id === updatedRow.id ? updatedRow : item));
            } else if (payload.eventType === 'DELETE') {
              const oldId = payload.old.id;
              setKatalog(prev => prev.filter(item => item.id !== oldId));
            }
          })
          .subscribe();
      } catch (err) {
        console.error("Gagal memulai koneksi realtime katalog_pelanggaran:", err);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (supabaseClient && activeChannel) {
        supabaseClient.removeChannel(activeChannel);
      }
    };
  }, []);

  const saveKatalogToStorage = (updatedList: KatalogPelanggaranItem[]) => {
    setKatalog(updatedList);
    localStorage.setItem('smartsantri_katalog_pelanggaran', JSON.stringify(updatedList));
  };

  const triggerConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Hapus') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText
    });
  };

  // Autocalculate repetition rules when creating new record
  useEffect(() => {
    if (selectedSantri && selectedKatalogItem) {
      let filteredList = keamananList;
      if (selectedPeriode !== 'Semua') {
        const activeP = periodes.find(p => p.id === selectedPeriode);
        if (activeP && activeP.startDate && activeP.endDate) {
          filteredList = filteredList.filter(
            rec => rec.tanggal >= activeP.startDate! && rec.tanggal <= activeP.endDate!
          );
        }
      }
      const prevCount = filteredList.filter(
        rec => isRecordForStudent(rec, selectedSantri) &&
               rec.jenisPelanggaran.toLowerCase() === selectedKatalogItem.nama.toLowerCase()
      ).length;

      setOccurrenceCount(prevCount);
      const nextOccurrence = prevCount + 1;

      let finalPoin = selectedKatalogItem.defaultPoin;
      let finalTazir = selectedKatalogItem.defaultTazir;

      const matchedRule = selectedKatalogItem.rules.find(r => r.kaliKe === nextOccurrence);
      if (matchedRule) {
        finalPoin = matchedRule.poin;
        finalTazir = matchedRule.tazir || selectedKatalogItem.defaultTazir;
      } else {
        // No exact match found, apply Strategy based on rules
        const sorted = [...selectedKatalogItem.rules].sort((a, b) => a.kaliKe - b.kaliKe);
        const strategy = selectedKatalogItem.repetitionStrategy || 'same_as_2';

        const hasCustomStrategy = strategy === 'custom';
        const sequentialRules = hasCustomStrategy 
          ? sorted.slice(0, -1) 
          : sorted;
        const highestSequentialKali = sequentialRules.length > 0 
          ? sequentialRules[sequentialRules.length - 1].kaliKe 
          : 1;

        if (strategy === 'same_as_2') {
          // Same as highest defined sequential rule
          const highestRule = sorted[sorted.length - 1];
          if (highestRule) {
            finalPoin = highestRule.poin;
            finalTazir = highestRule.tazir || selectedKatalogItem.defaultTazir;
          } else {
            finalPoin = selectedKatalogItem.defaultPoin;
            finalTazir = selectedKatalogItem.defaultTazir;
          }
        } else if (strategy === 'repeat_1_2') {
          const phaseLength = highestSequentialKali;
          const activeStep = ((nextOccurrence - 1) % phaseLength) + 1;
          
          if (activeStep === 1) {
            finalPoin = selectedKatalogItem.defaultPoin;
            finalTazir = selectedKatalogItem.defaultTazir + " (Siklus Kali ke-1)";
          } else {
            const matchedActiveRule = selectedKatalogItem.rules.find(r => r.kaliKe === activeStep);
            if (matchedActiveRule) {
              finalPoin = matchedActiveRule.poin;
              finalTazir = (matchedActiveRule.tazir || selectedKatalogItem.defaultTazir) + ` (Siklus Kali ke-${activeStep})`;
            } else {
              finalPoin = selectedKatalogItem.defaultPoin;
              finalTazir = selectedKatalogItem.defaultTazir + ` (Siklus Kali ke-${activeStep})`;
            }
          }
        } else {
          // 'custom': Use the highest rule defined (which is the custom rule at highest_kali_ke)
          const highestRule = sorted[sorted.length - 1];
          if (highestRule) {
            finalPoin = highestRule.poin;
            finalTazir = highestRule.tazir || selectedKatalogItem.defaultTazir;
          } else {
            finalPoin = selectedKatalogItem.defaultPoin;
            finalTazir = selectedKatalogItem.defaultTazir;
          }
        }
      }

      setLogPoin(finalPoin);
      setLogTindakan(finalTazir);
    } else if (selectedKatalogItem) {
      setOccurrenceCount(0);
      setLogPoin(selectedKatalogItem.defaultPoin);
      setLogTindakan(selectedKatalogItem.defaultTazir);
    } else {
      setOccurrenceCount(0);
      if (!selectedCustomViolation) {
        setLogPoin(0);
        setLogTindakan('');
      }
    }
  }, [selectedSantri, selectedKatalogItem, keamananList, selectedCustomViolation, selectedPeriode, periodes]);

  // Reset all modal fields when modal is closed, and clamp date when opened
  useEffect(() => {
    if (isLogModalOpen) {
      const todayStr = getYYYYMMDD(new Date());
      let defaultDate = todayStr;
      if (hasActivePeriode && activePeriodeObj && activePeriodeObj.startDate && activePeriodeObj.endDate) {
        if (todayStr >= activePeriodeObj.startDate && todayStr <= activePeriodeObj.endDate) {
          defaultDate = todayStr;
        } else if (todayStr < activePeriodeObj.startDate) {
          defaultDate = activePeriodeObj.startDate;
        } else {
          defaultDate = activePeriodeObj.endDate;
        }
      }
      setLogTanggal(defaultDate);
    } else {
      setSelectedSantri(null);
      setSelectedKatalogItem(null);
      setLogSearchSantri('');
      setCustomViolationName('');
      setKatalogSearchQuery('');
      setSelectedCustomViolation(false);
      setLogPoin(0);
      setLogTindakan('');
      setShowSantriDropdown(false);
      setShowKatalogDropdown(false);
    }
  }, [isLogModalOpen, hasActivePeriode, activePeriodeObj]);

  // Filtered katalog items based on search query
  const filteredKatalogItems = useMemo(() => {
    const q = katalogSearchQuery.toLowerCase().trim();
    if (!q) return katalog;
    return katalog.filter(item => 
      (item.nama || '').toLowerCase().includes(q) || 
      (item.kategori || '').toLowerCase().includes(q)
    );
  }, [katalog, katalogSearchQuery]);

  // Submit recorded violation
  const handleRecordViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;

    let violationName = '';
    if (selectedCustomViolation) {
      if (!customViolationName.trim()) return;
      violationName = customViolationName.trim();
    } else {
      if (!selectedKatalogItem) return;
      violationName = selectedKatalogItem.nama;
    }

    const newRecord: KeamananRecord = {
      id: 'K' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
      namaSantri: selectedSantri.nama,
      kamar: selectedSantri.kamar || 'Belum diatur kamar',
      jenisPelanggaran: violationName,
      tanggal: logTanggal,
      tindakan: logTindakan || 'Teguran lisan mendidik',
      poin: Number(logPoin) || 0,
      santriId: selectedSantri.id,
      nis: selectedSantri.nis
    };

    onAddKeamanan(newRecord);
    setIsLogModalOpen(false);

    // Reset fields
    setSelectedSantri(null);
    setSelectedKatalogItem(null);
    setLogSearchSantri('');
    setCustomViolationName('');
    setSelectedCustomViolation(false);
    setLogPoin(0);
    setLogTindakan('');
  };

  // Save or edit catalog item
  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNama.trim()) return;

    const sortedRules = [...catRules]
      .filter(r => r.kaliKe > 0)
      .sort((a, b) => a.kaliKe - b.kaliKe);

    if (catalogToEdit) {
      const updatedItemFields = {
        nama: catNama.trim(),
        kategori: catKategori,
        deskripsi: catDeskripsi.trim() || undefined,
        defaultPoin: Number(catDefaultPoin),
        defaultTazir: catDefaultTazir.trim(),
        rules: sortedRules,
        repetitionStrategy: catRepetitionStrategy,
        gender: catalogToEdit.gender || bukuIndukGender
      };

      try {
        await updateTableRow<KatalogPelanggaranItem>('katalog_pelanggaran', 'smartsantri_katalog_pelanggaran', catalogToEdit.id, updatedItemFields);
        const updatedList = katalog.map(item => {
          if (item.id === catalogToEdit.id) {
            return {
              ...item,
              ...updatedItemFields
            };
          }
          return item;
        });
        setKatalog(updatedList);
      } catch (err: any) {
        alert(`Gagal memperbarui item katalog di database: ${err.message}`);
        return;
      }
    } else {
      const newItem: KatalogPelanggaranItem = {
        id: 'PEL-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
        nama: catNama.trim(),
        kategori: catKategori,
        deskripsi: catDeskripsi.trim() || undefined,
        defaultPoin: Number(catDefaultPoin),
        defaultTazir: catDefaultTazir.trim(),
        rules: sortedRules,
        repetitionStrategy: catRepetitionStrategy,
        gender: bukuIndukGender
      };

      try {
        await insertTableRow<KatalogPelanggaranItem>('katalog_pelanggaran', 'smartsantri_katalog_pelanggaran', newItem);
        setKatalog(prev => [newItem, ...prev]);
      } catch (err: any) {
        alert(`Gagal menyimpan item katalog baru di database: ${err.message}`);
        return;
      }
    }

    setIsCatalogModalOpen(false);
    setCatalogToEdit(null);
    setCatNama('');
    setCatDeskripsi('');
    setCatDefaultPoin(10);
    setCatDefaultTazir('');
    setCatRules([]);
    setCatRepetitionStrategy('same_as_2');
  };

  // Repetitions helper
  const addRepetitionRule = () => {
    if (catRules.length === 0) {
      const rule2: RuleRepetisi = {
        id: 'R-2-' + Math.random().toString(36).slice(-4),
        kaliKe: 2,
        poin: catDefaultPoin * 2,
        tazir: ''
      };
      setCatRules([rule2]);
      setCatRepetitionStrategy('same_as_2');
    } else {
      const maxKali = Math.max(...catRules.map(r => r.kaliKe), 1);
      const nextKali = maxKali + 1;
      const newRule: RuleRepetisi = {
        id: 'R-' + nextKali + '-' + Math.random().toString(36).slice(-4),
        kaliKe: nextKali,
        poin: catDefaultPoin * nextKali,
        tazir: ''
      };
      setCatRules([...catRules, newRule]);
    }
  };

  const updateRepetitionRule = (id: string, field: keyof RuleRepetisi, value: any) => {
    setCatRules(catRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRepetitionRule = (id: string) => {
    const remaining = catRules.filter(r => r.id !== id);
    const reindexed = remaining
      .sort((a, b) => a.kaliKe - b.kaliKe)
      .map((r, index) => ({
        ...r,
        kaliKe: index + 2
      }));
    setCatRules(reindexed);
  };

  const handleStrategyChange = (newStrategy: 'repeat_1_2' | 'same_as_2' | 'custom') => {
    setCatRepetitionStrategy(newStrategy);
    if (newStrategy === 'custom') {
      const maxKali = catRules.length > 0 ? Math.max(...catRules.map(r => r.kaliKe)) : 1;
      const nextKali = maxKali + 1;
      const exists = catRules.some(r => r.kaliKe === nextKali);
      if (!exists) {
        const customRule: RuleRepetisi = {
          id: 'R-' + nextKali + '-' + Math.random().toString(36).slice(-4),
          kaliKe: nextKali,
          poin: catDefaultPoin * nextKali,
          tazir: ''
        };
        setCatRules([...catRules, customRule]);
      }
    } else {
      if (catRepetitionStrategy === 'custom') {
        const sorted = [...catRules].sort((a, b) => a.kaliKe - b.kaliKe);
        if (sorted.length > 0) {
          const highest = sorted[sorted.length - 1];
          setCatRules(catRules.filter(r => r.id !== highest.id));
        }
      }
    }
  };

  const updateRuleValue = (kaliKe: number, field: 'poin' | 'tazir', value: any) => {
    let exists = catRules.some(r => r.kaliKe === kaliKe);
    if (exists) {
      setCatRules(catRules.map(r => r.kaliKe === kaliKe ? { ...r, [field]: value } : r));
    } else {
      const newRule: RuleRepetisi = {
        id: `R-${kaliKe}-` + Math.random().toString(36).slice(-4),
        kaliKe,
        poin: field === 'poin' ? Number(value) : (catDefaultPoin * 2),
        tazir: field === 'tazir' ? String(value) : ''
      };
      setCatRules([...catRules, newRule]);
    }
  };

  // Open Add catalog
  const openAddCatalog = () => {
    setCatalogToEdit(null);
    setCatNama('');
    setCatKategori('Ringan');
    setCatDeskripsi('');
    setCatDefaultPoin(10);
    setCatDefaultTazir('');
    setCatRules([]);
    setCatRepetitionStrategy('same_as_2');
    setIsCatalogModalOpen(true);
  };

  // Open Edit catalog
  const openEditCatalog = (item: KatalogPelanggaranItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCatalogToEdit(item);
    setCatNama(item.nama);
    setCatKategori(item.kategori);
    setCatDeskripsi(item.deskripsi || '');
    setCatDefaultPoin(item.defaultPoin);
    setCatDefaultTazir(item.defaultTazir);
    setCatRules((item.rules || []).filter(r => r.kaliKe > 1));
    setCatRepetitionStrategy(item.repetitionStrategy || 'same_as_2');
    setIsCatalogModalOpen(true);
  };

  // Delete Catalog Item
  const handleDeleteCatalogItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = katalog.find(x => x.id === id);
    if (!item) return;

    triggerConfirmation(
      'Hapus Katalog Pelanggaran',
      `Apakah Anda yakin ingin menghapus "${item.nama}" dari Buku Induk Katalog? Data yang sudah dicatat di riwayat tidak akan terhapus.`,
      async () => {
        try {
          await deleteTableRow('katalog_pelanggaran', 'smartsantri_katalog_pelanggaran', id);
          const filtered = katalog.filter(x => x.id !== id);
          setKatalog(filtered);
          if (selectedCatalogDetail?.id === id) {
            setSelectedCatalogDetail(null);
          }
        } catch (err: any) {
          alert(`Gagal menghapus item Buku Induk: ${err.message}`);
        }
      }
    );
  };

  // Trigger browser print
  const handlePrintCard = () => {
    if (!printingSantri) return;
    const stats = getStudentStats(printingSantri.nama, printingSantri.id);
    const ind = getDisciplineIndicator(stats.points);
    const dateToday = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const logoHTML = profile.logoUrl && profile.logoUrl.trim()
      ? `<img src="${profile.logoUrl.trim()}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" referrerPolicy="no-referrer" />`
      : `<svg viewBox="0 0 100 100" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="#1e293b" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <path d="M50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30 Z" fill="#1e293b" />
          <path d="M50 35 L53 43 L62 43 L55 48 L58 56 L50 51 L42 56 L45 48 L38 43 L47 43 Z" fill="#ffffff" />
        </svg>`;

    let recordsRowsHTML = '';
    if (stats.records.length > 0) {
      stats.records.forEach((rec, i) => {
        recordsRowsHTML += `
          <tr>
            <td class="p-2 border border-slate-200 text-center font-mono" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-family: monospace;">${i + 1}</td>
            <td class="p-2 border border-slate-200 font-mono" style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; white-space: nowrap;">${rec.tanggal}</td>
            <td class="p-2 border border-slate-200 font-bold text-slate-800" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #1e293b;">${rec.jenisPelanggaran}</td>
            <td class="p-2 border border-slate-200 text-center font-extrabold text-rose-700" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 800; color: #be123c;">${rec.poin}</td>
            <td class="p-2 border border-slate-200" style="border: 1px solid #cbd5e1; padding: 8px;">${rec.tindakan}</td>
          </tr>
        `;
      });
    } else {
      recordsRowsHTML = `
        <tr>
          <td colspan="5" class="p-8 text-center" style="border: 1px solid #cbd5e1; padding: 32px; text-align: center; color: #94a3b8; font-weight: bold; font-style: italic;">
            Bersih dari pelanggaran. Santri ini memiliki rekam jejak kedisplinan yang SANGAT BAIK.
          </td>
        </tr>
      `;
    }

    const html = `
      <html>
      <head>
        <title>Kartu Disiplin - ${printingSantri.nama}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: auto;
            margin: 1.5cm;
          }
          body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background: white;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.5px; }
          .tracking-wide { letter-spacing: 0.5px; }
          
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-cols: 1fr 1fr; }
          .grid-cols-3 { grid-template-cols: 1fr 1fr 1fr; }
          .gap-4 { gap: 16px; }
          .gap-12 { gap: 48px; }
          
          .border-b-2 { border-bottom: 2px solid #1e293b; }
          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border { border: 1px solid #cbd5e1; }
          .p-4 { padding: 16px; }
          .p-3 { padding: 12px; }
          .p-2 { padding: 8px; }
          .pb-4 { padding-bottom: 16px; }
          .pb-1 { padding-bottom: 4px; }
          .pt-10 { padding-top: 40px; }
          
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-6 > * + * { margin-top: 24px; }
          .space-y-16 > * + * { margin-top: 64px; }
          
          .bg-slate-50 { background-color: #f8fafc; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .rounded-xl { border-radius: 12px; }
          .border-slate-200 { border-color: #e2e8f0; }
          .text-slate-400 { color: #94a3b8; }
          .text-slate-500 { color: #64748b; }
          .text-slate-700 { color: #334155; }
          .text-slate-800 { color: #1e293b; }
          .text-rose-700 { color: #be123c; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .text-lg { font-size: 18px; }
          .border-collapse { border-collapse: collapse; }
          
          .logo-box {
            height: 56px;
            width: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="space-y-6">
          <!-- Header Formal Pesantren -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="logo-box">
                ${logoHTML}
              </div>
              <div>
                ${profile.namaYayasan && profile.namaYayasan.trim() ? `<p style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">${profile.namaYayasan}</p>` : ''}
                <h2 style="font-size: 16px; font-weight: 900; color: #1e293b; text-transform: uppercase; margin: 2px 0 0 0;">
                  ${profile.namaPesantren || 'SMARTSANTRI'}
                </h2>
                <p style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0 0 0;">
                  BIRO KEPENGASUHAN & KEDISIPLINAN TATA TERTIB
                </p>
                <p style="font-size: 9px; color: #64748b; margin: 2px 0 0 0; line-height: 1.3;">
                  ${[
                    profile.alamat,
                    profile.desa ? `Ds. ${profile.desa}` : '',
                    profile.kecamatan ? `Kec. ${profile.kecamatan}` : '',
                    profile.kabupaten ? `Kab. ${profile.kabupaten}` : '',
                    profile.provinsi
                  ].filter(Boolean).join(', ')}
                </p>
                ${profile.telepon || profile.email ? `
                  <p style="font-size: 8px; color: #94a3b8; margin: 1px 0 0 0; font-family: monospace;">
                    ${[
                      profile.telepon ? `Telp: ${profile.telepon}` : '',
                      profile.email ? `Email: ${profile.email}` : ''
                    ].filter(Boolean).join(' | ')}
                  </p>
                ` : ''}
              </div>
            </div>
            
            <div style="text-align: right;">
              <span style="font-size: 10px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 800; display: block;">
                DOK: TERTIB/K-${printingSantri.id}
              </span>
              <span style="font-size: 9px; color: #94a3b8; display: block; margin-top: 4px;">Tanggal: ${new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          <!-- Title -->
          <div style="text-align: center; margin-top: 16px; margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 900; color: #1e293b; text-transform: uppercase; text-decoration: underline; margin: 0;">
              KARTU CATATAN PELANGGARAN & DISIPLIN SANTRI
            </h3>
            <p style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin: 4px 0 0 0;">
              Tahun Ajaran \${localStorage.getItem('smartsantri_active_tahun_ajaran') || '2026/2027'}
            </p>
          </div>

          <!-- Identitas Santri Grid -->
          <div style="display: flex; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 12px;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Nama Lengkap</span>
                <span style="color: #1e293b; font-weight: 800;">: ${printingSantri.nama}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Nomor Induk (NIS)</span>
                <span style="color: #1e293b; font-family: monospace; font-weight: 700;">: ${printingSantri.nis || '-'}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Gender / Status</span>
                <span style="color: #1e293b;">: ${printingSantri.gender} / Aktif</span>
              </div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Kamar / Asrama</span>
                <span style="color: #1e293b;">: ${printingSantri.kamar || '-'}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Kelas Belajar</span>
                <span style="color: #1e293b;">: Kelas ${printingSantri.kelas || '-'}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #94a3b8; width: 120px;">Asal Daerah</span>
                <span style="color: #1e293b;">: ${printingSantri.asal || '-'}</span>
              </div>
            </div>
          </div>

          <!-- Summary Badges -->
          <div style="display: flex; gap: 12px; text-align: center; margin-top: 16px; margin-bottom: 16px;">
            <div style="flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 12px; background: white;">
              <p style="font-size: 9px; font-weight: 800; color: #94a3b8; margin: 0 0 4px 0; text-transform: uppercase;">TOTAL KASUS</p>
              <p style="font-size: 16px; font-weight: 850; color: #1e293b; margin: 0;">${stats.count} Kali Pelanggaran</p>
            </div>
            <div style="flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 12px; background: white;">
              <p style="font-size: 9px; font-weight: 800; color: #94a3b8; margin: 0 0 4px 0; text-transform: uppercase;">TOTAL POIN SANKSI</p>
              <p style="font-size: 16px; font-weight: 850; color: #be123c; margin: 0;">${stats.points} Poin Akumulasi</p>
            </div>
            <div style="flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 12px; background: white;">
              <p style="font-size: 9px; font-weight: 800; color: #94a3b8; margin: 0 0 4px 0; text-transform: uppercase;">INDIKATOR DISIPLIN</p>
              <p style="font-size: 12px; font-weight: 850; color: #1e293b; margin: 4px 0 0 0;">${ind.text}</p>
            </div>
          </div>

          <!-- Infraction list table -->
          <div style="margin-top: 20px;">
            <p style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
              DAFTAR RIWAYAT PELANGGARAN TERPERINCI
            </p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 9px;">
                  <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 40px;">No</th>
                  <th style="padding: 8px; border: 1px solid #cbd5e1; width: 100px; text-align: left;">Tanggal</th>
                  <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Bentuk Pelanggaran</th>
                  <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 64px;">Poin</th>
                  <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Bentuk Sanksi Ta'zir yang Diberikan</th>
                </tr>
              </thead>
              <tbody style="color: #334155;">
                ${recordsRowsHTML}
              </tbody>
            </table>
          </div>

          <!-- Warning text -->
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 10px; line-height: 1.5; color: #64748b; margin-top: 16px;">
            <strong style="color: #1e293b;">PERHATIAN: </strong> 
            Akumulasi poin kedisplinan berjalan di atas dapat mempengaruhi kelayakan santri dalam mengikuti ujian semester, 
            mendapatkan izin kepulangan berkala, serta kelayakan mendapatkan beasiswa berprestasi pesantren. 
            Jika akumulasi poin melampaui 100, wali santri akan dipanggil secara tertulis untuk sidang majelis pengasuh.
          </div>

          <!-- Signature block -->
          <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; text-align: center;">
            <div style="width: 30%;">
              <p style="margin: 0 0 64px 0;">Disetujui / Wali Santri</p>
              <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 800;">
                (........................................)
              </div>
            </div>

            <div style="width: 30%;">
              <p style="margin: 0 0 64px 0;">Ketua Keamanan</p>
              <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 800; color: #1e293b;">
                ${profile.namaKetuaKeamanan && profile.namaKetuaKeamanan.trim() ? profile.namaKetuaKeamanan.trim() : '_________________________'}
              </div>
            </div>

            <div style="width: 30%;">
              <p style="margin: 0 0 64px 0;">Santri yang Bersangkutan</p>
              <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 800; color: #1e293b;">
                ${printingSantri.nama}
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Gagal membuka jendela cetak. Pop-up mungkin diblokir oleh peramban Anda.');
    }
  };

  // Calculate detailed points and count for each student
  const getStudentStats = (studentName: string, studentId?: string) => {
    const studentRecords = activeKeamananList.filter(rec => {
      if (studentId && rec.santriId) return rec.santriId === studentId;
      return (rec.namaSantri || '').toLowerCase() === (studentName || '').toLowerCase();
    });
    const points = studentRecords.reduce((sum, rec) => sum + rec.poin, 0);
    const count = studentRecords.length;
    return { points, count, records: studentRecords };
  };

  // Unique classes for filtering
  const uniqueClasses = Array.from(new Set(santriList.map(s => s.kelas).filter(Boolean))).sort();
  // Unique kamars for filtering
  const uniqueKamars = Array.from(new Set(santriList.map(s => s.kamar).filter(Boolean))).sort();

  // FILTERING: Tabel Seluruh Santri (Summary view like kamar santri)
  const filteredSantriList = santriList.filter(student => {
    const stats = getStudentStats(student.nama, student.id);
    const indicator = getDisciplineIndicator(stats.points);

    const matchSearch = (student.nama || '').toLowerCase().includes(searchSantri.toLowerCase()) ||
                        (student.nis && student.nis.includes(searchSantri)) ||
                        (student.kamar && student.kamar.toLowerCase().includes(searchSantri.toLowerCase())) ||
                        (student.kelas && student.kelas.toLowerCase().includes(searchSantri.toLowerCase()));

    const matchGender = student.gender === filterGender;
    const matchClass = filterClass === 'Semua' || student.kelas === filterClass;
    const membership = student.statusKeanggotaan || 'Aktif';
    const matchStatus = filterStatus === 'Semua' || membership === filterStatus;
    const matchKamar = filterKamar === 'Semua' || student.kamar === filterKamar;
    
    let matchIndicator = true;
    if (filterIndicator !== 'Semua') {
      if (filterIndicator === 'Sangat Baik') matchIndicator = stats.points === 0;
      else if (filterIndicator === 'Baik') matchIndicator = stats.points > 0 && stats.points <= 10;
      else if (filterIndicator === 'Cukup') matchIndicator = stats.points > 10 && stats.points <= 25;
      else if (filterIndicator === 'Mbulet') matchIndicator = stats.points > 25 && stats.points <= 90;
      else if (filterIndicator === 'Kronis') matchIndicator = stats.points > 90;
    }

    return matchSearch && matchGender && matchClass && matchIndicator && matchStatus && matchKamar;
  });

  // Sorting: Sorted Santri summary list based on sortKey & sortDirection
  const sortedSantriList = useMemo(() => {
    return [...filteredSantriList].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortKey === 'nama') {
        valA = a.nama.toLowerCase();
        valB = b.nama.toLowerCase();
      } else if (sortKey === 'nis') {
        valA = (a.nis || '').toLowerCase();
        valB = (b.nis || '').toLowerCase();
      } else if (sortKey === 'alamat') {
        const getAlamatStr = (s: Santri) => [s.desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ').toLowerCase();
        valA = getAlamatStr(a);
        valB = getAlamatStr(b);
      } else if (sortKey === 'pelanggaran') {
        valA = getStudentStats(a.nama, a.id).count;
        valB = getStudentStats(b.nama, b.id).count;
      } else if (sortKey === 'poin' || sortKey === 'indikator') {
        valA = getStudentStats(a.nama, a.id).points;
        valB = getStudentStats(b.nama, b.id).points;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      
      // Secondary sort by name
      if (sortKey !== 'nama') {
        const nameA = a.nama.toLowerCase();
        const nameB = b.nama.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
      }
      return 0;
    });
  }, [filteredSantriList, sortKey, sortDirection]);

  // Pagination calculations for Santri summary list
  const totalSantriPages = Math.ceil(filteredSantriList.length / itemsPerPage) || 1;
  const paginatedSantris = useMemo(() => {
    return sortedSantriList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedSantriList, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchSantri, filterGender, filterClass, filterIndicator, filterStatus, filterKamar]);

  // FILTERING: Riwayat kasus kronologis
  const filteredRiwayat = activeKeamananList.filter(rec => {
    if (!rec) return false;
    const matchSearch = (rec.namaSantri || '').toLowerCase().includes(searchRiwayat.toLowerCase()) ||
                        (rec.jenisPelanggaran || '').toLowerCase().includes(searchRiwayat.toLowerCase()) ||
                        (rec.kamar || '').toLowerCase().includes(searchRiwayat.toLowerCase());
    
    // Check if student matches filterGender
    const studentObj = findStudentForRecord(rec, santriList);
    const matchGender = !studentObj || studentObj.gender === filterGender;

    if (!matchGender) return false;
    
    if (filterKategoriRiwayat === 'Semua') return matchSearch;
    const catItem = katalog.find(k => k.nama && (k.nama.toLowerCase() === (rec.jenisPelanggaran || '').toLowerCase()));
    const itemKategori = catItem ? catItem.kategori : 'Ringan';
    return matchSearch && itemKategori === filterKategoriRiwayat;
  });

  // FILTERING: Catalog List
  const filteredKatalog = katalog.filter(item => {
    if (!item) return false;
    const matchSearch = (item.nama || '').toLowerCase().includes(searchKatalog.toLowerCase()) ||
                        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchKatalog.toLowerCase())) ||
                        (item.defaultTazir || '').toLowerCase().includes(searchKatalog.toLowerCase());
    
    const matchKategori = filterKategoriKatalog === 'Semua' || item.kategori === filterKategoriKatalog;
    const matchGender = !item.gender || item.gender === bukuIndukGender;
    return matchSearch && matchKategori && matchGender;
  });

  // Calculate high-level stats
  const totalKasus = activeKeamananList.length;
  const totalPoin = activeKeamananList.reduce((acc, curr) => acc + curr.poin, 0);

  // Most frequent violation
  const violationCounts: { [key: string]: number } = {};
  activeKeamananList.forEach(rec => {
    violationCounts[rec.jenisPelanggaran] = (violationCounts[rec.jenisPelanggaran] || 0) + 1;
  });
  const sortedViolations = Object.entries(violationCounts).sort((a, b) => b[1] - a[1]);
  const mostFrequentViolation = sortedViolations.length > 0 ? sortedViolations[0][0] : 'Belum ada data';

  // Autocomplete suggestions for recording form
  const searchedSantris = logSearchSantri.trim() === '' 
    ? [] 
    : santriList.filter(s => 
        s.statusKeanggotaan === 'Aktif' && 
        s.gender === filterGender &&
        (s.nama || '').toLowerCase().includes(logSearchSantri.toLowerCase())
      ).slice(0, 5);

  const handleJumpToDate = (targetDateStr: string) => {
    if (!targetDateStr || filteredRiwayat.length === 0) return;

    const targetTime = new Date(targetDateStr).getTime();
    let nearestRec: any = null;
    let minDiff = Infinity;

    filteredRiwayat.forEach((rec) => {
      const recTime = new Date(rec.tanggal).getTime();
      const diff = Math.abs(recTime - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearestRec = rec;
      }
    });

    if (nearestRec) {
      setHighlightedRiwayatId(nearestRec.id);
      setTimeout(() => {
        const el = document.getElementById(`riwayat-row-${nearestRec.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => {
        setHighlightedRiwayatId(null);
      }, 3000);
    }
  };

  const getRecordOrdinal = (rec: KeamananRecord) => {
    let activeP = periodes.find(p => p.id === selectedPeriode);
    if (selectedPeriode === 'Semua') {
      activeP = periodes.find(p => p.startDate && p.endDate && rec.tanggal >= p.startDate && rec.tanggal <= p.endDate);
    }
    
    let filteredList = keamananList;
    if (activeP && activeP.startDate && activeP.endDate) {
      filteredList = filteredList.filter(
        r => r.tanggal >= activeP!.startDate! && r.tanggal <= activeP!.endDate!
      );
    }
    
    const studentRecs = filteredList
      .filter(
        r => {
          const matchStudent = (rec.santriId && r.santriId) ? (rec.santriId === r.santriId) : ((r.namaSantri || '').toLowerCase() === (rec.namaSantri || '').toLowerCase());
          return matchStudent && (r.jenisPelanggaran || '').toLowerCase() === (rec.jenisPelanggaran || '').toLowerCase();
        }
      )
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) {
          return a.tanggal.localeCompare(b.tanggal);
        }
        return a.id.localeCompare(b.id);
      });
      
    const idx = studentRecs.findIndex(r => r.id === rec.id);
    return {
      ordinal: idx >= 0 ? idx + 1 : 1,
      periodeNama: activeP ? activeP.nama : 'Semua Periode'
    };
  };

  const groupedRiwayatByDate = useMemo(() => {
    const groups: { date: string; records: KeamananRecord[] }[] = [];
    const sorted = [...filteredRiwayat].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    sorted.forEach(rec => {
      const datePart = rec.tanggal.split('T')[0].split(' ')[0];
      let group = groups.find(g => g.date === datePart);
      if (!group) {
        group = { date: datePart, records: [] };
        groups.push(group);
      }
      group.records.push(rec);
    });
    return groups;
  }, [filteredRiwayat, periodes, selectedPeriode]);

  const topViolators = useMemo(() => {
    const studentViolations: { [key: string]: { count: number; points: number; name: string; santriId?: string } } = {};
    activeKeamananList.forEach(rec => {
      const student = findStudentForRecord(rec, santriList);
      const key = student ? student.id : rec.namaSantri;
      if (!studentViolations[key]) {
        studentViolations[key] = { count: 0, points: 0, name: rec.namaSantri, santriId: student?.id };
      }
      studentViolations[key].count += 1;
      studentViolations[key].points += rec.poin;
    });

    return Object.entries(studentViolations)
      .map(([key, stats]) => {
        const santri = stats.santriId ? santriList.find(s => s.id === stats.santriId) : santriList.find(s => (s.nama || '').toLowerCase() === (stats.name || '').toLowerCase());
        return {
          id: key,
          nama: stats.name,
          count: stats.count,
          points: stats.points,
          santri,
        };
      })
      .filter(item => {
        return !item.santri || item.santri.gender === filterGender;
      })
      .sort((a, b) => b.count - a.count || b.points - a.points)
      .slice(0, 5);
  }, [activeKeamananList, santriList, filterGender]);

  const violationsChartData = useMemo(() => {
    const counts: { [key: string]: { count: number; name: string } } = {};
    activeKeamananList.forEach(rec => {
      const santri = findStudentForRecord(rec, santriList);
      if (!santri || santri.gender === filterGender) {
        const key = rec.jenisPelanggaran;
        if (!counts[key]) {
          counts[key] = { count: 0, name: key };
        }
        counts[key].count += 1;
      }
    });
    
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [activeKeamananList, santriList, filterGender]);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {displayTab === 'overview' ? (
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 sm:text-3xl flex items-center gap-2">
              <span>Overview Keamanan</span>
              <span
                onClick={canSwitchGender ? () => setFilterGender(filterGender === 'Putra' ? 'Putri' : 'Putra') : undefined}
                className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                  canSwitchGender ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  filterGender === 'Putra' ? 'text-blue-600 font-black' : 'text-rose-600 font-black'
                }`}
                title={canSwitchGender ? "Klik untuk mengubah gender (Putra ⇄ Putri)" : undefined}
              >
                <span>{filterGender}</span>
                {canSwitchGender && (
                  <ArrowLeftRight 
                    className={`h-4.5 w-4.5 mt-0.5 transition-colors ${
                      filterGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                    }`} 
                  />
                )}
              </span>
            </h1>
          ) : displayTab === 'katalog' ? (
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 sm:text-3xl flex items-center gap-2">
              <span>Buku induk Pertatib</span>
              <span
                onClick={canSwitchGender ? () => setBukuIndukGender(bukuIndukGender === 'Putra' ? 'Putri' : 'Putra') : undefined}
                className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                  canSwitchGender ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  bukuIndukGender === 'Putra' ? 'text-blue-600 font-black' : 'text-rose-600 font-black'
                }`}
                title={canSwitchGender ? "Klik untuk mengubah gender (Putra ⇄ Putri)" : undefined}
              >
                <span>{bukuIndukGender}</span>
                {canSwitchGender && (
                  <ArrowLeftRight 
                    className={`h-4.5 w-4.5 mt-0.5 transition-colors ${
                      bukuIndukGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                    }`} 
                  />
                )}
              </span>
            </h1>
          ) : displayTab === 'riwayat' ? (
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 sm:text-3xl flex items-center gap-2">
              <span>Log Kasus</span>
              <span
                onClick={canSwitchGender ? () => setFilterGender(filterGender === 'Putra' ? 'Putri' : 'Putra') : undefined}
                className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                  canSwitchGender ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  filterGender === 'Putra' ? 'text-blue-600 font-black' : 'text-rose-600 font-black'
                }`}
                title={canSwitchGender ? "Klik untuk mengubah gender (Putra ⇄ Putri)" : undefined}
              >
                <span>{filterGender}</span>
                {canSwitchGender && (
                  <ArrowLeftRight 
                    className={`h-4.5 w-4.5 mt-0.5 transition-colors ${
                      filterGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                    }`} 
                  />
                )}
              </span>
            </h1>
          ) : displayTab === 'perizinan' ? (
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 sm:text-3xl flex items-center gap-2">
              <span>Perizinan Santri</span>
              <span
                onClick={canSwitchGender ? () => setFilterGender(filterGender === 'Putra' ? 'Putri' : 'Putra') : undefined}
                className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                  canSwitchGender ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  filterGender === 'Putra' ? 'text-blue-600 font-black' : 'text-rose-600 font-black'
                }`}
                title={canSwitchGender ? "Klik untuk mengubah gender (Putra ⇄ Putri)" : undefined}
              >
                <span>{filterGender}</span>
                {canSwitchGender && (
                  <ArrowLeftRight 
                    className={`h-4.5 w-4.5 mt-0.5 transition-colors ${
                      filterGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                    }`} 
                  />
                )}
              </span>
            </h1>
          ) : (
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-800 sm:text-3xl flex items-center gap-2">
              <span>Data Pelanggaran</span>
              <span
                onClick={canSwitchGender ? () => setFilterGender(filterGender === 'Putra' ? 'Putri' : 'Putra') : undefined}
                className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                  canSwitchGender ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  filterGender === 'Putra' ? 'text-blue-600 font-black' : 'text-rose-600 font-black'
                }`}
                title={canSwitchGender ? "Klik untuk mengubah gender (Putra ⇄ Putri)" : undefined}
              >
                <span>{filterGender}</span>
                {canSwitchGender && (
                  <ArrowLeftRight 
                    className={`h-4.5 w-4.5 mt-0.5 transition-colors ${
                      filterGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                    }`} 
                  />
                )}
              </span>
            </h1>
          )}
          <p className="text-sm text-slate-500">
            {displayTab === 'overview'
              ? `Analisis statistik, grafik pelanggaran terbanyak, dan pemantauan tingkat kedisiplinan santri ${filterGender.toLowerCase()}.`
              : displayTab === 'katalog'
                ? `Aturan tata tertib dan kriteria sanksi terstandar bagi santri ${bukuIndukGender.toLowerCase()}.`
                : displayTab === 'riwayat'
                  ? `Daftar kronologis lengkap semua pelanggaran dan sanksi santri ${filterGender.toLowerCase()} dalam periode yang dipilih.`
                  : displayTab === 'perizinan'
                    ? `Pengelolaan surat izin keluar, kepulangan, serta pantauan santri ${filterGender.toLowerCase()} yang sedang berada di luar pondok.`
                    : `Pencatatan kasus tata tertib santri ${filterGender.toLowerCase()} berdasar Buku Induk Sanksi & Aturan Repetisi.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {(displayTab === 'catatan' || displayTab === 'riwayat' || displayTab === 'overview') && (
            <div className="bg-transparent px-1 py-1 text-xs">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Periode Aktif</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-extrabold text-slate-700 leading-none">
                    {periodes.find(p => p.id === selectedPeriode)?.nama || 'Semua Periode'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPeriodConfigModalOpen(true)}
                    className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100/50 rounded-lg transition-all cursor-pointer select-none active:scale-90 flex items-center justify-center"
                    title="Ubah Periode"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Data Button */}
          {(displayTab === 'overview' || displayTab === 'catatan') && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 border-none"
              title="Ekspor &amp; Cetak Laporan Keamanan"
            >
              <Share2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Renderer */}
      <AnimatePresence mode="wait">
        {displayTab === 'overview' && (
          <motion.div
            key="overview-submodule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Kasus Pelanggaran</span>
                  <span className="text-2xl font-black text-slate-800">
                    {activeKeamananList.filter(rec => {
                      const santri = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                      return !santri || santri.gender === filterGender;
                    }).length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Akumulasi Poin Sanksi</span>
                  <span className="text-2xl font-black text-slate-800">
                    {activeKeamananList.filter(rec => {
                      const santri = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                      return !santri || santri.gender === filterGender;
                    }).reduce((acc, curr) => acc + curr.poin, 0)} Poin
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Pelanggaran Terbanyak</span>
                  <span className="text-sm font-bold text-slate-800 block truncate" title={
                    (() => {
                      const list = activeKeamananList.filter(rec => {
                        const santri = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                        return !santri || santri.gender === filterGender;
                      });
                      const counts: { [key: string]: number } = {};
                      list.forEach(rec => { counts[rec.jenisPelanggaran] = (counts[rec.jenisPelanggaran] || 0) + 1; });
                      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                      return sorted.length > 0 ? sorted[0][0] : 'Belum ada data';
                    })()
                  }>
                    {(() => {
                      const list = activeKeamananList.filter(rec => {
                        const santri = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                        return !santri || santri.gender === filterGender;
                      });
                      const counts: { [key: string]: number } = {};
                      list.forEach(rec => { counts[rec.jenisPelanggaran] = (counts[rec.jenisPelanggaran] || 0) + 1; });
                      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                      return sorted.length > 0 ? sorted[0][0] : 'Belum ada data';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 violators list */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-slate-800">Top 5 Santri Paling Melanggar</h3>
                      <p className="text-xs text-slate-400">Santri aktif dengan intensitas pelanggaran tertinggi</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                      {filterGender}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topViolators.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                        <span className="text-sm font-semibold text-slate-600">Alhamdulillah, tidak ada pelanggaran</span>
                        <span className="text-xs text-slate-400 mt-1">Semua santri tertib pada periode ini.</span>
                      </div>
                    ) : (
                      topViolators.map((item, idx) => {
                        const fallbackPhoto = item.santri?.gender === 'Putra' 
                          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' 
                          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
                        const photoUrl = item.santri?.filePasFoto || fallbackPhoto;
                        const discipline = getDisciplineIndicator(item.points);

                        return (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Rank circle */}
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                idx === 0 
                                  ? 'bg-rose-500 text-white' 
                                  : idx === 1 
                                    ? 'bg-amber-500 text-white' 
                                    : idx === 2 
                                      ? 'bg-yellow-500 text-white' 
                                      : 'bg-slate-100 text-slate-500'
                              }`}>
                                {idx + 1}
                              </div>

                              {/* Student Photo */}
                              <div className="h-9 w-9 rounded-full overflow-hidden border border-indigo-100 bg-indigo-50 shrink-0">
                                <img
                                  src={photoUrl}
                                  alt={item.nama}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              {/* Student info */}
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate hover:text-indigo-600 cursor-pointer"
                                    onClick={() => item.santri && setViewingDetailSantri(item.santri)}>
                                  {item.nama}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                                  <span>{item.santri?.kelas || 'Tanpa Kelas'}</span>
                                  <span>•</span>
                                  <span>{item.santri?.kamar || 'Tanpa Kamar'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Violations count & Points */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-xs font-black text-rose-600 block">{item.count} Kasus</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${discipline.bg} ${discipline.color} ${discipline.border}`}>
                                  {item.points} Poin
                                </span>
                              </div>
                              
                              <button
                                onClick={() => item.santri && setViewingHistorySantri(item.santri)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center h-7 w-7"
                                title="Lihat Riwayat Pelanggaran"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {topViolators.length > 0 && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => onChangeSubTab?.('catatan')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Semua Daftar Santri</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Chart of most frequent violations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full">
                <div className="mb-5">
                  <h3 className="font-display text-lg font-extrabold text-slate-800">Diagram Pelanggaran Paling Sering</h3>
                </div>

                <div className="flex-1 min-h-[160px] flex items-center justify-center">
                  {violationsChartData.length === 0 ? (
                    <div className="text-center text-slate-400 flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                      <span className="text-xs">Belum ada data grafik pelanggaran pada periode ini.</span>
                    </div>
                  ) : (
                    <div 
                      className="w-full text-xs"
                      style={{ height: `${Math.min(300, Math.max(140, violationsChartData.length * 36))}px` }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={violationsChartData}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            width={110}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                          />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl max-w-xs text-xs">
                                    <p className="font-bold mb-1 text-white">{data.name}</p>
                                    <div className="h-px bg-slate-800 my-1.5" />
                                    <p className="flex items-center justify-between gap-4 text-slate-300">
                                      <span>Frekuensi:</span>
                                      <span className="font-mono font-black text-rose-400">{data.count} Kali</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            name="Frekuensi Kasus"
                            radius={[0, 6, 6, 0]}
                            barSize={16}
                          >
                            {violationsChartData.map((entry, index) => {
                              const colors = [
                                '#f43f5e', // rose-500
                                '#f59e0b', // amber-500
                                '#ec4899', // pink-500
                                '#6366f1', // indigo-500
                                '#10b981', // emerald-500
                                '#06b6d4', // cyan-500
                                '#8b5cf6', // violet-500
                                '#14b8a6', // teal-500
                              ];
                              return (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onChangeSubTab?.('riwayat')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Log Riwayat Lengkap</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {displayTab === 'catatan' && (
          <motion.div
            key="catatan-submodule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Subtab View 1: DAFTAR SANTRI (THE CORE USER REQUESTED FEATURE) */}
            <div className="space-y-4">
                {/* Search block matching "tabel induk santri" style */}
                <div className="sticky top-16 z-[45] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-md space-y-3">
                  <div className="flex flex-row items-center gap-2 w-full">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Search className="h-5 w-5" />
                      </span>
                      <input
                        type="text"
                        value={searchSantri}
                        onChange={(e) => setSearchSantri(e.target.value)}
                        placeholder="Cari nama, NIS, asal kota, atau kamar santri..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      {searchSantri && (
                        <button
                          onClick={() => setSearchSantri('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                      onClick={() => setShowCatatanFilters(!showCatatanFilters)}
                      className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all hover:bg-slate-50 shrink-0 cursor-pointer ${
                        showCatatanFilters || filterIndicator !== 'Semua' || filterStatus !== 'Aktif' || filterKamar !== 'Semua'
                          ? 'border-indigo-200 bg-indigo-50/30 text-indigo-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                      title="Filter Status, Kedisiplinan, & Kamar"
                    >
                      <Filter className="h-4 w-4 text-current" />
                    </button>
                  </div>

                  {/* Grouped filters: Status, Kedisiplinan, Kamar */}
                  <AnimatePresence>
                    {showCatatanFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-slate-100 pt-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-2">
                          {/* 1. Status Filter Group */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                              Status Keanggotaan
                            </span>
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm"
                            >
                              <option value="Semua">Semua Status</option>
                              <option value="Aktif">Aktif</option>
                              <option value="Alumni">Alumni</option>
                            </select>
                          </div>

                          {/* 2. Kedisiplinan Filter Group */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                              Indikator Kedisiplinan
                            </span>
                            <select
                              value={filterIndicator}
                              onChange={(e) => setFilterIndicator(e.target.value)}
                              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm"
                            >
                              <option value="Semua">Semua Indikator</option>
                              <option value="Sangat Baik">Sangat Baik</option>
                              <option value="Baik">Baik</option>
                              <option value="Cukup">Cukup Baik</option>
                              <option value="Mbulet">Mbulet</option>
                              <option value="Kronis">Mbulet Akut</option>
                            </select>
                          </div>

                          {/* 3. Kamar Filter Group */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                              Kamar Santri
                            </span>
                            <select
                              value={filterKamar}
                              onChange={(e) => setFilterKamar(e.target.value)}
                              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm"
                            >
                              <option value="Semua">Semua Kamar</option>
                              {uniqueKamars.map(kamar => (
                                <option key={kamar} value={kamar}>{kamar}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Main Student Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className={`overflow-x-auto ${paginatedSantris.length > 0 ? 'min-h-[350px]' : ''}`}>
                    {paginatedSantris.length > 0 ? (
                      <table className="w-full border-collapse text-left text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                            <th className="py-3 px-4 text-center w-12 md:sticky md:left-0 md:bg-slate-50 md:z-20 md:border-r md:border-slate-100 text-slate-400">No</th>
                            
                            {/* Nama (Sortable by 'nama') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'nama') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('nama');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none md:sticky md:left-12 md:bg-slate-50 md:z-20 md:border-r md:border-slate-100"
                            >
                              <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-slate-400">Nama</span>
                                {sortKey === 'nama' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* NIS (Sortable by 'nis') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'nis') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('nis');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-slate-400">NIS</span>
                                {sortKey === 'nis' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* Alamat (Sortable by 'alamat') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'alamat') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('alamat');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-slate-400">Alamat</span>
                                {sortKey === 'alamat' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* Status (Sortable by 'status') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'status') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('status');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-slate-400">Status</span>
                                {sortKey === 'status' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* Jml Pelanggaran (Sortable by 'pelanggaran') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'pelanggaran') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('pelanggaran');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-center">
                                <span className="text-slate-400">Jumlah</span>
                                {sortKey === 'pelanggaran' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* Total Poin (Sortable by 'poin') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'poin') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('poin');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-center">
                                <span className="text-slate-400">Total Poin</span>
                                {sortKey === 'poin' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            {/* Indikator Kedisiplinan (Sortable by 'indikator') */}
                            <th 
                              onClick={() => {
                                  if (sortKey === 'indikator') {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey('indikator');
                                    setSortDirection('asc');
                                  }
                              }}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5 justify-start">
                                <span className="text-slate-400">Kedisiplinan</span>
                                {sortKey === 'indikator' ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                                )}
                              </div>
                            </th>

                            <th className="py-3 px-4 text-center w-12 min-w-[48px] text-slate-400 sticky right-0 bg-slate-50 z-20 border-l border-slate-100 select-none">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {paginatedSantris.map((student, idx) => {
                            const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                            const stats = getStudentStats(student.nama, student.id);
                            const ind = getDisciplineIndicator(stats.points);

                            return (
                              <tr 
                                key={student.id} 
                                className={`hover:bg-slate-50/40 transition-colors ${activeDropdownStudentId === student.id ? 'relative z-40' : ''}`}
                              >
                                <td className="py-3.5 px-4 text-center text-slate-400 font-mono md:sticky md:left-0 md:bg-white md:z-10 md:border-r md:border-slate-100">
                                  {globalIdx}
                                </td>
                                <td className="py-3.5 px-4 md:sticky md:left-12 md:bg-white md:z-10 md:border-r md:border-slate-100">
                                  <span className="font-bold text-slate-800 text-sm block">{student.nama}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-slate-500 font-mono text-xs">{student.nis || '-'}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-slate-700 text-xs font-semibold block">
                                    {[student.desa, student.kecamatan, student.kabupaten].filter(Boolean).join(', ') || 'Alamat belum diatur'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                    student.status === 'Aktif'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                  }`}>
                                    {student.status || 'Aktif'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center justify-center h-6 min-w-6 rounded-md font-extrabold text-xs ${
                                    stats.count > 0 ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-350'
                                  }`}>
                                    {stats.count}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center justify-center h-6 min-w-10 px-1.5 rounded-md font-extrabold text-xs ${
                                    stats.points > 0 
                                      ? 'bg-rose-100 text-rose-800 font-extrabold shadow-sm shadow-rose-600/5' 
                                      : 'bg-emerald-100 text-emerald-800 font-extrabold'
                                  }`}>
                                    {stats.points}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${ind.bg} ${ind.color} ${ind.border}`}>
                                    {ind.text}
                                  </span>
                                </td>
                                <td className={`py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-white border-l border-slate-100 transition-colors w-12 min-w-[48px] ${
                                  activeDropdownStudentId === student.id ? 'z-[60]' : 'z-10'
                                }`}>
                                  <div className="relative inline-block text-left">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownStudentId(activeDropdownStudentId === student.id ? null : student.id);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors border-none bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                                      title="Aksi Santri"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>

                                    <AnimatePresence>
                                      {activeDropdownStudentId === student.id && (() => {
                                        const isLastFew = idx > 1 && idx >= paginatedSantris.length - 3;
                                        return (
                                          <>
                                            {/* Click away backdrop */}
                                            <div 
                                              className="fixed inset-0 z-[90] bg-transparent"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownStudentId(null);
                                              }}
                                            />
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.95, y: isLastFew ? -5 : 5 }}
                                              animate={{ opacity: 1, scale: 1, y: 0 }}
                                              exit={{ opacity: 0, scale: 0.95, y: isLastFew ? -5 : 5 }}
                                              className={`absolute right-0 ${isLastFew ? 'bottom-full mb-1.5' : 'mt-1'} w-40 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-[100] text-left`}
                                            >
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setViewingDetailSantri(student);
                                                  setActiveDropdownStudentId(null);
                                                }}
                                                className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                                              >
                                                <span>Biodata</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setPrintingSantri(student);
                                                  setActiveDropdownStudentId(null);
                                                }}
                                                className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                                              >
                                                <span>Cetak Kartu</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setViewingHistorySantri(student);
                                                  setActiveDropdownStudentId(null);
                                                }}
                                                className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-indigo-650 hover:bg-indigo-50 transition-colors border-none bg-transparent cursor-pointer"
                                              >
                                                <span>Riwayat</span>
                                              </button>
                                              {canWriteCurrent && (
                                                <button
                                                  type="button"
                                                  disabled={!canRecord}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSantri(student);
                                                    setLogSearchSantri(student.nama);
                                                    setIsLogModalOpen(true);
                                                    setActiveDropdownStudentId(null);
                                                  }}
                                                  className={`flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold transition-colors border-none bg-transparent ${
                                                    canRecord
                                                      ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                                                      : 'text-slate-350 cursor-not-allowed opacity-60'
                                                  }`}
                                                  title={!canRecord ? 'Pilih/aktifkan periode kustom terlebih dahulu untuk mencatat pelanggaran' : undefined}
                                                >
                                                  <span>Catat Pelanggaran</span>
                                                </button>
                                              )}
                                            </motion.div>
                                          </>
                                        );
                                      })()}
                                    </AnimatePresence>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center bg-white">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mx-auto mb-3 border border-slate-100">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="text-slate-800 font-bold text-sm">Tidak Ada Santri Ditemukan</p>
                        <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                          Tidak menemukan santri aktif dengan kata kunci, gender, kelas, atau tingkat indikator kedisiplinan yang dipilih.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls Footer exactly matching "Buku Induk" style */}
                  {filteredSantriList.length > 0 && (
                    <div className="flex flex-row items-center justify-between p-5 text-xs text-slate-500 font-medium gap-2 bg-slate-50/30 rounded-b-2xl">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden sm:inline font-display">Baris per Halaman:</span>
                        <span title="Baris per Halaman"><Eye className="h-4 w-4 text-slate-400 sm:hidden shrink-0" /></span>
                        <div className="relative shrink-0">
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {[10, 20, 50, 100].map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <span className="hidden sm:inline">
                          Menampilkan <b>{(currentPage - 1) * itemsPerPage + 1}</b> - <b>{Math.min(currentPage * itemsPerPage, filteredSantriList.length)}</b> dari <b>{filteredSantriList.length}</b> santri
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 select-none">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                          className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
                          title="Halaman Pertama"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                          className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
                          title="Halaman Sebelumnya"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowPageJumpDropdown(!showPageJumpDropdown)}
                            className="h-8.5 px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-display text-xs font-bold active:scale-95 transition-all cursor-pointer"
                            title="Pilih Halaman"
                          >
                            <span>{currentPage} / {totalSantriPages}</span>
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          </button>

                          <AnimatePresence>
                            {showPageJumpDropdown && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40"
                                  onClick={() => setShowPageJumpDropdown(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-16 rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-50 text-slate-700 font-sans"
                                >
                                  <div className="space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                    {Array.from({ length: totalSantriPages || 1 }).map((_, idx) => {
                                      const pageNum = idx + 1;
                                      const isActive = currentPage === pageNum;
                                      return (
                                        <button
                                          key={pageNum}
                                          type="button"
                                          onClick={() => {
                                            setCurrentPage(pageNum);
                                            setShowPageJumpDropdown(false);
                                          }}
                                          className={`w-full text-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            isActive
                                              ? 'bg-rose-50 text-rose-800 font-bold'
                                              : 'hover:bg-slate-50 text-slate-600'
                                          }`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          type="button"
                          disabled={currentPage === totalSantriPages || totalSantriPages === 0}
                          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalSantriPages))}
                          className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
                          title="Halaman Selanjutnya"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={currentPage === totalSantriPages || totalSantriPages === 0}
                          onClick={() => setCurrentPage(totalSantriPages)}
                          className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
                          title="Halaman Terakhir"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </motion.div>
        )}

        {displayTab === 'riwayat' && (
          <motion.div
            key="riwayat-submodule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Subtab View 2: RIWAYAT KRONOLOGIS SEMUA KASUS */}
            <div className="space-y-4">
                {/* Search & Kategori filters */}
                <div className="sticky top-16 z-[45] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama santri, pelanggaran, kamar..."
                      value={searchRiwayat}
                      onChange={(e) => setSearchRiwayat(e.target.value)}
                      className="w-full pl-9 pr-16 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all"
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                      {searchRiwayat && (
                        <button
                          onClick={() => setSearchRiwayat('')}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
                          title="Bersihkan Pencarian"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className="relative p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer w-7 h-7" title="Pilih Tanggal Lompat">
                        <input
                          type="date"
                          onChange={(e) => {
                            const val = e.target.value; // YYYY-MM-DD
                            if (val) {
                              handleJumpToDate(val);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <Calendar size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Tingkat Kasus with Filter Icon & Tombol Catatan Baru */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end flex-wrap sm:flex-nowrap">
                    <div className="relative shrink-0">
                      {isTingkatDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-10 bg-transparent" 
                          onClick={() => setIsTingkatDropdownOpen(false)}
                        />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setIsTingkatDropdownOpen(!isTingkatDropdownOpen)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm relative z-20 select-none"
                      >
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span>{filterKategoriRiwayat}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isTingkatDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isTingkatDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-25 text-left"
                          >
                            {['Semua', 'Ringan', 'Sedang', 'Berat', 'Sangat Berat'].map((kat) => {
                              const isSelected = filterKategoriRiwayat === kat;
                              return (
                                <button
                                  key={kat}
                                  type="button"
                                  onClick={() => {
                                    setFilterKategoriRiwayat(kat);
                                    setIsTingkatDropdownOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-left ${
                                    isSelected 
                                      ? 'bg-rose-50 text-rose-700' 
                                      : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{kat}</span>
                                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {canWriteCurrent && (
                      <button
                        type="button"
                        disabled={!canRecord}
                        onClick={() => {
                          setSelectedSantri(null);
                          setLogSearchSantri('');
                          setIsLogModalOpen(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative z-20 select-none shrink-0 ${
                          canRecord 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={!canRecord ? 'Pilih/aktifkan periode kustom terlebih dahulu untuk mencatat pelanggaran' : undefined}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Catatan Baru</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* List-based chronological representation */}
                <div className="bg-transparent shadow-none overflow-hidden">
                  <div className={`${groupedRiwayatByDate.length > 0 ? 'min-h-[350px]' : ''}`}>
                    {groupedRiwayatByDate.length > 0 ? (
                      <div className="space-y-4">
                        {groupedRiwayatByDate.map((group) => (
                          <div key={group.date} className="flex flex-col bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-none">
                            {/* Segment header per date - centered and colored non-gray (indigo) */}
                            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-[10px] font-black text-indigo-700 uppercase tracking-wider select-none">
                              <Calendar size={13} className="text-indigo-500" />
                              <span>{formatIndonesianDateOnly(group.date)}</span>
                            </div>
                            
                            {/* Segment items list */}
                            <div className="bg-white">
                              {group.records.map((rec) => {
                                const matchedCat = katalog.find(k => k.nama.toLowerCase() === rec.jenisPelanggaran.toLowerCase());
                                const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());

                                const isHighlighted = rec.id === highlightedRiwayatId;
                                
                                const isRepetition = matchedCat && matchedCat.rules && matchedCat.rules.length > 0;
                                let repInfo = null;
                                if (isRepetition) {
                                  const { ordinal, periodeNama } = getRecordOrdinal(rec);
                                  repInfo = (
                                    <span className="text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-[10px] font-extrabold select-none">
                                      {ordinal === 1 ? 'Pertama' : `Ke-${ordinal}`} selama &quot;{periodeNama}&quot;
                                    </span>
                                  );
                                }

                                return (
                                  <div
                                    key={rec.id}
                                    id={`riwayat-row-${rec.id}`}
                                    className={`p-4 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                      isHighlighted 
                                        ? 'bg-rose-100/95 border-l-4 border-l-rose-500 font-bold' 
                                        : 'hover:bg-slate-50/40'
                                    }`}
                                  >
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                      {/* [nama santri] and [nama pelanggaran] */}
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (student) {
                                              setViewingDetailSantri(student);
                                            }
                                          }}
                                          className="font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer text-sm border-none bg-transparent p-0 text-left shrink-0"
                                          title="Klik untuk melihat biodata santri"
                                        >
                                          {rec.namaSantri}
                                        </button>
                                        <span className="text-slate-300 select-none text-xs">•</span>
                                        <span className="text-slate-800 font-semibold text-xs leading-relaxed break-words">
                                          {rec.jenisPelanggaran}
                                        </span>
                                      </div>

                                      {/* Additional details: [ke-n dalam (periode)] and [(poin)] */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        {/* Point badge */}
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black select-none shrink-0">
                                          +{rec.poin} Poin
                                        </span>

                                        {/* Repetition info */}
                                        {repInfo}
                                      </div>
                                    </div>

                                    {/* Action buttons: detail, print, and delete */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                      {/* Detail Button */}
                                      <button
                                        type="button"
                                        onClick={() => setViewingRecordDetail(rec)}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-indigo-100 hover:border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95 select-none"
                                        title="Detail Kasus & Sanksi"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>

                                      {student && (
                                        <button
                                          type="button"
                                          onClick={() => setPrintingSantri(student)}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95 select-none"
                                          title="Cetak Kartu"
                                        >
                                          <Printer className="h-4 w-4" />
                                        </button>
                                      )}
                                      {canWriteCurrent && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            triggerConfirmation(
                                              'Hapus Catatan Pelanggaran',
                                              `Apakah Anda yakin ingin menghapus catatan pelanggaran "${rec.jenisPelanggaran}" milik santri "${rec.namaSantri}" ini? Poin santri akan dikurangi kembali secara otomatis.`,
                                              () => onDeleteKeamanan(rec.id)
                                            );
                                          }}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-all cursor-pointer shadow-sm active:scale-95 select-none"
                                          title="Hapus Catatan"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-450 mx-auto mb-3">
                          <ShieldAlert className="h-6 w-6" />
                        </div>
                        <p className="text-slate-800 font-bold text-sm">Tidak Ada Catatan Kasus Ditemukan</p>
                        <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                          Tidak ditemukan riwayat pelanggaran dengan pencarian atau filter yang ditentukan.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </motion.div>
        )}

        {displayTab === 'katalog' && (
          <motion.div
            key="katalog-submodule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Catalog list with search & filter */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari jenis pelanggaran atau aturan..."
                    value={searchKatalog}
                    onChange={(e) => setSearchKatalog(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
                  />
                  {searchKatalog && (
                    <button
                      onClick={() => setSearchKatalog('')}
                      className="absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-slate-100 text-slate-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {canWriteBukuInduk && (
                  <button
                    type="button"
                    onClick={openAddCatalog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 select-none justify-center w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Aturan</span>
                  </button>
                )}
              </div>

              {/* Grid lists */}
              {filteredKatalog.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredKatalog.map((item) => {
                    const isExpanded = !!expandedKatalog[item.id];
                    const badgColor = 
                      item.kategori === 'Ringan' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      item.kategori === 'Sedang' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      item.kategori === 'Berat' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-rose-50 text-rose-700 border-rose-100';

                    return (
                      <div 
                        key={item.id} 
                        className="transition-colors hover:bg-slate-50/20"
                      >
                        {/* Header Row (Always Visible) */}
                        <div 
                          onClick={() => {
                            if (window.innerWidth < 640) {
                              setSelectedCatalogDetail(item);
                            } else {
                              setExpandedKatalog(prev => ({ [item.id]: !prev[item.id] }));
                            }
                          }}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none group"
                        >
                          <span className="font-bold text-slate-800 text-xs sm:text-[13px] leading-snug group-hover:text-indigo-650 transition-colors">
                            {item.nama}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedKatalog(prev => ({ [item.id]: !prev[item.id] }));
                              }}
                              className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-450 hover:text-slate-750 transition-all cursor-pointer hidden sm:inline-flex"
                              title={isExpanded ? "Sembunyikan Detail" : "Tampilkan Detail"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Details Area */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                            >
                              <div className="p-4 sm:p-5 space-y-4 text-xs font-semibold text-slate-750">
                                {/* Deskripsi */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                    Deskripsi Aturan
                                  </span>
                                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs font-medium text-slate-600 leading-relaxed">
                                    {item.deskripsi || <span className="text-slate-400 italic font-normal">Tidak ada deskripsi tambahan untuk aturan ini.</span>}
                                  </div>
                                </div>

                                {/* Conditionally render based on whether there's repetition */}
                                {item.rules && item.rules.length > 0 ? (
                                  /* Has Repetition: No main default boxes, directly show boxed timeline 1 to n */
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                      ATURAN REPETISI (BERTINGKAT)
                                    </span>
                                    <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-3.5 py-1">
                                      {(() => {
                                        const baseRule = {
                                          kaliKe: 1,
                                          poin: item.defaultPoin,
                                          tazir: item.defaultTazir || '-'
                                        };
                                        const sortedRules = [...(item.rules || [])]
                                          .filter(r => r.kaliKe !== 1)
                                          .sort((a, b) => a.kaliKe - b.kaliKe);
                                        const timelineRules = [baseRule, ...sortedRules];
                                        return timelineRules.map((rule, idx) => {
                                          const isLast = idx === timelineRules.length - 1;
                                          const label = rule.kaliKe === 1
                                            ? 'Pelanggaran Pertama'
                                            : isLast && timelineRules.length > 1
                                              ? `Pengulangan ke-${rule.kaliKe} atau lebih`
                                              : `Pengulangan ke-${rule.kaliKe}`;
                                          return (
                                            <div key={idx} className="relative">
                                              {/* Centered Dot */}
                                              <div className="absolute -left-[25px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />

                                              {/* Boxed Card */}
                                              <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-3xs space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-extrabold text-slate-800 text-[11px]">
                                                    {label}
                                                  </span>
                                                  <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-100">
                                                    +{rule.poin} Poin
                                                  </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                                  <span className="text-indigo-600 font-extrabold">Ta&apos;zir:</span> {rule.tazir || '-'}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  /* No Repetition: Show single main default scheme cards and a subtle text */
                                  <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">POIN PELANGGARAN</p>
                                        <p className="text-sm font-extrabold text-rose-700">{item.defaultPoin} Poin</p>
                                      </div>
                                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">SANKSI TA&apos;ZIR</p>
                                        <p className="text-xs text-slate-800 font-extrabold">{item.defaultTazir || '-'}</p>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Footer Actions */}
                                {canWriteBukuInduk && (
                                  <div className="pt-3 flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => openEditCatalog(item, e)}
                                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-indigo-750 hover:text-indigo-850 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                      <span>Ubah Aturan</span>
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteCatalogItem(item.id, e)}
                                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 hover:text-rose-750 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Hapus Aturan</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-450 mx-auto mb-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="text-slate-800 font-bold text-sm">Tidak Ada Katalog Ditemukan</p>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                    Coba masukkan pencarian lain atau pilih filter yang berbeda.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {displayTab === 'perizinan' && (
          <div className="space-y-6">
            {/* Tab Selector for Perizinan Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-80 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPerizinanMode('resmi');
                  setSelectedSantriIdForIzin('');
                  setJenisIzin('');
                  setKeteranganIzin('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  perizinanMode === 'resmi'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Izin Resmi
              </button>
              <button
                type="button"
                onClick={() => {
                  setPerizinanMode('ilegal');
                  setSelectedSantriIdForIzin('');
                  setJenisIzin('');
                  setKeteranganIzin('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  perizinanMode === 'ilegal'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Keluar Ilegal
              </button>
            </div>

            <motion.div
              key={`perizinan-grid-${perizinanMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
            {/* Left Panel: Form & Riwayat - col-span-6 */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Form Input Izin Baru */}
              {canWriteCurrent && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className={`text-sm font-bold ${perizinanMode === 'resmi' ? 'text-slate-800' : 'text-rose-800'}`}>
                    {perizinanMode === 'resmi' ? 'Catat Perizinan Baru' : 'Catat Keluar Ilegal Baru'}
                  </h3>
                </div>

                <form onSubmit={handleAddPerizinan} className="space-y-4">
                  {/* Select Santri */}
                  <div className="space-y-1.5 relative" ref={izinDropdownRef}>
                    <label className="text-xs font-bold text-slate-500">Pilih Santri *</label>
                    {selectedSantriIdForIzin ? (
                      (() => {
                        const s = santriList.find(x => x.id === selectedSantriIdForIzin);
                        if (!s) return null;
                        return (
                          <div className="bg-indigo-50/40 border border-indigo-100/50 p-4 rounded-xl flex items-center justify-between gap-4 relative group">
                            <div className="flex items-center gap-4.5 min-w-0 flex-1">
                              {/* Foto lingkaran di kiri */}
                              <div className="h-14 w-14 rounded-full overflow-hidden border border-indigo-200 bg-indigo-100 shrink-0 flex items-center justify-center">
                                <img
                                  src={s.filePasFoto || (s.gender === 'Putra' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100')}
                                  alt={s.nama}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {/* Detail di sebelah kanan */}
                              <div className="flex-1 min-w-0 space-y-0.5 text-left">
                                <h4 className="text-sm font-extrabold text-slate-800 truncate">{s.nama}</h4>
                                <p className="text-[10px] text-slate-500 font-semibold truncate">
                                  NIS: {s.nis || '-'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                  Desa {s.desa || '-'}, Kec. {s.kecamatan || '-'}, Kab. {s.kabupaten || '-'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Tombol X di kanan */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSantriIdForIzin('');
                                setSearchSantriForIzin('');
                                setShowIzinSantriDropdown(false);
                              }}
                              className="p-1.5 rounded-lg hover:bg-indigo-105 text-indigo-500 hover:text-indigo-700 transition-all cursor-pointer focus:outline-none focus:ring-0 shrink-0"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Ketik nama atau NIS santri untuk mencari..."
                            value={searchSantriForIzin}
                            onChange={(e) => {
                              setSearchSantriForIzin(e.target.value);
                              setShowIzinSantriDropdown(true);
                            }}
                            onFocus={() => setShowIzinSantriDropdown(true)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all"
                          />
                          {searchSantriForIzin && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchSantriForIzin('');
                                setShowIzinSantriDropdown(false);
                              }}
                              className="absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        
                        {/* Dropdown candidates */}
                        {showIzinSantriDropdown && searchSantriForIzin.trim() !== '' && (
                          <div className="absolute z-40 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1">
                            {filteredIzinCandidates.length > 0 ? (
                              filteredIzinCandidates.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSantriIdForIzin(s.id);
                                    setSearchSantriForIzin('');
                                    setShowIzinSantriDropdown(false);
                                    
                                    // Set default start date to current time, and end date to 1 hour later
                                    const now = new Date();
                                    const nowStr = getYYYYMMDDTHHMM(now);
                                    setTanggalMulaiIzin(nowStr);
                                    
                                    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
                                    setTanggalSelesaiIzin(getYYYYMMDDTHHMM(oneHourLater));
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/55 flex items-center gap-3 transition-colors focus:outline-none focus:ring-0 focus:bg-indigo-50/55 border-b border-slate-100 last:border-0 cursor-pointer"
                                >
                                  {/* Foto lingkaran di kiri */}
                                  <div className="h-10 w-10 rounded-full overflow-hidden border border-indigo-200 bg-indigo-100 shrink-0 flex items-center justify-center">
                                    <img
                                      src={s.filePasFoto || (s.gender === 'Putra' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100')}
                                      alt={s.nama}
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  {/* Detail di sebelah kanan */}
                                  <div className="flex-1 min-w-0 space-y-0.5 text-left">
                                    <h4 className="text-xs font-extrabold text-slate-800 truncate">{s.nama}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold truncate">
                                      NIS: {s.nis || '-'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">
                                      Desa {s.desa || '-'}, Kec. {s.kecamatan || '-'}, Kab. {s.kabupaten || '-'}
                                    </p>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <p className="px-4 py-3 text-xs font-semibold text-slate-400 italic text-center">Tidak ada santri aktif bertepatan kata pencarian.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Keterangan/Izin (for Resmi) or Kronologi (for Ilegal) */}
                  {perizinanMode === 'resmi' ? (
                    <div className="space-y-1.5 relative" ref={presetDropdownRef}>
                      <label className="text-xs font-bold text-slate-500">Keterangan/Izin *</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ketik keterangan izin atau pilih preset..."
                          value={jenisIzin}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJenisIzin(val);
                            setShowPresetDropdown(true);
                            if (!val && tanggalMulaiIzin) {
                              const d = new Date(tanggalMulaiIzin);
                              d.setHours(d.getHours() + 1);
                              setTanggalSelesaiIzin(getYYYYMMDDTHHMM(d));
                            }
                          }}
                          onFocus={() => setShowPresetDropdown(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.currentTarget.blur();
                              setShowPresetDropdown(false);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all cursor-text"
                        />
                        {jenisIzin && (
                          <button
                            type="button"
                            onClick={() => {
                              setJenisIzin('');
                              setShowPresetDropdown(false);
                              if (tanggalMulaiIzin) {
                                const d = new Date(tanggalMulaiIzin);
                                d.setHours(d.getHours() + 1);
                                setTanggalSelesaiIzin(getYYYYMMDDTHHMM(d));
                              }
                            }}
                            className="absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {showPresetDropdown && presetIzinList.filter(p => p.nama.toLowerCase().includes(jenisIzin.toLowerCase())).length > 0 && (
                        <div className="absolute z-40 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-[280px] overflow-hidden p-1 animate-in fade-in slide-in-from-top-1">
                          <div className="py-1 overflow-y-auto max-h-[220px] divide-y divide-slate-100">
                            {presetIzinList.filter(p => p.nama.toLowerCase().includes(jenisIzin.toLowerCase())).map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setJenisIzin(preset.nama);
                                  // Adjust Tanggal Selesai based on durasi
                                  const d = new Date(tanggalMulaiIzin);
                                  d.setDate(d.getDate() + (preset.durasiDays || 0));
                                  d.setHours(d.getHours() + (preset.durasiHours || 0));
                                  d.setMinutes(d.getMinutes() + (preset.durasiMinutes || 0));
                                  setTanggalSelesaiIzin(getYYYYMMDDTHHMM(d));
                                  setShowPresetDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50/55 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
                              >
                                <span>{preset.nama}</span>
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold">
                                  {formatDuration(preset.durasiDays, preset.durasiHours, preset.durasiMinutes)}
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="p-1 border-t border-slate-100 bg-slate-50/50 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPresetDropdown(false);
                                setIsAddPresetModalOpen(true);
                              }}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Tambah Preset Izin</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Keterangan / Kronologi Keluar *</label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Kabur lewat pagar belakang setelah Isya..."
                        value={keteranganIzin}
                        onChange={(e) => setKeteranganIzin(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all cursor-text"
                        required
                      />
                    </div>
                  )}

                  {/* Date Range */}
                  <div className={perizinanMode === 'resmi' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 block text-left">
                        {perizinanMode === 'resmi' ? 'Tanggal Mulai *' : 'Tanggal Keluar *'}
                      </label>
                      <DateTimePicker
                        value={tanggalMulaiIzin}
                        onChange={(val) => {
                          setTanggalMulaiIzin(val);
                          if (val && perizinanMode === 'resmi') {
                            // Only adjust the end date if it is currently empty or if it is earlier than the new start date
                            if (!tanggalSelesaiIzin || tanggalSelesaiIzin < val) {
                              const d = new Date(val);
                              d.setHours(d.getHours() + 1);
                              setTanggalSelesaiIzin(getYYYYMMDDTHHMM(d));
                            }
                          }
                        }}
                      />
                    </div>
                    {perizinanMode === 'resmi' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block text-left">Tanggal Selesai *</label>
                        <DateTimePicker
                          value={tanggalSelesaiIzin}
                          min={tanggalMulaiIzin}
                          onChange={(val) => {
                            if (val && val < tanggalMulaiIzin) {
                              setTanggalSelesaiIzin(tanggalMulaiIzin);
                            } else {
                              setTanggalSelesaiIzin(val);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedSantriIdForIzin}
                    className={`w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                      selectedSantriIdForIzin 
                        ? (perizinanMode === 'resmi' 
                            ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' 
                            : 'bg-rose-600 hover:bg-rose-750 cursor-pointer'
                          )
                        : 'bg-slate-300 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {perizinanMode === 'resmi' ? 'Catat Perizinan Baru' : 'Catat Keluar Ilegal Baru'}
                    </span>
                  </button>
                </form>
              </div>
              )}

              {/* Riwayat Catatan Perizinan */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {perizinanMode === 'resmi' ? 'Riwayat Catatan Perizinan' : 'Riwayat Keluar Ilegal'}
                    </h3>
                  </div>

                  <div className="flex flex-row items-center gap-3 w-full">
                    {/* Status Filter Dropdown - Paling Kiri */}
                    <div className="w-24 shrink-0">
                      <select
                        value={historyFilterStatus}
                        onChange={(e) => setHistoryFilterStatus(e.target.value as any)}
                        className="rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-[11px] font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer shadow-xs appearance-none relative w-full"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '12px'
                        }}
                      >
                        <option value="semua">Semua</option>
                        <option value="keluar">Keluar</option>
                        <option value="masuk">Masuk</option>
                      </select>
                    </div>

                    {/* Kotak Cari memanjang mengikuti ukuran layar */}
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari riwayat..."
                        value={searchIzin}
                        onChange={(e) => setSearchIzin(e.target.value)}
                        className="w-full pl-8 pr-9 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" title="Lompat ke tanggal...">
                        <Calendar className="h-3.5 w-3.5 pointer-events-none" />
                        <input
                          type="date"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              handleJumpToHistoryDate(val);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of historical permissions */}
                {(() => {
                  const filteredHist = perizinanList.filter(rec => {
                    const matchesGender = rec.gender === filterGender;
                    const matchesType = perizinanMode === 'resmi' ? !rec.isCabut : rec.isCabut;
                    const matchesSearch = !searchIzin.trim() || 
                      (rec.namaSantri || '').toLowerCase().includes(searchIzin.toLowerCase()) ||
                      (rec.keterangan || '').toLowerCase().includes(searchIzin.toLowerCase()) ||
                      (rec.jenisIzin || '').toLowerCase().includes(searchIzin.toLowerCase());
                    
                    let matchesStatus = true;
                    const isReturned = rec.status === 'Sudah Kembali';
                    if (historyFilterStatus === 'keluar') {
                      matchesStatus = !isReturned;
                    } else if (historyFilterStatus === 'masuk') {
                      matchesStatus = isReturned;
                    }
                    
                    return matchesGender && matchesType && matchesSearch && matchesStatus;
                  });

                  if (filteredHist.length === 0) {
                    return (
                      <div className="h-[500px] flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/40 p-8">
                        <Info className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold text-slate-500">
                          {perizinanMode === 'resmi' 
                            ? 'Tidak ada riwayat perizinan ditemukan' 
                            : 'Tidak ada riwayat keluar ilegal ditemukan'
                          }
                        </p>
                      </div>
                    );
                  }

                  // Grouping filteredHist by date portion
                  const groups: { dateLabel: string; dateKey: string; items: PerizinanRecord[] }[] = [];
                  filteredHist.forEach(rec => {
                    const dateVal = rec.isCabut 
                      ? (rec.tanggalCabut || rec.tanggalMulai) 
                      : rec.tanggalMulai;
                    const dateLabel = formatIndonesianDateOnly(dateVal);
                    const dateKey = dateVal ? dateVal.substring(0, 10) : '';
                    
                    const lastGroup = groups[groups.length - 1];
                    if (lastGroup && lastGroup.dateLabel === dateLabel) {
                      lastGroup.items.push(rec);
                    } else {
                      groups.push({ dateLabel, dateKey, items: [rec] });
                    }
                  });

                  return (
                    <div id="history-scroll-container" className="h-[500px] overflow-y-auto bg-slate-50/40 space-y-3.5 p-2.5">
                      {groups.map((group, groupIdx) => (
                        <div key={groupIdx} id={`history-group-${group.dateKey}`} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs relative">
                          {/* Sticky Date Header */}
                          <div className="sticky top-0 bg-indigo-50/95 backdrop-blur-xs py-2 px-3 border-b border-indigo-100/50 font-black text-[10px] text-indigo-850 z-10 flex items-center justify-between">
                            <span className="tracking-wider uppercase">Tanggal: {group.dateLabel}</span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded-full font-black">
                              {group.items.length} Data
                            </span>
                          </div>
                          
                          {/* List of items inside this group */}
                          <div className="divide-y divide-slate-100">
                            {group.items.map((rec) => (
                              <RiwayatIzinRow
                                key={rec.id}
                                rec={rec}
                                santriList={santriList}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Right Panel: Memantau Anak-Anak Yang Masih Dalam Izin - col-span-6 */}
            <div className="lg:col-span-6 lg:h-full lg:flex lg:flex-col">
              
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 lg:flex-1 lg:flex lg:flex-col min-h-0 space-y-4">
                <div className="border-b border-slate-100 pb-3 shrink-0">
                  <h3 className={`text-sm font-bold ${perizinanMode === 'resmi' ? 'text-slate-800' : 'text-rose-800'}`}>
                    {perizinanMode === 'resmi' ? 'Pantauan Santri di Luar' : 'Pantauan Keluar Ilegal'}
                  </h3>
                </div>

                {/* Search bar specifically for active permits */}
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={perizinanMode === 'resmi' ? "Cari santri aktif di luar..." : "Cari santri keluar ilegal..."}
                    value={searchActiveIzin}
                    onChange={(e) => setSearchActiveIzin(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      perizinanMode === 'resmi' ? 'focus:ring-indigo-500/25' : 'focus:ring-rose-500/25'
                    }`}
                  />
                </div>

                {/* Active out-of-pondok student list */}
                {(() => {
                  const activePermits = perizinanList.filter(rec => {
                    const matchesGender = rec.gender === filterGender;
                    const matchesType = perizinanMode === 'resmi' ? !rec.isCabut : rec.isCabut;
                    const isActive = rec.status === 'Izin Aktif' && matchesType;
                    const matchesSearch = !searchActiveIzin.trim() || 
                      (rec.namaSantri || '').toLowerCase().includes(searchActiveIzin.toLowerCase());
                    return matchesGender && isActive && matchesSearch;
                  });

                  if (activePermits.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex-1 flex flex-col justify-center items-center">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500 shrink-0" />
                        <p className="text-xs font-black text-slate-850">
                          {perizinanMode === 'resmi' ? 'Semua Santri Berada di Pondok' : 'Aman dari Keluar Ilegal'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {perizinanMode === 'resmi' 
                            ? `Tidak ada santri ${filterGender.toLowerCase()} yang sedang berada di luar.`
                            : `Alhamdulillah, tidak ada santri ${filterGender.toLowerCase()} yang terpantau keluar secara ilegal.`
                          }
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                      {activePermits.map((rec) => (
                        <ActiveSantriIzinCard
                          key={rec.id}
                          rec={rec}
                          santriList={santriList}
                          handleReturnToPondok={handleReturnToPondok}
                          onExtendDuration={handleExtendDuration}
                          onDeletePerizinan={confirmDeletePerizinan}
                          onRevokeIzin={handleRevokeIzin}
                          canWriteCurrent={canWriteCurrent}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL PRINT DISCIPLINARY CARD (KARTU DISIPLIN SANTRI) */}
      {/* ======================================= */}
      <AnimatePresence>
        {printingSantri && (() => {
          const stats = getStudentStats(printingSantri.nama, printingSantri.id);
          const ind = getDisciplineIndicator(stats.points);

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto print:static">
              <div className="flex min-h-screen items-center justify-center p-4 text-center print:p-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs print:hidden"
                  onClick={() => setPrintingSantri(null)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-250 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:static"
                >
                  {/* Print Window Header (Hidden when printing) */}
                  <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Printer className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Cetak Kartu Disiplin Santri</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">Tampilan cetak formal untuk arsip asrama atau wali santri</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPrintingSantri(null)}
                      className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Print Notification Info Banner */}
                  <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start gap-2.5 text-[11px] leading-normal text-amber-900 print:hidden">
                    <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold">Tips Pencetakan iFrame:</p>
                      <p className="font-medium text-slate-700">
                        Jika tombol &quot;Cetak Sekarang&quot; tidak merespon karena kebijakan keamanan penjelajah (iframe), silakan 
                        <strong> Buka Aplikasi di Tab Baru </strong> (klik tombol panah miring kanan atas di panel preview), lalu ulangi langkah cetak ini.
                      </p>
                    </div>
                  </div>

                  {/* Printable Area Container */}
                  <div id="printable-area" className="p-6 space-y-6 bg-white text-slate-900">
                    
                    {/* Header Formal Pesantren */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {profile.logoUrl && profile.logoUrl.trim() ? (
                            <img
                              src={profile.logoUrl.trim()}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg viewBox="0 0 100 100" className="h-10 w-10 text-slate-800" xmlns="http://www.w3.org/2000/svg">
                              <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="currentColor" />
                              <circle cx="50" cy="50" r="28" fill="#ffffff" />
                              <path d="M50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30 Z" fill="currentColor" />
                              <path d="M50 35 L53 43 L62 43 L55 48 L58 56 L50 51 L42 56 L45 48 L38 43 L47 43 Z" fill="#ffffff" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h2 className="font-display text-base font-extrabold uppercase tracking-tight text-slate-850">
                            {profile.namaPesantren.toUpperCase()}
                          </h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            BIRO KEPENGASUHAN & KEDISIPLINAN TATA TERTIB
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium mt-1 leading-relaxed">
                            {[
                              profile.alamat,
                              profile.desa ? `Ds. ${profile.desa}` : '',
                              profile.kecamatan ? `Kec. ${profile.kecamatan}` : '',
                              profile.kabupaten ? `Kab. ${profile.kabupaten}` : '',
                              profile.provinsi
                            ].filter(Boolean).join(', ')}
                          </p>
                          {(profile.telepon || profile.email) && (
                            <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                              {[
                                profile.telepon ? `Telp: ${profile.telepon}` : '',
                                profile.email ? `Email: ${profile.email}` : ''
                              ].filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[10px] bg-slate-100 border border-slate-250 px-2 py-0.5 rounded font-mono font-extrabold block">
                          DOK: TERTIB/K-{printingSantri.id}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">Tanggal: {new Date().toISOString().split('T')[0]}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                      <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-800 underline">
                        KARTU CATATAN PELANGGARAN & DISIPLIN SANTRI
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                        Tahun Ajaran {localStorage.getItem('smartsantri_active_tahun_ajaran') || '2026/2027'}
                      </p>
                    </div>

                    {/* Identitas Santri Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="space-y-1.5 font-semibold text-slate-700">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Nama Lengkap</span>
                          <span className="col-span-2 text-slate-800 font-extrabold">: {printingSantri.nama}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Nomor Induk (NIS)</span>
                          <span className="col-span-2 text-slate-800 font-mono font-bold">: {printingSantri.nis || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Gender / Status</span>
                          <span className="col-span-2 text-slate-800">: {printingSantri.gender} / Aktif</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 font-semibold text-slate-700">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Kamar / Asrama</span>
                          <span className="col-span-2 text-slate-800">: {printingSantri.kamar || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Kelas Belajar</span>
                          <span className="col-span-2 text-slate-800">: Kelas {printingSantri.kelas || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400">Asal Daerah</span>
                          <span className="col-span-2 text-slate-800">: {printingSantri.asal || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Badges on Print */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 border border-slate-200 rounded-xl bg-white">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL KASUS</p>
                        <p className="text-lg font-extrabold text-slate-800">{stats.count} Kali Pelanggaran</p>
                      </div>
                      <div className="p-3 border border-slate-200 rounded-xl bg-white">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL POIN SANKSI</p>
                        <p className="text-lg font-extrabold text-rose-700">{stats.points} Poin Akumulasi</p>
                      </div>
                      <div className="p-3 border border-slate-200 rounded-xl bg-white">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">INDIKATOR DISIPLIN</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-1">{ind.text}</p>
                      </div>
                    </div>

                    {/* Infraction list table */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                        DAFTAR RIWAYAT PELANGGARAN TERPERINCI
                      </p>
                      {stats.records.length > 0 ? (
                        <table className="w-full border-collapse text-left text-[11px] border border-slate-200">
                          <thead>
                            <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-extrabold text-slate-550 uppercase">
                              <th className="p-2 border border-slate-200 text-center w-10">No</th>
                              <th className="p-2 border border-slate-200 w-24">Tanggal</th>
                              <th className="p-2 border border-slate-200">Bentuk Pelanggaran</th>
                              <th className="p-2 border border-slate-200 text-center w-16">Poin</th>
                              <th className="p-2 border border-slate-200">Bentuk Sanksi Ta&apos;zir yang Diberikan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                            {stats.records.map((rec, i) => (
                              <tr key={rec.id}>
                                <td className="p-2 border border-slate-200 text-center font-mono">{i + 1}</td>
                                <td className="p-2 border border-slate-200 font-mono whitespace-nowrap">{rec.tanggal}</td>
                                <td className="p-2 border border-slate-200 font-bold text-slate-800">{rec.jenisPelanggaran}</td>
                                <td className="p-2 border border-slate-200 text-center font-extrabold text-rose-700">{rec.poin}</td>
                                <td className="p-2 border border-slate-200">{rec.tindakan}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center border border-dashed border-slate-250 rounded-xl bg-slate-50/20">
                          <p className="text-xs text-slate-400 font-bold italic">
                            Bersih dari pelanggaran. Santri ini memiliki rekam jejak kedisplinan yang SANGAT BAIK.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Disciplinary Rules Warning footer text */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] leading-relaxed font-semibold text-slate-500">
                      <strong className="text-slate-800">PERHATIAN: </strong> 
                      Akumulasi poin kedisplinan berjalan di atas dapat mempengaruhi kelayakan santri dalam mengikuti ujian semester, 
                      mendapatkan izin kepulangan berkala, serta kelayakan mendapatkan beasiswa berprestasi pesantren. 
                      Jika akumulasi poin melampaui 100, wali santri akan dipanggil secara tertulis untuk sidang majelis pengasuh.
                    </div>

                    {/* Signature block */}
                    <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs font-semibold">
                      <div className="space-y-16">
                        <p className="text-slate-450">Disetujui / Wali Santri</p>
                        <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">
                          (........................................)
                        </div>
                      </div>

                      <div className="space-y-16">
                        <p className="text-slate-450">Ketua Keamanan</p>
                        <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                          {profile.namaKetuaKeamanan && profile.namaKetuaKeamanan.trim() ? profile.namaKetuaKeamanan.trim() : '_________________________'}
                        </div>
                      </div>

                      <div className="space-y-16">
                        <p className="text-slate-450">Santri yang Bersangkutan</p>
                        <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                          {printingSantri.nama}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Print Window Footer (Hidden when printing) */}
                  <div className="p-4 border-t border-slate-150 bg-slate-50/80 flex items-center justify-end gap-2 print:hidden">
                    <button
                      onClick={() => setPrintingSantri(null)}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handlePrintCard}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Cetak Sekarang</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL 1: RECORD VIOLATION (PENCATATAN) */}
      {/* ======================================= */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsLogModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white text-left shadow-2xl border-0"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">Catat Pelanggaran Santri</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLogModalOpen(false)}
                    className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-655 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleRecordViolation} className="p-5 space-y-4">
                  {/* SEARCH SANTRI FIELD */}
                  {!selectedSantri && (
                    <div className="relative" ref={studentSearchRef}>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">NAMA SANTRI</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required={!selectedSantri}
                          placeholder="Ketik nama santri untuk mencari..."
                          value={logSearchSantri}
                          onChange={(e) => {
                            setLogSearchSantri(e.target.value);
                            setShowSantriDropdown(true);
                          }}
                          onFocus={() => setShowSantriDropdown(true)}
                          className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all"
                        />
                      </div>

                      {/* Autocomplete Dropdown list */}
                      {showSantriDropdown && logSearchSantri.trim() !== '' && (
                        <div className="absolute left-0 right-0 mt-1.5 z-35 max-h-48 overflow-y-auto rounded-xl bg-white shadow-2xl py-1 border border-slate-100">
                          {searchedSantris.length > 0 ? (
                            searchedSantris.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSantri(s);
                                  setLogSearchSantri('');
                                  setShowSantriDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-rose-50/55 flex items-center gap-3 transition-colors focus:outline-none focus:ring-0 focus:bg-rose-50/55 border-b border-slate-100 last:border-0"
                              >
                                {/* Foto lingkaran di kiri */}
                                <div className="h-10 w-10 rounded-full overflow-hidden border border-rose-200 bg-rose-100 shrink-0 flex items-center justify-center">
                                  <img
                                    src={s.filePasFoto || (s.gender === 'Putra' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100')}
                                    alt={s.nama}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                {/* Detail di sebelah kanan */}
                                <div className="flex-1 min-w-0 space-y-0.5 text-left">
                                  <h4 className="text-xs font-extrabold text-slate-800 truncate">{s.nama}</h4>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate">
                                    NIS: {s.nis || '-'}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-medium truncate">
                                    Alamat: {[s.desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ') || '-'}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-xs font-semibold text-slate-400 italic">Tidak ada santri aktif bertepatan kata pencarian.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* DISPLAY SELECTED SANTRI BADGE */}
                  {selectedSantri && (
                    <div className="bg-rose-50/40 border border-rose-100/50 p-4 rounded-xl flex items-center justify-between gap-4 relative group">
                      <div className="flex items-center gap-4.5 min-w-0 flex-1">
                        {/* Foto lingkaran di kiri */}
                        <div className="h-14 w-14 rounded-full overflow-hidden border border-rose-200 bg-rose-100 shrink-0 flex items-center justify-center">
                          <img
                            src={selectedSantri.filePasFoto || (selectedSantri.gender === 'Putra' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100')}
                            alt={selectedSantri.nama}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {/* Detail di sebelah kanan */}
                        <div className="flex-1 min-w-0 space-y-0.5 text-left">
                          <h4 className="text-sm font-extrabold text-slate-800 truncate">{selectedSantri.nama}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                            NIS: {selectedSantri.nis || '-'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            Alamat: {[selectedSantri.desa, selectedSantri.kecamatan, selectedSantri.kabupaten].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Tombol X di kanan */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSantri(null);
                          setLogSearchSantri('');
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-all cursor-pointer focus:outline-none focus:ring-0 shrink-0"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  )}

                  {/* VIOLATION TYPE SELECTION */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">JENIS PELANGGARAN</label>
                    
                    <div className="flex items-center gap-4 mb-2.5">
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="violationType"
                          checked={!selectedCustomViolation}
                          onChange={() => {
                            setSelectedCustomViolation(false);
                            setCustomViolationName('');
                          }}
                          className="text-rose-600 focus:ring-0 focus:ring-offset-0 focus:outline-none h-3.5 w-3.5 border-slate-300"
                        />
                        <span>Pilih dari Buku Induk</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="violationType"
                          checked={selectedCustomViolation}
                          onChange={() => {
                            setSelectedCustomViolation(true);
                            setSelectedKatalogItem(null);
                          }}
                          className="text-rose-600 focus:ring-0 focus:ring-offset-0 focus:outline-none h-3.5 w-3.5 border-slate-300"
                        />
                        <span>Ketik Manual (Luar Buku Induk)</span>
                      </label>
                    </div>

                    {!selectedCustomViolation ? (
                      <div className="relative">
                        {showKatalogDropdown && (
                          <div 
                            className="fixed inset-0 z-20 bg-transparent" 
                            onClick={() => setShowKatalogDropdown(false)}
                          />
                        )}
                        <div className="relative z-25">
                          <input
                            type="text"
                            required={!selectedCustomViolation && !selectedKatalogItem}
                            placeholder="Cari pelanggaran dari Buku Induk..."
                            value={selectedKatalogItem ? selectedKatalogItem.nama : katalogSearchQuery}
                            onChange={(e) => {
                              setKatalogSearchQuery(e.target.value);
                              if (selectedKatalogItem) {
                                setSelectedKatalogItem(null);
                              }
                              setShowKatalogDropdown(true);
                            }}
                            onFocus={() => setShowKatalogDropdown(true)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all"
                          />
                        </div>
                        
                        {showKatalogDropdown && (
                          <div className="absolute left-0 right-0 mt-1.5 z-30 max-h-48 overflow-y-auto rounded-xl bg-white shadow-2xl py-1 border border-slate-100">
                            {filteredKatalogItems.length > 0 ? (
                              filteredKatalogItems.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedKatalogItem(item);
                                    setKatalogSearchQuery(item.nama);
                                    setShowKatalogDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50/50 block text-xs font-bold text-slate-800 transition-colors focus:outline-none focus:ring-0 focus:bg-rose-50/50 border-b border-slate-50 last:border-0"
                                >
                                  {item.nama}
                                </button>
                              ))
                            ) : (
                              <p className="px-4 py-3 text-xs font-semibold text-slate-400 italic">Tidak menemukan sanksi/aturan yang sesuai.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={selectedCustomViolation}
                        placeholder="Ketik pelanggaran lainnya di sini..."
                        value={customViolationName}
                        onChange={(e) => setCustomViolationName(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all"
                      />
                    )}
                  </div>

                  {/* AUTO CALCULATION AND REPETITION WARNING BANNER */}
                  {selectedSantri && selectedKatalogItem && selectedKatalogItem.rules && selectedKatalogItem.rules.length > 0 && (
                    <div className="bg-yellow-400 p-3 rounded-xl flex items-center gap-2 text-yellow-950 font-bold text-xs border border-yellow-500/25">
                      <span className="w-2 h-2 rounded-full bg-yellow-700 animate-pulse shrink-0" />
                      <span>Pelanggaran Ke-{occurrenceCount + 1} selama &quot;{activePeriodeObj ? activePeriodeObj.nama : 'Semua Periode'}&quot;</span>
                    </div>
                  )}

                  {/* DATE FIELD */}
                  <div>
                    <BirthDatePicker
                      id="tanggal-pelanggaran-input"
                      label="Tanggal Pelanggaran"
                      required={true}
                      value={logTanggal}
                      onChange={(isoDate) => {
                        let finalDate = isoDate;
                        if (hasActivePeriode && activePeriodeObj && activePeriodeObj.startDate && activePeriodeObj.endDate) {
                          if (finalDate < activePeriodeObj.startDate) {
                            finalDate = activePeriodeObj.startDate;
                          } else if (finalDate > activePeriodeObj.endDate) {
                            finalDate = activePeriodeObj.endDate;
                          }
                        }
                        setLogTanggal(finalDate);
                      }}
                    />
                  </div>

                  {/* POIN & TAZIR */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">BOBOT POIN</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Contoh: 15"
                        value={logPoin}
                        onChange={(e) => setLogPoin(Number(e.target.value))}
                        disabled={!selectedCustomViolation}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:pointer-events-none disabled:select-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">TINDAKAN / SANKSI TA&apos;ZIR</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Menghafal Juz Amma / Membersihkan masjid"
                        value={logTindakan}
                        onChange={(e) => setLogTindakan(e.target.value)}
                        disabled={!selectedCustomViolation}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-0 focus:border-slate-400 focus-visible:outline-none focus-visible:ring-0 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:pointer-events-none disabled:select-none"
                      />
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLogModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none shadow-sm hover:bg-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedSantri || (!selectedKatalogItem && !selectedCustomViolation)}
                      className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/15 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL 2: ADD / EDIT CATALOG ITEM */}
      {/* ======================================= */}
      <AnimatePresence>
        {isCatalogModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsCatalogModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="relative w-full max-w-2xl h-[680px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200/60"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {catalogToEdit ? 'Ubah Aturan Buku Induk' : 'Tambah Aturan Buku Induk Baru'}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCatalogModalOpen(false)}
                    className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-655 transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCatalogItem} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* NAMA PELANGGARAN */}
                    <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">NAMA PELANGGARAN / NAMA ATURAN</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Membawa Senjata Tajam / Merokok / Kabur"
                      value={catNama}
                      onChange={(e) => setCatNama(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* DESKRIPSI (FULL-WIDTH) */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">DESKRIPSI / PENJELASAN ATURAN (OPSIONAL)</label>
                    <input
                      type="text"
                      placeholder="Penjelasan ringkas mengenai detail/batasan pelanggaran ini..."
                      value={catDeskripsi}
                      onChange={(e) => setCatDeskripsi(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* DEFAULTS */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    {catRules.length > 0 && (
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                          1
                        </span>
                        <span>PELANGGARAN PERTAMA</span>
                      </h4>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                          POIN PELANGGARAN
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={catDefaultPoin}
                          onChange={(e) => setCatDefaultPoin(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                          SANKSI TA'ZIR
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={catRules.length > 0 ? "Sanksi ta'zir khusus untuk kali ke-1..." : "Ta'ziran standar jika aturan berulang tidak cocok..."}
                          value={catDefaultTazir}
                          onChange={(e) => setCatDefaultTazir(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SPECIAL REPETITION RULES TIER */}
                  <div className="space-y-3">
                    {catRules.length === 0 && (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={addRepetitionRule}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/55 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> Tambah aturan repetisi
                        </button>
                      </div>
                    )}

                    {(() => {
                      if (catRules.length > 0) {
                        const sortedRules = [...catRules].sort((a, b) => a.kaliKe - b.kaliKe);
                        const hasCustomStrategy = catRepetitionStrategy === 'custom';
                        const sequentialRules = hasCustomStrategy 
                          ? sortedRules.slice(0, -1) 
                          : sortedRules;

                        const customStrategyRule = hasCustomStrategy && sortedRules.length > 0
                          ? sortedRules[sortedRules.length - 1] 
                          : null;

                        const highestSequentialKali = sequentialRules.length > 0 
                          ? sequentialRules[sequentialRules.length - 1].kaliKe 
                          : 1;

                        const nextKaliLevel = highestSequentialKali + 1;

                        return (
                          <div className="space-y-4">
                            {/* Sequential Rule Boxes (List Container) */}
                            <div className="space-y-3 border border-slate-200/80 bg-slate-50/50 p-2.5 rounded-2xl">
                              {sequentialRules.map((rule) => (
                                <div key={rule.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="h-5 w-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                        {rule.kaliKe}
                                      </span>
                                      <span>PENGULANGAN KE-{rule.kaliKe}</span>
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => removeRepetitionRule(rule.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer transition-all select-none flex items-center justify-center rounded-lg hover:bg-rose-50 sm:p-0 sm:hover:bg-transparent"
                                      title="Hapus Repetisi"
                                    >
                                      <span className="hidden sm:inline text-[10px] font-bold">Hapus Repetisi</span>
                                      <Trash2 className="h-4 w-4 sm:hidden" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-1">
                                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                        POIN PELANGGARAN
                                      </label>
                                      <input
                                        type="number"
                                        required
                                        min="0"
                                        value={rule.poin}
                                        onChange={(e) => updateRuleValue(rule.kaliKe, 'poin', Number(e.target.value))}
                                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                        SANKSI TA'ZIR
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder={`Sanksi ta'zir khusus untuk pengulangan ke-${rule.kaliKe}...`}
                                        value={rule.tazir}
                                        onChange={(e) => updateRuleValue(rule.kaliKe, 'tazir', e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Control button to add more sequential rules */}
                            <div className="flex justify-center pt-1.5 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={addRepetitionRule}
                                className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-950 border border-indigo-200 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer select-none"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah aturan repetisi</span>
                              </button>
                            </div>

                            {/* BOX Strategy: Kali ke-(highest+1) atau Lebih */}
                            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                              <h5 className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-5 w-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                  {nextKaliLevel}+
                                </span>
                                <span>PENGULANGAN KE-{nextKaliLevel} ATAU LEBIH</span>
                              </h5>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Skema Tindakan / Strategi Sanksi
                                  </label>
                                  <select
                                    value={catRepetitionStrategy}
                                    onChange={(e) => handleStrategyChange(e.target.value as any)}
                                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                  >
                                    <option value="same_as_2">Sama dengan sanksi Pengulangan ke-{highestSequentialKali}</option>
                                    <option value="repeat_1_2">Ulangi Seluruh Fase secara berulang (Siklus Pelanggaran Pertama s.d Pengulangan ke-{highestSequentialKali})</option>
                                    <option value="custom">Kustom (Input Mandiri)</option>
                                  </select>
                                </div>
 
                                {catRepetitionStrategy === 'custom' && customStrategyRule ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-1">
                                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                        POIN PELANGGARAN
                                      </label>
                                      <input
                                        type="number"
                                        required
                                        min="0"
                                        value={customStrategyRule.poin}
                                        onChange={(e) => updateRuleValue(customStrategyRule.kaliKe, 'poin', Number(e.target.value))}
                                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                        SANKSI TA'ZIR
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder={`Sanksi ta'zir kustom untuk pengulangan ke-${nextKaliLevel}...`}
                                        value={customStrategyRule.tazir}
                                        onChange={(e) => updateRuleValue(customStrategyRule.kaliKe, 'tazir', e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      />
                                    </div>
                                  </div>
                                ) : catRepetitionStrategy === 'same_as_2' ? (
                                  <div className="text-xs bg-amber-50/50 text-amber-800 border border-amber-100 p-3 rounded-xl font-medium leading-relaxed">
                                    <span className="font-bold block mb-0.5">ℹ️ Sanksi Otomatis Disamakan</span>
                                    Poin dan Sanksi Ta'zir untuk pengulangan ke-{nextKaliLevel} atau lebih akan selalu sama dengan Pengulangan ke-{highestSequentialKali} secara otomatis (yaitu: <span className="font-bold">
                                      {sequentialRules.length > 0 ? sequentialRules[sequentialRules.length - 1].poin : catDefaultPoin} Poin
                                    </span> - <span className="font-bold">
                                      {sequentialRules.length > 0 ? (sequentialRules[sequentialRules.length - 1].tazir || catDefaultTazir || 'belum ditentukan') : (catDefaultTazir || 'belum ditentukan')}
                                    </span>).
                                  </div>
                                ) : (
                                  <div className="text-xs bg-indigo-50/50 text-indigo-850 border border-indigo-100 p-3 rounded-xl font-medium leading-relaxed">
                                    <span className="font-bold block mb-0.5 text-indigo-950">🔄 Siklus Pengulangan Fase</span>
                                    Sanksi akan mengulang siklus/fase dari awal secara berulang: Pelanggaran pengulangan ke-{nextKaliLevel} akan disamakan dengan Pelanggaran Pertama (<span className="font-bold">{catDefaultPoin} Poin</span>), pengulangan ke-{nextKaliLevel+1} akan disamakan dengan Pengulangan ke-2, dan seterusnya. Siklus akan berputar kembali setelah mencapai Pengulangan ke-{highestSequentialKali}.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/20">
                            <p className="text-[11px] font-semibold text-slate-400 italic">
                              Belum ada skema repetisi khusus. Aturan default utama akan selalu berlaku untuk setiap kali pelanggaran.
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  </div>

                  {/* Footer Buttons */}
                  <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      Simpan Aturan
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL 3: CATALOG DETAILS */}
      {/* ======================================= */}
      <AnimatePresence>
        {selectedCatalogDetail && (() => {
          const hasRepetition = selectedCatalogDetail.rules && selectedCatalogDetail.rules.length > 0;
          const baseRule = {
            kaliKe: 1,
            poin: selectedCatalogDetail.defaultPoin,
            tazir: selectedCatalogDetail.defaultTazir || '-'
          };
          const sortedRules = [...(selectedCatalogDetail.rules || [])]
            .filter(r => r.kaliKe !== 1)
            .sort((a, b) => a.kaliKe - b.kaliKe);
          const timelineRules = [baseRule, ...sortedRules];

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4 text-center">
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                  onClick={() => setSelectedCatalogDetail(null)}
                />

                <div
                  className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#F8FAFC] text-left shadow-2xl border border-slate-200/80"
                >
                  {/* Top Header Row matching HP screenshot */}
                  <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
                    <span className="font-extrabold text-indigo-950 text-sm tracking-wide">Detail Aturan</span>
                    <button 
                      onClick={() => setSelectedCatalogDetail(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4 overflow-y-auto pb-24 max-h-[calc(85vh-100px)]">
                    {/* Title */}
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                        {selectedCatalogDetail.nama}
                      </h2>
                    </div>

                    {/* Description Card */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider block">
                        Deskripsi Aturan
                      </span>
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                        <p className="text-slate-600 font-medium leading-relaxed text-xs sm:text-[13px]">
                          {selectedCatalogDetail.deskripsi || <span className="text-slate-400 italic font-normal">Tidak ada deskripsi tambahan untuk aturan ini.</span>}
                        </p>
                      </div>
                    </div>

                    {/* Conditional layout for single vs repetition */}
                    {hasRepetition ? (
                      <>
                        {/* Timeline Header */}
                        <div className="pt-1">
                          <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-3.5">
                            ATURAN REPETISI (BERTINGKAT)
                          </span>

                          {/* Beautiful Timeline */}
                          <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-4 py-1">
                            {timelineRules.map((rule, idx) => {
                              const isLast = idx === timelineRules.length - 1;
                              const label = rule.kaliKe === 1
                                ? 'Pelanggaran Pertama'
                                : isLast && timelineRules.length > 1
                                  ? `Pengulangan ke-${rule.kaliKe} atau lebih`
                                  : `Pengulangan ke-${rule.kaliKe}`;
                              return (
                                <div key={idx} className="relative">
                                  {/* Centered Dot */}
                                  <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-md" />

                                  {/* Card */}
                                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-[13px]">
                                        {label}
                                      </span>
                                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-100">
                                        +{rule.poin} Poin
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed pt-0.5">
                                      <span className="text-indigo-600 font-extrabold">Ta&apos;zir:</span> {rule.tazir || '-'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Single Poin Pelanggaran Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">Poin Pelanggaran</span>
                          </div>
                          <span className="bg-rose-50 text-rose-700 text-xs font-black px-3 py-1 rounded-full border border-rose-100">
                            +{selectedCatalogDetail.defaultPoin} Poin
                          </span>
                        </div>

                        {/* Single Sanksi Ta'zir Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex gap-3">
                          <Gavel className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-indigo-600 font-extrabold text-xs sm:text-sm block">Sanksi Ta&apos;zir</span>
                            <p className="text-xs sm:text-[13px] text-slate-600 font-semibold leading-relaxed">
                              {selectedCatalogDetail.defaultTazir || '-'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sticky Footer matching HP view */}
                  {canWriteBukuInduk && (
                    <div className="bg-white border-t border-slate-200 p-4 flex gap-3 sticky bottom-0 left-0 right-0 z-10 shadow-lg">
                      <button
                        onClick={(e) => {
                          setSelectedCatalogDetail(null);
                          openEditCatalog(selectedCatalogDetail, e);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Ubah Aturan</span>
                      </button>
                      <button
                        onClick={(e) => {
                          setSelectedCatalogDetail(null);
                          handleDeleteCatalogItem(selectedCatalogDetail.id, e);
                        }}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Hapus Aturan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: KONFIGURASI PERIODE SANKSI */}
      {/* ======================================= */}
      <AnimatePresence>
        {isPeriodConfigModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsPeriodConfigModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white text-left shadow-2xl border-0 font-sans"
              >
                {/* Header - No outline or background */}
                <div className="p-5 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {canWriteCurrent ? 'Atur Periode Aktif' : 'Filter Periode Laporan'}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPeriodConfigModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 pt-3 space-y-4">
                  {/* List - No outline borders */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {periodes.map((p) => {
                      const isPendingSelected = pendingSelectedPeriode === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                            isPendingSelected 
                              ? 'bg-indigo-50/50' 
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-black ${isPendingSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {p.nama}
                              </p>
                            </div>
                            {p.startDate && p.endDate ? (
                              <p className="text-[10px] text-slate-500 font-medium normal-case">
                                {formatIndonesianDateOnly(p.startDate)} s.d {formatIndonesianDateOnly(p.endDate)}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 font-medium italic normal-case">
                                Menampilkan seluruh data tanpa batas tanggal
                              </p>
                            )}
                          </div>

                          {/* Action Buttons for Each Row */}
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {/* PILIH Button */}
                            <button
                              type="button"
                              onClick={() => setPendingSelectedPeriode(p.id)}
                              disabled={isPendingSelected}
                              className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all select-none cursor-pointer ${
                                isPendingSelected
                                  ? 'bg-indigo-600 text-white shadow-3xs cursor-default'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 active:scale-95'
                              }`}
                            >
                              {isPendingSelected ? 'Terpilih' : 'Pilih'}
                            </button>

                            {/* UBAH Button (Custom periodes only) */}
                            {canWriteCurrent && !PREDEFINED_PERIODES.some(pre => pre.id === p.id) && (
                              <button
                                type="button"
                                onClick={(e) => handleEditPeriode(p, e)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer select-none active:scale-90 flex items-center justify-center"
                                title="Ubah Periode"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* HAPUS Button (Custom periodes only) */}
                            {canWriteCurrent && !PREDEFINED_PERIODES.some(pre => pre.id === p.id) && (
                              <button
                                type="button"
                                onClick={(e) => handleDeletePeriode(p.id, e)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer select-none active:scale-90 flex items-center justify-center"
                                title="Hapus Periode"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer - No outline or grey background */}
                <div className="p-5 pt-2 flex flex-wrap gap-3 justify-between items-center border-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsPeriodConfigModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
                  >
                    Tutup
                  </button>
                  <div className="flex items-center gap-2">
                    {canWriteCurrent && (
                      <button
                        type="button"
                        onClick={openAddPeriodeModal}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Periode Baru</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (canWriteCurrent) {
                          setShowPeriodConfirmDialog(true);
                        } else {
                          // View-only user: change selectedPeriode locally as a filter only
                          setSelectedPeriode(pendingSelectedPeriode);
                          setIsPeriodConfigModalOpen(false);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none active:scale-95"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>{canWriteCurrent ? 'Terapkan' : 'Terapkan Filter'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* DIALOG KONFIRMASI GANTI PERIODE */}
      {/* ======================================= */}
      <AnimatePresence>
        {showPeriodConfirmDialog && (
          <div className="fixed inset-0 z-[110] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
                onClick={() => setShowPeriodConfirmDialog(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl border-0 font-sans z-10"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Konfirmasi Ganti Periode Aktif
                    </h3>
                    <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl text-amber-900 space-y-1">
                      <p className="text-[11px] font-medium leading-relaxed text-amber-850">
                        Mengubah periode aktif akan menyesuaikan laporan pelanggaran yang tampil di tabel. 
                        Sistem juga akan menghitung riwayat pelanggaran santri (pelanggaran ke-1, ke-2, dst) hanya dalam rentang tanggal periode ini untuk menentukan sanksi yang sesuai.
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Apakah Anda yakin ingin menerapkan periode <span className="text-indigo-600 font-extrabold">&ldquo;{periodes.find(p => p.id === pendingSelectedPeriode)?.nama}&rdquo;</span> sebagai periode aktif saat ini?
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowPeriodConfirmDialog(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer select-none"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = pendingSelectedPeriode;
                      setSelectedPeriode(targetId);
                      setShowPeriodConfirmDialog(false);
                      setIsPeriodConfigModalOpen(false);

                      // Persist active status to Supabase
                      try {
                        const updates = periodes.map(async (p) => {
                          const isActive = p.id === targetId;
                          try {
                            await updateTableRow<{ id: string; nama: string; startDate?: string; endDate?: string; isActive?: boolean }>('periode', 'smartsantri_custom_periodes', p.id, { isActive });
                          } catch (e) {
                            console.warn(`Gagal memperbarui status aktif periode ${p.id} ke cloud`, e);
                          }
                        });
                        await Promise.all(updates);
                      } catch (err) {
                        console.error("Gagal menyimpan periode aktif ke database", err);
                      }
                    }}
                    className="px-5 py-2 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer select-none"
                  >
                    Ya, Terapkan
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: EKSPOR & CETAK LAPORAN */}
      {/* ======================================= */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[110] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsExportModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white text-left shadow-2xl border-0 font-sans p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">
                        Ekspor &amp; Cetak Laporan
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pilih metode pelaporan untuk halaman {displayTab === 'overview' ? 'Overview' : 'Data Pelanggaran'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border-none bg-transparent cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-slate-50/55 rounded-xl border border-slate-100 p-3.5 mb-5 flex items-start gap-2.5">
                  <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-normal">
                    <span className="font-bold text-slate-700 block">Kriteria Laporan Terpilih:</span>
                    <ul className="list-disc pl-4 mt-1 text-slate-500 space-y-0.5 font-medium">
                      <li>Halaman aktif: <b className="text-slate-700">{displayTab === 'overview' ? 'Overview Keamanan' : 'Data Pelanggaran (Buku Induk)'}</b></li>
                      <li>Kategori gender: <b className="text-slate-700">{filterGender}</b></li>
                      <li>Periode laporan: <b className="text-slate-700">{periodes.find(p => p.id === selectedPeriode)?.nama || 'Semua Periode'}</b></li>
                    </ul>
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Print PDF */}
                  <div
                    onClick={() => {
                      setIsExportModalOpen(false);
                      setTimeout(() => {
                        handlePrintPDFKeamanan();
                      }, 150);
                    }}
                    className="group border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/10 rounded-2xl p-4 transition-all cursor-pointer select-none text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Printer className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-700">Cetak PDF / Printer</h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-medium">
                        Cetak dokumen fisik atau ekspor ke PDF resmi dengan kop surat pesantren dan ttd pengesahan.
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-50 flex justify-end">
                      <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">Buka Cetak &rarr;</span>
                    </div>
                  </div>

                  {/* Option 2: Excel */}
                  <div
                    onClick={() => {
                      setIsExportModalOpen(false);
                      if (displayTab === 'overview') {
                        handleExportExcelOverview();
                      } else {
                        handleExportExcelCatatan();
                      }
                    }}
                    className="group border border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/10 rounded-2xl p-4 transition-all cursor-pointer select-none text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-emerald-700">Unduh Excel (.xls)</h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-medium">
                        Unduh semua data mentah dan ringkasan visual ke format Microsoft Excel spreadsheet.
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-50 flex justify-end">
                      <span className="text-[10px] font-bold text-emerald-600 group-hover:underline">Unduh File &rarr;</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end border-0 bg-white pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer select-none"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* PRINT AREA TEMPLATE (HIDDEN ON SCREEN)  */}
      {/* ======================================= */}
      <div className="hidden print:block font-sans text-slate-900 bg-white p-12 min-h-screen">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area-keamanan, .print-area-keamanan * {
              visibility: visible;
            }
            .print-area-keamanan {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
        <div className="print-area-keamanan space-y-8">
          {/* Letterhead (Kop Surat) */}
          <div className="flex items-center justify-between border-b-4 border-slate-800 pb-4">
            <div className="text-left">
              {profile.namaYayasan && profile.namaYayasan.trim() && (
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {profile.namaYayasan}
                </span>
              )}
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {profile.namaPesantren || 'SMARTSANTRI'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {[
                  profile.alamat,
                  profile.desa ? `Ds. ${profile.desa}` : '',
                  profile.kecamatan ? `Kec. ${profile.kecamatan}` : '',
                  profile.kabupaten ? `Kab. ${profile.kabupaten}` : '',
                  profile.provinsi
                ].filter(Boolean).join(', ')}
                {profile.telepon && ` | Telp: ${profile.telepon}`}
                {profile.email && ` | Email: ${profile.email}`}
              </p>
            </div>
            {/* Logo image or fallback SVG */}
            <div className="h-16 w-16 bg-white flex items-center justify-center shrink-0">
              {profile.logoUrl && profile.logoUrl.trim() ? (
                <img
                  src={profile.logoUrl.trim()}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="h-12 w-12 text-slate-800" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="currentColor" />
                  <circle cx="50" cy="50" r="28" fill="#ffffff" />
                  <path d="M50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30 Z" fill="currentColor" />
                  <path d="M50 35 L53 43 L62 43 L55 48 L58 56 L50 51 L42 56 L45 48 L38 43 L47 43 Z" fill="#ffffff" />
                </svg>
              )}
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wide text-slate-800">
              {displayTab === 'overview' 
                ? 'LAPORAN OVERVIEW KEAMANAN & KEDISIPLINAN SANTRI' 
                : 'LAPORAN BUKU INDUK DATA PELANGGARAN & KEDISIPLINAN SANTRI'}
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              Kategori Gender: <span className="font-extrabold text-slate-800">{filterGender}</span> | Periode: <span className="font-extrabold text-slate-800">{periodes.find(p => p.id === selectedPeriode)?.nama || 'Semua Periode'}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Dicetak oleh: {localStorage.getItem('smartsantri_username') || 'Petugas Keamanan'}
            </p>
          </div>

          {displayTab === 'overview' ? (
            <div className="space-y-6">
              {/* Overview Section 1: Quick Stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase text-slate-800 border-b border-slate-200 pb-1">I. RINGKASAN STATISTIK UTAMA</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kasus Pelanggaran</span>
                    <span className="text-xl font-black text-slate-800 mt-1 block">
                      {activeKeamananList.filter(rec => {
                        const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                        return !student || student.gender === filterGender;
                      }).length} Kasus
                    </span>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Akumulasi Poin Sanksi</span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">
                      {activeKeamananList.filter(rec => {
                        const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                        return !student || student.gender === filterGender;
                      }).reduce((acc, curr) => acc + curr.poin, 0)} Poin
                    </span>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pelanggaran Terbanyak</span>
                    <span className="text-xs font-black text-slate-800 mt-1.5 block truncate">
                      {(() => {
                        const list = activeKeamananList.filter(rec => {
                          const student = santriList.find(s => s.nama.toLowerCase() === rec.namaSantri.toLowerCase());
                          return !student || student.gender === filterGender;
                        });
                        const counts: { [key: string]: number } = {};
                        list.forEach(rec => { counts[rec.jenisPelanggaran] = (counts[rec.jenisPelanggaran] || 0) + 1; });
                        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                        return sorted.length > 0 ? sorted[0][0] : 'Belum ada data';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overview Section 2: Top 5 Violators */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase text-slate-800 border-b border-slate-200 pb-1">II. TOP 5 SANTRI DENGAN PELANGGARAN TERTINGGI</h3>
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold text-slate-700">
                      <th className="border border-slate-300 p-2 text-center w-12">No</th>
                      <th className="border border-slate-300 p-2">Nama Santri</th>
                      <th className="border border-slate-300 p-2 text-center">Kelas</th>
                      <th className="border border-slate-300 p-2 text-center">Kamar</th>
                      <th className="border border-slate-300 p-2 text-center">Jumlah Kasus</th>
                      <th className="border border-slate-300 p-2 text-center">Total Poin Sanksi</th>
                      <th className="border border-slate-300 p-2 text-center">Status Kedisiplinan</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-800">
                    {topViolators.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-slate-300 p-4 text-center text-slate-400 italic">
                          Tidak ada data pelanggaran pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      topViolators.map((item, idx) => {
                        const discipline = getDisciplineIndicator(item.points);
                        return (
                          <tr key={item.id}>
                            <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 font-black">{item.nama}</td>
                            <td className="border border-slate-300 p-2 text-center">{item.santri?.kelas || '-'}</td>
                            <td className="border border-slate-300 p-2 text-center">{item.santri?.kamar || '-'}</td>
                            <td className="border border-slate-300 p-2 text-center text-rose-600 font-black">{item.count} Kasus</td>
                            <td className="border border-slate-300 p-2 text-center font-black">{item.points} Poin</td>
                            <td className="border border-slate-300 p-2 text-center">{discipline.text}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Overview Section 3: Visual Diagram - Frequent Violations */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase text-slate-800 border-b border-slate-200 pb-1">III. DIAGRAM/FREKUENSI PELANGGARAN PALING SERING</h3>
                <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-4">
                  {violationsChartData.length === 0 ? (
                    <p className="text-center text-slate-400 italic py-6">Belum ada data grafik pelanggaran pada periode ini.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {violationsChartData.map((item, index) => {
                        const maxVal = Math.max(...violationsChartData.map(v => v.count)) || 1;
                        const percentage = Math.min(100, Math.max(8, (item.count / maxVal) * 100));
                        return (
                          <div key={item.name} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>{item.name}</span>
                              <span className="font-mono text-rose-600 font-black">{item.count} Kali</span>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-md overflow-hidden flex">
                              <div 
                                className="h-full rounded-r bg-indigo-500" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: [
                                    '#f43f5e', '#f59e0b', '#ec4899', '#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6'
                                  ][index % 8]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Buku Induk Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase text-slate-800 border-b border-slate-200 pb-1 flex-1">I. DAFTAR DATA INDUK PELANGGARAN SANTRI</h3>
                </div>
                <table className="w-full border-collapse border border-slate-300 text-left text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold text-slate-700">
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2">Nama Lengkap</th>
                      <th className="border border-slate-300 p-2 text-center w-20">NIS</th>
                      <th className="border border-slate-300 p-2">Alamat / Asal</th>
                      <th className="border border-slate-300 p-2 text-center w-20">Status</th>
                      <th className="border border-slate-300 p-2 text-center w-12">Kasus</th>
                      <th className="border border-slate-300 p-2 text-center w-16">Poin Sanksi</th>
                      <th className="border border-slate-300 p-2 text-center w-20">Kedisiplinan</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-800">
                    {sortedSantriList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-slate-300 p-4 text-center text-slate-400 italic">
                          Tidak ada data santri ditemukan.
                        </td>
                      </tr>
                    ) : (
                      sortedSantriList.map((student, idx) => {
                        const stats = getStudentStats(student.nama, student.id);
                        const ind = getDisciplineIndicator(stats.points);
                        const alamatStr = [student.desa, student.kecamatan, student.kabupaten].filter(Boolean).join(', ') || '-';
                        return (
                          <tr key={student.id}>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{student.nama}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{student.nis || '-'}</td>
                            <td className="border border-slate-300 p-1.5 truncate max-w-[150px]">{alamatStr}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{student.status || 'Aktif'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{stats.count}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-700">{stats.points}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{ind.text}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="pt-12 text-xs font-semibold grid grid-cols-2 gap-12">
            <div className="text-center space-y-16">
              <p>Mengetahui,</p>
              <div className="space-y-0.5">
                <p className="font-extrabold border-b border-slate-800 pb-1 inline-block min-w-[180px]">_________________________</p>
                <p className="text-slate-500">Kepala Bagian Keamanan</p>
              </div>
            </div>
            <div className="text-center space-y-16">
              <p>Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="space-y-0.5">
                <p className="font-extrabold border-b border-slate-800 pb-1 inline-block min-w-[180px]">{localStorage.getItem('smartsantri_username') || 'Petugas Keamanan'}</p>
                <p className="text-slate-500">Petugas Keamanan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL: TAMBAH PERIODE CUSTOM */}
      {/* ======================================= */}
      <AnimatePresence>
        {isPeriodeModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsPeriodeModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-left shadow-2xl border-0 font-sans"
              >
                {/* Header - No outline or background */}
                <div className="p-5 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {editingPeriode ? 'Ubah Periode Kustom' : 'Tambah Periode Kustom Baru'}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPeriodeModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSavePeriode} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      NAMA PERIODE
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Contoh: Semester Ganjil ${localStorage.getItem('smartsantri_active_tahun_ajaran') || '2026/2027'}`}
                      value={newPeriodeNama}
                      onChange={(e) => setNewPeriodeNama(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <BirthDatePicker
                        label="Tanggal Mulai"
                        required
                        value={newPeriodeStart}
                        onChange={(val) => {
                          setNewPeriodeStart(val);
                          setPeriodeError('');
                          if (val) {
                            if (!newPeriodeEnd || newPeriodeEnd < val) {
                              setNewPeriodeEnd(val);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <BirthDatePicker
                        label="Tanggal Selesai"
                        required
                        value={newPeriodeEnd}
                        onChange={(val) => {
                          setPeriodeError('');
                          if (val && val < newPeriodeStart) {
                            setNewPeriodeEnd(newPeriodeStart);
                          } else {
                            setNewPeriodeEnd(val);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {periodeError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{periodeError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-0 bg-white">
                    <button
                      type="button"
                      onClick={() => setIsPeriodeModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      {editingPeriode ? 'Simpan Perubahan' : 'Tambah Periode'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* GENERAL CONFIRMATION MODAL */}
      {/* ======================================= */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-5 text-left shadow-2xl border border-slate-100 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">{confirmModal.title}</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tindakan Irreversibel</p>
                  </div>
                </div>
                <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                  {confirmModal.message}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirmModal.onConfirm}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {confirmModal.confirmText || 'Hapus'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Santri Biodata Detail Modal */}
      <SantriDetailModal selectedSantri={viewingDetailSantri} onClose={() => setViewingDetailSantri(null)} />

      {/* Modal Detail Pelanggaran & Sanksi */}
      <AnimatePresence>
        {viewingRecordDetail && (
          <div className="fixed inset-0 z-[150] overflow-y-auto">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setViewingRecordDetail(null)}
            />

            {/* Modal wrapper */}
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all w-full max-w-md border border-slate-100"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setViewingRecordDetail(null)}
                  className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Modal Title */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-none">Detail Pelanggaran</h3>
                  </div>
                </div>

                {/* Details Content */}
                <div className="space-y-4">
                  {/* Student Info */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Santri</span>
                    {(() => {
                      const s = santriList.find(x => x.nama.toLowerCase() === viewingRecordDetail.namaSantri.toLowerCase());
                      if (!s) {
                        return (
                          <div className="bg-indigo-50/40 border border-indigo-100/50 p-4 rounded-xl flex items-center gap-4 relative">
                            <div className="flex items-center gap-4.5 min-w-0 flex-1">
                              <div className="h-14 w-14 rounded-full overflow-hidden border border-indigo-200 bg-indigo-100 shrink-0 flex items-center justify-center">
                                <span className="text-indigo-600 font-black text-base">?</span>
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5 text-left">
                                <h4 className="text-sm font-extrabold text-slate-800 truncate">{viewingRecordDetail.namaSantri}</h4>
                                <p className="text-[10px] text-slate-500 font-semibold truncate">Kamar: {viewingRecordDetail.kamar || '-'}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-indigo-50/40 border border-indigo-100/50 p-4 rounded-xl flex items-center gap-4 relative">
                          <div className="flex items-center gap-4.5 min-w-0 flex-1">
                            {/* Foto lingkaran di kiri */}
                            <div className="h-14 w-14 rounded-full overflow-hidden border border-indigo-200 bg-indigo-100 shrink-0 flex items-center justify-center">
                              <img
                                src={s.filePasFoto || (s.gender === 'Putra' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100')}
                                alt={s.nama}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            {/* Detail di sebelah kanan */}
                            <div className="flex-1 min-w-0 space-y-0.5 text-left">
                              <h4 className="text-sm font-extrabold text-slate-800 truncate">{s.nama}</h4>
                              <p className="text-[10px] text-slate-500 font-semibold truncate">
                                NIS: {s.nis || '-'}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium truncate">
                                Desa {s.desa || '-'}, Kec. {s.kecamatan || '-'}, Kab. {s.kabupaten || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Violation Type */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Jenis Pelanggaran</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        {viewingRecordDetail.jenisPelanggaran}
                      </p>
                      {(() => {
                        const matchedCat = katalog.find(k => k.nama.toLowerCase() === viewingRecordDetail.jenisPelanggaran.toLowerCase());
                        const isRepetition = matchedCat && matchedCat.rules && matchedCat.rules.length > 0;
                        if (!isRepetition) return null;
                        const { ordinal, periodeNama } = getRecordOrdinal(viewingRecordDetail);
                        return (
                          <div className="mt-2 text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 select-none w-full">
                            <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                            <span>Pelanggaran {ordinal === 1 ? 'Pertama' : `Ke-${ordinal}`} dalam periode &quot;{periodeNama}&quot;</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Sanction / Action */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Sanksi / Tindakan</span>
                    <p className="text-sm font-semibold text-rose-700 leading-relaxed bg-rose-50/50 border border-rose-100/50 rounded-xl p-3">
                      {viewingRecordDetail.tindakan || 'Belum ada sanksi yang tercatat.'}
                    </p>
                  </div>

                  {/* Grid details (Date, Points) */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tanggal Kejadian</span>
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{formatIndonesianDateOnly(viewingRecordDetail.tanggal)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Poin Pelanggaran</span>
                      <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black">
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-md bg-rose-100 text-rose-800 text-[11px] font-black">
                          +{viewingRecordDetail.poin} Poin
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingRecordDetail(null)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  {(() => {
                    const student = santriList.find(s => s.nama.toLowerCase() === viewingRecordDetail.namaSantri.toLowerCase());
                    if (!student) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDetailSantri(student);
                          setViewingRecordDetail(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Lihat Biodata Santri
                      </button>
                    );
                  })()}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Riwayat Pelanggaran (Tambah Riwayat) */}
      <AnimatePresence>
        {viewingHistorySantri && (() => {
          const student = viewingHistorySantri;
          const violations = keamananList.filter(rec => isRecordForStudent(rec, student))
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
          const stats = getStudentStats(student.nama, student.id);

          const getIcon = (title: string) => {
            const lower = title.toLowerCase();
            if (lower.includes('hp') || lower.includes('handphone') || lower.includes('ponsel') || lower.includes('telepon')) {
              return <Smartphone className="h-4 w-4" />;
            }
            if (lower.includes('shalat') || lower.includes('terlambat') || lower.includes('jam') || lower.includes('waktu') || lower.includes('disiplin')) {
              return <Clock className="h-4 w-4" />;
            }
            return <AlertCircle className="h-4 w-4" />;
          };

          const warningStatus = stats.points === 0 
            ? 'SANGAT BAIK' 
            : stats.points <= 10 
              ? 'AMAN' 
              : stats.points <= 25 
                ? 'PERINGATAN 1' 
                : stats.points <= 90 
                  ? 'PERINGATAN 2' 
                  : 'PERINGATAN 3 (SKOR KONTRAK)';

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4 text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                  onClick={() => setViewingHistorySantri(null)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="relative w-full max-w-xl h-[600px] flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-2xl border-0 z-10"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-none">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800">Riwayat Pelanggaran</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingHistorySantri(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Log Content Area */}
                  <div className="px-6 py-6 flex-1 overflow-y-auto space-y-4">
                    {violations.length > 0 ? (
                      violations.map((rec) => {
                        const isExpanded = expandedViolationId === rec.id;
                        return (
                          <div key={rec.id} className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:bg-slate-50/80 transition-all flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-400 shrink-0">{rec.tanggal}</span>
                                <span className="text-slate-300 text-xs">•</span>
                                <h4 className="text-sm font-bold text-slate-800">{rec.jenisPelanggaran}</h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-full uppercase tracking-wider shrink-0">
                                  +{rec.poin} POIN
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedViolationId(isExpanded ? null : rec.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4.5 w-4.5" />
                                  ) : (
                                    <ChevronDown className="h-4.5 w-4.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-200/60 pt-3 mt-1 space-y-3">
                                <div>
                                  <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                    SANKSI / TA'ZIRAN
                                  </span>
                                  <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                                    "{rec.tindakan || 'Tidak ada sanksi terdaftar.'}"
                                  </p>
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerConfirmation(
                                        'Hapus Catatan Pelanggaran',
                                        `Apakah Anda yakin ingin menghapus catatan pelanggaran "${rec.jenisPelanggaran}" ini? Poin santri akan dikurangi kembali secara otomatis.`,
                                        () => {
                                          onDeleteKeamanan(rec.id);
                                        }
                                      );
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer select-none"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-slate-400">
                        <p className="text-xs font-bold">Belum ada riwayat pelanggaran untuk santri ini.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer with Accumulation Info */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-none">
                    <div className="text-left">
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Total Akumulasi Poin
                      </span>
                      <span className="text-base font-black text-rose-600">
                        {stats.points} Poin
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingHistorySantri(null)}
                      className="px-6 py-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-extrabold rounded-lg text-xs transition-colors cursor-pointer select-none"
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal Tambah Preset Izin */}
      <AnimatePresence>
        {isAddPresetModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "linear" }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsAddPresetModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-2xl border-0 z-10 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">Tambah Preset Izin Baru</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddPresetModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Nama Preset Izin *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Izin Nikah Saudara, Pulang Lebaran..."
                      value={newPresetNama}
                      onChange={(e) => setNewPresetNama(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Durasi Standar *</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Hari</span>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={newPresetHari}
                          onChange={(e) => setNewPresetHari(Math.max(0, parseInt(e.target.value) || 0))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Jam</span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={newPresetJam}
                          onChange={(e) => setNewPresetJam(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Menit</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={newPresetMenit}
                          onChange={(e) => setNewPresetMenit(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPresetModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPresetNama.trim()) {
                        alert('Silakan isi nama preset terlebih dahulu.');
                        return;
                      }
                      if (newPresetHari === 0 && newPresetJam === 0 && newPresetMenit === 0) {
                        alert('Silakan isi durasi perizinan.');
                        return;
                      }
                      setPresetIzinList(prev => [...prev, { 
                        nama: newPresetNama.trim(), 
                        durasiDays: newPresetHari,
                        durasiHours: newPresetJam,
                        durasiMinutes: newPresetMenit
                      }]);
                      setJenisIzin(newPresetNama.trim());
                      
                      // Automatically set the end date based on duration
                      const d = new Date(tanggalMulaiIzin);
                      d.setDate(d.getDate() + newPresetHari);
                      d.setHours(d.getHours() + newPresetJam);
                      d.setMinutes(d.getMinutes() + newPresetMenit);
                      setTanggalSelesaiIzin(getYYYYMMDDTHHMM(d));
                      
                      setNewPresetNama('');
                      setNewPresetHari(0);
                      setNewPresetJam(0);
                      setNewPresetMenit(0);
                      setIsAddPresetModalOpen(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Simpan Preset
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {deleteIzinModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="fixed inset-0" onClick={() => setDeleteIzinModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">Hapus Catatan Izin</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteIzinModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Mohon pilih alasan menghapus catatan perizinan santri ini. Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">Alasan Penghapusan</label>
                  
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      deleteIzinReason === 'salah_input'
                        ? 'bg-rose-50/40 border-rose-200 text-rose-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="deleteIzinReason"
                        checked={deleteIzinReason === 'salah_input'}
                        onChange={() => setDeleteIzinReason('salah_input')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Salah Input Data</span>
                    </label>

                    <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      deleteIzinReason === 'lainnya'
                        ? 'bg-rose-50/40 border-rose-200 text-rose-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="deleteIzinReason"
                        checked={deleteIzinReason === 'lainnya'}
                        onChange={() => setDeleteIzinReason('lainnya')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Alasan Lainnya</span>
                    </label>
                  </div>
                </div>

                {deleteIzinReason === 'lainnya' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Ketik Alasan Lainnya *</label>
                    <input
                      type="text"
                      placeholder="Masukkan alasan detail penghapusan..."
                      value={deleteIzinCustomReason}
                      onChange={(e) => setDeleteIzinCustomReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                      required
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteIzinModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeletePerizinan}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {revokeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="fixed inset-0" onClick={() => setRevokeModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">Cabut Izin Santri</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRevokeModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Tindakan ini akan mencabut izin keluar santri. Waktu izin dan batas waktu izin akan dihapus, dan diganti dengan status <span className="text-rose-600 font-bold">Keluar Ilegal</span> yang dihitung dari saat pencabutan ini.
                </p>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Alasan Pencabutan Izin <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan alasan mengapa izin santri dicabut..."
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRevoke}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Cabut Izin</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
