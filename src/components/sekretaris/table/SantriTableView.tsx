import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  Eye, 
  Pencil, 
  MoreVertical, 
  CheckSquare, 
  Printer, 
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GraduationCap,
  AlertTriangle,
  School
} from 'lucide-react';
import { Santri, Lembaga, Kelas, isGenderMatch } from '../../../types';
import { demoteSantriToCalonPesertaDidik, PENDIDIKAN_OPTIONS, normalizePendidikan, formatDateDDMMYYYY } from '../../../lib/utils';
import { renderSantriAvatar, getFormalKelasDisplay } from '../../SekretarisHelper';
import { MembershipBadge } from '../components/HelperComponents';
import { AgeFilterConfig, calculateAgeOnDate } from '../AgeFilterModal';
import { fetchTableData } from '../../../lib/api';

interface SantriTableViewProps {
  paginatedSantri: Santri[];
  startIndex: number;
  isSelectionMode: boolean;
  selectedSantriIds: string[];
  setSelectedSantriIds: (ids: string[]) => void;
  visibleColumns: Record<string, boolean>;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  setSortKey: (key: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setSelectedSantri: (s: Santri) => void;
  handleStartEditSantri: (s: Santri) => void;
  handlePrintClick: (s: Santri) => void;
  handleDeleteClick: (id: string, name: string) => void;
  activeDesktopDropdownId: string | null;
  setActiveDesktopDropdownId: (id: string | null) => void;
  activeSantriDropdownId: string | null;
  setActiveSantriDropdownId: (id: string | null) => void;
  setIsSelectionMode: (val: boolean) => void;
  canWritePutra: boolean;
  canWritePutri: boolean;
  ageFilterConfig?: AgeFilterConfig;
  onUpdateSantri?: (s: Santri) => void;
  isMonitoringMode?: boolean;
}

const isSantriDataComplete = (s: Santri): boolean => {
  const requiredFields: (keyof Santri)[] = [
    'nis', 'nama', 'nisn', 'nism', 'nik', 'noKk', 'tempatLahir', 'tanggalLahir',
    'gender', 'pendidikanTerakhir', 'namaAyah', 'nikAyah', 'pekerjaanAyah', 'pendidikanAyah',
    'namaIbu', 'nikIbu', 'pekerjaanIbu', 'pendidikanIbu', 'alamat', 'rt', 'rw', 'desa',
    'kecamatan', 'kabupaten', 'provinsi', 'noHp', 'statusKeanggotaan', 'statusEmis'
  ];
  
  for (const field of requiredFields) {
    const val = s[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      return false;
    }
  }

  if (s.statusKeanggotaan === 'Aktif') {
    if (!s.statusDomisili || String(s.statusDomisili).trim() === '') {
      return false;
    }
  }

  return true;
};

const isMonitoringWajibComplete = (s: Santri): boolean => {
  const wajibFields: (keyof Santri)[] = [
    'nis', 'gender', 'nik', 'nisn', 'tempatLahir', 'tanggalLahir',
    'desa', 'kecamatan', 'kabupaten', 'provinsi', 'pendidikanTerakhir',
    'namaAyah', 'namaIbu', 'statusKeanggotaan', 'noHp', 'tanggalMasuk', 'statusEmis'
  ];
  
  for (const field of wajibFields) {
    const val = s[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      return false;
    }
  }
  return true;
};

const isCellEmpty = (s: Santri, key: string): boolean => {
  switch (key) {
    case 'nama':
      return !s.nama || !s.nama.trim();
    case 'nis':
      return !s.nis || !s.nis.trim() || s.nis === '-';
    case 'nisn':
      return !s.nisn || !s.nisn.trim() || s.nisn === '-';
    case 'nik':
      return !s.nik || !s.nik.trim() || s.nik === '-';
    case 'umur':
      return !s.tanggalLahir;
    case 'nism':
      return !s.nism || !s.nism.trim() || s.nism === '-';
    case 'noKk':
      return !s.noKk || !s.noKk.trim() || s.noKk === '-';
    case 'tempatLahir':
      return !s.tempatLahir || !s.tempatLahir.trim() || s.tempatLahir === '-';
    case 'tanggalLahir':
      return !s.tanggalLahir || !s.tanggalLahir.trim() || s.tanggalLahir === '-';
    case 'gender':
      return !s.gender;
    case 'pendidikanTerakhir':
      return !s.pendidikanTerakhir || !s.pendidikanTerakhir.trim() || s.pendidikanTerakhir === '-';
    case 'pendidikanFormal':
      return !s.pendidikanFormal || s.pendidikanFormal.trim() === '' || s.pendidikanFormal === 'TIDAK TERDAFTAR' || s.pendidikanFormal === 'Belum / Non-Formal';
    case 'anakKe':
      return s.anakKe === undefined || s.anakKe === null || s.anakKe === 0;
    case 'dariBersaudara':
      return s.dariBersaudara === undefined || s.dariBersaudara === null || s.dariBersaudara === 0;
    case 'namaAyah':
      return !s.namaAyah || !s.namaAyah.trim() || s.namaAyah === '-';
    case 'nikAyah':
      return !s.nikAyah || !s.nikAyah.trim() || s.nikAyah === '-';
    case 'pekerjaanAyah':
      return !s.pekerjaanAyah || !s.pekerjaanAyah.trim() || s.pekerjaanAyah === '-';
    case 'pendidikanAyah':
      return !s.pendidikanAyah || !s.pendidikanAyah.trim() || s.pendidikanAyah === '-';
    case 'namaIbu':
      return !s.namaIbu || !s.namaIbu.trim() || s.namaIbu === '-';
    case 'nikIbu':
      return !s.nikIbu || !s.nikIbu.trim() || s.nikIbu === '-';
    case 'pekerjaanIbu':
      return !s.pekerjaanIbu || !s.pekerjaanIbu.trim() || s.pekerjaanIbu === '-';
    case 'pendidikanIbu':
      return !s.pendidikanIbu || !s.pendidikanIbu.trim() || s.pendidikanIbu === '-';
    case 'alamat':
      return !s.alamat || !s.alamat.trim() || s.alamat === '-';
    case 'rt':
      return !s.rt || String(s.rt).trim() === '' || String(s.rt).trim() === '0' || String(s.rt).trim() === '-';
    case 'rw':
      return !s.rw || String(s.rw).trim() === '' || String(s.rw).trim() === '0' || String(s.rw).trim() === '-';
    case 'desa':
      return !s.desa || !s.desa.trim() || s.desa === '-';
    case 'kecamatan':
      return !s.kecamatan || !s.kecamatan.trim() || s.kecamatan === '-';
    case 'kabupaten':
      return (!s.kabupaten && !s.asal) || (s.kabupaten && s.kabupaten.trim() === '-');
    case 'provinsi':
      return !s.provinsi || !s.provinsi.trim() || s.provinsi === '-';
    case 'jarakRumah':
      return !s.jarakRumah || s.jarakRumah === 0;
    case 'noHp':
      return !s.noHp || !s.noHp.trim() || s.noHp === '-';
    case 'statusDomisili':
      return s.statusKeanggotaan === 'Aktif' && (!s.statusDomisili || (s.statusDomisili as string).trim() === '' || (s.statusDomisili as string) === '-');
    case 'tanggalMasuk':
      return !s.tanggalMasuk || !s.tanggalMasuk.trim() || s.tanggalMasuk === '-';
    case 'tanggalKeluar':
      return s.statusKeanggotaan !== 'Aktif' && (!s.tanggalKeluar || !s.tanggalKeluar.trim() || s.tanggalKeluar === '-');
    case 'catatan':
      return false;
    case 'statusKeanggotaan':
      return !s.statusKeanggotaan;
    case 'statusEmis':
      return !s.statusEmis || s.statusEmis.toLowerCase() !== 'terdaftar';
    default: {
      const val = (s as any)[key];
      return val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-';
    }
  }
};

export default function SantriTableView({
  paginatedSantri,
  startIndex,
  isSelectionMode,
  selectedSantriIds,
  setSelectedSantriIds,
  visibleColumns,
  sortKey,
  sortDirection,
  setSortKey,
  setSortDirection,
  setSelectedSantri,
  handleStartEditSantri,
  handlePrintClick,
  handleDeleteClick,
  activeDesktopDropdownId,
  setActiveDesktopDropdownId,
  activeSantriDropdownId,
  setActiveSantriDropdownId,
  setIsSelectionMode,
  canWritePutra,
  canWritePutri,
  ageFilterConfig,
  onUpdateSantri,
  isMonitoringMode = false
}: SantriTableViewProps) {
  const isColumnComplete = (key: string): boolean => {
    if (!paginatedSantri || paginatedSantri.length === 0) return true;
    return paginatedSantri.every(s => !isCellEmpty(s, key));
  };

  const isNoColumnComplete = (): boolean => {
    if (!paginatedSantri || paginatedSantri.length === 0) return true;
    return paginatedSantri.every(s => isMonitoringWajibComplete(s));
  };
  const [activeEmisDropdownId, setActiveEmisDropdownId] = React.useState<string | null>(null);
  const [activeVervalDropdownId, setActiveVervalDropdownId] = React.useState<string | null>(null);
  const [activeStatusKeanggotaanDropdownId, setActiveStatusKeanggotaanDropdownId] = React.useState<string | null>(null);
  const [activeDomisiliDropdownId, setActiveDomisiliDropdownId] = React.useState<string | null>(null);
  const [activeFormalKelasDropdownId, setActiveFormalKelasDropdownId] = React.useState<string | null>(null);

  // Position states for floating portal dropdowns
  const [actionDropdownPos, setActionDropdownPos] = React.useState<{ top: number; right: number; isUpward?: boolean } | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = React.useState<{ top: number; left: number; isUpward?: boolean } | null>(null);
  const [emisDropdownPos, setEmisDropdownPos] = React.useState<{ top: number; left: number; isUpward?: boolean } | null>(null);
  const [vervalDropdownPos, setVervalDropdownPos] = React.useState<{ top: number; left: number; isUpward?: boolean } | null>(null);
  const [domisiliDropdownPos, setDomisiliDropdownPos] = React.useState<{ top: number; left: number; isUpward?: boolean } | null>(null);
  const [formalKelasDropdownPos, setFormalKelasDropdownPos] = React.useState<{ top: number; left: number; isUpward?: boolean } | null>(null);

  // Pending selection states for column dropdowns
  const [pendingDomisili, setPendingDomisili] = React.useState<{ [santriId: string]: string }>({});
  const [pendingStatusKeanggotaan, setPendingStatusKeanggotaan] = React.useState<{ [santriId: string]: 'Aktif' | 'Alumni' | 'Meninggal' }>({});
  const [pendingEmis, setPendingEmis] = React.useState<{ [santriId: string]: 'Terdaftar' | 'Belum' }>({});
  const [pendingFormalKelas, setPendingFormalKelas] = React.useState<{ [santriId: string]: { lem: Lembaga | null; cls: Kelas | null } }>({});

  const [editingCell, setEditingCell] = React.useState<{ santriId: string; field: keyof Santri; value: string } | null>(null);
  const [editingError, setEditingError] = React.useState<string | null>(null);

  const [lembagasList, setLembagasList] = React.useState<Lembaga[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_lembagas');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [kelasList, setKelasList] = React.useState<Kelas[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_kelas');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const loadEducationData = async () => {
      try {
        const lems = await fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', []);
        const kls = await fetchTableData<Kelas>('kelas', 'smartsantri_kelas', []);
        if (lems && lems.length > 0) setLembagasList(lems);
        if (kls && kls.length > 0) setKelasList(kls);
      } catch {}
    };
    loadEducationData();

    const handleCloseDropdowns = (e?: Event) => {
      if (e && e.target) {
        const target = e.target as HTMLElement;
        if (target.closest && (
          target.closest('.dropdown-container-box') || 
          target.closest('.dropdown-trigger-btn')
        )) {
          return;
        }
      }
      setActiveEmisDropdownId(null);
      setActiveStatusKeanggotaanDropdownId(null);
      setActiveDomisiliDropdownId(null);
      setActiveFormalKelasDropdownId(null);
      setActiveDesktopDropdownId(null);
      setActiveSantriDropdownId(null);
    };

    window.addEventListener('click', handleCloseDropdowns, true);
    window.addEventListener('scroll', handleCloseDropdowns, true);
    return () => {
      window.removeEventListener('click', handleCloseDropdowns, true);
      window.removeEventListener('scroll', handleCloseDropdowns, true);
    };
  }, [setActiveDesktopDropdownId, setActiveSantriDropdownId]);

  React.useEffect(() => {
    if (!editingCell) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && target.closest('.edit-container-box')) {
        return;
      }

      const s = paginatedSantri.find(item => item.id === editingCell.santriId);
      if (s) {
        const origVal = ((s[editingCell.field] ?? '') as string).trim();
        const currentVal = editingCell.value.trim();
        if (currentVal === origVal) {
          setEditingCell(null);
          setEditingError(null);
        }
      } else {
        setEditingCell(null);
        setEditingError(null);
      }
    };

    window.addEventListener('click', handleClickOutside, true);
    return () => {
      window.removeEventListener('click', handleClickOutside, true);
    };
  }, [editingCell, paginatedSantri]);

  const handleUpdateFormalClass = (s: Santri, targetLembaga: Lembaga | null, targetClass: Kelas | null) => {
    if (!onUpdateSantri) return;

    const currentKelasStr = s.kelas ? String(s.kelas).trim() : '';
    let currentClasses = currentKelasStr ? currentKelasStr.split(',').map(c => c.trim()).filter(Boolean) : [];

    const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
      if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
      const lower = (l.nama || '').toLowerCase();
      if (
        lower.includes('madin') || lower.includes('diniyah') || lower.includes('tpq') ||
        lower.includes('tahfidz') || lower.includes('pondok') || lower.includes('kitab') ||
        lower.includes('internal') || (l.kode && l.kode.toLowerCase().includes('madin'))
      ) {
        return 'Internal';
      }
      return 'Formal';
    };

    const formalLembagaIds = lembagasList.filter(l => getLembagaJenis(l) === 'Formal').map(l => String(l.id));

    currentClasses = currentClasses.filter(clsName => {
      const lowerCls = clsName.trim().toLowerCase();
      if (
        lowerCls === 'calon pelajar' ||
        lowerCls === 'calon peserta didik' ||
        lowerCls === 'tanpa kelas' ||
        lowerCls === 'tidak mengikuti' ||
        lowerCls === 'belum' ||
        lowerCls === '-' ||
        lowerCls === ''
      ) {
        return false;
      }
      const foundClsList = kelasList.filter(k => k.nama.trim().toLowerCase() === lowerCls);
      const isFormalClass = foundClsList.some(k => {
        const lemId = String(k.lembagaId || (k as any).lembaga_id || '');
        return formalLembagaIds.includes(lemId);
      });
      if (isFormalClass) {
        return false;
      }
      return true;
    });

    let formalStr = '';
    if (targetLembaga) {
      if (targetClass && targetClass.nama) {
        currentClasses.push(targetClass.nama.trim());
        formalStr = `${targetLembaga.nama} - ${targetClass.nama.trim()}`;
      } else {
        currentClasses.push('Calon Peserta Didik');
        formalStr = `${targetLembaga.nama} - Calon Peserta Didik`;
      }
    }

    const finalKelasString = Array.from(new Set(currentClasses)).join(', ') || 'Tanpa Kelas';

    const updated: Santri = {
      ...s,
      kelas: finalKelasString,
      pendidikanFormal: formalStr || undefined,
      statusEmis: (targetClass && targetClass.nama) ? 'Terdaftar' : s.statusEmis
    };

    onUpdateSantri(updated);
  };

  const validateCellField = (field: keyof Santri, value: string): string | null => {
    const trimmed = value.trim();

    if (field === 'nama') {
      if (!trimmed) return "Nama Lengkap tidak boleh kosong.";
    }

    if (field === 'nis') {
      if (!trimmed) return "NIS tidak boleh kosong.";
    }

    if (field === 'nik' || field === 'nikAyah' || field === 'nikIbu' || field === 'noKk') {
      if (trimmed !== '') {
        const fieldName = field === 'nik' ? 'NIK Santri' : field === 'nikAyah' ? 'NIK Ayah' : field === 'nikIbu' ? 'NIK Ibu' : 'No KK';
        if (!/^\d{16}$/.test(trimmed)) {
          return `${fieldName} harus 16 digit angka.`;
        }
      }
    }

    if (field === 'nisn') {
      if (trimmed !== '' && !/^\d{10}$/.test(trimmed)) {
        return "NISN harus 10 digit angka.";
      }
    }

    if (field === 'noHp') {
      if (trimmed !== '' && !/^\d{10,15}$/.test(trimmed)) {
        return "No HP/WA harus 10-15 digit angka.";
      }
    }

    if (field === 'rt' || field === 'rw') {
      if (trimmed !== '' && !/^\d{1,4}$/.test(trimmed)) {
        return "RT/RW harus berupa angka (max 4 digit).";
      }
    }

    return null;
  };

  const handleCellDoubleClick = (e: React.MouseEvent, s: Santri, field: keyof Santri) => {
    e.stopPropagation();
    const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
    if (!canWrite) return;

    setEditingError(null);
    const currentVal = s[field] !== undefined && s[field] !== null ? String(s[field]) : '';
    setEditingCell({
      santriId: s.id,
      field,
      value: currentVal
    });
  };

  const handleSaveInlineEdit = (s: Santri) => {
    if (!editingCell || editingCell.santriId !== s.id) return;
    const field = editingCell.field;
    const rawVal = editingCell.value;

    const errorMsg = validateCellField(field, rawVal);
    if (errorMsg) {
      setEditingError(errorMsg);
      return;
    }

    setEditingError(null);

    let parsedVal: any = rawVal.trim();

    if (['anakKe', 'dariBersaudara', 'jarakRumah'].includes(field as string)) {
      parsedVal = rawVal.trim() === '' ? undefined : Number(rawVal);
    }

    const updated: Santri = {
      ...s,
      [field]: parsedVal
    };

    onUpdateSantri?.(updated);
    setEditingCell(null);
  };

  const renderEditableCell = (
    s: Santri,
    field: keyof Santri,
    displayValue: React.ReactNode,
    options?: {
      type?: 'text' | 'date' | 'number' | 'select';
      selectOptions?: string[];
      className?: string;
    }
  ) => {
    const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
    const isEditing = editingCell?.santriId === s.id && editingCell?.field === field;

    if (isEditing) {
      const inputType = options?.type || 'text';

      return (
        <div className="relative w-full z-30 edit-container-box" onClick={(e) => e.stopPropagation()}>
          {inputType === 'select' ? (
            <select
              autoFocus
              value={editingCell.value}
              onChange={(e) => {
                setEditingCell({ ...editingCell, value: e.target.value });
                setEditingError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveInlineEdit(s);
                if (e.key === 'Escape') {
                  setEditingCell(null);
                  setEditingError(null);
                }
              }}
              className="w-full rounded-md border border-emerald-500 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {(options?.selectOptions || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              autoFocus
              type={inputType}
              value={editingCell.value}
              onChange={(e) => {
                setEditingCell({ ...editingCell, value: e.target.value });
                setEditingError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveInlineEdit(s);
                if (e.key === 'Escape') {
                  setEditingCell(null);
                  setEditingError(null);
                }
              }}
              className={`w-full rounded-md border bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-1 ${
                editingError ? 'border-rose-500 focus:ring-rose-500' : 'border-emerald-500 focus:ring-emerald-500'
              }`}
            />
          )}

          {/* Action buttons on top right horizontal above input box */}
          {editingCell.value.trim() !== ((s[editingCell.field] ?? '') as string).trim() && (
            <div className="absolute -top-8 right-0 z-[110] flex flex-row items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-lg animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => handleSaveInlineEdit(s)}
                className="rounded p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors shadow-2xs"
                title="Terapkan Perubahan (Centang)"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCell(null);
                  setEditingError(null);
                }}
                className="rounded p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors shadow-2xs"
                title="Batal Perubahan (X)"
              >
                <X className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </div>
          )}

          {editingError && (
            <div className="absolute left-0 top-full mt-1 z-50 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-1">
              {editingError}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onDoubleClick={(e) => {
          if (isSelectionMode) return;
          handleCellDoubleClick(e, s, field);
        }}
        title={canWrite && !isSelectionMode ? "Double-click untuk edit cepat" : undefined}
        className={`group/cell relative flex items-center justify-between rounded px-1.5 py-0.5 transition-colors ${
          isSelectionMode
            ? 'pointer-events-none opacity-80'
            : canWrite
              ? 'hover:bg-emerald-50/60 cursor-pointer'
              : ''
        } ${options?.className || ''}`}
      >
        <span className="truncate">{displayValue}</span>
        {canWrite && !isSelectionMode && (
          <Pencil className="h-2.5 w-2.5 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0 ml-1" />
        )}
      </div>
    );
  };
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const [lastAction, setLastAction] = React.useState<'select' | 'deselect' | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [stickyTop, setStickyTop] = React.useState(148);
  const [floatingHeaderStyle, setFloatingHeaderStyle] = React.useState({ left: 0, width: 0 });

  const floatingHeaderRef = React.useRef<HTMLDivElement>(null);
  const floatingHeaderOuterRef = React.useRef<HTMLDivElement>(null);
  const isSyncingScroll = React.useRef(false);
  const scrollSourceRef = React.useRef<'main' | 'floating' | null>(null);
  const scrollTimeoutRef = React.useRef<number | null>(null);

  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Only enable scroll buttons if the table is actually scrollable horizontally
      const hasHorizontalScroll = scrollWidth > clientWidth + 4;
      setCanScrollLeft(hasHorizontalScroll && scrollLeft > 2);
      setCanScrollRight(hasHorizontalScroll && scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    const container = containerRef.current;
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

  const handleTableScroll = () => {
    updateScrollButtons();
    const container = containerRef.current;
    if (!container) return;

    // Sync scroll to floating header using scrollSourceRef
    if (scrollSourceRef.current !== 'floating') {
      scrollSourceRef.current = 'main';
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollSourceRef.current = null;
      }, 150);

      if (floatingHeaderRef.current && floatingHeaderRef.current.scrollLeft !== container.scrollLeft) {
        floatingHeaderRef.current.scrollLeft = container.scrollLeft;
      }
    }

    // Calculate sticky threshold below the main header
    const mainHeader = document.querySelector('header');
    const mainHeaderHeight = mainHeader ? (mainHeader as HTMLElement).offsetHeight : 64;
    const computedStickyTop = mainHeaderHeight;

    setStickyTop(computedStickyTop);

    const containerRect = container.getBoundingClientRect();
    // Header floats when the container's top has reached the stickyTop threshold and remains inside the table bounds
    const isHeaderFloating = 
      containerRect.top <= computedStickyTop && 
      containerRect.bottom > (computedStickyTop + 48);
    setIsScrolled(isHeaderFloating);

    setFloatingHeaderStyle({
      left: containerRect.left,
      width: containerRect.width,
    });
  };

  // Recalculate horizontal scroll buttons and scroll stickiness on layout changes
  React.useEffect(() => {
    updateScrollButtons();
    const timer = setTimeout(() => {
      updateScrollButtons();
      handleTableScroll();
    }, 100);

    const handleResize = () => {
      updateScrollButtons();
      handleTableScroll();
    };

    const handleGlobalScroll = () => {
      handleTableScroll();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('scroll', handleGlobalScroll, { capture: true, passive: true });

    // Use ResizeObserver for high-precision, instant scroll status updates
    let observer: ResizeObserver | null = null;
    const container = containerRef.current;
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
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleGlobalScroll, { capture: true });
      if (observer) {
        observer.disconnect();
      }
    };
  }, [paginatedSantri, visibleColumns, isSelectionMode]);

  const [dragStart, setDragStart] = React.useState<{ pageX: number; pageY: number } | null>(null);
  const [dragBox, setDragBox] = React.useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const mousePosRef = React.useRef<{ clientX: number; clientY: number } | null>(null);
  const initialSelectedIdsRef = React.useRef<string[]>([]);

  const lastSelectedIndexRef = React.useRef(lastSelectedIndex);
  const lastActionRef = React.useRef(lastAction);
  const paginatedSantriRef = React.useRef(paginatedSantri);
  const selectedSantriIdsRef = React.useRef(selectedSantriIds);
  const draggedRef = React.useRef<boolean>(false);
  const clickedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    lastSelectedIndexRef.current = lastSelectedIndex;
  }, [lastSelectedIndex]);

  React.useEffect(() => {
    lastActionRef.current = lastAction;
  }, [lastAction]);

  React.useEffect(() => {
    paginatedSantriRef.current = paginatedSantri;
  }, [paginatedSantri]);

  React.useEffect(() => {
    selectedSantriIdsRef.current = selectedSantriIds;
  }, [selectedSantriIds]);

  const toggleSingleSelection = (id: string, shiftKey: boolean) => {
    const paginated = paginatedSantriRef.current;
    const lastIdx = lastSelectedIndexRef.current;
    const lastAct = lastActionRef.current;
    const prevSelected = selectedSantriIdsRef.current;

    const index = paginated.findIndex(x => x.id === id);
    if (index === -1) return;

    const s = paginated[index];
    const isSelected = prevSelected.includes(s.id);

    if (shiftKey && lastIdx !== null && lastAct !== null) {
      const start = Math.min(lastIdx, index);
      const end = Math.max(lastIdx, index);
      const rangeIds = paginated.slice(start, end + 1).map(x => x.id);

      if (lastAct === 'select') {
        const unionSet = new Set([...prevSelected, ...rangeIds]);
        setSelectedSantriIds(Array.from(unionSet));
      } else { // 'deselect'
        setSelectedSantriIds(prevSelected.filter(x => !rangeIds.includes(x)));
      }
    } else {
      if (isSelected) {
        setLastSelectedIndex(index);
        setLastAction('deselect');
        setSelectedSantriIds(prevSelected.filter(x => x !== s.id));
      } else {
        setLastSelectedIndex(index);
        setLastAction('select');
        setSelectedSantriIds([...prevSelected, s.id]);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectionMode) return;
    if (e.button !== 0) return; // Left click only

    const target = e.target as HTMLElement;
    if (target.closest('thead')) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    initialSelectedIdsRef.current = selectedSantriIds;
    draggedRef.current = false;

    // Find closest row to determine clicked target
    const rowEl = target.closest('[data-drag-id]');
    clickedIdRef.current = rowEl?.getAttribute('data-drag-id') || null;

    setDragStart({ pageX: e.clientX + window.scrollX, pageY: e.clientY + window.scrollY });
    setDragBox(null);
  };

  React.useEffect(() => {
    if (!dragStart) {
      mousePosRef.current = null;
      return;
    }

    mousePosRef.current = { clientX: dragStart.pageX - window.scrollX, clientY: dragStart.pageY - window.scrollY };
    let animationFrameId: number;

    const updateSelection = () => {
      const container = containerRef.current;
      const mousePos = mousePosRef.current;
      if (!container || !mousePos) return;

      const containerRect = container.getBoundingClientRect();

      // Page-absolute box coordinates
      const currentPageX = mousePos.clientX + window.scrollX;
      const currentPageY = mousePos.clientY + window.scrollY;

      const dist = Math.sqrt(
        Math.pow(currentPageX - dragStart.pageX, 2) + 
        Math.pow(currentPageY - dragStart.pageY, 2)
      );

      if (dist <= 4 && !draggedRef.current) {
        setDragBox(null);
        return;
      }

      draggedRef.current = true;

      const pageLeft = Math.min(dragStart.pageX, currentPageX);
      const pageTop = Math.min(dragStart.pageY, currentPageY);
      const pageWidth = Math.abs(dragStart.pageX - currentPageX);
      const pageHeight = Math.abs(dragStart.pageY - currentPageY);
      const pageRight = pageLeft + pageWidth;
      const pageBottom = pageTop + pageHeight;

      // Convert page-absolute coordinates to container-relative coordinates for rendering the absolute dragBox
      const containerPageLeft = containerRect.left + window.scrollX;
      const containerPageTop = containerRect.top + window.scrollY;

      const left = pageLeft - containerPageLeft + container.scrollLeft;
      const top = pageTop - containerPageTop + container.scrollTop;

      setDragBox({ left, top, width: pageWidth, height: pageHeight });

      const itemElements = container.querySelectorAll('[data-drag-id]');
      const intersectedIds: string[] = [];

      itemElements.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const id = el.getAttribute('data-drag-id');
        if (!id) return;

        const elPageLeft = elRect.left + window.scrollX;
        const elPageRight = elRect.right + window.scrollX;
        const elPageTop = elRect.top + window.scrollY;
        const elPageBottom = elRect.bottom + window.scrollY;

        const isOverlapping = !(
          elPageRight < pageLeft ||
          elPageLeft > pageRight ||
          elPageBottom < pageTop ||
          elPageTop > pageBottom
        );

        if (isOverlapping) {
          intersectedIds.push(id);
        }
      });

      const unionSet = new Set([...initialSelectedIdsRef.current, ...intersectedIds]);
      setSelectedSantriIds(Array.from(unionSet));
    };

    const scrollAndLoop = () => {
      const mousePos = mousePosRef.current;
      if (!mousePos) return;

      const viewportHeight = window.innerHeight;
      const { clientY } = mousePos;
      const scrollThreshold = 60; // distance from top/bottom edge to start scrolling
      const maxScrollSpeed = 15; // max scroll increment in pixels

      let scrolled = false;

      if (clientY > viewportHeight - scrollThreshold) {
        const ratio = (clientY - (viewportHeight - scrollThreshold)) / scrollThreshold;
        const speed = Math.max(1, Math.min(maxScrollSpeed, ratio * maxScrollSpeed));
        window.scrollBy(0, speed);
        scrolled = true;
      } else if (clientY < scrollThreshold) {
        const ratio = (scrollThreshold - clientY) / scrollThreshold;
        const speed = Math.max(1, Math.min(maxScrollSpeed, ratio * maxScrollSpeed));
        window.scrollBy(0, -speed);
        scrolled = true;
      }

      updateSelection();
      animationFrameId = requestAnimationFrame(scrollAndLoop);
    };

    animationFrameId = requestAnimationFrame(scrollAndLoop);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { clientX: e.clientX, clientY: e.clientY };
      updateSelection();
    };

    const handleMouseUp = () => {
      setDragStart(null);
      setDragBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, setSelectedSantriIds]);

  const handleRowClick = (e: React.MouseEvent, index: number, s: Santri) => {
    if (!isSelectionMode) return;
    if (draggedRef.current) return;

    toggleSingleSelection(s.id, e.shiftKey);
  };

  const getAgeHeaderSubtext = (config?: AgeFilterConfig) => {
    if (!config) return '(Hari ini)';
    if (config.refType === 'custom' && config.customDate) {
      const d = new Date(config.customDate);
      if (!isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        return `(Per ${formatted})`;
      }
    }
    return '(Hari ini)';
  };

  const scrolledHeaderClass = 'bg-slate-50 text-slate-400 border-b border-slate-100';

  const renderSortHeader = (key: string, label: string, isSticky: boolean = false, widthClass: string = '', subtext?: string) => {
    const isSorted = sortKey === key;
    const stickyLeftClass = key === 'nama'
      ? (isSelectionMode ? 'sm:left-[112px] left-[112px]' : 'sm:left-[64px] left-[64px]')
      : '';
    const complete = isColumnComplete(key);

    return (
      <th 
        onClick={() => {
          if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortKey(key);
            setSortDirection('asc');
          }
        }}
        className={`px-4 py-3 cursor-pointer transition-all select-none font-display text-xs font-bold uppercase tracking-wider sticky top-0 relative ${scrolledHeaderClass} ${
          isSticky 
            ? `${stickyLeftClass} z-30 sm:shadow-[2px_0_5px_rgba(0,0,0,0.05)] md:w-[272px] w-[200px] md:min-w-[272px] min-w-[200px] md:max-w-[272px] max-w-[200px] border-r` 
            : `hover:bg-slate-100/80 z-20 ${widthClass || 'w-44 min-w-[176px]'}`
          }`}
      >
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5 justify-start relative">
            <span className="text-slate-400">{label}</span>
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3 text-emerald-700 font-bold shrink-0" />
              ) : (
                <ArrowDown className="h-3 w-3 text-emerald-700 font-bold shrink-0" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500 shrink-0" />
            )}
          </div>
          {subtext && (
            <span className="text-[10px] font-bold text-emerald-600 normal-case tracking-tight leading-tight mt-0.5">
              {subtext}
            </span>
          )}
        </div>

        {/* Scroll Left Button placed exactly in the middle of the right side of 'nama' header column */}
        {key === 'nama' && canScrollLeft && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scrollTable('left');
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[40] flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
            title="Gulir Kiri"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5] -translate-x-[0.5px]" />
          </button>
        )}

        {/* Header completeness bar for Monitoring Mode */}
        {isMonitoringMode && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 transition-colors ${
              complete ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            title={complete ? 'Semua data di kolom ini terisi lengkap' : 'Ada data di kolom ini yang belum terisi'}
          />
        )}
      </th>
    );
  };

  const renderTableHeadContents = (headerClass: string) => (
    <tr>
      {isSelectionMode && (
        <th className={`px-3 py-4 text-center sticky top-0 left-0 z-35 border-r border-slate-100 w-12 min-w-[48px] transition-all duration-300 relative ${headerClass}`}>
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              checked={paginatedSantri.length > 0 && paginatedSantri.every(s => selectedSantriIds.includes(s.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  const newIds = [...selectedSantriIds];
                  paginatedSantri.forEach(s => {
                     if (!newIds.includes(s.id)) {
                       newIds.push(s.id);
                     }
                  });
                  setSelectedSantriIds(newIds);
                } else {
                  const paginatedIds = paginatedSantri.map(s => s.id);
                  setSelectedSantriIds(selectedSantriIds.filter(id => !paginatedIds.includes(id)));
                }
              }}
            />
          </div>
          {isMonitoringMode && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-500" />
          )}
        </th>
      )}
      {/* Nomor Column (Sticky Left) */}
      <th className={`px-2 py-4 sticky top-0 ${isSelectionMode ? 'sm:left-[48px] left-[48px]' : 'sm:left-0 left-0'} z-35 w-16 min-w-[64px] font-display text-xs font-bold uppercase tracking-wider border-r border-slate-100 text-center transition-all duration-300 relative ${headerClass}`}>
        No.
        {isMonitoringMode && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 transition-colors ${
              isNoColumnComplete() ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            title={isNoColumnComplete() ? 'Semua santri data wajibnya lengkap' : 'Ada santri data wajibnya belum lengkap'}
          />
        )}
      </th>
      {/* Selalu Terlihat: Nama (berisi foto juga), NIS, NISN, NIK */}
      {renderSortHeader('nama', 'Nama Lengkap', true)}
      {renderSortHeader('nis', 'NIS', false, 'w-[95px] min-w-[95px]')}
      {renderSortHeader('nisn', 'NISN', false, 'w-[110px] min-w-[110px]')}
      {renderSortHeader('nik', 'NIK', false, 'w-[155px] min-w-[155px]')}
      
      {/* Kolom Umur jika Filter Umur Aktif */}
      {ageFilterConfig?.enabled && renderSortHeader('umur', 'Umur', false, 'w-[125px] min-w-[125px]', getAgeHeaderSubtext(ageFilterConfig))}

      {/* Toggable */}
      {visibleColumns.nism && renderSortHeader('nism', 'NISM', false, 'w-[110px] min-w-[110px]')}
      {visibleColumns.noKk && renderSortHeader('noKk', 'No. KK', false, 'w-[155px] min-w-[155px]')}
      {visibleColumns.tempatLahir && renderSortHeader('tempatLahir', 'Tempat Lahir', false, 'w-[125px] min-w-[125px]')}
      {visibleColumns.tanggalLahir && renderSortHeader('tanggalLahir', 'Tanggal Lahir', false, 'w-[115px] min-w-[115px]')}
      {visibleColumns.gender && renderSortHeader('gender', 'Gender', false, 'w-[90px] min-w-[90px]')}
      {visibleColumns.pendidikanTerakhir && renderSortHeader('pendidikanTerakhir', 'Pendidikan Terakhir', false, 'w-[160px] min-w-[160px]')}
      {(visibleColumns.pendidikanFormal ?? true) && renderSortHeader('pendidikanFormal', 'Pendidikan Formal', false, 'w-[190px] min-w-[190px]')}
      {visibleColumns.anakKe && renderSortHeader('anakKe', 'Anak Ke', false, 'w-[85px] min-w-[85px]')}
      {visibleColumns.dariBersaudara && renderSortHeader('dariBersaudara', 'Jumlah Saudara', false, 'w-[120px] min-w-[120px]')}
      {visibleColumns.namaAyah && renderSortHeader('namaAyah', 'Nama Ayah', false, 'w-[150px] min-w-[150px]')}
      {visibleColumns.nikAyah && renderSortHeader('nikAyah', 'NIK Ayah', false, 'w-[155px] min-w-[155px]')}
      {visibleColumns.pekerjaanAyah && renderSortHeader('pekerjaanAyah', 'Pekerjaan Ayah', false, 'w-[140px] min-w-[140px]')}
      {visibleColumns.pendidikanAyah && renderSortHeader('pendidikanAyah', 'Pendidikan Ayah', false, 'w-[130px] min-w-[130px]')}
      {visibleColumns.namaIbu && renderSortHeader('namaIbu', 'Nama Ibu', false, 'w-[150px] min-w-[150px]')}
      {visibleColumns.nikIbu && renderSortHeader('nikIbu', 'NIK Ibu', false, 'w-[155px] min-w-[155px]')}
      {visibleColumns.pekerjaanIbu && renderSortHeader('pekerjaanIbu', 'Pekerjaan Ibu', false, 'w-[140px] min-w-[140px]')}
      {visibleColumns.pendidikanIbu && renderSortHeader('pendidikanIbu', 'Pendidikan Ibu', false, 'w-[130px] min-w-[130px]')}
      {visibleColumns.alamat && renderSortHeader('alamat', 'Alamat', false, 'w-[180px] min-w-[180px]')}
      {visibleColumns.rt && renderSortHeader('rt', 'RT', false, 'w-[65px] min-w-[65px]')}
      {visibleColumns.rw && renderSortHeader('rw', 'RW', false, 'w-[65px] min-w-[65px]')}
      {visibleColumns.desa && renderSortHeader('desa', 'Desa / Kelurahan', false, 'w-[140px] min-w-[140px]')}
      {visibleColumns.kecamatan && renderSortHeader('kecamatan', 'Kecamatan', false, 'w-[140px] min-w-[140px]')}
      {visibleColumns.kabupaten && renderSortHeader('kabupaten', 'Kabupaten / Kota', false, 'w-[150px] min-w-[150px]')}
      {visibleColumns.provinsi && renderSortHeader('provinsi', 'Provinsi', false, 'w-[150px] min-w-[150px]')}
      {visibleColumns.jarakRumah && renderSortHeader('jarakRumah', 'Jarak (km)', false, 'w-[100px] min-w-[100px]')}
      {visibleColumns.noHp && renderSortHeader('noHp', 'No. HP Wali', false, 'w-[130px] min-w-[130px]')}
      {visibleColumns.statusDomisili && renderSortHeader('statusDomisili', 'Status Domisili', false, 'w-[130px] min-w-[130px]')}
      {visibleColumns.tanggalMasuk && renderSortHeader('tanggalMasuk', 'Tgl Masuk', false, 'w-[105px] min-w-[105px]')}
      {visibleColumns.tanggalKeluar && renderSortHeader('tanggalKeluar', 'Tgl Keluar', false, 'w-[105px] min-w-[105px]')}
      
      {/* Status & Emis & Verval */}
      {renderSortHeader('statusKeanggotaan', 'Status', false, 'w-[105px] min-w-[105px]')}
      {renderSortHeader('statusEmis', 'Emis', false, 'w-[95px] min-w-[95px]')}
      {visibleColumns.statusVerval && renderSortHeader('statusVerval', 'Verval', false, 'w-[95px] min-w-[95px]')}
      {visibleColumns.catatan && renderSortHeader('catatan', 'Catatan', false, 'w-[180px] min-w-[180px]')}
      
      <th className={`px-2 py-4 text-center font-display text-xs font-bold uppercase tracking-wider sticky top-0 right-0 z-35 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] border-l w-12 min-w-[48px] transition-all duration-300 ${isSelectionMode ? 'hidden md:table-cell' : 'table-cell'} ${headerClass}`}>Aksi</th>
    </tr>
  );

  const renderScrollButtons = (isFloating: boolean) => {
    if (!canScrollRight) return null;
    return (
      <>
        {/* Scroll Right Button placed exactly in the middle of the right side/edge line of the header */}
        <button
          id={isFloating ? "table-scroll-right-btn-floating" : "table-scroll-right-btn"}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollTable('right');
          }}
          className={`absolute right-0 translate-x-1/2 ${
            isFloating ? 'top-1/2 -translate-y-1/2' : 'top-[26px] -translate-y-1/2'
          } z-[100] flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100`}
          title="Gulir Kanan"
        >
          <ChevronRight className="h-4 w-4 stroke-[2.5] translate-x-[0.5px]" />
        </button>
      </>
    );
  };

  return (
    <div className="relative group/table overflow-visible">
      {/* Scroll Navigation Buttons for Main Table Header */}
      {renderScrollButtons(false)}

      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onScroll={handleTableScroll}
        className="relative overflow-x-auto overflow-y-visible rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-thin select-none"
      >
      {dragBox && (
        <div
          className="absolute border border-[#00b0f0] bg-[#00b0f0]/15 pointer-events-none z-[15] rounded"
          style={{
            left: dragBox.left,
            top: dragBox.top,
            width: dragBox.width,
            height: dragBox.height,
          }}
        />
      )}
      <table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm text-slate-600 table-sticky-leakproof">
        <thead className="text-xs font-semibold uppercase tracking-wider sticky top-0 z-35">
          {renderTableHeadContents(scrolledHeaderClass)}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedSantri.map((s, idx) => {
            const isLastFew = paginatedSantri.length > 3 && idx >= paginatedSantri.length - 2;
            const isSelected = selectedSantriIds.includes(s.id);
            const canWriteForSantri = s.gender === 'Putra' ? canWritePutra : canWritePutri;
            return (
              <tr 
                key={`${s.id}-${idx}`} 
                data-drag-id={s.id}
                onClick={(e) => handleRowClick(e, idx, s)}
                className={`transition-colors group ${
                  isSelectionMode ? 'cursor-pointer font-semibold select-none' : ''
                } ${
                  isSelectionMode && isSelected
                    ? 'bg-emerald-50/60 hover:bg-emerald-100/60'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                 {isSelectionMode && (
                  <td 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSingleSelection(s.id, e.shiftKey);
                    }}
                    className={`px-3 py-4 text-center sticky left-0 transition-colors z-10 border-r border-slate-100 w-12 min-w-[48px] max-w-[48px] cursor-pointer ${
                      isSelected ? 'bg-emerald-50' : 'bg-white group-hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                        checked={isSelected}
                        readOnly
                      />
                    </div>
                  </td>
                )}
                {/* Nomor Column (Sticky Left) */}
                <td className={`px-2 py-4 static sm:sticky ${isSelectionMode ? 'sm:left-[48px] left-[48px]' : 'sm:left-0 left-0'} transition-colors z-10 border-r border-slate-100 w-16 min-w-[64px] max-w-[64px] text-center font-mono text-xs font-semibold ${
                  isSelectionMode && isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'bg-white text-slate-500 group-hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {isMonitoringMode && (
                      isMonitoringWajibComplete(s) ? (
                        <div 
                          className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 shadow-xs"
                          title="Semua Data Wajib Monitoring Lengkap"
                        >
                          <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                        </div>
                      ) : (
                        <div 
                          className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0 shadow-xs"
                          title="Ada Data Wajib Monitoring Belum Lengkap"
                        >
                          <X className="h-2.5 w-2.5 stroke-[3.5]" />
                        </div>
                      )
                    )}
                    <span>{startIndex + idx + 1}</span>
                  </div>
                </td>
                {/* Name sticky column (Nama Lengkap) - Sticky on Desktop only */}
                <td className={`px-4 py-4 font-medium static sm:sticky ${isSelectionMode ? 'sm:left-[112px] left-[112px]' : 'sm:left-[64px] left-[64px]'} transition-colors z-10 sm:shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 md:w-[272px] w-[200px] md:min-w-[272px] min-w-[200px] md:max-w-[272px] max-w-[200px] ${
                  isMonitoringMode && isCellEmpty(s, 'nama')
                    ? '!bg-rose-100/90 !text-rose-800'
                    : isSelectionMode && isSelected
                      ? 'bg-emerald-50 text-slate-900'
                      : 'bg-white text-slate-900 group-hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {renderSantriAvatar(s, "h-8 w-8 shrink-0 rounded-full border border-slate-100 shadow-xs")}
                    <div className="flex-1 min-w-0">
                      {renderEditableCell(s, 'nama', s.nama, { className: 'font-display text-xs font-bold text-slate-900' })}
                    </div>
                  </div>
                </td>
                
                {/* NIS */}
                <td className={`px-3 py-4 whitespace-nowrap text-xs font-semibold text-slate-700 w-[110px] min-w-[110px] ${
                  isMonitoringMode && isCellEmpty(s, 'nis') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                }`}>
                  {renderEditableCell(s, 'nis', s.nis, { className: 'font-mono' })}
                </td>

                {/* Selalu Terlihat: NISN & NIK */}
                <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[120px] min-w-[120px] ${
                  isMonitoringMode && isCellEmpty(s, 'nisn') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                }`}>
                  {renderEditableCell(s, 'nisn', s.nisn || '-', { className: 'font-mono' })}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[160px] min-w-[160px] ${
                  isMonitoringMode && isCellEmpty(s, 'nik') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                }`}>
                  {renderEditableCell(s, 'nik', s.nik || '-', { className: 'font-mono' })}
                </td>

                {/* Kolom Umur jika Filter Umur Aktif */}
                {ageFilterConfig?.enabled && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs font-bold font-mono text-emerald-800 bg-emerald-50/40 w-[125px] min-w-[125px] ${
                    isMonitoringMode && isCellEmpty(s, 'umur') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {(() => {
                      const refDate = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
                        ? new Date(ageFilterConfig.customDate)
                        : new Date();
                      const age = calculateAgeOnDate(s.tanggalLahir, refDate);
                      return age !== null ? `${age} Tahun` : '-';
                    })()}
                  </td>
                )}

                {/* Toggable */}
                {visibleColumns.nism && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[120px] min-w-[120px] ${
                    isMonitoringMode && isCellEmpty(s, 'nism') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'nism', s.nism || '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.noKk && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[160px] min-w-[160px] ${
                    isMonitoringMode && isCellEmpty(s, 'noKk') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'noKk', s.noKk || '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.tempatLahir && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs font-medium text-slate-700 font-display w-[130px] min-w-[130px] ${
                    isMonitoringMode && isCellEmpty(s, 'tempatLahir') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'tempatLahir', s.tempatLahir || '-')}
                  </td>
                )}
                {visibleColumns.tanggalLahir && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[125px] min-w-[125px] ${
                    isMonitoringMode && isCellEmpty(s, 'tanggalLahir') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'tanggalLahir', formatDateDDMMYYYY(s.tanggalLahir), { type: 'date', className: 'font-mono' })}
                  </td>
                )}

                {/* Toggable */}
                {visibleColumns.gender && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs w-[110px] min-w-[110px] ${
                    isMonitoringMode && isCellEmpty(s, 'gender') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(
                      s,
                      'gender',
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.gender === 'Putra' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-pink-50 text-pink-700'
                      }`}>
                        {s.gender}
                      </span>,
                      { type: 'select', selectOptions: ['Putra', 'Putri'] }
                    )}
                  </td>
                )}
                {visibleColumns.pendidikanTerakhir && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 w-[160px] min-w-[160px] ${
                    isMonitoringMode && isCellEmpty(s, 'pendidikanTerakhir') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'pendidikanTerakhir', s.pendidikanTerakhir || 'Tidak Sekolah', {
                      type: 'select',
                      selectOptions: [...PENDIDIKAN_OPTIONS]
                    })}
                  </td>
                )}
                {(visibleColumns.pendidikanFormal ?? true) && (
                  <td className="px-3 py-4 whitespace-nowrap text-xs w-[190px] min-w-[190px]">
                    {(() => {
                      const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
                      const isEmis = (s.statusEmis || 'Belum').toLowerCase() === 'terdaftar';
                      
                      const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
                        if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
                        const lower = (l.nama || '').toLowerCase();
                        if (
                          lower.includes('madin') || lower.includes('diniyah') || lower.includes('tpq') ||
                          lower.includes('tahfidz') || lower.includes('pondok') || lower.includes('kitab') ||
                          lower.includes('internal') || (l.kode && l.kode.toLowerCase().includes('madin'))
                        ) {
                          return 'Internal';
                        }
                        return 'Formal';
                      };

                      const formalLembagas = lembagasList.filter(l => getLembagaJenis(l) === 'Formal');
                      
                      // Compute current formal display label
                      let currentDisplay = 'TIDAK TERDAFTAR';
                      let currentFormalLembaga: Lembaga | null = null;
                      let currentFormalClass: Kelas | null = null;

                      const sClasses = s.kelas ? s.kelas.split(',').map(x => x.trim()) : [];

                      for (const fl of formalLembagas) {
                        const classesOfFl = kelasList.filter(k => String(k.lembagaId || (k as any).lembaga_id) === String(fl.id));
                        const matchedClass = classesOfFl.find(k => k.nama && sClasses.some(sc => sc.toLowerCase() === k.nama.trim().toLowerCase()));
                        if (matchedClass) {
                          currentFormalLembaga = fl;
                          currentFormalClass = matchedClass;
                          currentDisplay = `${fl.nama} - ${matchedClass.nama}`;
                          break;
                        }
                      }

                      if (!currentFormalLembaga && s.pendidikanFormal) {
                        currentDisplay = s.pendidikanFormal;
                        for (const fl of formalLembagas) {
                          if (s.pendidikanFormal.toLowerCase().includes(fl.nama.toLowerCase()) || (fl.kode && s.pendidikanFormal.toLowerCase().includes(fl.kode.toLowerCase()))) {
                            currentFormalLembaga = fl;
                            break;
                          }
                        }
                      }

                      if (!currentFormalLembaga && sClasses.length > 0) {
                        for (const fl of formalLembagas) {
                          if (sClasses.some(sc => sc.toLowerCase().includes(fl.nama.toLowerCase()) || (fl.kode && sc.toLowerCase().includes(fl.kode.toLowerCase())))) {
                            currentFormalLembaga = fl;
                            currentDisplay = `${fl.nama} - Calon Peserta Didik`;
                            break;
                          }
                        }
                      }

                      const isOpen = activeFormalKelasDropdownId === s.id;

                      // Pending state for popover inputs
                      const pendingState = pendingFormalKelas[s.id] || {
                        lem: currentFormalLembaga,
                        cls: currentFormalClass
                      };

                      return (
                        <div className="relative inline-block text-left w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isSelectionMode) return;
                              e.stopPropagation();
                              if (!canWrite) return;
                              if (activeFormalKelasDropdownId === s.id) {
                                setActiveFormalKelasDropdownId(null);
                                setFormalKelasDropdownPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const isUpward = spaceBelow < 320;
                                setFormalKelasDropdownPos({
                                  top: isUpward ? rect.top - 6 : rect.bottom + 6,
                                  left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
                                  isUpward
                                });
                                setActiveFormalKelasDropdownId(s.id);
                              }
                              setActiveEmisDropdownId(null);
                              setActiveDomisiliDropdownId(null);
                              setActiveStatusKeanggotaanDropdownId(null);

                              setPendingFormalKelas(prev => ({
                                ...prev,
                                [s.id]: {
                                  lem: currentFormalLembaga,
                                  cls: currentFormalClass
                                }
                              }));
                            }}
                            disabled={!canWrite || isSelectionMode}
                            className={`dropdown-trigger-btn w-full inline-flex items-center justify-between gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-all ${
                              isSelectionMode
                                ? 'bg-slate-100/70 text-slate-400 border-slate-200/50 shadow-none pointer-events-none filter grayscale opacity-60'
                                : currentFormalLembaga 
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-300' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            } ${canWrite && !isSelectionMode ? 'cursor-pointer shadow-2xs hover:shadow-xs' : 'cursor-default'}`}
                            title={canWrite && !isSelectionMode ? "Klik untuk memilih Lembaga & Kelas Formal" : undefined}
                          >
                            <span className="truncate max-w-[150px]">{currentDisplay}</span>
                            {canWrite && !isSelectionMode && (
                              <ChevronsUpDown className="h-3 w-3 opacity-70 shrink-0 text-slate-500" />
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                )}
                {visibleColumns.anakKe && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 w-[90px] min-w-[90px] ${
                    isMonitoringMode && isCellEmpty(s, 'anakKe') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'anakKe', s.anakKe !== undefined ? s.anakKe : '-', { type: 'number', className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.dariBersaudara && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 w-[125px] min-w-[125px] ${
                    isMonitoringMode && isCellEmpty(s, 'dariBersaudara') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'dariBersaudara', s.dariBersaudara !== undefined ? s.dariBersaudara : '-', { type: 'number', className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.namaAyah && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 max-w-[150px] truncate w-[150px] min-w-[150px] ${
                    isMonitoringMode && isCellEmpty(s, 'namaAyah') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'namaAyah', s.namaAyah || '-')}
                  </td>
                )}
                {visibleColumns.nikAyah && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[160px] min-w-[160px] ${
                    isMonitoringMode && isCellEmpty(s, 'nikAyah') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'nikAyah', s.nikAyah || '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.pekerjaanAyah && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 max-w-[140px] truncate w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'pekerjaanAyah') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'pekerjaanAyah', s.pekerjaanAyah || '-')}
                  </td>
                )}
                {visibleColumns.pendidikanAyah && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'pendidikanAyah') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'pendidikanAyah', s.pendidikanAyah || '-', {
                      type: 'select',
                      selectOptions: [...PENDIDIKAN_OPTIONS]
                    })}
                  </td>
                )}
                {visibleColumns.namaIbu && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 max-w-[150px] truncate w-[150px] min-w-[150px] ${
                    isMonitoringMode && isCellEmpty(s, 'namaIbu') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'namaIbu', s.namaIbu || '-')}
                  </td>
                )}
                {visibleColumns.nikIbu && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[160px] min-w-[160px] ${
                    isMonitoringMode && isCellEmpty(s, 'nikIbu') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'nikIbu', s.nikIbu || '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.pekerjaanIbu && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 max-w-[140px] truncate w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'pekerjaanIbu') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'pekerjaanIbu', s.pekerjaanIbu || '-')}
                  </td>
                )}
                {visibleColumns.pendidikanIbu && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-700 w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'pendidikanIbu') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'pendidikanIbu', s.pendidikanIbu || '-', {
                      type: 'select',
                      selectOptions: [...PENDIDIKAN_OPTIONS]
                    })}
                  </td>
                )}
                {visibleColumns.alamat && (
                  <td className={`px-3 py-4 text-xs text-slate-600 max-w-[180px] truncate w-[180px] min-w-[180px] ${
                    isMonitoringMode && isCellEmpty(s, 'alamat') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'alamat', s.alamat || '-')}
                  </td>
                )}
                {visibleColumns.rt && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[75px] min-w-[75px] ${
                    isMonitoringMode && isCellEmpty(s, 'rt') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'rt', s.rt && String(s.rt).trim() !== '0' ? s.rt : '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.rw && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[75px] min-w-[75px] ${
                    isMonitoringMode && isCellEmpty(s, 'rw') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'rw', s.rw && String(s.rw).trim() !== '0' ? s.rw : '-', { className: 'font-mono' })}
                  </td>
                )}

                {/* Toggable */}
                {visibleColumns.desa && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'desa') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'desa', s.desa || '-')}
                  </td>
                )}
                {visibleColumns.kecamatan && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[140px] min-w-[140px] ${
                    isMonitoringMode && isCellEmpty(s, 'kecamatan') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'kecamatan', s.kecamatan || '-')}
                  </td>
                )}
                {visibleColumns.kabupaten && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[150px] min-w-[150px] ${
                    isMonitoringMode && isCellEmpty(s, 'kabupaten') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'kabupaten', s.kabupaten || s.asal || '-')}
                  </td>
                )}
                {visibleColumns.provinsi && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[150px] min-w-[150px] ${
                    isMonitoringMode && isCellEmpty(s, 'provinsi') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'provinsi', s.provinsi || '-')}
                  </td>
                )}
                {visibleColumns.jarakRumah && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[110px] min-w-[110px] ${
                    isMonitoringMode && isCellEmpty(s, 'jarakRumah') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'jarakRumah', s.jarakRumah && s.jarakRumah !== 0 ? `${s.jarakRumah} km` : '-', { type: 'number', className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.noHp && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-600 w-[135px] min-w-[135px] ${
                    isMonitoringMode && isCellEmpty(s, 'noHp') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'noHp', s.noHp || '-', { className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.statusDomisili && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs w-[130px] min-w-[130px] ${
                    isMonitoringMode && isCellEmpty(s, 'statusDomisili') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {s.statusKeanggotaan === 'Aktif' ? (
                      (() => {
                        const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
                        const domisiliVal = s.statusDomisili || 'Muqim';

                        return (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (isSelectionMode) return;
                                e.stopPropagation();
                                if (!canWrite) return;
                                if (activeDomisiliDropdownId === s.id) {
                                  setActiveDomisiliDropdownId(null);
                                  setDomisiliDropdownPos(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const isUpward = spaceBelow < 150;
                                  setDomisiliDropdownPos({
                                    top: isUpward ? rect.top - 6 : rect.bottom + 6,
                                    left: Math.max(12, rect.left),
                                    isUpward
                                  });
                                  setActiveDomisiliDropdownId(s.id);
                                }
                                setActiveFormalKelasDropdownId(null);
                                setActiveEmisDropdownId(null);
                                setActiveStatusKeanggotaanDropdownId(null);
                              }}
                              disabled={!canWrite || isSelectionMode}
                              className={`dropdown-trigger-btn inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${
                                isSelectionMode
                                  ? 'bg-slate-100/70 text-slate-400 border-slate-200/50 shadow-none pointer-events-none filter grayscale opacity-60'
                                  : domisiliVal === 'Kampung' 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              } ${canWrite && !isSelectionMode ? 'cursor-pointer shadow-2xs' : 'cursor-default'}`}
                              title={canWrite && !isSelectionMode ? "Klik untuk mengubah Status Domisili" : undefined}
                            >
                              <span>{domisiliVal}</span>
                              {canWrite && !isSelectionMode && <ChevronsUpDown className="h-3 w-3 opacity-70 shrink-0 text-slate-500" />}
                            </button>

                            {activeDomisiliDropdownId === s.id && (() => {
                              const pendingVal = pendingDomisili[s.id];
                              const hasChangedDomisili = pendingVal !== undefined && pendingVal !== domisiliVal;

                              return (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="dropdown-container-box absolute left-0 mt-1 w-max min-w-[105px] max-w-[130px] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] py-1 text-xs font-semibold text-slate-700"
                                >
                                  {/* Tombol centang & X tersusun vertikal di kanan atas dropdown (hanya jika ada perubahan) */}
                                  {hasChangedDomisili && (
                                    <div className="absolute -top-2 -right-8 z-[110] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-lg animate-in fade-in zoom-in-95">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const valToApply = pendingDomisili[s.id] || domisiliVal;
                                          if (valToApply !== domisiliVal) {
                                            onUpdateSantri?.({
                                              ...s,
                                              statusDomisili: valToApply as any
                                            });
                                          }
                                          setActiveDomisiliDropdownId(null);
                                          setPendingDomisili(prev => {
                                            const copy = { ...prev };
                                            delete copy[s.id];
                                            return copy;
                                          });
                                        }}
                                        className="rounded p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors shadow-2xs"
                                        title="Terapkan Perubahan (Centang)"
                                      >
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDomisiliDropdownId(null);
                                          setPendingDomisili(prev => {
                                            const copy = { ...prev };
                                            delete copy[s.id];
                                            return copy;
                                          });
                                        }}
                                        className="rounded p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors shadow-2xs"
                                        title="Batal Perubahan (X)"
                                      >
                                        <X className="h-3.5 w-3.5 stroke-[3]" />
                                      </button>
                                    </div>
                                  )}

                                {(['Muqim', 'Kampung'] as const).map((domOption) => {
                                  const activeVal = pendingDomisili[s.id] || domisiliVal;
                                  const isCurrent = activeVal === domOption;
                                  return (
                                    <button
                                      key={domOption}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPendingDomisili(prev => ({ ...prev, [s.id]: domOption }));
                                      }}
                                      className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                                        isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{domOption}</span>
                                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-slate-400 font-mono">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.tanggalMasuk && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[115px] min-w-[115px] ${
                    isMonitoringMode && isCellEmpty(s, 'tanggalMasuk') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'tanggalMasuk', formatDateDDMMYYYY(s.tanggalMasuk), { type: 'date', className: 'font-mono' })}
                  </td>
                )}
                {visibleColumns.tanggalKeluar && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs text-slate-500 w-[115px] min-w-[115px] ${
                    isMonitoringMode && isCellEmpty(s, 'tanggalKeluar') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'tanggalKeluar', formatDateDDMMYYYY(s.tanggalKeluar), { type: 'date', className: 'font-mono' })}
                  </td>
                )}

                {/* Selalu Terlihat: Status Keanggotaan & Status Emis */}
                <td className={`px-3 py-4 text-center whitespace-nowrap text-xs w-[115px] min-w-[115px] ${
                  isMonitoringMode && isCellEmpty(s, 'statusKeanggotaan') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                }`}>
                  {(() => {
                    const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
                    const currentStatus = s.statusKeanggotaan || 'Aktif';

                    return (
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isSelectionMode) return;
                            e.stopPropagation();
                            if (!canWrite) return;
                            if (activeStatusKeanggotaanDropdownId === s.id) {
                              setActiveStatusKeanggotaanDropdownId(null);
                              setStatusDropdownPos(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const isUpward = spaceBelow < 160;
                              setStatusDropdownPos({
                                top: isUpward ? rect.top - 6 : rect.bottom + 6,
                                left: Math.max(12, rect.left),
                                isUpward
                              });
                              setActiveStatusKeanggotaanDropdownId(s.id);
                            }
                            setActiveFormalKelasDropdownId(null);
                            setActiveDomisiliDropdownId(null);
                            setActiveEmisDropdownId(null);
                          }}
                          disabled={!canWrite || isSelectionMode}
                          className={`dropdown-trigger-btn ${
                            isSelectionMode
                              ? 'pointer-events-none filter grayscale opacity-60'
                              : canWrite
                                ? 'cursor-pointer hover:scale-105 transition-transform'
                                : 'cursor-default'
                          }`}
                          title={canWrite && !isSelectionMode ? "Klik untuk mengubah Status Keanggotaan" : undefined}
                        >
                          <MembershipBadge status={currentStatus} showChevron={canWrite && !isSelectionMode} />
                        </button>

                        {activeStatusKeanggotaanDropdownId === s.id && (() => {
                          const pendingVal = pendingStatusKeanggotaan[s.id];
                          const hasChangedStatus = pendingVal !== undefined && pendingVal !== currentStatus;

                          return (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="dropdown-container-box absolute left-1/2 -translate-x-1/2 mt-1 w-max min-w-[115px] max-w-[140px] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] py-1 text-xs font-semibold text-slate-700"
                            >
                              {/* Tombol centang & X tersusun vertikal di kanan atas dropdown (hanya jika ada perubahan) */}
                              {hasChangedStatus && (
                                <div className="absolute -top-2 -right-8 z-[110] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-lg animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const valToApply = pendingStatusKeanggotaan[s.id] || currentStatus;
                                      if (valToApply !== currentStatus) {
                                        const updated: Santri = {
                                          ...s,
                                          statusKeanggotaan: valToApply as any,
                                        };
                                        if (valToApply === 'Aktif') {
                                          updated.tanggalKeluar = undefined;
                                          if (!updated.statusDomisili) updated.statusDomisili = 'Muqim';
                                        } else {
                                          updated.statusDomisili = undefined;
                                          if (!updated.tanggalKeluar) {
                                            updated.tanggalKeluar = new Date().toISOString().split('T')[0];
                                          }
                                        }
                                        onUpdateSantri?.(updated);
                                      }
                                      setActiveStatusKeanggotaanDropdownId(null);
                                      setPendingStatusKeanggotaan(prev => {
                                        const copy = { ...prev };
                                        delete copy[s.id];
                                        return copy;
                                      });
                                    }}
                                    className="rounded p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Terapkan Perubahan (Centang)"
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveStatusKeanggotaanDropdownId(null);
                                      setPendingStatusKeanggotaan(prev => {
                                        const copy = { ...prev };
                                        delete copy[s.id];
                                        return copy;
                                      });
                                    }}
                                    className="rounded p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Batal Perubahan (X)"
                                  >
                                    <X className="h-3.5 w-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              )}

                            {(['Aktif', 'Alumni', 'Meninggal'] as const).map((opt) => {
                              const activeVal = pendingStatusKeanggotaan[s.id] || currentStatus;
                              const isCurrent = activeVal === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingStatusKeanggotaan(prev => ({ ...prev, [s.id]: opt }));
                                  }}
                                  className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                                    isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                      </div>
                    );
                  })()}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-xs w-[115px] min-w-[115px] ${
                  isMonitoringMode && isCellEmpty(s, 'statusEmis') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                }`}>
                  {(() => {
                    const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
                    const isTerdaftar = (s.statusEmis || 'Belum').toLowerCase() === 'terdaftar';
                    
                    return (
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isSelectionMode) return;
                            e.stopPropagation();
                            if (!canWrite) return;
                            if (activeEmisDropdownId === s.id) {
                              setActiveEmisDropdownId(null);
                              setEmisDropdownPos(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const isUpward = spaceBelow < 150;
                              setEmisDropdownPos({
                                top: isUpward ? rect.top - 6 : rect.bottom + 6,
                                left: Math.max(12, rect.left),
                                isUpward
                              });
                              setActiveEmisDropdownId(s.id);
                            }
                            setActiveFormalKelasDropdownId(null);
                            setActiveDomisiliDropdownId(null);
                            setActiveStatusKeanggotaanDropdownId(null);
                          }}
                          disabled={!canWrite || isSelectionMode}
                          className={`dropdown-trigger-btn inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                            isSelectionMode
                              ? 'bg-slate-100/70 text-slate-400 border-slate-200/50 shadow-none pointer-events-none filter grayscale opacity-60'
                              : isTerdaftar
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                          } ${canWrite && !isSelectionMode ? 'cursor-pointer shadow-2xs hover:shadow-xs' : 'cursor-default'}`}
                          title={canWrite && !isSelectionMode ? "Klik untuk mengubah Status EMIS" : undefined}
                        >
                          <span>{s.statusEmis || 'Belum'}</span>
                          {canWrite && !isSelectionMode && (
                            <ChevronsUpDown className="h-3 w-3 opacity-70 shrink-0 text-slate-500" />
                          )}
                        </button>

                        {activeEmisDropdownId === s.id && (() => {
                          const currentEmis = s.statusEmis || 'Belum';
                          const pendingVal = pendingEmis[s.id];
                          const hasChangedEmis = pendingVal !== undefined && pendingVal !== currentEmis;

                          return (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="dropdown-container-box absolute left-0 mt-1 w-max min-w-[110px] max-w-[135px] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] py-1 text-xs font-semibold text-slate-700"
                            >
                              {/* Tombol centang & X tersusun vertikal di kanan atas dropdown (hanya jika ada perubahan) */}
                              {hasChangedEmis && (
                                <div className="absolute -top-2 -right-8 z-[110] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-lg animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const valToApply = pendingEmis[s.id] || currentEmis;
                                      if (valToApply !== currentEmis) {
                                        let updated: Santri = {
                                          ...s,
                                          statusEmis: valToApply as any
                                        };
                                        if (valToApply === 'Belum') {
                                          updated = demoteSantriToCalonPesertaDidik(s, lembagasList, kelasList);
                                        }
                                        onUpdateSantri?.(updated);
                                      }
                                      setActiveEmisDropdownId(null);
                                      setPendingEmis(prev => {
                                        const copy = { ...prev };
                                        delete copy[s.id];
                                        return copy;
                                      });
                                    }}
                                    className="rounded p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Terapkan Perubahan (Centang)"
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveEmisDropdownId(null);
                                      setPendingEmis(prev => {
                                        const copy = { ...prev };
                                        delete copy[s.id];
                                        return copy;
                                      });
                                    }}
                                    className="rounded p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Batal Perubahan (X)"
                                  >
                                    <X className="h-3.5 w-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              )}

                            {(['Terdaftar', 'Belum'] as const).map((emisOption) => {
                              const activeVal = pendingEmis[s.id] || (s.statusEmis || 'Belum');
                              const isCurrent = activeVal === emisOption;
                              return (
                                <button
                                  key={emisOption}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingEmis(prev => ({ ...prev, [s.id]: emisOption }));
                                  }}
                                  className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                                    isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{emisOption === 'Belum' ? 'Belum' : 'Terdaftar'}</span>
                                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                      </div>
                    );
                  })()}
                </td>

                {/* Status Verval */}
                {visibleColumns.statusVerval && (
                  <td className={`px-3 py-4 whitespace-nowrap text-xs w-[115px] min-w-[115px] ${
                    isMonitoringMode && isCellEmpty(s, 'statusVerval') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {(() => {
                      const canWrite = s.gender === 'Putri' ? canWritePutri : canWritePutra;
                      const isEmisTerdaftar = (s.statusEmis || 'Belum').toLowerCase() === 'terdaftar';
                      const currentVerval = isEmisTerdaftar ? (s.statusVerval || 'Proses') : 'Proses';
                      const isSukses = currentVerval === 'Sukses';

                      return (
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isSelectionMode) return;
                              e.stopPropagation();
                              if (!canWrite || !isEmisTerdaftar) return;
                              if (activeVervalDropdownId === s.id) {
                                setActiveVervalDropdownId(null);
                                setVervalDropdownPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const isUpward = spaceBelow < 150;
                                setVervalDropdownPos({
                                  top: isUpward ? rect.top - 6 : rect.bottom + 6,
                                  left: Math.max(12, rect.left),
                                  isUpward
                                });
                                setActiveVervalDropdownId(s.id);
                              }
                              setActiveEmisDropdownId(null);
                              setActiveFormalKelasDropdownId(null);
                              setActiveDomisiliDropdownId(null);
                              setActiveStatusKeanggotaanDropdownId(null);
                            }}
                            disabled={!canWrite || !isEmisTerdaftar || isSelectionMode}
                            className={`dropdown-trigger-btn inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                              isSelectionMode || !isEmisTerdaftar
                                ? 'bg-slate-100 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-70'
                                : isSukses
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer shadow-2xs hover:shadow-xs'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer shadow-2xs hover:shadow-xs'
                            }`}
                            title={
                              !isEmisTerdaftar 
                                ? "Hanya bisa diatur saat Status EMIS Terdaftar" 
                                : canWrite && !isSelectionMode ? "Klik untuk mengubah Status Verval" : undefined
                            }
                          >
                            <span>{currentVerval}</span>
                            {canWrite && isEmisTerdaftar && !isSelectionMode && (
                              <ChevronsUpDown className="h-3 w-3 opacity-70 shrink-0 text-slate-500" />
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                )}

                {visibleColumns.catatan && (
                  <td className={`px-3 py-4 text-xs text-slate-500 max-w-[180px] truncate w-[180px] min-w-[180px] ${
                    isMonitoringMode && isCellEmpty(s, 'catatan') ? '!bg-rose-100/90 !text-rose-800 font-medium' : ''
                  }`}>
                    {renderEditableCell(s, 'catatan', s.catatan || '-')}
                  </td>
                )}

                {/* Aksi (Sticky Right) */}
                <td 
                  className={`px-2 py-4 text-center whitespace-nowrap sticky right-0 transition-colors shadow-[-2px_0_5px_rgba(0,0,0,0.05)] border-l border-slate-100 w-12 min-w-[48px] ${
                    isSelectionMode
                      ? isSelected
                        ? 'bg-emerald-50 text-emerald-800 hidden md:table-cell cursor-pointer'
                        : 'bg-slate-50 text-slate-400 hidden md:table-cell cursor-pointer'
                      : 'bg-white group-hover:bg-slate-50 table-cell'
                  } ${activeSantriDropdownId === `tbl-${s.id}` || activeDesktopDropdownId === s.id ? 'z-[100]' : 'z-20'}`}
                >
                  <div className="flex items-center justify-center">
                    {/* Tombol Titik Tiga (Dropdown Aksi Lainnya) */}
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        disabled={isSelectionMode}
                        onClick={(e) => {
                          if (isSelectionMode) return;
                          e.stopPropagation();
                          if (activeDesktopDropdownId === s.id) {
                            setActiveDesktopDropdownId(null);
                            setActionDropdownPos(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const isUpward = spaceBelow < 220;
                            setActionDropdownPos({
                              top: isUpward ? rect.top - 6 : rect.bottom + 6,
                              right: window.innerWidth - rect.right,
                              isUpward
                            });
                            setActiveDesktopDropdownId(s.id);
                          }
                        }}
                        className={`dropdown-trigger-btn inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                          isSelectionMode
                            ? 'bg-slate-100 text-slate-300 pointer-events-none border border-slate-200'
                            : activeDesktopDropdownId === s.id
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer active:scale-95'
                        }`}
                        title="Aksi Lainnya"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

      {/* Portal Dropdown Aksi */}
      {typeof document !== 'undefined' && activeDesktopDropdownId && actionDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDesktopDropdownId(null);
              setActionDropdownPos(null);
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: actionDropdownPos.isUpward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: actionDropdownPos.isUpward ? 4 : -4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              top: actionDropdownPos.isUpward ? 'auto' : `${actionDropdownPos.top}px`,
              bottom: actionDropdownPos.isUpward ? `${window.innerHeight - actionDropdownPos.top}px` : 'auto',
              right: `${actionDropdownPos.right}px`,
            }}
            className="dropdown-container-box w-38 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-[9999] text-slate-700 text-left font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeDesktopDropdownId);
              if (!s) return null;
              const idx = paginatedSantri.findIndex(item => item.id === activeDesktopDropdownId);
              const canWriteForSantri = s.gender === 'Putri' ? canWritePutri : canWritePutra;

              return (
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopDropdownId(null);
                      setActionDropdownPos(null);
                      setSelectedSantri(s);
                    }}
                    className="flex w-full items-center px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Detail Biodata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopDropdownId(null);
                      setActionDropdownPos(null);
                      setIsSelectionMode(true);
                      setLastSelectedIndex(idx);
                      setLastAction('select');
                      if (!selectedSantriIds.includes(s.id)) {
                        setSelectedSantriIds([...selectedSantriIds, s.id]);
                      }
                    }}
                    className="flex w-full items-center px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <span>Pilih</span>
                  </button>

                  {canWriteForSantri && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDesktopDropdownId(null);
                        setActionDropdownPos(null);
                        handleStartEditSantri(s);
                      }}
                      className="flex w-full items-center px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      <span>Ubah Data</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopDropdownId(null);
                      setActionDropdownPos(null);
                      handlePrintClick(s);
                    }}
                    className="flex w-full items-center px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <span>Cetak Data</span>
                  </button>

                  {canWriteForSantri && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDesktopDropdownId(null);
                          setActionDropdownPos(null);
                          handleDeleteClick(s.id, s.nama);
                        }}
                        className="flex w-full items-center px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <span>Hapus Data</span>
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </>,
        document.body
      )}

      {/* Portal Dropdown Status Keanggotaan */}
      {typeof document !== 'undefined' && activeStatusKeanggotaanDropdownId && statusDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveStatusKeanggotaanDropdownId(null);
              setStatusDropdownPos(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: statusDropdownPos.isUpward ? 'auto' : `${statusDropdownPos.top}px`,
              bottom: statusDropdownPos.isUpward ? `${window.innerHeight - statusDropdownPos.top}px` : 'auto',
              left: `${statusDropdownPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="dropdown-container-box w-max min-w-[120px] max-w-[150px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] py-1 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95"
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeStatusKeanggotaanDropdownId);
              if (!s) return null;
              const currentStatus = s.statusKeanggotaan || 'Aktif';
              const pendingVal = pendingStatusKeanggotaan[s.id];
              const hasChangedStatus = pendingVal !== undefined && pendingVal !== currentStatus;

              return (
                <>
                  {hasChangedStatus && (
                    <div className="absolute -top-2 -right-8 z-[10000] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const valToApply = pendingStatusKeanggotaan[s.id] || currentStatus;
                          if (valToApply !== currentStatus) {
                            const updated: Santri = {
                              ...s,
                              statusKeanggotaan: valToApply as any,
                            };
                            if (valToApply === 'Aktif') {
                              updated.tanggalKeluar = undefined;
                              if (!updated.statusDomisili) updated.statusDomisili = 'Muqim';
                            } else {
                              updated.statusDomisili = undefined;
                              if (!updated.tanggalKeluar) {
                                updated.tanggalKeluar = new Date().toISOString().split('T')[0];
                              }
                            }
                            onUpdateSantri?.(updated);
                          }
                          setActiveStatusKeanggotaanDropdownId(null);
                          setStatusDropdownPos(null);
                          setPendingStatusKeanggotaan(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors"
                        title="Terapkan Perubahan"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStatusKeanggotaanDropdownId(null);
                          setStatusDropdownPos(null);
                          setPendingStatusKeanggotaan(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors"
                        title="Batal"
                      >
                        <X className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  )}

                  {(['Aktif', 'Alumni', 'Meninggal'] as const).map((opt) => {
                    const activeVal = pendingStatusKeanggotaan[s.id] || currentStatus;
                    const isCurrent = activeVal === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingStatusKeanggotaan(prev => ({ ...prev, [s.id]: opt }));
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Portal Dropdown Status EMIS */}
      {typeof document !== 'undefined' && activeEmisDropdownId && emisDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveEmisDropdownId(null);
              setEmisDropdownPos(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: emisDropdownPos.isUpward ? 'auto' : `${emisDropdownPos.top}px`,
              bottom: emisDropdownPos.isUpward ? `${window.innerHeight - emisDropdownPos.top}px` : 'auto',
              left: `${emisDropdownPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="dropdown-container-box w-max min-w-[115px] max-w-[140px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] py-1 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95"
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeEmisDropdownId);
              if (!s) return null;
              const currentEmis = s.statusEmis || 'Belum';
              const pendingVal = pendingEmis[s.id];
              const hasChangedEmis = pendingVal !== undefined && pendingVal !== currentEmis;

              return (
                <>
                  {hasChangedEmis && (
                    <div className="absolute -top-2 -right-8 z-[10000] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const valToApply = pendingEmis[s.id] || currentEmis;
                          if (valToApply !== currentEmis) {
                            let updated: Santri = {
                              ...s,
                              statusEmis: valToApply as any
                            };
                            if (valToApply === 'Belum') {
                              updated = demoteSantriToCalonPesertaDidik(s, lembagasList, kelasList);
                            }
                            onUpdateSantri?.(updated);
                          }
                          setActiveEmisDropdownId(null);
                          setEmisDropdownPos(null);
                          setPendingEmis(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors"
                        title="Terapkan Perubahan"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEmisDropdownId(null);
                          setEmisDropdownPos(null);
                          setPendingEmis(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors"
                        title="Batal"
                      >
                        <X className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  )}

                  {(['Terdaftar', 'Belum'] as const).map((emisOption) => {
                    const activeVal = pendingEmis[s.id] || currentEmis;
                    const isCurrent = activeVal === emisOption;
                    return (
                      <button
                        key={emisOption}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingEmis(prev => ({ ...prev, [s.id]: emisOption }));
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{emisOption}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Portal Dropdown Status Verval */}
      {typeof document !== 'undefined' && activeVervalDropdownId && vervalDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveVervalDropdownId(null);
              setVervalDropdownPos(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: vervalDropdownPos.isUpward ? 'auto' : `${vervalDropdownPos.top}px`,
              bottom: vervalDropdownPos.isUpward ? `${window.innerHeight - vervalDropdownPos.top}px` : 'auto',
              left: `${vervalDropdownPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="dropdown-container-box w-max min-w-[115px] max-w-[140px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] py-1 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95"
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeVervalDropdownId);
              if (!s) return null;
              const currentVerval = s.statusVerval || 'Proses';

              return (
                <>
                  {(['Proses', 'Sukses'] as const).map((vervalOption) => {
                    const isCurrent = currentVerval === vervalOption;
                    return (
                      <button
                        key={vervalOption}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (vervalOption !== currentVerval) {
                            onUpdateSantri?.({
                              ...s,
                              statusVerval: vervalOption
                            });
                          }
                          setActiveVervalDropdownId(null);
                          setVervalDropdownPos(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{vervalOption}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Portal Dropdown Status Domisili */}
      {typeof document !== 'undefined' && activeDomisiliDropdownId && domisiliDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDomisiliDropdownId(null);
              setDomisiliDropdownPos(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: domisiliDropdownPos.isUpward ? 'auto' : `${domisiliDropdownPos.top}px`,
              bottom: domisiliDropdownPos.isUpward ? `${window.innerHeight - domisiliDropdownPos.top}px` : 'auto',
              left: `${domisiliDropdownPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="dropdown-container-box w-max min-w-[110px] max-w-[135px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] py-1 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95"
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeDomisiliDropdownId);
              if (!s) return null;
              const domisiliVal = s.statusDomisili || 'Muqim';
              const pendingVal = pendingDomisili[s.id];
              const hasChangedDomisili = pendingVal !== undefined && pendingVal !== domisiliVal;

              return (
                <>
                  {hasChangedDomisili && (
                    <div className="absolute -top-2 -right-8 z-[10000] flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const valToApply = pendingDomisili[s.id] || domisiliVal;
                          if (valToApply !== domisiliVal) {
                            onUpdateSantri?.({
                              ...s,
                              statusDomisili: valToApply as any
                            });
                          }
                          setActiveDomisiliDropdownId(null);
                          setDomisiliDropdownPos(null);
                          setPendingDomisili(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors"
                        title="Terapkan Perubahan"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDomisiliDropdownId(null);
                          setDomisiliDropdownPos(null);
                          setPendingDomisili(prev => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });
                        }}
                        className="rounded-lg p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors"
                        title="Batal"
                      >
                        <X className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  )}

                  {(['Muqim', 'Kampung'] as const).map((domOption) => {
                    const activeVal = pendingDomisili[s.id] || domisiliVal;
                    const isCurrent = activeVal === domOption;
                    return (
                      <button
                        key={domOption}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDomisili(prev => ({ ...prev, [s.id]: domOption }));
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{domOption}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Portal Popover Pendidikan Formal */}
      {typeof document !== 'undefined' && activeFormalKelasDropdownId && formalKelasDropdownPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setActiveFormalKelasDropdownId(null);
              setFormalKelasDropdownPos(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: formalKelasDropdownPos.isUpward ? 'auto' : `${formalKelasDropdownPos.top}px`,
              bottom: formalKelasDropdownPos.isUpward ? `${window.innerHeight - formalKelasDropdownPos.top}px` : 'auto',
              left: `${formalKelasDropdownPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="dropdown-container-box w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-3.5 text-xs text-slate-700 font-sans animate-in fade-in zoom-in-95"
          >
            {(() => {
              const s = paginatedSantri.find(item => item.id === activeFormalKelasDropdownId);
              if (!s) return null;
              const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
                if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
                const lower = (l.nama || '').toLowerCase();
                if (
                  lower.includes('madin') || lower.includes('diniyah') || lower.includes('tpq') ||
                  lower.includes('tahfidz') || lower.includes('pondok') || lower.includes('kitab') ||
                  lower.includes('internal') || (l.kode && l.kode.toLowerCase().includes('madin'))
                ) {
                  return 'Internal';
                }
                return 'Formal';
              };

              const formalLembagas = lembagasList.filter(l => getLembagaJenis(l) === 'Formal');
              const isEmis = (s.statusEmis || 'Belum').toLowerCase() === 'terdaftar';
              
              let currentFormalLembaga: Lembaga | null = null;
              let currentFormalClass: Kelas | null = null;
              const sClasses = s.kelas ? s.kelas.split(',').map(x => x.trim()) : [];

              for (const fl of formalLembagas) {
                const classesOfFl = kelasList.filter(k => String(k.lembagaId || (k as any).lembaga_id) === String(fl.id));
                const matchedClass = classesOfFl.find(k => k.nama && sClasses.some(sc => sc.toLowerCase() === k.nama.trim().toLowerCase()));
                if (matchedClass) {
                  currentFormalLembaga = fl;
                  currentFormalClass = matchedClass;
                  break;
                }
              }

              if (!currentFormalLembaga && s.pendidikanFormal) {
                for (const fl of formalLembagas) {
                  if (s.pendidikanFormal.toLowerCase().includes(fl.nama.toLowerCase()) || (fl.kode && s.pendidikanFormal.toLowerCase().includes(fl.kode.toLowerCase()))) {
                    currentFormalLembaga = fl;
                    break;
                  }
                }
              }

              const pendingState = pendingFormalKelas[s.id] || {
                lem: currentFormalLembaga,
                cls: currentFormalClass
              };

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[12px]">
                      <School className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Pendidikan Formal</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isEmis 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {isEmis ? 'EMIS Terdaftar' : 'Belum EMIS'}
                    </span>
                  </div>

                  {/* Box 1 (Atas) - Select Lembaga */}
                  <div className="mb-3">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      1. Pilih Lembaga Formal
                    </label>
                    <select
                      value={pendingState.lem ? String(pendingState.lem.id) : ''}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        const selectedLem = formalLembagas.find(l => String(l.id) === chosenId) || null;
                        setPendingFormalKelas(prev => ({
                          ...prev,
                          [s.id]: {
                            lem: selectedLem,
                            cls: null
                          }
                        }));
                      }}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Tanpa Lembaga Formal --</option>
                      {formalLembagas
                        .filter(fl => isGenderMatch(fl.gender, s.gender))
                        .map((fl) => (
                          <option key={fl.id} value={String(fl.id)}>
                            {fl.nama}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Box 2 (Bawah) - Select Kelas */}
                  <div className="mb-3">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      2. Pilih Kelas / Status
                    </label>
                    <select
                      disabled={!pendingState.lem}
                      value={pendingState.cls && isEmis ? String(pendingState.cls.id) : 'calon'}
                      onChange={(e) => {
                        const chosenClassId = e.target.value;
                        let selectedCls: Kelas | null = null;
                        if (pendingState.lem && chosenClassId !== 'calon' && isEmis) {
                          selectedCls = kelasList.find(k => String(k.id) === chosenClassId) || null;
                        }
                        setPendingFormalKelas(prev => ({
                          ...prev,
                          [s.id]: {
                            ...prev[s.id],
                            cls: selectedCls
                          }
                        }));
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                        !pendingState.lem
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer'
                      }`}
                    >
                      {!pendingState.lem ? (
                        <option value="">Pilih Lembaga Terlebih Dahulu</option>
                      ) : (
                        <>
                          <option value="calon">Calon Peserta Didik</option>
                          {kelasList
                            .filter(k => 
                              String(k.lembagaId || (k as any).lembaga_id) === String(pendingState.lem?.id) &&
                              k.nama.trim().toLowerCase() !== 'calon peserta didik' &&
                              k.nama.trim().toLowerCase() !== 'calon pelajar'
                            )
                            .map((k) => (
                              <option
                                key={k.id}
                                value={String(k.id)}
                                disabled={!isEmis}
                                className={!isEmis ? 'text-slate-400 bg-slate-100' : ''}
                              >
                                {k.nama} {!isEmis ? ' (Perlu EMIS)' : ''}
                              </option>
                            ))
                          }
                        </>
                      )}
                    </select>
                  </div>

                  {/* Info box for EMIS */}
                  {!isEmis && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[10.5px] text-amber-900 font-medium leading-snug flex items-center gap-1.5 shadow-2xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Daftarkan EMIS sebelum mendistribusikan ke kelas</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFormalKelasDropdownId(null);
                        setFormalKelasDropdownPos(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateFormalClass(s, pendingState.lem, pendingState.cls);
                        setActiveFormalKelasDropdownId(null);
                        setFormalKelasDropdownPos(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Viewport-sticky floating header (rendered via Portal to avoid being trapped by parent transform layout) */}
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={floatingHeaderOuterRef}
          className="fixed z-[45] bg-slate-50 border border-slate-100 shadow-md rounded-t-2xl overflow-visible"
          style={{
            top: `${stickyTop}px`,
            left: `${floatingHeaderStyle.left}px`,
            width: `${floatingHeaderStyle.width}px`,
            display: isScrolled ? 'block' : 'none',
          }}
        >
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

                if (containerRef.current && containerRef.current.scrollLeft !== floating.scrollLeft) {
                  containerRef.current.scrollLeft = floating.scrollLeft;
                }
              }
            }}
            className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            <table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm text-slate-600">
              <thead className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50">
                {renderTableHeadContents('bg-slate-50 text-slate-400 border-b border-slate-100')}
              </thead>
            </table>
          </div>
          {/* Scroll Navigation Buttons inside Floating Header */}
          {renderScrollButtons(true)}
        </div>,
        document.body
      )}
    </div>
  );
}
