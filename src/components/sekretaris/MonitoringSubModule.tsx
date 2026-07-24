import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  Search, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowLeftRight,
  ClipboardCheck,
  AlertCircle,
  FileCheck2,
  FileWarning,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Santri } from '../../types';
import SantriDetailModal from './SantriDetailModal';
import { renderSantriAvatar } from '../SekretarisHelper';

interface MonitoringSubModuleProps {
  santriList: Santri[];
}

interface ColumnConfig {
  key: keyof Santri;
  label: string;
  description: string;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { key: 'nis', label: 'NIS', description: 'Nomor Induk Santri' },
  { key: 'gender', label: 'Gender', description: 'Jenis Kelamin' },
  { key: 'nik', label: 'NIK', description: 'Nomor Induk Kependudukan' },
  { key: 'nisn', label: 'NISN', description: 'Nomor Induk Siswa Nasional' },
  { key: 'tempatLahir', label: 'Tpt Lahir', description: 'Tempat Lahir' },
  { key: 'tanggalLahir', label: 'Tgl Lahir', description: 'Tanggal Lahir' },
  { key: 'desa', label: 'Desa', description: 'Desa / Kelurahan' },
  { key: 'kecamatan', label: 'Kecamatan', description: 'Kecamatan' },
  { key: 'kabupaten', label: 'Kabupaten', description: 'Kabupaten / Kota' },
  { key: 'provinsi', label: 'Provinsi', description: 'Provinsi' },
  { key: 'pendidikanTerakhir', label: 'Pend. Terakhir', description: 'Pendidikan Terakhir' },
  { key: 'namaAyah', label: 'Nama Ayah', description: 'Nama Kandung Ayah' },
  { key: 'namaIbu', label: 'Nama Ibu', description: 'Nama Kandung Ibu' },
  { key: 'statusKeanggotaan', label: 'Status Anggota', description: 'Status Keanggotaan' },
  { key: 'noHp', label: 'No HP', description: 'Nomor HP Aktif' },
  { key: 'tanggalMasuk', label: 'Tgl Masuk', description: 'Tanggal Masuk Pesantren' },
  { key: 'statusEmis', label: 'Status EMIS', description: 'Status Pendataan EMIS Kemenag' },
  { key: 'kelas', label: 'Kelas', description: 'Kelas Pendidikan Formal' },
  { key: 'kamar', label: 'Kamar', description: 'Asrama Kamar Santri' },
  { key: 'asal', label: 'Asal Sekolah', description: 'Asal Sekolah / Lembaga Sebelumnya' },
  { key: 'statusDomisili', label: 'Status Domisili', description: 'Status Mukim / Kampung' },
  { key: 'noKk', label: 'No KK', description: 'Nomor Kartu Keluarga' },
  { key: 'anakKe', label: 'Anak Ke', description: 'Anak nomor ke-berapa' },
  { key: 'dariBersaudara', label: 'Dari Bersaudara', description: 'Jumlah saudara kandung' },
  { key: 'nikAyah', label: 'NIK Ayah', description: 'NIK Ayah Kandung' },
  { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', description: 'Pekerjaan Ayah Kandung' },
  { key: 'pendidikanAyah', label: 'Pend. Ayah', description: 'Pendidikan Terakhir Ayah' },
  { key: 'nikIbu', label: 'NIK Ibu', description: 'NIK Ibu Kandung' },
  { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', description: 'Pekerjaan Ibu Kandung' },
  { key: 'pendidikanIbu', label: 'Pend. Ibu', description: 'Pendidikan Terakhir Ibu' },
  { key: 'alamat', label: 'Alamat', description: 'Alamat Jalan/Dusun' },
  { key: 'rt', label: 'RT', description: 'Rukun Tetangga' },
  { key: 'rw', label: 'RW', description: 'Rukun Warga' },
  { key: 'jarakRumah', label: 'Jarak Rumah', description: 'Jarak Rumah ke Pesantren (km)' },
  { key: 'nomorLemari', label: 'No Lemari', description: 'Nomor Lemari Inventaris' },
  { key: 'fileKk', label: 'File KK', description: 'Scan Kartu Keluarga' },
  { key: 'fileKtp', label: 'File KTP', description: 'Scan KTP Orang Tua / Santri' },
  { key: 'fileAkta', label: 'File Akta', description: 'Scan Akta Kelahiran' },
  { key: 'fileIjazah', label: 'File Ijazah', description: 'Scan Ijazah Terakhir' },
  { key: 'filePasFoto', label: 'File Pas Foto', description: 'File Pas Foto Formal' },
  { key: 'tanggalKeluar', label: 'Tgl Keluar', description: 'Tanggal Keluar Pesantren' },
  { key: 'catatan', label: 'Catatan', description: 'Catatan Khusus Keterangan Santri' },
];

const DEFAULT_WAJIB_KEYS: (keyof Santri)[] = [
  'nis', 'gender', 'nik', 'nisn', 'tempatLahir', 'tanggalLahir', 
  'desa', 'kecamatan', 'kabupaten', 'provinsi', 'pendidikanTerakhir', 
  'namaAyah', 'namaIbu', 'statusKeanggotaan', 'noHp', 'tanggalMasuk', 'statusEmis'
];

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function MonitoringSubModule({ santriList }: MonitoringSubModuleProps) {
  const [activeTab, setActiveTab] = useState<'wajib' | 'tidak_wajib'>('wajib');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'semua' | 'Putra' | 'Putri'>('semua');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [domisiliFilter, setDomisiliFilter] = useState<string>('semua');
  const [showFilters, setShowFilters] = useState(false);

  // Custom mandatory columns configuration modal
  const [showMandatoryConfigModal, setShowMandatoryConfigModal] = useState(false);
  const [mandatoryKeys, setMandatoryKeys] = useState<(keyof Santri)[]>(() => {
    try {
      const saved = localStorage.getItem('smartsantri_mandatory_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load mandatory columns', e);
    }
    return DEFAULT_WAJIB_KEYS;
  });

  const toggleMandatoryColumn = (colKey: keyof Santri) => {
    setMandatoryKeys((prev) =>
      prev.includes(colKey)
        ? prev.filter((k) => k !== colKey)
        : [...prev, colKey]
    );
  };

  // Dynamic Wajib & Tidak Wajib Columns
  const wajibColumns: ColumnConfig[] = useMemo(() => {
    return ALL_COLUMNS.filter(col => mandatoryKeys.includes(col.key));
  }, [mandatoryKeys]);

  const tidakWajibColumns: ColumnConfig[] = useMemo(() => {
    return ALL_COLUMNS.filter(col => !mandatoryKeys.includes(col.key));
  }, [mandatoryKeys]);

  // States for dropdowns inside expandable advanced filters
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState<boolean>(false);
  const [showDomisiliFilterDropdown, setShowDomisiliFilterDropdown] = useState<boolean>(false);

  // State to handle opening detail modal
  const [viewingDetailSantri, setViewingDetailSantri] = useState<Santri | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Refs and state for vertical sticky/horizontal scroll synchronization of the table header
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableElementRef = useRef<HTMLTableElement>(null);
  const floatingHeaderRef = useRef<HTMLDivElement>(null);
  const floatingHeaderOuterRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);
  const scrollSourceRef = useRef<'main' | 'floating' | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const [floatingHeaderStyle, setFloatingHeaderStyle] = useState({ left: 0, width: 0 });
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  const [headerHeight, setHeaderHeight] = useState<number>(56);

  const currentColumns = activeTab === 'wajib' ? wajibColumns : tidakWajibColumns;

  // Filter santri list based on search, gender, status, and domisili (identical to Data Induk)
  const filteredSantri = useMemo(() => {
    const isDomisiliDisabled = statusFilter !== 'semua' && statusFilter !== 'Aktif';
    return santriList.filter(s => {
      const matchSearch = 
        (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.nis || '').includes(searchQuery) ||
        (s.asal && s.asal.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.kamar && s.kamar.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGender = genderFilter === 'semua' || s.gender === genderFilter;
      const matchesStatus = statusFilter === 'semua' || s.statusKeanggotaan === statusFilter;
      const matchesDomisili = isDomisiliDisabled || domisiliFilter === 'semua' || s.statusDomisili === domisiliFilter;

      return matchSearch && matchGender && matchesStatus && matchesDomisili;
    });
  }, [santriList, searchQuery, genderFilter, statusFilter, domisiliFilter]);

  // Measure thead height continuously to ensure main-scroll-right-btn is pixel-perfect vertically centered
  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (tableElementRef.current) {
        const thead = tableElementRef.current.querySelector('thead');
        if (thead && thead.offsetHeight > 0) {
          setHeaderHeight(thead.offsetHeight);
        }
      }
    };

    updateHeaderHeight();

    let observer: ResizeObserver | null = null;
    if (tableElementRef.current) {
      const thead = tableElementRef.current.querySelector('thead');
      if (thead) {
        observer = new ResizeObserver(() => {
          updateHeaderHeight();
        });
        observer.observe(thead);
      }
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [filteredSantri.length, activeTab, currentColumns]);

  // Scroll buttons states & helper functions
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const container = tableContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth + 4;
      setCanScrollLeft(hasHorizontalScroll && scrollLeft > 2);
      setCanScrollRight(hasHorizontalScroll && scrollLeft + clientWidth < scrollWidth - 2);

      if (tableElementRef.current) {
        const thead = tableElementRef.current.querySelector('thead');
        const mainRightBtn = document.getElementById('main-scroll-right-btn');
        if (thead && mainRightBtn) {
          mainRightBtn.style.top = `${thead.offsetHeight / 2}px`;
        }
      }
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    const container = tableContainerRef.current;
    if (container) {
      scrollSourceRef.current = 'main';
      const scrollAmount = 300;
      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const main = e.currentTarget;
    if (scrollSourceRef.current !== 'floating') {
      scrollSourceRef.current = 'main';
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollSourceRef.current = null;
      }, 150);

      if (floatingHeaderRef.current && floatingHeaderRef.current.scrollLeft !== main.scrollLeft) {
        floatingHeaderRef.current.scrollLeft = main.scrollLeft;
      }
    }
    updateScrollButtons();
  };

  // Helper function to evaluate if a field is filled
  const isFieldFilled = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value);
    return true;
  };

  const isSantriWajibComplete = useCallback((santri: Santri): boolean => {
    if (wajibColumns.length === 0) return true;
    return wajibColumns.every(col => isFieldFilled(santri[col.key]));
  }, [wajibColumns]);

  // Pagination logic
  const totalItems = filteredSantri.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSantri = useMemo(() => {
    return filteredSantri.slice(startIndex, endIndex);
  }, [filteredSantri, startIndex, endIndex]);

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleGenderToggle = () => {
    setCurrentPage(1);
    if (genderFilter === 'semua') setGenderFilter('Putra');
    else if (genderFilter === 'Putra') setGenderFilter('Putri');
    else setGenderFilter('semua');
  };

  const allowedGenders = ['semua', 'Putra', 'Putri'];
  const handleGenderSwitch = () => {
    const currentIndex = allowedGenders.indexOf(genderFilter);
    const nextIndex = (currentIndex + 1) % allowedGenders.length;
    setGenderFilter(allowedGenders[nextIndex] as 'semua' | 'Putra' | 'Putri');
    setCurrentPage(1);
  };

  // Check if a specific column is completely filled across all CURRENT filtered santri
  const getColumnCompleteness = (colKey: keyof Santri) => {
    if (filteredSantri.length === 0) return true;
    return filteredSantri.every(s => isFieldFilled(s[colKey]));
  };

  // Detailed statistics calculations
  const stats = useMemo(() => {
    if (filteredSantri.length === 0) {
      return { 
        wajibPct: 0, 
        tidakWajibPct: 0, 
        totalWajibFilled: 0, 
        totalWajibCells: 0,
        totalTidakWajibFilled: 0,
        totalTidakWajibCells: 0
      };
    }
    
    let wajibFilledCount = 0;
    const totalWajibCells = filteredSantri.length * wajibColumns.length;
    
    let tidakWajibFilledCount = 0;
    const totalTidakWajibCells = filteredSantri.length * tidakWajibColumns.length;

    filteredSantri.forEach(s => {
      wajibColumns.forEach(col => {
        if (isFieldFilled(s[col.key])) wajibFilledCount++;
      });
      tidakWajibColumns.forEach(col => {
        if (isFieldFilled(s[col.key])) tidakWajibFilledCount++;
      });
    });

    return {
      wajibPct: Math.round((wajibFilledCount / totalWajibCells) * 100) || 0,
      tidakWajibPct: Math.round((tidakWajibFilledCount / totalTidakWajibCells) * 100) || 0,
      totalWajibFilled: wajibFilledCount,
      totalWajibCells,
      totalTidakWajibFilled: tidakWajibFilledCount,
      totalTidakWajibCells
    };
  }, [filteredSantri, wajibColumns, tidakWajibColumns]);

  // Synchronized Measurement and Positioning function (unified for resize, scroll, and content changes)
  const recalculateHeaderVisibilityAndPosition = useCallback(() => {
    if (!tableContainerRef.current || !tableElementRef.current) return;

    const containerRect = tableContainerRef.current.getBoundingClientRect();
    const mainHeaderHeight = 64; // The sticky top-0 App Header has a height of 64px

    // Determine visibility based on positions and existence of rows
    const shouldShow = 
      filteredSantri.length > 0 && 
      containerRect.top <= mainHeaderHeight && 
      containerRect.bottom > (mainHeaderHeight + 48);

    // Only update state if it actually changed to prevent unnecessary re-renders
    setShowFloatingHeader(prev => (prev !== shouldShow ? shouldShow : prev));

    // Measure and cache column widths of the main table
    const thElements = tableElementRef.current.querySelectorAll('thead th');
    if (thElements.length > 0) {
      const widths = Array.from(thElements).map((th: any) => th.getBoundingClientRect().width);
      setColumnWidths(prev => {
        if (prev.length === widths.length && prev.every((w, i) => Math.abs(w - widths[i]) < 0.1)) {
          return prev;
        }
        return widths;
      });
    }
    
    // Direct DOM manipulation for zero-lag instant visibility toggling and alignment
    if (floatingHeaderOuterRef.current) {
      floatingHeaderOuterRef.current.style.display = shouldShow ? 'block' : 'none';
      floatingHeaderOuterRef.current.style.left = `${containerRect.left}px`;
      floatingHeaderOuterRef.current.style.width = `${containerRect.width}px`;
    }

    // Direct DOM manipulation for main container scroll buttons to avoid React re-renders on scroll
    const mainLeftBtn = document.getElementById('main-scroll-left-btn');
    const mainRightBtn = document.getElementById('main-scroll-right-btn');
    if (mainLeftBtn) {
      mainLeftBtn.style.display = shouldShow ? 'none' : 'block';
    }
    if (mainRightBtn) {
      mainRightBtn.style.display = shouldShow ? 'none' : 'block';
      if (tableElementRef.current) {
        const thead = tableElementRef.current.querySelector('thead');
        if (thead) {
          mainRightBtn.style.top = `${thead.offsetHeight / 2}px`;
        }
      }
    }

    // Cache container left position and width
    setFloatingHeaderStyle(prev => {
      if (Math.abs(prev.left - containerRect.left) < 0.1 && Math.abs(prev.width - containerRect.width) < 0.1) {
        return prev;
      }
      return {
        left: containerRect.left,
        width: containerRect.width,
      };
    });

    // Synchronize scroll left using scrollSourceRef
    if (scrollSourceRef.current !== 'floating' && floatingHeaderRef.current && tableContainerRef.current && floatingHeaderRef.current.scrollLeft !== tableContainerRef.current.scrollLeft) {
      floatingHeaderRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
    updateScrollButtons();
  }, [filteredSantri.length]);

  // High-Precision ResizeObserver for scroll buttons
  useEffect(() => {
    let observer: ResizeObserver | null = null;
    const container = tableContainerRef.current;
    if (container) {
      observer = new ResizeObserver(() => {
        updateScrollButtons();
      });
      observer.observe(container);
      const table = container.querySelector('table');
      if (table) {
        observer.observe(table);
      }
    }
    updateScrollButtons();
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [filteredSantri.length, activeTab]);

  // 1. High-Performance Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
      recalculateHeaderVisibilityAndPosition();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial run
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [recalculateHeaderVisibilityAndPosition]);

  // 2. State-driven recalculation to prevent visual lag during switches/filters/pagination
  useEffect(() => {
    recalculateHeaderVisibilityAndPosition();
    
    // Perform double-checks after React render paint is completed
    const timer = setTimeout(() => {
      recalculateHeaderVisibilityAndPosition();
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, genderFilter, statusFilter, domisiliFilter, santriList, currentPage, recalculateHeaderVisibilityAndPosition]);

  return (
    <div className="space-y-6">
      {/* Grand Title and Gender Switcher (as requested) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl flex flex-wrap items-center gap-x-2">
            <span>Monitoring</span>
            <span 
              onClick={handleGenderSwitch}
              className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none cursor-pointer active:scale-95 ${
                genderFilter === 'semua' 
                  ? 'text-emerald-600 hover:text-emerald-700' 
                  : genderFilter === 'Putra' 
                  ? 'text-indigo-600 hover:text-indigo-700' 
                  : 'text-rose-600 hover:text-rose-700'
              }`}
              title="Klik untuk mengubah filter gender (Semua ⇄ Putra ⇄ Putri)"
            >
              <span>
                {genderFilter === 'semua' ? 'Semua Santri' : genderFilter === 'Putra' ? 'Santri Putra' : 'Santri Putri'}
              </span>
              <ArrowLeftRight className="h-5 w-5 mt-0.5 shrink-0" />
            </span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Lacak kelengkapan berkas wajib dan tambahan seluruh santri secara real-time.
          </p>
        </div>
      </div>

      {/* Statistics Dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Santri */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Santri Terpantau</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{filteredSantri.length}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Biodata terfilter saat ini</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Kelengkapan Data Wajib */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Rasio Kelengkapan Wajib</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-emerald-700 tracking-tight">{stats.wajibPct}%</h3>
              <span className="text-[10px] font-bold text-slate-400">({stats.totalWajibFilled}/{stats.totalWajibCells} data)</span>
            </div>
            
            {/* Simple progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.wajibPct}%` }}
              />
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileCheck2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Kelengkapan Data Tidak Wajib */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Rasio Kelengkapan Tambahan</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-indigo-700 tracking-tight">{stats.tidakWajibPct}%</h3>
              <span className="text-[10px] font-bold text-slate-400">({stats.totalTidakWajibFilled}/{stats.totalTidakWajibCells} data)</span>
            </div>

            {/* Simple progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.tidakWajibPct}%` }}
              />
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <FileWarning className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs navigation & Controls bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-visible">
        {/* Tab Header Selector - stretched to full width as requested */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 w-full">
          <button
            onClick={() => {
              setActiveTab('wajib');
              setCurrentPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'wajib'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>DATA WAJIB ({wajibColumns.length} KOLOM)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tidak_wajib');
              setCurrentPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'tidak_wajib'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>DATA TIDAK WAJIB ({tidakWajibColumns.length} KOLOM)</span>
          </button>
        </div>

        {/* Filters control bar inside panel */}
        <div className="px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Real-time Search Box */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cari nama, NIS, asal kota, atau kamar santri..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-10 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle & Atur Data Wajib Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 font-display text-xs font-bold transition-all hover:bg-slate-50 shrink-0 cursor-pointer ${
                  showFilters || statusFilter !== 'semua' || genderFilter !== 'semua' || domisiliFilter !== 'semua'
                    ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                title="Filter Data"
              >
                <Filter className="h-4 w-4 text-current" />
                <span>Filter</span>
              </button>

              <button
                onClick={() => setShowMandatoryConfigModal(true)}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 px-3.5 font-display text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                title="Atur Kolom Data Wajib & Tidak Wajib"
              >
                <SlidersHorizontal className="h-4 w-4 text-amber-700" />
                <span>Atur Data Wajib</span>
              </button>
            </div>
          </div>

          {/* Expandable Advanced Filters Drawer in UI */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ ease: 'linear', duration: 0.05 }}
                className="mt-3 border-t border-slate-100 pt-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Keanggotaan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status Keanggotaan</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowStatusFilterDropdown(!showStatusFilterDropdown);
                          setShowDomisiliFilterDropdown(false);
                        }}
                        className={`w-full flex flex-row h-10 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all hover:bg-slate-50 whitespace-nowrap ${
                          showStatusFilterDropdown
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>
                          {statusFilter === 'semua' ? 'Semua Status' : statusFilter}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showStatusFilterDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowStatusFilterDropdown(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute left-0 mt-2 w-full min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl z-50 text-slate-700 font-sans"
                            >
                              <div className="space-y-1">
                                {[
                                  { value: 'semua', label: 'Semua Status' },
                                  { value: 'Aktif', label: 'Aktif' },
                                  { value: 'Alumni', label: 'Alumni' },
                                  { value: 'Meninggal', label: 'Meninggal' }
                                ].map((opt) => {
                                  const isActive = statusFilter === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setStatusFilter(opt.value);
                                        setShowStatusFilterDropdown(false);
                                        setCurrentPage(1);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                                        isActive
                                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {isActive && <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Status Domisili */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status Domisili</label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={statusFilter !== 'semua' && statusFilter !== 'Aktif'}
                        onClick={() => {
                          setShowDomisiliFilterDropdown(!showDomisiliFilterDropdown);
                          setShowStatusFilterDropdown(false);
                        }}
                        className={`w-full flex flex-row h-10 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all whitespace-nowrap ${
                          statusFilter !== 'semua' && statusFilter !== 'Aktif'
                            ? 'border-slate-200 bg-slate-100/70 text-slate-400 pointer-events-none'
                            : showDomisiliFilterDropdown
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>
                          {statusFilter !== 'semua' && statusFilter !== 'Aktif' ? 'Tidak Berlaku' : (domisiliFilter === 'semua' ? 'Semua Domisili' : domisiliFilter)}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showDomisiliFilterDropdown && (statusFilter === 'semua' || statusFilter === 'Aktif') && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowDomisiliFilterDropdown(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute left-0 mt-2 w-full min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl z-50 text-slate-700 font-sans"
                            >
                              <div className="space-y-1">
                                {[
                                  { value: 'semua', label: 'Semua Domisili' },
                                  { value: 'Muqim', label: 'Muqim' },
                                  { value: 'Kampung', label: 'Kampung' }
                                ].map((opt) => {
                                  const isActive = domisiliFilter === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setDomisiliFilter(opt.value);
                                        setShowDomisiliFilterDropdown(false);
                                        setCurrentPage(1);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                                        isActive
                                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {isActive && <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Reset Filters */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('semua');
                        setGenderFilter('semua');
                        setDomisiliFilter('semua');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Atur Ulang Filter
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Monitoring grid Table with Sticky Header (both vertical and horizontal) */}
        <div className="relative">
          {/* Scroll Right Button placed exactly in the middle of the right side/edge line of the header */}
          {canScrollRight && (
            <button
              id="main-scroll-right-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollTable('right');
              }}
              style={{ top: `${headerHeight / 2}px` }}
              className="absolute right-0 -translate-y-1/2 translate-x-1/2 z-[48] p-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
              title="Gulir Kanan"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5] shrink-0" />
            </button>
          )}

          <div 
            ref={tableContainerRef}
            onScroll={handleTableScroll}
            className="overflow-x-auto relative min-h-[300px] scrollbar-thin"
          >
          {filteredSantri.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Filter className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada santri yang cocok</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Cobalah untuk mengubah kata kunci pencarian atau mengganti filter jenis kelamin Anda.</p>
            </div>
          ) : (
            <table ref={tableElementRef} className="border-collapse text-left text-xs text-slate-600 table-fixed" style={{ width: `${370 + currentColumns.length * 120}px` }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {/* Sticky No. Header Column */}
                  <th className="sticky left-0 bg-slate-100 z-30 px-2 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] shadow-[2px_2px_5px_rgba(0,0,0,0.06)] border-r border-slate-200 min-w-[70px] w-[70px] max-w-[70px] text-center">
                    No.
                  </th>
                  {/* Sticky Nama Header Column */}
                  <th className="sticky left-[70px] bg-slate-100 z-30 px-4 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] shadow-[2px_2px_5px_rgba(0,0,0,0.06)] border-r border-slate-200 min-w-[300px] w-[300px] max-w-[300px] relative">
                    Nama Lengkap
                    {/* Scroll Left Button placed exactly in the middle of the right side of 'nama' header column */}
                    {canScrollLeft && (
                      <button
                        id="main-scroll-left-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollTable('left');
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[40] p-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
                        title="Gulir Kiri"
                      >
                        <ChevronLeft className="h-4 w-4 stroke-[2.5] shrink-0" />
                      </button>
                    )}
                  </th>
                  {currentColumns.map(col => {
                    const isAllFilled = getColumnCompleteness(col.key);
                    return (
                      <th key={col.key} className="bg-slate-50 px-3 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] border-r border-slate-100 min-w-[120px] w-[120px] max-w-[120px] text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)]" title={col.description}>
                        <div>{col.label}</div>
                        {/* Overall column status box as requested */}
                        <div className="mt-1 flex justify-center">
                          <span className={`inline-flex items-center gap-1 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tight shadow-xs ${
                            isAllFilled 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`} title={isAllFilled ? "Semua baris terisi" : "Ada baris kosong"}>
                            {isAllFilled ? 'LENGKAP' : 'BELUM'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSantri.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Sticky No. Column with Completeness Indicator */}
                    <td className="sticky left-0 bg-white group-hover:bg-slate-100 z-10 px-2 py-3 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] min-w-[70px] w-[70px] max-w-[70px] text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isSantriWajibComplete(s) ? (
                          <div 
                            className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 shadow-2xs"
                            title="Semua Data Wajib Lengkap"
                          >
                            <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                          </div>
                        ) : (
                          <div 
                            className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0 shadow-2xs"
                            title="Ada Data Wajib Belum Lengkap"
                          >
                            <X className="h-2.5 w-2.5 stroke-[3.5]" />
                          </div>
                        )}
                        <span className="font-mono font-bold text-slate-600 text-xs">{startIndex + idx + 1}</span>
                      </div>
                    </td>

                    {/* Sticky Name value Column */}
                    <td 
                      onClick={() => setViewingDetailSantri(s)}
                      className="sticky left-[70px] bg-white group-hover:bg-slate-100 z-10 px-4 py-3 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)] min-w-[300px] w-[300px] max-w-[300px] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Profile Photo Circle */}
                        <div className="shrink-0">
                           {renderSantriAvatar(s, "h-10 w-10 text-xs")}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          {/* Label Keanggotaan di atas nama */}
                          <div className="mb-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                              s.statusKeanggotaan === 'Aktif' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60' 
                                : s.statusKeanggotaan === 'Alumni'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/60'
                                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                            }`}>
                              {s.statusKeanggotaan}
                            </span>
                          </div>

                          {/* Nama Lengkap */}
                          <h4 className="text-xs font-extrabold text-slate-900 truncate hover:text-emerald-700 transition-colors" title={s.nama}>
                            {s.nama}
                          </h4>

                          {/* NIS & Alamat (desa, kecamatan, kabupaten) with Title Case */}
                          <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5" title={`${s.nis || '-'} • ${s.desa ? toTitleCase(s.desa) : '-'}, ${s.kecamatan ? toTitleCase(s.kecamatan) : '-'}, ${s.kabupaten ? toTitleCase(s.kabupaten) : '-'}`}>
                            <span className="font-mono font-bold text-slate-500">{s.nis || '-'}</span>
                            <span className="text-slate-300 mx-1.5">•</span>
                            <span>
                              {s.desa || s.kecamatan || s.kabupaten ? (
                                `${s.desa ? toTitleCase(s.desa) : '-'}, ${s.kecamatan ? toTitleCase(s.kecamatan) : '-'}, ${s.kabupaten ? toTitleCase(s.kabupaten) : '-'}`
                              ) : (
                                'Alamat belum diisi'
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    {currentColumns.map(col => {
                      const value = s[col.key];
                      const filled = isFieldFilled(value);
                      return (
                        <td key={col.key} className="px-3 py-3 text-center border-r border-slate-50 min-w-[120px] w-[120px] max-w-[120px]">
                          {filled ? (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                              <X className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

        {/* Footer pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/30">
            <div className="text-xs text-slate-500 font-bold">
              Menampilkan {startIndex + 1} - {endIndex} dari {totalItems} Santri
            </div>

            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-slate-400 font-bold px-1 select-none">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`h-8 w-8 text-xs font-bold rounded-lg border transition-all ${
                          p === currentPage
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Synchronized viewport-sticky floating header */}
      <div
        ref={floatingHeaderOuterRef}
        className="fixed top-16 z-30 bg-slate-50 border-b border-slate-200/80 shadow-md overflow-visible"
        style={{
          left: floatingHeaderStyle.left,
          width: floatingHeaderStyle.width,
          display: showFloatingHeader ? 'block' : 'none',
        }}
      >
          {/* Scroll Right Button inside floating header */}
          {canScrollRight && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollTable('right');
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[48] p-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
              title="Gulir Kanan"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5] shrink-0" />
            </button>
          )}

          <div
            ref={floatingHeaderRef}
            onScroll={(e) => {
              const floating = e.currentTarget;
              if (scrollSourceRef.current !== 'main') {
                scrollSourceRef.current = 'floating';
                if (scrollTimeoutRef.current) {
                  window.clearTimeout(scrollTimeoutRef.current);
                }
                scrollTimeoutRef.current = window.setTimeout(() => {
                  scrollSourceRef.current = null;
                }, 150);

                if (tableContainerRef.current && tableContainerRef.current.scrollLeft !== floating.scrollLeft) {
                  tableContainerRef.current.scrollLeft = floating.scrollLeft;
                }
              }
              updateScrollButtons();
            }}
            className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: 'none',
            }}
          >
            <table className="border-collapse text-left text-xs text-slate-600 table-fixed" style={{ width: columnWidths.reduce((a, b) => a + b, 0) || `${370 + currentColumns.length * 120}px` }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {/* Sticky No. column on floating header */}
                  <th 
                    className="sticky left-0 bg-slate-100 z-30 px-2 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] shadow-[2px_2px_5px_rgba(0,0,0,0.06)] border-r border-slate-200 text-center"
                    style={{
                      width: columnWidths[0] || 70,
                      minWidth: columnWidths[0] || 70,
                      maxWidth: columnWidths[0] || 70,
                    }}
                  >
                    No.
                  </th>
                  {/* Sticky Name column on floating header */}
                  <th 
                    className="sticky left-[70px] bg-slate-100 z-30 px-4 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] shadow-[2px_2px_5px_rgba(0,0,0,0.06)] border-r border-slate-200 relative"
                    style={{
                      width: columnWidths[1] || 300,
                      minWidth: columnWidths[1] || 300,
                      maxWidth: columnWidths[1] || 300,
                    }}
                  >
                    Nama Lengkap
                    {/* Scroll Left Button placed exactly in the middle of the right side of 'nama' header column */}
                    {canScrollLeft && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollTable('left');
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[40] p-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
                        title="Gulir Kiri"
                      >
                        <ChevronLeft className="h-4 w-4 stroke-[2.5] shrink-0" />
                      </button>
                    )}
                  </th>
                  {currentColumns.map((col, idx) => {
                    const isAllFilled = getColumnCompleteness(col.key);
                    const cellWidth = columnWidths[idx + 2] || 120;
                    return (
                      <th 
                        key={col.key} 
                        className="bg-slate-50 z-20 px-3 py-2.5 font-black text-slate-700 uppercase tracking-wider text-[10px] border-r border-slate-100 text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)]" 
                        title={col.description}
                        style={{
                          width: cellWidth,
                          minWidth: cellWidth,
                          maxWidth: cellWidth,
                        }}
                      >
                        <div>{col.label}</div>
                        <div className="mt-1 flex justify-center">
                          <span className={`inline-flex items-center gap-1 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tight shadow-xs ${
                            isAllFilled 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`} title={isAllFilled ? "Semua baris terisi" : "Ada baris kosong"}>
                            {isAllFilled ? 'LENGKAP' : 'BELUM'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
          </div>
        </div>

      {/* Detail Modal */}
      {viewingDetailSantri && (
        <SantriDetailModal
          selectedSantri={viewingDetailSantri}
          onClose={() => setViewingDetailSantri(null)}
          canWrite={false}
        />
      )}

      {/* Full-Screen Dark Overlay for Mandatory Column Selection */}
      <AnimatePresence>
        {showMandatoryConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 bg-black text-white font-sans overflow-y-auto"
          >
            {/* Top Close Button */}
            <div className="w-full flex justify-end max-w-5xl">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('smartsantri_mandatory_columns', JSON.stringify(mandatoryKeys));
                  } catch (e) {
                    console.error('Failed to save mandatory columns', e);
                  }
                  setShowMandatoryConfigModal(false);
                }}
                className="p-2.5 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer ring-1 ring-white/10"
                title="Tutup & Simpan"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main Content Area - Centered & Clean */}
            <div className="w-full max-w-[650px] mx-auto my-auto py-8 text-center flex flex-col items-center">
              <h1 className="text-white text-3xl font-semibold mb-12 text-center tracking-tight">
                Pilih Data Wajib
              </h1>

              <motion.div 
                className="flex flex-wrap gap-3 justify-center overflow-visible w-full"
                layout
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5,
                }}
              >
                {ALL_COLUMNS.map((col) => {
                  const isSelected = mandatoryKeys.includes(col.key);
                  return (
                    <motion.button
                      key={col.key}
                      type="button"
                      onClick={() => toggleMandatoryColumn(col.key)}
                      layout
                      initial={false}
                      animate={{
                        backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.5)",
                      }}
                      whileHover={{
                        backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.8)",
                      }}
                      whileTap={{
                        backgroundColor: isSelected ? "#1f1209" : "rgba(39, 39, 42, 0.9)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.5,
                        backgroundColor: { duration: 0.1 },
                      }}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-full text-base font-medium
                        whitespace-nowrap overflow-hidden ring-1 ring-inset cursor-pointer transition-shadow
                        ${isSelected 
                          ? "text-[#ff9066] ring-[hsla(0,0%,100%,0.12)]" 
                          : "text-zinc-400 ring-[hsla(0,0%,100%,0.06)]"}
                      `}
                    >
                      <motion.div 
                        className="relative flex items-center"
                        animate={{ 
                          width: isSelected ? "auto" : "100%",
                          paddingRight: isSelected ? "1.5rem" : "0",
                        }}
                        transition={{
                          ease: [0.175, 0.885, 0.32, 1.275],
                          duration: 0.3,
                        }}
                      >
                        <span>{col.label}</span>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 500, 
                                damping: 30, 
                                mass: 0.5 
                              }}
                              className="absolute right-0"
                            >
                              <div className="w-4 h-4 rounded-full bg-[#ff9066] flex items-center justify-center">
                                <Check className="w-3 h-3 text-[#2a1711]" strokeWidth={2} />
                              </div>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Minimal Centered Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
                <button
                  type="button"
                  onClick={() => setMandatoryKeys(ALL_COLUMNS.map((c) => c.key))}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer px-3 py-1.5"
                >
                  Pilih Semua
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setMandatoryKeys(DEFAULT_WAJIB_KEYS)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer px-3 py-1.5"
                >
                  Reset Default
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setMandatoryKeys([])}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer px-3 py-1.5"
                >
                  Hapus Semua
                </button>
              </div>

              {/* Primary Apply Button */}
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('smartsantri_mandatory_columns', JSON.stringify(mandatoryKeys));
                  } catch (e) {
                    console.error('Failed to save mandatory columns', e);
                  }
                  setShowMandatoryConfigModal(false);
                }}
                className="mt-8 px-8 py-3 rounded-full bg-[#ff9066] hover:bg-[#ff8052] text-[#2a1711] font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#ff9066]/10 cursor-pointer"
              >
                Selesai & Terapkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
