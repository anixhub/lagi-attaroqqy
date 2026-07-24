import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Check, RotateCcw } from 'lucide-react';

export interface AgeFilterConfig {
  enabled: boolean;
  mode: 'range' | 'exact' | 'min' | 'max';
  exactAge: string;
  minAge: string;
  maxAge: string;
  refType: 'today' | 'custom';
  customDate: string;
}

export const DEFAULT_AGE_FILTER_CONFIG: AgeFilterConfig = {
  enabled: false,
  mode: 'range',
  exactAge: '',
  minAge: '',
  maxAge: '',
  refType: 'today',
  customDate: new Date().toISOString().split('T')[0],
};

interface AgeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AgeFilterConfig;
  onApply: (newConfig: AgeFilterConfig) => void;
  onReset: () => void;
}

export function calculateAgeOnDate(birthDateStr: string | undefined | null, refDate: Date): number | null {
  if (!birthDateStr || typeof birthDateStr !== 'string' || !birthDateStr.trim()) return null;
  let birthDate: Date;
  try {
    const trimmed = birthDateStr.trim();
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      birthDate = new Date(trimmed);
    }
    if (isNaN(birthDate.getTime())) return null;

    let age = refDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = refDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  } catch {
    return null;
  }
}

export default function AgeFilterModal({
  isOpen,
  onClose,
  config,
  onApply,
  onReset,
}: AgeFilterModalProps) {
  const [localMode, setLocalMode] = useState<AgeFilterConfig['mode']>(config.mode || 'range');
  const [exactAge, setExactAge] = useState<string>(config.exactAge || '');
  const [minAge, setMinAge] = useState<string>(config.minAge || '');
  const [maxAge, setMaxAge] = useState<string>(config.maxAge || '');
  const [refType, setRefType] = useState<AgeFilterConfig['refType']>(config.refType || 'today');
  const [customDate, setCustomDate] = useState<string>(
    config.customDate || new Date().toISOString().split('T')[0]
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Sync state when modal opens or config changes
  useEffect(() => {
    if (isOpen) {
      setLocalMode(config.mode || 'range');
      setExactAge(config.exactAge || '');
      setMinAge(config.minAge || '');
      setMaxAge(config.maxAge || '');
      setRefType(config.refType || 'today');
      setCustomDate(config.customDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      enabled: true,
      mode: localMode,
      exactAge,
      minAge,
      maxAge,
      refType,
      customDate,
    });
    onClose();
  };

  const handleResetLocal = () => {
    onReset();
    onClose();
  };

  // Format reference date string for preview
  const getFormattedRefDateStr = () => {
    let dateObj: Date;
    if (refType === 'custom' && customDate) {
      dateObj = new Date(customDate);
      if (isNaN(dateObj.getTime())) dateObj = new Date();
    } else {
      dateObj = new Date();
    }

    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Preview text description
  const getPreviewText = () => {
    const dateStr = getFormattedRefDateStr();
    if (localMode === 'exact') {
      return exactAge
        ? `Menampilkan santri berumur tepat ${exactAge} tahun (per ${dateStr})`
        : `Masukkan angka umur spesifik (per ${dateStr})`;
    }
    if (localMode === 'min') {
      return minAge
        ? `Menampilkan santri berumur minimal ${minAge} tahun ke atas (per ${dateStr})`
        : `Masukkan batas minimal umur (per ${dateStr})`;
    }
    if (localMode === 'max') {
      return maxAge
        ? `Menampilkan santri berumur maksimal ${maxAge} tahun (per ${dateStr})`
        : `Masukkan batas maksimal umur (per ${dateStr})`;
    }
    if (localMode === 'range') {
      if (minAge && maxAge) {
        return `Menampilkan santri berumur ${minAge} s/d ${maxAge} tahun (per ${dateStr})`;
      }
      if (minAge) {
        return `Menampilkan santri berumur minimal ${minAge} tahun (per ${dateStr})`;
      }
      if (maxAge) {
        return `Menampilkan santri berumur maksimal ${maxAge} tahun (per ${dateStr})`;
      }
      return `Masukkan rentang umur (per ${dateStr})`;
    }
    return '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 my-auto text-slate-800 font-sans z-10"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4.5">
            <h3 className="font-display text-base font-extrabold text-slate-900 tracking-tight">
              Filter Umur Santri
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/60 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* 1. Mode Filter Umur */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Kriteria Umur
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'range', label: 'Rentang', icon: '↔' },
                  { id: 'exact', label: 'Sama Dengan', icon: '=' },
                  { id: 'min', label: 'Minimal', icon: '≥' },
                  { id: 'max', label: 'Maksimal', icon: '≤' },
                ].map((item) => {
                  const isActive = localMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLocalMode(item.id as AgeFilterConfig['mode'])}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-extrabold mb-0.5">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Inputs Umur */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {localMode === 'range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Minimal Umur (Tahun)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Contoh: 12"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Maksimal Umur (Tahun)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Contoh: 18"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {localMode === 'exact' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sama Dengan Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 15"
                    value={exactAge}
                    onChange={(e) => setExactAge(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              )}

              {localMode === 'min' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimal Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 12"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              )}

              {localMode === 'max' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maksimal Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 18"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* 3. Tanggal Acuan Hitung Umur */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Hitung Per Tanggal
              </label>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setRefType('today')}
                  className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    refType === 'today'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Saat Ini (Hari Ini)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefType('custom')}
                  className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    refType === 'custom'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Tanggal Spesifik</span>
                </button>
              </div>

              {refType === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </motion.div>
              )}
            </div>

            {/* Preview Banner */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 text-xs text-emerald-900 font-semibold flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{getPreviewText()}</span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <button
              type="button"
              onClick={handleResetLocal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-sm hover:bg-emerald-800 active:scale-95 transition-all cursor-pointer"
              >
                <span>Terapkan Filter</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
