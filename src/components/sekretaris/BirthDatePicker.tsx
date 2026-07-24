import React, { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';

interface BirthDatePickerProps {
  value: string; // Format standar ISO: YYYY-MM-DD (e.g. "2010-08-15")
  onChange: (isoDate: string) => void; // Mengembalikan tanggal berformat YYYY-MM-DD
  required?: boolean;
  label?: React.ReactNode;
  id?: string;
  disabled?: boolean;
}

export function BirthDatePicker({
  value,
  onChange,
  required = false,
  label = "Tanggal Lahir",
  id,
  disabled = false
}: BirthDatePickerProps) {
  // State untuk 3 segmen dengan default teks placeholder aktif ("dd", "mm", "tttt")
  const [day, setDay] = useState('dd');
  const [month, setMonth] = useState('mm');
  const [year, setYear] = useState('tttt');
  
  const [activeSegment, setActiveSegment] = useState<'day' | 'month' | 'year' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  // 1. Sinkronisasi dari prop value (YYYY-MM-DD) ke segmen-segmen
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      setDay(d);
      setMonth(m);
      setYear(y);
    } else if (!value) {
      setDay('dd');
      setMonth('mm');
      setYear('tttt');
    }
  }, [value]);

  // 2. Klik di luar komponen untuk melepaskan fokus aktif
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSegment(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Logika Clamping & Validasi Silang Tanggal
  const validateAndClampDate = (dStr: string, mStr: string, yStr: string): { d: string, m: string, y: string } => {
    let yNum = parseInt(yStr) || currentYear;
    let mNum = parseInt(mStr) || 1;
    let dNum = parseInt(dStr) || 1;

    // Batasi Bulan (1-12)
    if (mNum < 1) mNum = 1;
    if (mNum > 12) mNum = 12;

    // Batasi Tahun
    if (yNum < 1900) yNum = 1900;
    if (yNum > currentYear + 15) yNum = currentYear + 15;

    // Batasi Hari berdasarkan Bulan & Tahun (validasi kabisat otomatis)
    const maxDays = new Date(yNum, mNum, 0).getDate();
    if (dNum < 1) dNum = 1;
    if (dNum > maxDays) dNum = maxDays;

    return {
      d: String(dNum).padStart(2, '0'),
      m: String(mNum).padStart(2, '0'),
      y: String(yNum).padStart(4, '0')
    };
  };

  const checkAndPublish = (dVal: string, mVal: string, yVal: string) => {
    const dClean = dVal === 'dd' ? '' : dVal;
    const mClean = mVal === 'mm' ? '' : mVal;
    const yClean = yVal === 'tttt' ? '' : yVal;

    if (dClean.length === 2 && mClean.length === 2 && yClean.length === 4) {
      const { d, m, y } = validateAndClampDate(dClean, mClean, yClean);
      setDay(d);
      setMonth(m);
      setYear(y);
      onChange(`${y}-${m}-${d}`);
    } else if (!dClean && !mClean && !yClean) {
      onChange('');
    }
  };

  // Helper untuk memformat otomatis satu segmen ketika beralih / kehilangan fokus
  const formatSegmentOnBlurOrSwitch = (val: string, type: 'day' | 'month' | 'year') => {
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
    return val;
  };

  // 4. Input Change Handlers dengan Auto-advance & Smart Replacement
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value;
    
    if (raw.startsWith('dd') && raw.length > 2) {
      raw = raw.replace('dd', '');
    } else if (raw.endsWith('dd') && raw.length > 2) {
      raw = raw.replace('dd', '');
    }

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const dNum = parseInt(val);
      if (dNum >= 4) {
        const padded = '0' + val;
        setDay(padded);
        monthRef.current?.focus();
        checkAndPublish(padded, month, year);
        return;
      }
    } else if (val.length === 2) {
      let dNum = parseInt(val);
      if (dNum < 1) dNum = 1;
      if (dNum > 31) dNum = 31;
      const formatted = String(dNum).padStart(2, '0');
      setDay(formatted);
      monthRef.current?.focus();
      checkAndPublish(formatted, month, year);
      return;
    }
    setDay(val || 'dd');
    checkAndPublish(val || 'dd', month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value;

    if (raw.startsWith('mm') && raw.length > 2) {
      raw = raw.replace('mm', '');
    } else if (raw.endsWith('mm') && raw.length > 2) {
      raw = raw.replace('mm', '');
    }

    let val = raw.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);

    if (val.length === 1) {
      const mNum = parseInt(val);
      if (mNum >= 2) {
        const padded = '0' + val;
        setMonth(padded);
        yearRef.current?.focus();
        checkAndPublish(day, padded, year);
        return;
      }
    } else if (val.length === 2) {
      let mNum = parseInt(val);
      if (mNum < 1) mNum = 1;
      if (mNum > 12) mNum = 12;
      const formatted = String(mNum).padStart(2, '0');
      setMonth(formatted);
      yearRef.current?.focus();
      checkAndPublish(day, formatted, year);
      return;
    }
    setMonth(val || 'mm');
    checkAndPublish(day, val || 'mm', year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value;

    if (raw.startsWith('tttt') && raw.length > 4) {
      raw = raw.replace('tttt', '');
    } else if (raw.endsWith('tttt') && raw.length > 4) {
      raw = raw.replace('tttt', '');
    }

    let val = raw.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);

    setYear(val || 'tttt');
    if (val.length === 4) {
      checkAndPublish(day, month, val);
    } else {
      if (value) {
        onChange('');
      }
    }
  };

  const handleBlur = (type: 'day' | 'month' | 'year') => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (
        activeEl !== dayRef.current &&
        activeEl !== monthRef.current &&
        activeEl !== yearRef.current
      ) {
        setActiveSegment(null);
      }

      // Format segmen yang baru saja blur
      if (type === 'day') {
        setDay(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'day');
          setTimeout(() => checkAndPublish(nextVal, month, year), 0);
          return nextVal;
        });
      } else if (type === 'month') {
        setMonth(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'month');
          setTimeout(() => checkAndPublish(day, nextVal, year), 0);
          return nextVal;
        });
      } else if (type === 'year') {
        setYear(prev => {
          const nextVal = formatSegmentOnBlurOrSwitch(prev, 'year');
          setTimeout(() => checkAndPublish(day, month, nextVal), 0);
          return nextVal;
        });
      }
    }, 50);
  };

  // Navigasi Keyboard antar segmen
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, current: 'day' | 'month' | 'year') => {
    if (disabled) return;

    if (e.key === 'ArrowRight') {
      if (current === 'day') {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (current === 'month') {
        e.preventDefault();
        yearRef.current?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (current === 'month') {
        e.preventDefault();
        dayRef.current?.focus();
      } else if (current === 'year') {
        e.preventDefault();
        monthRef.current?.focus();
      }
    } else if (e.key === 'Backspace') {
      const target = e.target as HTMLInputElement;
      if (target.value === '' || target.value === 'dd' || target.value === 'mm' || target.value === 'tttt') {
        if (current === 'month') {
          e.preventDefault();
          dayRef.current?.focus();
          const nextDay = day === 'dd' ? '' : day.slice(0, -1);
          setDay(nextDay || 'dd');
          checkAndPublish(nextDay || 'dd', month, year);
        } else if (current === 'year') {
          e.preventDefault();
          monthRef.current?.focus();
          const nextMonth = month === 'mm' ? '' : month.slice(0, -1);
          setMonth(nextMonth || 'mm');
          checkAndPublish(day, nextMonth || 'mm', year);
        }
      }
    }
  };

  const hasAnyValue = (day !== 'dd' && day !== '') || 
                     (month !== 'mm' && month !== '') || 
                     (year !== 'tttt' && year !== '');

  // Handle pembersihan input tanggal
  const handleClear = () => {
    setDay('dd');
    setMonth('mm');
    setYear('tttt');
    onChange('');
  };

  // Dipanggil ketika date picker standar bawaan browser dipilih
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-');
      setDay(d);
      setMonth(m);
      setYear(y);
      onChange(val);
    } else {
      handleClear();
    }
  };

  // Klik di area kotak input akan fokus ke day segment
  const handleBoxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (document.activeElement === dayRef.current || 
        document.activeElement === monthRef.current || 
        document.activeElement === yearRef.current) {
      return;
    }
    
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-btn')) {
      return;
    }

    dayRef.current?.focus();
  };

  return (
    <div className="relative w-full text-left font-sans" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        onClick={handleBoxClick}
        className={`flex items-center justify-between w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 cursor-text ${
          activeSegment !== null ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
      >
        {/* Segmen Input (dd / mm / tttt) yang Selaras Sempurna */}
        <div className="flex items-center gap-1 font-medium tracking-wide text-slate-800 h-5 leading-none">
          <input
            ref={dayRef}
            type="text"
            id={id}
            value={day}
            onChange={handleDayChange}
            onKeyDown={(e) => handleKeyDown(e, 'day')}
            onFocus={() => { 
              setActiveSegment('day'); 
              setTimeout(() => dayRef.current?.select(), 0); 
            }}
            onBlur={() => handleBlur('day')}
            disabled={disabled}
            className={`w-6 text-center bg-transparent border-none outline-none p-0 focus:text-emerald-600 focus:font-bold select-all h-5 leading-none ${
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
            disabled={disabled}
            className={`w-6 text-center bg-transparent border-none outline-none p-0 focus:text-emerald-600 focus:font-bold select-all h-5 leading-none ${
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
            disabled={disabled}
            className={`w-10 text-center bg-transparent border-none outline-none p-0 focus:text-emerald-600 focus:font-bold select-all h-5 leading-none ${
              year === 'tttt' ? 'text-slate-300 font-normal' : 'text-slate-800'
            }`}
          />
        </div>
        
        {/* Tombol Interaksi Sisi Kanan Input yang Presisi Tinggi */}
        <div className="flex items-center gap-1 text-slate-400 h-5">
          {!disabled && hasAnyValue && (
            <button
              type="button"
              onClick={handleClear}
              className="interactive-btn p-1 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors cursor-pointer z-20 flex items-center justify-center w-6 h-6"
              title="Bersihkan tanggal"
            >
              <X size={14} />
            </button>
          )}
          {!disabled && (
            <div className="interactive-btn relative p-1 rounded-md hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer w-6 h-6">
              {/* Native input overlayed exactly on the calendar icon, fully transparent but triggers date picker on click */}
              <input
                type="date"
                value={value || ''}
                onChange={handleNativeDateChange}
                disabled={disabled}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                style={{ contentVisibility: 'auto' }}
              />
              <Calendar size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
