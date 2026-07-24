import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  FileText, 
  SlidersHorizontal, 
  AlertTriangle, 
  ShieldAlert,
  Wand2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Santri } from '../types';
import { normalizePendidikan, PENDIDIKAN_OPTIONS, formatDateDDMMYYYY } from '../lib/utils';
import { PUTRA_AVATAR, PUTRI_AVATAR } from './SekretarisHelper';

const convertToStandardDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  let year = 0;
  let month = 0;
  let day = 0;

  // Check if it's already YYYY-MM-DD
  const matchYmd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (matchYmd) {
    year = parseInt(matchYmd[1], 10);
    month = parseInt(matchYmd[2], 10);
    day = parseInt(matchYmd[3], 10);
  } else {
    // Try to match DD-MM-YYYY or DD/MM/YYYY
    const matchDmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (matchDmy) {
      day = parseInt(matchDmy[1], 10);
      month = parseInt(matchDmy[2], 10);
      year = parseInt(matchDmy[3], 10);
    }
  }

  if (year > 0 && month >= 1 && month <= 12 && day >= 1) {
    // Ensure day does not exceed the maximum number of days in that month/year
    const maxDays = new Date(year, month, 0).getDate();
    if (day > maxDays) {
      day = maxDays;
    }
    const yStr = String(year).padStart(4, '0');
    const mStr = String(month).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }

  return trimmed;
};

const isValidDateFormat = (val: string | undefined | null): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  if (trimmed === "") return true;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && 
           parsedDate.getMonth() === month - 1 && 
           parsedDate.getDate() === day;
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && 
           parsedDate.getMonth() === month - 1 && 
           parsedDate.getDate() === day;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && 
           parsedDate.getMonth() === month - 1 && 
           parsedDate.getDate() === day;
  }

  return false;
};

const EXCEL_COLUMNS = [
  { label: 'A', width: 'w-[60px]', isSticky: true, stickyLeft: 'left-[50px]' }, // Pilih
  { label: 'B', width: 'w-[120px]' }, // NIS
  { label: 'C', width: 'w-[220px]' }, // Nama Lengkap
  { label: 'D', width: 'w-[140px]' }, // NISN
  { label: 'E', width: 'w-[220px]' }, // NISM
  { label: 'F', width: 'w-[180px]' }, // NIK
  { label: 'G', width: 'w-[180px]' }, // No KK
  { label: 'H', width: 'w-[140px]' }, // Tempat Lahir
  { label: 'I', width: 'w-[130px]' }, // Tanggal Lahir
  { label: 'J', width: 'w-[100px]' }, // Gender
  { label: 'K', width: 'w-[160px]' }, // Pendidikan Terakhir
  { label: 'L', width: 'w-[100px]' }, // Anak Ke
  { label: 'M', width: 'w-[120px]' }, // Jumlah Saudara
  { label: 'N', width: 'w-[160px]' }, // Nama Ayah
  { label: 'O', width: 'w-[180px]' }, // NIK Ayah
  { label: 'P', width: 'w-[150px]' }, // Pekerjaan Ayah
  { label: 'Q', width: 'w-[150px]' }, // Pendidikan Ayah
  { label: 'R', width: 'w-[160px]' }, // Nama Ibu
  { label: 'S', width: 'w-[180px]' }, // NIK Ibu
  { label: 'T', width: 'w-[150px]' }, // Pekerjaan Ibu
  { label: 'U', width: 'w-[150px]' }, // Pendidikan Ibu
  { label: 'V', width: 'w-[240px]' }, // Alamat
  { label: 'W', width: 'w-[80px]' }, // RT
  { label: 'X', width: 'w-[80px]' }, // RW
  { label: 'Y', width: 'w-[140px]' }, // Desa
  { label: 'Z', width: 'w-[140px]' }, // Kecamatan
  { label: 'AA', width: 'w-[140px]' }, // Kabupaten
  { label: 'AB', width: 'w-[140px]' }, // Provinsi
  { label: 'AC', width: 'w-[150px]' }, // Jarak Rumah (km)
  { label: 'AD', width: 'w-[150px]' }, // No HP Wali
  { label: 'AE', width: 'w-[150px]' }, // Status Keanggotaan
  { label: 'AF', width: 'w-[130px]' }, // Status Domisili
  { label: 'AG', width: 'w-[130px]' }, // Status Hidup
  { label: 'AH', width: 'w-[130px]' }, // Tanggal Masuk
  { label: 'AI', width: 'w-[130px]' }, // Tanggal Keluar
  { label: 'AJ', width: 'w-[150px]' }, // Status Emis
  { label: 'AK', width: 'w-[150px]' }, // Status Verval
  { label: 'AL', width: 'w-[200px]' }, // Catatan
];

const REPLACE_FIELDS = [
  { value: 'all', label: 'Semua Kolom' },
  { value: 'nis', label: 'NIS' },
  { value: 'nama', label: 'Nama Lengkap' },
  { value: 'nisn', label: 'NISN' },
  { value: 'nism', label: 'NISM' },
  { value: 'nik', label: 'NIK' },
  { value: 'noKk', label: 'No KK' },
  { value: 'tempatLahir', label: 'Tempat Lahir' },
  { value: 'tanggalLahir', label: 'Tanggal Lahir' },
  { value: 'gender', label: 'Gender' },
  { value: 'pendidikanTerakhir', label: 'Pendidikan Terakhir' },
  { value: 'anakKe', label: 'Anak Ke' },
  { value: 'dariBersaudara', label: 'Jumlah Saudara' },
  { value: 'namaAyah', label: 'Nama Ayah' },
  { value: 'nikAyah', label: 'NIK Ayah' },
  { value: 'pekerjaanAyah', label: 'Pekerjaan Ayah' },
  { value: 'pendidikanAyah', label: 'Pendidikan Ayah' },
  { value: 'namaIbu', label: 'Nama Ibu' },
  { value: 'nikIbu', label: 'NIK Ibu' },
  { value: 'pekerjaanIbu', label: 'Pekerjaan Ibu' },
  { value: 'pendidikanIbu', label: 'Pendidikan Ibu' },
  { value: 'alamat', label: 'Alamat' },
  { value: 'rt', label: 'RT' },
  { value: 'rw', label: 'RW' },
  { value: 'desa', label: 'Desa' },
  { value: 'kecamatan', label: 'Kecamatan' },
  { value: 'kabupaten', label: 'Kabupaten' },
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'jarakRumah', label: 'Jarak Rumah (km)' },
  { value: 'noHp', label: 'No HP Wali' },
  { value: 'statusKeanggotaan', label: 'Status Keanggotaan' },
  { value: 'statusDomisili', label: 'Status Domisili' },
  { value: 'tanggalMasuk', label: 'Tanggal Masuk' },
  { value: 'tanggalKeluar', label: 'Tanggal Keluar' },
  { value: 'statusEmis', label: 'Status Emis' },
  { value: 'statusVerval', label: 'Status Verval' },
  { value: 'catatan', label: 'Catatan' },
];

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSantri: (newSantri: Santri) => void;
  onBulkAddSantri?: (newSantriList: Santri[]) => void;
  setIsAddSantriOpen: (val: boolean) => void;
  setToastMessage: (msg: string | null) => void;
  santriList: Santri[];
  onExportExcelXML: (filename: string, sheetName: string, headers: string[], rows: any[][]) => void;
}

export function ImportModal({
  isOpen,
  onClose,
  onAddSantri,
  onBulkAddSantri,
  setIsAddSantriOpen,
  setToastMessage,
  santriList,
  onExportExcelXML
}: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importedFileName, setImportedFileName] = useState('');
  const [importedSantri, setImportedSantri] = useState<Santri[]>([]);
  const [selectedImportMap, setSelectedImportMap] = useState<Record<number, boolean>>({});
  const [originalImportedSantri, setOriginalImportedSantri] = useState<Santri[]>([]);

  const hasUserEdits = useMemo(() => {
    if (!originalImportedSantri.length || !importedSantri.length) return false;
    if (originalImportedSantri.length !== importedSantri.length) return true;
    return importedSantri.some((item, index) => {
      const orig = originalImportedSantri[index];
      if (!orig) return true;
      const keys = Object.keys(item) as (keyof Santri)[];
      return keys.some(k => {
        if (k === 'id') return false;
        const v1 = item[k];
        const v2 = orig[k];
        const s1 = (v1 === null || v1 === undefined) ? '' : String(v1).trim();
        const s2 = (v2 === null || v2 === undefined) ? '' : String(v2).trim();
        return s1 !== s2;
      });
    });
  }, [originalImportedSantri, importedSantri]);

  // Importing States & Dynamic Filters for lightweight DOM and unresponsive script prevention
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all');
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(50);
  const [editingCell, setEditingCell] = useState<{ idx: number; field: keyof Santri } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const startEditing = (idx: number, field: keyof Santri, currentVal: any) => {
    let displayVal = String(currentVal || '');
    if ((field === 'tanggalLahir' || field === 'tanggalMasuk' || field === 'tanggalKeluar') && displayVal) {
      const matchYmd = displayVal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (matchYmd) {
        displayVal = `${matchYmd[3]}-${matchYmd[2]}-${matchYmd[1]}`;
      }
    }
    setEditingCell({ idx, field });
    setEditingValue(displayVal);
  };

  const commitEditing = () => {
    if (!editingCell) return;
    const { idx, field } = editingCell;
    const updated = [...importedSantri];
    let finalValue: any = editingValue.trim();

    // Parse date fields from DD-MM-YYYY back to YYYY-MM-DD
    if (field === 'tanggalLahir' || field === 'tanggalMasuk' || field === 'tanggalKeluar') {
      if (finalValue) {
        const matchDmy = finalValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (matchDmy) {
          const day = matchDmy[1].padStart(2, '0');
          const month = matchDmy[2].padStart(2, '0');
          const year = matchDmy[3];
          finalValue = `${year}-${month}-${day}`;
        }
      }
    }

    // Normalize Gender to Putra/Putri
    if (field === 'gender') {
      const lower = finalValue.toLowerCase();
      if (lower === 'putra' || lower === 'l' || lower === 'laki' || lower === 'laki-laki') {
        finalValue = 'Putra';
      } else if (lower === 'putri' || lower === 'p' || lower === 'perempuan') {
        finalValue = 'Putri';
      }
    }

    // Normalize Pendidikan
    if (field === 'pendidikanTerakhir' || field === 'pendidikanAyah' || field === 'pendidikanIbu') {
      finalValue = normalizePendidikan(finalValue);
    }

    // Normalize statusKeanggotaan
    if (field === 'statusKeanggotaan') {
      const lower = finalValue.toLowerCase();
      if (lower === 'aktif') {
        finalValue = 'Aktif';
      } else if (lower === 'alumni') {
        finalValue = 'Alumni';
      }
    }

    // Normalize statusDomisili
    if (field === 'statusDomisili') {
      const lower = finalValue.toLowerCase();
      if (lower === 'muqim') {
        finalValue = 'Muqim';
      } else if (lower === 'kampung') {
        finalValue = 'Kampung';
      }
    }

    updated[idx] = {
      ...updated[idx],
      [field]: finalValue
    };

    setImportedSantri(updated);
    setEditingCell(null);
  };

  const excelGridScrollRef = React.useRef<HTMLDivElement>(null);
  const [activeErrorNavIdx, setActiveErrorNavIdx] = useState<number>(-1);

  // Find & Replace States
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceField, setReplaceField] = useState<string>('all');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeCell, setMatchWholeCell] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(-1);
  const [activeMatch, setActiveMatch] = useState<{ idx: number; field: keyof Santri } | null>(null);
  const [showReplaceAdvanced, setShowReplaceAdvanced] = useState(false);
  const dragControls = useDragControls();

  const handleFindNext = () => {
    if (!findText) {
      setToastMessage("Silakan isi kolom 'Cari apa' terlebih dahulu.");
      return;
    }

    const searchableKeys = REPLACE_FIELDS.filter(f => f.value !== 'all').map(f => f.value as keyof Santri);
    const fieldsToCheck = replaceField === 'all' 
      ? searchableKeys
      : [replaceField as keyof Santri];

    const fText = matchCase ? findText : findText.toLowerCase();

    const matches: { idx: number; field: keyof Santri }[] = [];
    importedSantri.forEach((row, idx) => {
      fieldsToCheck.forEach(field => {
        const val = String(row[field] || '');
        const cellText = matchCase ? val : val.toLowerCase();

        let isMatch = false;
        if (matchWholeCell) {
          isMatch = cellText === fText;
        } else {
          isMatch = cellText.includes(fText);
        }

        if (isMatch) {
          matches.push({ idx, field });
        }
      });
    });

    if (matches.length === 0) {
      setToastMessage(`Tidak ditemukan kecocokan untuk "${findText}"`);
      setActiveMatchIdx(-1);
      setActiveMatch(null);
      return;
    }

    let nextPointer = 0;
    if (activeMatch) {
      const currIndex = matches.findIndex(m => m.idx === activeMatch.idx && m.field === activeMatch.field);
      if (currIndex !== -1) {
        nextPointer = (currIndex + 1) % matches.length;
      }
    }

    const nextMatch = matches[nextPointer];
    setActiveMatchIdx(nextPointer);
    setActiveMatch(nextMatch);

    // Scroll the matched row into view
    handleScrollToError(nextMatch.idx);
  };

  const handleReplaceOne = () => {
    if (!activeMatch) {
      handleFindNext();
      return;
    }

    const { idx, field } = activeMatch;
    const val = String(importedSantri[idx][field] || '');
    
    let newVal = val;
    if (matchWholeCell) {
      newVal = replaceText;
    } else {
      if (matchCase) {
        newVal = val.replaceAll(findText, replaceText);
      } else {
        const escapedFind = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedFind, 'gi');
        newVal = val.replace(regex, replaceText);
      }
    }

    const updated = [...importedSantri];
    updated[idx] = {
      ...updated[idx],
      [field]: newVal
    };
    setImportedSantri(updated);
    setToastMessage(`Berhasil mengganti satu kecocokan di kolom ${field}.`);

    setActiveMatch(null);
    setActiveMatchIdx(-1);

    setTimeout(() => {
      handleFindNext();
    }, 50);
  };

  const handleReplaceAll = () => {
    if (!findText) {
      setToastMessage("Silakan isi kolom 'Cari apa' terlebih dahulu.");
      return;
    }

    const searchableKeys = REPLACE_FIELDS.filter(f => f.value !== 'all').map(f => f.value as keyof Santri);
    const fieldsToCheck = replaceField === 'all' 
      ? searchableKeys
      : [replaceField as keyof Santri];

    const fText = matchCase ? findText : findText.toLowerCase();
    
    // Pre-compile regular expression once outside of the loop for case-insensitive partial replacements
    let regex: RegExp | null = null;
    if (!matchWholeCell && !matchCase) {
      const escapedFind = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      regex = new RegExp(escapedFind, 'gi');
    }

    let replaceCount = 0;
    const affectedRowIndices = new Set<number>();
    const updated = [...importedSantri];

    updated.forEach((row, idx) => {
      let rowCloned = false;
      let currentRow = row;

      fieldsToCheck.forEach(field => {
        const val = String(currentRow[field] || '');
        const cellText = matchCase ? val : val.toLowerCase();

        let isMatch = false;
        if (matchWholeCell) {
          isMatch = cellText === fText;
        } else {
          isMatch = cellText.includes(fText);
        }

        if (isMatch) {
          if (!rowCloned) {
            updated[idx] = { ...currentRow };
            currentRow = updated[idx];
            rowCloned = true;
          }

          let newVal = val;
          if (matchWholeCell) {
            newVal = replaceText;
          } else {
            if (matchCase) {
              newVal = val.replaceAll(findText, replaceText);
            } else if (regex) {
              newVal = val.replace(regex, replaceText);
            }
          }

          (currentRow as Record<string, any>)[field] = newVal;
          replaceCount++;
        }
      });

      if (rowCloned) {
        affectedRowIndices.add(idx);
      }
    });

    if (replaceCount === 0) {
      setToastMessage(`Tidak ada kecocokan yang ditemukan untuk diganti.`);
      return;
    }

    setImportedSantri(updated);
    setActiveMatch(null);
    setActiveMatchIdx(-1);
    setToastMessage(`Sukses Ganti Semua! Mengganti ${replaceCount} kecocokan di ${affectedRowIndices.size} baris.`);
  };

  // Reset visibleCount back to 50 when filter or imported data changes to maintain ultra-fast render
  useEffect(() => {
    setVisibleCount(50);
    setSelectedProblemCategory('all');
  }, [filterType, importedSantri.length]);

  const hasEmptyNis = useMemo(() => {
    return importedSantri.some(row => !row.nis || row.nis.trim() === "");
  }, [importedSantri]);

  const dbNisDuplicateCount = useMemo(() => {
    return importedSantri.filter(row => {
      if (!row.nis || row.nis.trim() === "") return false;
      return santriList.some(s => s.nis === row.nis);
    }).length;
  }, [importedSantri, santriList]);

  const handleAutoFillNis = () => {
    const updated = importedSantri.map(s => ({ ...s }));
    const yearNextSeqMap: Record<string, number> = {};

    updated.forEach((row) => {
      if (!row.nis || row.nis.trim() === "") {
        // If entry date (tanggalMasuk) is empty, do not generate NIS automatically
        if (!row.tanggalMasuk || row.tanggalMasuk.trim() === "") {
          return;
        }
        let entryYear = new Date().getFullYear().toString();
        if (row.tanggalMasuk && row.tanggalMasuk.trim() !== "") {
          const parts = row.tanggalMasuk.split('-');
          if (parts.length > 0 && parts[0].length === 4) {
            entryYear = parts[0];
          }
        }

        if (yearNextSeqMap[entryYear] === undefined) {
          const prefix = entryYear; // 4 digits year, e.g. '2026'

          const sameYearSantrisDb = (santriList || []).filter(s => {
            const sYear = s.tanggalMasuk ? s.tanggalMasuk.split('-')[0] : '';
            if (sYear === entryYear) return true;
            if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) return true;
            return false;
          });

          const dbSequences = sameYearSantrisDb
            .map(s => {
              if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) {
                const seqPart = s.nis.slice(4);
                const parsed = parseInt(seqPart, 10);
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            })
            .filter(seq => seq > 0);

          const dbMaxSeq = dbSequences.length > 0 ? Math.max(...dbSequences) : 0;

          // Also look at any manually filled/already-set NIS in the uploaded rows of the same entryYear
          const sameYearSantrisImport = updated.filter(s => {
            if (!s.nis || s.nis.trim() === "") return false;
            const sYear = s.tanggalMasuk ? s.tanggalMasuk.split('-')[0] : '';
            if (sYear === entryYear) return true;
            if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) return true;
            return false;
          });

          const importSequences = sameYearSantrisImport
            .map(s => {
              if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) {
                const seqPart = s.nis.slice(4);
                const parsed = parseInt(seqPart, 10);
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            })
            .filter(seq => seq > 0);

          const importMaxSeq = importSequences.length > 0 ? Math.max(...importSequences) : 0;

          const maxSeq = Math.max(dbMaxSeq, importMaxSeq);
          const totalCount = sameYearSantrisDb.length + sameYearSantrisImport.length;
          const initialNextSeq = Math.max(maxSeq + 1, totalCount + 1);

          yearNextSeqMap[entryYear] = initialNextSeq;
        }

        const nextSeq = yearNextSeqMap[entryYear];
        const prefix = entryYear; // 4 digits year, e.g. '2026'
        const nextSeqStr = String(nextSeq).padStart(3, '0');
        row.nis = prefix + nextSeqStr;

        // Increment for next row of same year
        yearNextSeqMap[entryYear] = nextSeq + 1;
      }
    });

    setImportedSantri(updated);
    setupInitialSelectionMap(updated);
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, importedSantri.length]);

  const handleDownloadImportTemplate = () => {
    const headers = [
      'NIS', 'Nama Lengkap', 'NISN', 'NISM', 'NIK', 'No KK', 'Tempat Lahir', 'Tanggal Lahir', 'Gender',
      'Pendidikan Terakhir', 'Anak Ke', 'Jumlah Saudara', 'Nama Ayah', 'NIK Ayah', 'Pekerjaan Ayah', 'Pendidikan Ayah',
      'Nama Ibu', 'NIK Ibu', 'Pekerjaan Ibu', 'Pendidikan Ibu', 'Alamat', 'RT', 'RW', 'Desa',
      'Kecamatan', 'Kabupaten', 'Provinsi', 'Jarak Rumah (km)', 'No HP Wali', 'Status Keanggotaan',
      'Status Domisili', 'Tanggal Masuk', 'Tanggal Keluar', 'Status Emis', 'Status Verval', 'Catatan'
    ];
    
    const rows = [
      [
        '12345', 'Ahmad Fauzi', '0091234567', '121235170001000001', '3517011203050002', '3517012508120035', 'Jombang', '14-05-2010', 'Putra',
        'SD/MI', '1', '2', 'Slamet', '3517011203050010', 'Wiraswasta', 'SLTA',
        'Siti', '3517011203050011', 'Ibu Rumah Tangga', 'SLTA', 'Jl. Raya Pesantren No. 12', '03', '01', 'Cukir',
        'Diwek', 'Jombang', 'Jawa Timur', '15', '081234567890', 'Aktif',
        'Muqim', '01-07-2024', '', 'Terdaftar', 'Sukses', 'Santri baru berprestasi'
      ],
      [
        '12346', 'Fathimah Az-Zahra', '0091234568', '121235170002000002', '3517011203050003', '3517012508120036', 'Kediri', '21-09-2011', 'Putri',
        'SMP/MTs', '2', '1', 'Umar', '3517011203050020', 'PNS', 'S1',
        'Aisyah', '3517011203050021', 'Guru', 'S1', 'Jl. Pemuda No. 45', '01', '04', 'Pare',
        'Pare', 'Kediri', 'Jawa Timur', '45', '081298765432', 'Aktif',
        'Muqim', '01-07-2024', '', 'Terdaftar', 'Proses', 'Pernah juara pidato'
      ],
      [
        '12347', 'Muhammad Akhyar', '0091234569', '121235170003000003', '3517011203050004', '3517012508120037', 'Gresik', '12-04-2010', 'Putra',
        'SD/MI', '1', '2', 'Yusuf', '3517011203050030', 'Petani', 'SD',
        'Aminah', '3517011203050031', 'Ibu Rumah Tangga', 'SLTP', 'Jl. Wahid Hasyim No. 8', '02', '02', 'Manyar',
        'Manyar', 'Gresik', 'Jawa Timur', '60', '081345678901', 'Aktif',
        'Muqim', '01-07-2024', '', 'Belum', 'Proses', ''
      ]
    ];

    onExportExcelXML('Template_Import_Santri.xls', 'Template Import Santri', headers, rows);
  };

  const parseUploadedFile = (file: File): Promise<Santri[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          if (!jsonData || jsonData.length === 0) {
            resolve([]);
            return;
          }

          // Row 0 is the headers
          const headers = (jsonData[0] || []).map(h => String(h || '').trim());
          const parsedRows: Santri[] = [];

          // Indices of important headers
          const idxNis = headers.indexOf('NIS');
          const idxNama = headers.indexOf('Nama Lengkap');
          const idxNisn = headers.indexOf('NISN');
          const idxNism = headers.indexOf('NISM');
          const idxNik = headers.indexOf('NIK');
          const idxNoKk = headers.indexOf('No KK') !== -1 ? headers.indexOf('No KK') : headers.indexOf('No. KK');
          const idxTempatLahir = headers.indexOf('Tempat Lahir');
          const idxTanggalLahir = headers.indexOf('Tanggal Lahir');
          const idxGender = headers.indexOf('Gender');
          const idxPendidikanTerakhir = headers.indexOf('Pendidikan Terakhir');
          const idxAnakKe = headers.indexOf('Anak Ke');
          const idxDariBersaudara = headers.indexOf('Jumlah Saudara') !== -1 ? headers.indexOf('Jumlah Saudara') : headers.indexOf('Dari Bersaudara');
          const idxAyah = headers.indexOf('Nama Ayah') !== -1 ? headers.indexOf('Nama Ayah') : headers.indexOf('Ayah');
          const idxNikAyah = headers.indexOf('NIK Ayah');
          const idxPekerjaanAyah = headers.indexOf('Pekerjaan Ayah');
          const idxPendidikanAyah = headers.indexOf('Pendidikan Ayah');
          const idxIbu = headers.indexOf('Nama Ibu') !== -1 ? headers.indexOf('Nama Ibu') : headers.indexOf('Ibu');
          const idxNikIbu = headers.indexOf('NIK Ibu');
          const idxPekerjaanIbu = headers.indexOf('Pekerjaan Ibu');
          const idxPendidikanIbu = headers.indexOf('Pendidikan Ibu');
          const idxAlamat = headers.indexOf('Alamat');
          const idxRt = headers.indexOf('RT');
          const idxRw = headers.indexOf('RW');
          const idxDesa = headers.indexOf('Desa');
          const idxKecamatan = headers.indexOf('Kecamatan');
          const idxKabupaten = headers.indexOf('Kabupaten');
          const idxProvinsi = headers.indexOf('Provinsi');
          const idxJarakRumah = headers.indexOf('Jarak Rumah (km)') !== -1 ? headers.indexOf('Jarak Rumah (km)') : headers.indexOf('Jarak Rumah');
          const idxNoHp = headers.indexOf('No HP Wali') !== -1 ? headers.indexOf('No HP Wali') : (headers.indexOf('No HP') !== -1 ? headers.indexOf('No HP') : headers.indexOf('Nomor HP'));
          const idxStatusKeanggotaan = headers.indexOf('Status Keanggotaan');
          const idxStatusDomisili = headers.indexOf('Status Domisili');
          const idxStatusHidup = headers.indexOf('Status Hidup');
          const idxStatusEmis = headers.indexOf('Status Emis');
          const idxStatusVerval = headers.indexOf('Status Verval');
          const idxKelas = headers.indexOf('Kelas');
          const idxKamar = headers.indexOf('Kamar');
          const idxTanggalMasuk = headers.indexOf('Tanggal Masuk');
          const idxTanggalKeluar = headers.indexOf('Tanggal Keluar');
          const idxCatatan = headers.indexOf('Catatan');

          for (let r = 1; r < jsonData.length; r++) {
            const cellValues = jsonData[r];
            if (!cellValues || cellValues.length === 0) continue;

            const getVal = (idx: number, def = '') => {
              if (idx === -1 || idx >= cellValues.length) return def;
              const val = cellValues[idx];
              return val !== undefined && val !== null ? String(val).trim() : def;
            };

            const rawTanggalMasuk = getVal(idxTanggalMasuk);
            const isTanggalMasukEmpty = !rawTanggalMasuk || rawTanggalMasuk.trim() === "";

            const nis = getVal(idxNis);
            const nama = getVal(idxNama);

            // Skip completely empty rows
            if (!nama && !nis && !rawTanggalMasuk) {
              let isRowEmpty = true;
              for (let i = 0; i < cellValues.length; i++) {
                if (cellValues[i] !== undefined && cellValues[i] !== null && String(cellValues[i]).trim() !== "") {
                  isRowEmpty = false;
                  break;
                }
              }
              if (isRowEmpty) continue;
            }

            const nisn = getVal(idxNisn);
            const nism = getVal(idxNism);
            const nik = getVal(idxNik);
            const noKk = getVal(idxNoKk);
            const tempatLahir = getVal(idxTempatLahir);
            const tanggalLahir = convertToStandardDate(getVal(idxTanggalLahir));
            const rawGender = getVal(idxGender).trim().toLowerCase();
            const gender = (rawGender === 'putra') ? 'Putra' : (rawGender === 'putri' ? 'Putri' : (getVal(idxGender) || '') as any);
            const pendidikanTerakhir = normalizePendidikan(getVal(idxPendidikanTerakhir));
            const rawAnakKe = getVal(idxAnakKe);
            const anakKe = rawAnakKe ? (isNaN(parseInt(rawAnakKe, 10)) ? undefined : parseInt(rawAnakKe, 10)) : undefined;
            const rawDariBersaudara = getVal(idxDariBersaudara);
            const dariBersaudara = rawDariBersaudara ? (isNaN(parseInt(rawDariBersaudara, 10)) ? undefined : parseInt(rawDariBersaudara, 10)) : undefined;
            const namaAyah = getVal(idxAyah);
            const nikAyah = getVal(idxNikAyah);
            const pekerjaanAyah = getVal(idxPekerjaanAyah) || '';
            const pendidikanAyah = normalizePendidikan(getVal(idxPendidikanAyah));
            const namaIbu = getVal(idxIbu);
            const nikIbu = getVal(idxNikIbu);
            const pekerjaanIbu = getVal(idxPekerjaanIbu) || '';
            const pendidikanIbu = normalizePendidikan(getVal(idxPendidikanIbu));
            const alamat = getVal(idxAlamat);
            const rt = getVal(idxRt);
            const rw = getVal(idxRw);
            const desa = getVal(idxDesa);
            const kecamatan = getVal(idxKecamatan);
            const kabupaten = getVal(idxKabupaten);
            const provinsi = getVal(idxProvinsi);
            const rawJarakRumah = getVal(idxJarakRumah);
            const jarakRumah = rawJarakRumah ? (isNaN(parseFloat(rawJarakRumah)) ? undefined : parseFloat(rawJarakRumah)) : undefined;
            const noHp = getVal(idxNoHp);
            const rawStatusKeanggotaan = getVal(idxStatusKeanggotaan).trim();
            const skL = rawStatusKeanggotaan.toLowerCase();
            const statusKeanggotaan = (
              skL === 'aktif' ? 'Aktif' :
              skL === 'alumni' ? 'Alumni' :
              skL === 'meninggal' ? 'Meninggal' :
              rawStatusKeanggotaan
            ) as any;

            const rawStatusDomisili = getVal(idxStatusDomisili).trim();
            const sdL = rawStatusDomisili.toLowerCase();
            let statusDomisili = (
              sdL === 'muqim' ? 'Muqim' :
              sdL === 'kampung' ? 'Kampung' :
              sdL === '' ? undefined :
              rawStatusDomisili
            ) as any;

            if (statusKeanggotaan !== 'Aktif') {
              statusDomisili = undefined;
            }

            const rawStatusEmis = getVal(idxStatusEmis).trim();
            const seL = rawStatusEmis.toLowerCase();
            const statusEmis = (
              seL === 'terdaftar' ? 'Terdaftar' :
              seL === 'belum' ? 'Belum' :
              rawStatusEmis === '' ? 'Belum' :
              rawStatusEmis
            ) as any;

            const rawStatusVerval = getVal(idxStatusVerval).trim();
            const svL = rawStatusVerval.toLowerCase();
            const statusVerval = (
              svL === 'sukses' ? 'Sukses' :
              svL === 'proses' ? 'Proses' :
              'Proses'
            ) as any;

            const kelas = getVal(idxKelas) || 'Tanpa Kelas';
            const kamar = getVal(idxKamar) || 'Tanpa Kamar';
            const tanggalMasuk = isTanggalMasukEmpty ? "" : (convertToStandardDate(rawTanggalMasuk) || "");
            const tanggalKeluar = getVal(idxTanggalKeluar) ? convertToStandardDate(getVal(idxTanggalKeluar)) : undefined;
            const catatan = getVal(idxCatatan) || undefined;

            parsedRows.push({
              id: `S${Date.now()}_${r}`,
              nis,
              nama,
              kelas,
              kamar,
              asal: kabupaten && provinsi ? `${kabupaten}, ${provinsi}` : (kabupaten || provinsi || 'Jombang, Jawa Timur'),
              gender: gender as 'Putra' | 'Putri',
              tanggalMasuk,
              pendidikanTerakhir,
              nisn,
              nism,
              nik,
              noKk,
              tempatLahir,
              tanggalLahir,
              anakKe,
              dariBersaudara,
              namaAyah,
              nikAyah,
              pekerjaanAyah,
              pendidikanAyah,
              namaIbu,
              nikIbu,
              pekerjaanIbu,
              pendidikanIbu,
              alamat,
              rt,
              rw,
              desa,
              kecamatan,
              kabupaten,
              provinsi,
              jarakRumah,
              noHp,
              statusKeanggotaan,
              statusDomisili,
              statusEmis,
              statusVerval,
              tanggalKeluar,
              catatan,
              fileKk: undefined,
              fileKtp: undefined,
              fileAkta: undefined,
              fileIjazah: undefined,
              filePasFoto: undefined
            });
          }

          resolve(parsedRows);
        } catch (err) {
          console.error("Error parsing spreadsheet file via SheetJS:", err);
          resolve([]);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImportedFileName(file.name);
      const rows = await parseUploadedFile(file);
      setImportedSantri(rows);
      setOriginalImportedSantri(JSON.parse(JSON.stringify(rows)));
      setupInitialSelectionMap(rows);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportedFileName(file.name);
      const rows = await parseUploadedFile(file);
      setImportedSantri(rows);
      setOriginalImportedSantri(JSON.parse(JSON.stringify(rows)));
      setupInitialSelectionMap(rows);
    }
    e.target.value = '';
  };

  const setupInitialSelectionMap = (rows: Santri[]) => {
    const initialMap: Record<number, boolean> = {};
    const seenNis = new Set<string>();
    const seenNik = new Set<string>();

    // Count occurrences of NIK in the entire imported file to detect duplicates upfront
    const fileNikCounts: Record<string, number> = {};
    rows.forEach(row => {
      const rowNik = row.nik ? String(row.nik).trim() : "";
      if (rowNik) {
        fileNikCounts[rowNik] = (fileNikCounts[rowNik] || 0) + 1;
      }
    });

    rows.forEach((row, idx) => {
      let hasCriticalError = false;
      
      if (!row.nama || row.nama.trim() === "") hasCriticalError = true;
      
      if (!row.gender || row.gender.trim() === "") {
        hasCriticalError = true;
      } else if (row.gender !== 'Putra' && row.gender !== 'Putri') {
        hasCriticalError = true;
      }
      
      // NIS is no longer a critical error if it's already in the database because it will be adjusted automatically during import.
      
      if (row.tanggalLahir && row.tanggalLahir.trim() !== "") {
        if (!isValidDateFormat(row.tanggalLahir)) hasCriticalError = true;
      }
      
      if (row.noHp && row.noHp.trim() !== "") {
        if (!/^\+?\d+$/.test(row.noHp)) hasCriticalError = true;
      }

      if (row.rt && row.rt.trim() !== "") {
        if (!/^\d+$/.test(row.rt)) hasCriticalError = true;
      }
      
      if (row.rw && row.rw.trim() !== "") {
        if (!/^\d+$/.test(row.rw)) hasCriticalError = true;
      }
      
      if (row.nik && row.nik.trim() !== "") {
        const rowNik = row.nik.trim();
        if (!/^\d+$/.test(rowNik) || rowNik.length !== 16) hasCriticalError = true;
        if (santriList.some(s => s.nik === row.nik)) hasCriticalError = true;
        if (fileNikCounts[rowNik] > 1) hasCriticalError = true;
      }
      
      if (row.noKk && row.noKk.trim() !== "") {
        if (!/^\d+$/.test(row.noKk) || row.noKk.length !== 16) hasCriticalError = true;
      }

      if (row.nis && row.nis.trim() !== "") {
        if (!/^\d+$/.test(row.nis) || row.nis.length !== 7) hasCriticalError = true;
      }

      if (row.nisn && row.nisn.trim() !== "") {
        if (!/^\d+$/.test(row.nisn) || row.nisn.length !== 10) hasCriticalError = true;
      }

      if (row.nism && row.nism.trim() !== "") {
        if (!/^\d+$/.test(row.nism) || row.nism.length !== 18) hasCriticalError = true;
      }

      if (row.nikAyah && row.nikAyah.trim() !== "") {
        if (!/^\d+$/.test(row.nikAyah) || row.nikAyah.length !== 16) hasCriticalError = true;
      }

      if (row.nikIbu && row.nikIbu.trim() !== "") {
        if (!/^\d+$/.test(row.nikIbu) || row.nikIbu.length !== 16) hasCriticalError = true;
      }
      
      if (row.tanggalMasuk && row.tanggalMasuk.trim() !== "") {
        if (!isValidDateFormat(row.tanggalMasuk)) {
          hasCriticalError = true;
        }
      }
      
      if (row.tanggalKeluar && row.tanggalKeluar.trim() !== "") {
        if (!isValidDateFormat(row.tanggalKeluar)) {
          hasCriticalError = true;
        }
      }

      let skLower = "";
      if (!row.statusKeanggotaan || row.statusKeanggotaan.trim() === "") {
        hasCriticalError = true;
      } else {
        skLower = row.statusKeanggotaan.trim().toLowerCase();
        if (skLower !== 'aktif' && skLower !== 'alumni' && skLower !== 'meninggal') {
          hasCriticalError = true;
        }
      }

      const sdLower = (row.statusDomisili || "").trim().toLowerCase();
      if (skLower === 'aktif') {
        if (sdLower !== 'muqim' && sdLower !== 'kampung') {
          hasCriticalError = true;
        }
      } else {
        if (sdLower !== "") {
          hasCriticalError = true;
        }
      }

      const seLower = (row.statusEmis || "").trim().toLowerCase();
      if (seLower !== "terdaftar" && seLower !== "belum") {
        hasCriticalError = true;
      }

      // statusVerval validation removed

      if (hasCriticalError) {
        initialMap[idx] = false;
      } else {
        const isNisDupe = row.nis && row.nis.trim() !== "" ? seenNis.has(row.nis) : false;
        const isNikDupe = row.nik && row.nik.trim() !== "" ? (seenNik.has(row.nik) || fileNikCounts[row.nik.trim()] > 1) : false;

        if (isNisDupe || isNikDupe) {
          initialMap[idx] = false;
        } else {
          initialMap[idx] = true;
          if (row.nis && row.nis.trim() !== "") seenNis.add(row.nis);
          if (row.nik && row.nik.trim() !== "") seenNik.add(row.nik);
        }
      }
    });
    setSelectedImportMap(initialMap);
  };

  const dynamicValidationResults = useMemo(() => {
    // Pre-build database lookup Sets for O(1) checks!
    const dbNisSet = new Set(santriList.map(s => s.nis ? String(s.nis).trim() : "").filter(Boolean));
    const dbNikSet = new Set(santriList.map(s => s.nik ? String(s.nik).trim() : "").filter(Boolean));

    // Pre-build counts of NIK in the entire file
    const fileNikCounts: Record<string, number> = {};
    importedSantri.forEach((row) => {
      const rowNik = row.nik ? String(row.nik).trim() : "";
      if (rowNik) {
        fileNikCounts[rowNik] = (fileNikCounts[rowNik] || 0) + 1;
      }
    });

    // Pre-build counts of NIS and NIK in selectedImportMap to avoid O(M) nested loop per row!
    const selectedNisCounts: Record<string, number> = {};
    const selectedNikCounts: Record<string, number> = {};

    importedSantri.forEach((row, idx) => {
      if (selectedImportMap[idx]) {
        const rowNis = row.nis ? String(row.nis).trim() : "";
        const rowNik = row.nik ? String(row.nik).trim() : "";
        if (rowNis) selectedNisCounts[rowNis] = (selectedNisCounts[rowNis] || 0) + 1;
        if (rowNik) selectedNikCounts[rowNik] = (selectedNikCounts[rowNik] || 0) + 1;
      }
    });

    return importedSantri.map((row, idx) => {
      const errors: Record<string, string> = {};
      const criticalErrors: Record<string, string> = {};
      const fileDuplicateErrors: Record<string, string> = {};

      if (!row.nama || row.nama.trim() === "") criticalErrors.nama = "Nama Lengkap wajib diisi";
      if (!row.gender || row.gender.trim() === "") {
        criticalErrors.gender = "Gender wajib diisi (Putra/Putri)";
      } else if (row.gender !== 'Putra' && row.gender !== 'Putri') {
        criticalErrors.gender = "Gender harus 'Putra' atau 'Putri'";
      }
      if (row.tanggalLahir && row.tanggalLahir.trim() !== "") {
        if (!isValidDateFormat(row.tanggalLahir)) {
          criticalErrors.tanggalLahir = "Format Tanggal Lahir salah (harus DD-MM-YYYY atau YYYY-MM-DD)";
        }
      }
      if (row.noHp && row.noHp.trim() !== "") {
        if (!/^\+?\d+$/.test(row.noHp)) {
          criticalErrors.noHp = "No HP harus berupa angka";
        }
      }

      if (row.rt && row.rt.trim() !== "") {
        if (!/^\d+$/.test(row.rt)) {
          criticalErrors.rt = "RT harus berupa angka (tidak boleh ada huruf)";
        }
      }
      if (row.rw && row.rw.trim() !== "") {
        if (!/^\d+$/.test(row.rw)) {
          criticalErrors.rw = "RW harus berupa angka (tidak boleh ada huruf)";
        }
      }
      if (row.nik && row.nik.trim() !== "") {
        const rowNik = row.nik.trim();
        if (!/^\d+$/.test(rowNik)) {
          criticalErrors.nik = "NIK harus berupa angka (tidak boleh ada huruf)";
        } else if (rowNik.length !== 16) {
          criticalErrors.nik = `NIK harus tepat 16 digit (terdeteksi ${rowNik.length} digit)`;
        } else if (dbNikSet.has(rowNik)) {
          criticalErrors.nik = "NIK sudah terdaftar di database aplikasi";
        } else if (fileNikCounts[rowNik] > 1) {
          criticalErrors.nik = `NIK ganda dalam file import (${fileNikCounts[rowNik]} kali muncul). Keduanya/semuanya tidak dapat dipilih.`;
        }
      }
      if (row.noKk && row.noKk.trim() !== "") {
        if (!/^\d+$/.test(row.noKk)) {
          criticalErrors.noKk = "No KK harus berupa angka (tidak boleh ada huruf)";
        } else if (row.noKk.length !== 16) {
          criticalErrors.noKk = `No KK harus tepat 16 digit (terdeteksi ${row.noKk.length} digit)`;
        }
      }

      if (row.nis && row.nis.trim() !== "") {
        if (!/^\d+$/.test(row.nis)) {
          criticalErrors.nis = "NIS harus berupa angka (tidak boleh ada huruf)";
        } else if (row.nis.length !== 7) {
          criticalErrors.nis = `NIS harus tepat 7 digit (terdeteksi ${row.nis.length} digit)`;
        }
      }

      if (row.nisn && row.nisn.trim() !== "") {
        if (!/^\d+$/.test(row.nisn)) {
          criticalErrors.nisn = "NISN harus berupa angka (tidak boleh ada huruf)";
        } else if (row.nisn.length !== 10) {
          criticalErrors.nisn = `NISN harus tepat 10 digit (terdeteksi ${row.nisn.length} digit)`;
        }
      }

      if (row.nism && row.nism.trim() !== "") {
        if (!/^\d+$/.test(row.nism)) {
          criticalErrors.nism = "NISM harus berupa angka (tidak boleh ada huruf)";
        } else if (row.nism.length !== 18) {
          criticalErrors.nism = `NISM harus tepat 18 digit (terdeteksi ${row.nism.length} digit)`;
        }
      }

      if (row.nikAyah && row.nikAyah.trim() !== "") {
        if (!/^\d+$/.test(row.nikAyah)) {
          criticalErrors.nikAyah = "NIK Ayah harus berupa angka (tidak boleh ada huruf)";
        } else if (row.nikAyah.length !== 16) {
          criticalErrors.nikAyah = `NIK Ayah harus tepat 16 digit (terdeteksi ${row.nikAyah.length} digit)`;
        }
      }

      if (row.nikIbu && row.nikIbu.trim() !== "") {
        if (!/^\d+$/.test(row.nikIbu)) {
          criticalErrors.nikIbu = "NIK Ibu harus berupa angka (tidak boleh ada huruf)";
        } else if (row.nikIbu.length !== 16) {
          criticalErrors.nikIbu = `NIK Ibu harus tepat 16 digit (terdeteksi ${row.nikIbu.length} digit)`;
        }
      }

      if (row.tanggalMasuk && row.tanggalMasuk.trim() !== "") {
        if (!isValidDateFormat(row.tanggalMasuk)) {
          criticalErrors.tanggalMasuk = "Format Tanggal Masuk salah (harus DD-MM-YYYY atau YYYY-MM-DD)";
        }
      }
      if (row.tanggalKeluar && row.tanggalKeluar.trim() !== "") {
        if (!isValidDateFormat(row.tanggalKeluar)) {
          criticalErrors.tanggalKeluar = "Format Tanggal Keluar salah (harus DD-MM-YYYY atau YYYY-MM-DD)";
        }
      }

      let skLower = "";
      if (!row.statusKeanggotaan || row.statusKeanggotaan.trim() === "") {
        criticalErrors.statusKeanggotaan = "Status Keanggotaan wajib diisi (Aktif/Alumni/Meninggal)";
      } else {
        skLower = row.statusKeanggotaan.trim().toLowerCase();
        if (skLower !== 'aktif' && skLower !== 'alumni' && skLower !== 'meninggal') {
          criticalErrors.statusKeanggotaan = "Status Keanggotaan harus 'Aktif', 'Alumni', atau 'Meninggal'";
        }
      }

      const sdLower = (row.statusDomisili || "").trim().toLowerCase();
      if (skLower === 'aktif') {
        if (sdLower !== 'muqim' && sdLower !== 'kampung') {
          criticalErrors.statusDomisili = "Untuk Status Keanggotaan 'Aktif', Status Domisili harus diisi 'Muqim' atau 'Kampung'";
        }
      } else if (skLower === 'alumni' || skLower === 'meninggal') {
        if (sdLower !== "") {
          criticalErrors.statusDomisili = `Untuk Status Keanggotaan '${row.statusKeanggotaan}', Status Domisili harus kosong`;
        }
      }

      const seLower = (row.statusEmis || "").trim().toLowerCase();
      if (seLower !== "terdaftar" && seLower !== "belum") {
        criticalErrors.statusEmis = "Status Emis harus 'Terdaftar' atau 'Belum'";
      }

      const svLower = (row.statusVerval || "").trim().toLowerCase();
      if (svLower && svLower !== "sukses" && svLower !== "proses") {
        criticalErrors.statusVerval = "Status Verval harus 'Sukses' atau 'Proses'";
      }

      const warnings: Record<string, string> = {};

      if (row.nis && row.nis.trim() !== "") {
        const rowNis = row.nis.trim();
        if (dbNisSet.has(rowNis)) {
          warnings.nis = "NIS sudah terdaftar, akan disesuaikan otomatis saat import";
        }
      }

      if (selectedImportMap[idx]) {
        if (row.nis && row.nis.trim() !== "") {
          const rowNis = row.nis.trim();
          if ((selectedNisCounts[rowNis] || 0) > 1) {
            warnings.nis = "NIS ganda, akan disesuaikan otomatis saat import";
          }
        }
        if (row.nik && row.nik.trim() !== "") {
          const rowNik = row.nik.trim();
          if ((selectedNikCounts[rowNik] || 0) > 1) {
            fileDuplicateErrors.nik = "NIK ganda dalam file import (keduanya dichecklist)";
          }
        }
      }

      const allErrors = { ...criticalErrors, ...fileDuplicateErrors, ...warnings };

      return {
        rowNum: idx + 2,
        hasCriticalError: Object.keys(criticalErrors).length > 0,
        hasFileDuplicateError: Object.keys(fileDuplicateErrors).length > 0,
        isValid: Object.keys(criticalErrors).length === 0 && Object.keys(fileDuplicateErrors).length === 0,
        errors: allErrors,
        criticalErrors,
        fileDuplicateErrors
      };
    });
  }, [importedSantri, selectedImportMap, santriList]);

  const problemCategories = useMemo(() => {
    const categories = [
      { id: 'all', label: 'Semua Masalah', matcher: (errors: Record<string, string>) => Object.keys(errors).length > 0 },
      { id: 'nama_empty', label: 'Nama Lengkap Kosong', matcher: (errors: Record<string, string>) => !!errors.nama },
      { id: 'gender_invalid', label: 'Gender Kosong / Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.gender },
      { id: 'nis_registered', label: 'NIS Sudah Terdaftar di DB', matcher: (errors: Record<string, string>) => !!errors.nis && errors.nis.includes('terdaftar') },
      { id: 'nis_duplicate', label: 'NIS Ganda (Ceklis)', matcher: (errors: Record<string, string>) => !!errors.nis && errors.nis.includes('ganda') },
      { id: 'nik_not_number', label: 'NIK Bukan Angka (Siswa/Ortu)', matcher: (errors: Record<string, string>) => 
        (!!errors.nik && errors.nik.includes('angka')) || 
        (!!errors.nikAyah && errors.nikAyah.includes('angka')) || 
        (!!errors.nikIbu && errors.nikIbu.includes('angka')) 
      },
      { id: 'nik_invalid_length', label: 'NIK Bukan 16 Digit (Siswa/Ortu)', matcher: (errors: Record<string, string>) => 
        (!!errors.nik && errors.nik.includes('16 digit')) || 
        (!!errors.nikAyah && errors.nikAyah.includes('16 digit')) || 
        (!!errors.nikIbu && errors.nikIbu.includes('16 digit')) 
      },
      { id: 'nik_registered', label: 'NIK Sudah Terdaftar di DB', matcher: (errors: Record<string, string>) => !!errors.nik && errors.nik.includes('terdaftar') },
      { id: 'nik_duplicate', label: 'NIK Ganda dalam Berkas', matcher: (errors: Record<string, string>) => !!errors.nik && errors.nik.includes('ganda') },
      { id: 'noKk_not_number', label: 'No KK Bukan Angka', matcher: (errors: Record<string, string>) => !!errors.noKk && errors.noKk.includes('angka') },
      { id: 'noKk_invalid_length', label: 'No KK Bukan 16 Digit', matcher: (errors: Record<string, string>) => !!errors.noKk && errors.noKk.includes('16 digit') },
      { id: 'nisn_not_number', label: 'NISN Bukan Angka', matcher: (errors: Record<string, string>) => !!errors.nisn && errors.nisn.includes('angka') },
      { id: 'nisn_invalid_length', label: 'NISN Bukan 10 Digit', matcher: (errors: Record<string, string>) => !!errors.nisn && errors.nisn.includes('10 digit') },
      { id: 'nism_not_number', label: 'NISM Bukan Angka', matcher: (errors: Record<string, string>) => !!errors.nism && errors.nism.includes('angka') },
      { id: 'nism_invalid_length', label: 'NISM Bukan 18 Digit', matcher: (errors: Record<string, string>) => !!errors.nism && errors.nism.includes('18 digit') },
      { id: 'tanggalLahir_invalid', label: 'Format Tanggal Lahir Salah', matcher: (errors: Record<string, string>) => !!errors.tanggalLahir },
      { id: 'tanggalMasuk_invalid', label: 'Format Tanggal Masuk Salah', matcher: (errors: Record<string, string>) => !!errors.tanggalMasuk },
      { id: 'tanggalKeluar_invalid', label: 'Format Tanggal Keluar Salah', matcher: (errors: Record<string, string>) => !!errors.tanggalKeluar },
      { id: 'rtrw_invalid', label: 'Format RT/RW Bukan Angka', matcher: (errors: Record<string, string>) => !!errors.rt || !!errors.rw },
      { id: 'noHp_invalid', label: 'No HP Wali Bukan Angka', matcher: (errors: Record<string, string>) => !!errors.noHp },
      { id: 'anakKe_invalid', label: 'Urutan Anak Ke Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.anakKe },
      { id: 'statusKeanggotaan_invalid', label: 'Status Keanggotaan Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.statusKeanggotaan },
      { id: 'statusDomisili_invalid', label: 'Status Domisili Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.statusDomisili },
      { id: 'statusEmis_invalid', label: 'Status Emis Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.statusEmis },
      { id: 'statusVerval_invalid', label: 'Status Verval Tidak Valid', matcher: (errors: Record<string, string>) => !!errors.statusVerval }
    ];

    // Count occurrences for each category from the invalid rows
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = 0;
    });

    importedSantri.forEach((row, idx) => {
      const valResult = dynamicValidationResults[idx];
      if (valResult && !valResult.isValid) {
        counts['all']++;
        categories.forEach(cat => {
          if (cat.id !== 'all') {
            const isMatch = cat.matcher(valResult.errors);
            if (isMatch) {
              counts[cat.id]++;
            }
          }
        });
      }
    });

    return categories
      .map(cat => ({
        ...cat,
        count: counts[cat.id] || 0
      }))
      .filter(cat => cat.id === 'all' || cat.count > 0); // Only show categories with actual errors or 'all'
  }, [importedSantri, dynamicValidationResults]);

  const checkedAndInvalidIndices = useMemo(() => {
    const indices: number[] = [];
    importedSantri.forEach((_, idx) => {
      if (selectedImportMap[idx] && !dynamicValidationResults[idx]?.isValid) {
        indices.push(idx);
      }
    });
    return indices;
  }, [importedSantri, selectedImportMap, dynamicValidationResults]);

  const handleScrollToError = (targetIdx: number) => {
    if (targetIdx === -1) return;
    
    // Find relative position in filteredSantriWithIndices
    const relativeIdx = filteredSantriWithIndices.findIndex(item => item.originalIndex === targetIdx);
    if (relativeIdx === -1) {
      // If it's not currently visible due to filterType, change filterType to 'all' or 'invalid'
      if (filterType === 'valid') {
        setFilterType('all');
      }
      setTimeout(() => {
        const newRelativeIdx = filteredSantriWithIndices.findIndex(item => item.originalIndex === targetIdx);
        if (newRelativeIdx !== -1) {
          if (newRelativeIdx >= visibleCount) {
            setVisibleCount(newRelativeIdx + 50);
          }
          setTimeout(() => {
            const rowEl = excelGridScrollRef.current?.querySelector(`[data-row-index="${targetIdx}"]`);
            if (rowEl) {
              rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              rowEl.classList.add('bg-rose-200/50');
              setTimeout(() => {
                rowEl.classList.remove('bg-rose-200/50');
              }, 1500);
            }
          }, 100);
        }
      }, 50);
      return;
    }

    if (relativeIdx >= visibleCount) {
      setVisibleCount(relativeIdx + 50);
    }

    setTimeout(() => {
      const rowEl = excelGridScrollRef.current?.querySelector(`[data-row-index="${targetIdx}"]`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowEl.classList.add('bg-rose-200/50');
        setTimeout(() => {
          rowEl.classList.remove('bg-rose-200/50');
        }, 1500);
      }
    }, 100);
  };

  const handleNavErrorPrev = () => {
    if (checkedAndInvalidIndices.length === 0) return;
    let nextPointer = checkedAndInvalidIndices.indexOf(activeErrorNavIdx) - 1;
    if (nextPointer < 0) {
      nextPointer = checkedAndInvalidIndices.length - 1;
    }
    const targetIdx = checkedAndInvalidIndices[nextPointer];
    setActiveErrorNavIdx(targetIdx);
    handleScrollToError(targetIdx);
  };

  const handleNavErrorNext = () => {
    if (checkedAndInvalidIndices.length === 0) return;
    let nextPointer = checkedAndInvalidIndices.indexOf(activeErrorNavIdx) + 1;
    if (nextPointer >= checkedAndInvalidIndices.length || nextPointer < 0) {
      nextPointer = 0;
    }
    const targetIdx = checkedAndInvalidIndices[nextPointer];
    setActiveErrorNavIdx(targetIdx);
    handleScrollToError(targetIdx);
  };

  useEffect(() => {
    if (checkedAndInvalidIndices.length > 0) {
      if (!checkedAndInvalidIndices.includes(activeErrorNavIdx)) {
        setActiveErrorNavIdx(checkedAndInvalidIndices[0]);
      }
    } else {
      setActiveErrorNavIdx(-1);
    }
  }, [checkedAndInvalidIndices, activeErrorNavIdx]);

  const handleExportInvalidData = () => {
    const headers = [
      'NIS', 'Nama Lengkap', 'NISN', 'NISM', 'NIK', 'No KK', 'Tempat Lahir', 'Tanggal Lahir', 'Gender',
      'Pendidikan Terakhir', 'Anak Ke', 'Jumlah Saudara', 'Nama Ayah', 'NIK Ayah', 'Pekerjaan Ayah', 'Pendidikan Ayah',
      'Nama Ibu', 'NIK Ibu', 'Pekerjaan Ibu', 'Pendidikan Ibu', 'Alamat', 'RT', 'RW', 'Desa',
      'Kecamatan', 'Kabupaten', 'Provinsi', 'Jarak Rumah (km)', 'No HP Wali', 'Status Keanggotaan',
      'Status Domisili', 'Tanggal Masuk', 'Tanggal Keluar', 'Status Emis', 'Status Verval', 'Catatan', 'Keterangan Masalah'
    ];

    const fieldsToExport: (keyof Santri)[] = [
      'nis', 'nama', 'nisn', 'nism', 'nik', 'noKk', 'tempatLahir', 'tanggalLahir', 'gender',
      'pendidikanTerakhir', 'anakKe', 'dariBersaudara', 'namaAyah', 'nikAyah', 'pekerjaanAyah', 'pendidikanAyah',
      'namaIbu', 'nikIbu', 'pekerjaanIbu', 'pendidikanIbu', 'alamat', 'rt', 'rw', 'desa',
      'kecamatan', 'kabupaten', 'provinsi', 'jarakRumah', 'noHp', 'statusKeanggotaan',
      'statusDomisili', 'tanggalMasuk', 'tanggalKeluar', 'statusEmis', 'statusVerval', 'catatan'
    ];

    const invalidRowsToExport = importedSantri
      .map((row, idx) => ({ row, idx }))
      .filter(({ idx }) => {
        const val = dynamicValidationResults[idx];
        if (!val || val.isValid) return false;

        if (selectedProblemCategory === 'all') return true;
        const currentCat = problemCategories.find(c => c.id === selectedProblemCategory);
        if (currentCat && currentCat.matcher) {
          return currentCat.matcher(val.errors);
        }
        return true;
      });

    const exportRows = invalidRowsToExport.map(({ row, idx }) => {
      const val = dynamicValidationResults[idx];
      const errorMsgString = Object.entries(val?.errors || {})
        .map(([field, msg]) => `[${field}] ${msg}`)
        .join('; ');

      // Format date values to DD-MM-YYYY for Excel
      const formatExcelDate = (dStr: string) => {
        if (!dStr) return '';
        const match = dStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        return dStr;
      };

      const cells = fieldsToExport.map((field) => {
        let cellVal = String(row[field] || '');
        if (field === 'tanggalLahir' || field === 'tanggalMasuk' || field === 'tanggalKeluar') {
          cellVal = formatExcelDate(cellVal);
        }

        const hasError = val?.errors && !!val.errors[field as string];
        if (hasError) {
          return { value: cellVal, isProblem: true };
        }
        return cellVal;
      });

      // Add the last column 'Keterangan Masalah' which is colored pink as well since it contains the issues description
      if (errorMsgString) {
        cells.push({ value: errorMsgString, isProblem: true } as any);
      } else {
        cells.push('' as any);
      }

      return cells;
    });

    const suffix = selectedProblemCategory !== 'all' ? `_${selectedProblemCategory}` : '';
    onExportExcelXML(`Data_Bermasalah${suffix}.xls`, 'Data Bermasalah', headers, exportRows as any);
    setToastMessage(`Berhasil mengekspor ${exportRows.length} baris bermasalah.`);
  };

  const handleExportEditedData = () => {
    const headers = [
      'NIS', 'Nama Lengkap', 'NISN', 'NISM', 'NIK', 'No KK', 'Tempat Lahir', 'Tanggal Lahir', 'Gender',
      'Pendidikan Terakhir', 'Anak Ke', 'Jumlah Saudara', 'Nama Ayah', 'NIK Ayah', 'Pekerjaan Ayah', 'Pendidikan Ayah',
      'Nama Ibu', 'NIK Ibu', 'Pekerjaan Ibu', 'Pendidikan Ibu', 'Alamat', 'RT', 'RW', 'Desa',
      'Kecamatan', 'Kabupaten', 'Provinsi', 'Jarak Rumah (km)', 'No HP Wali', 'Status Keanggotaan',
      'Status Domisili', 'Tanggal Masuk', 'Tanggal Keluar', 'Status Emis', 'Status Verval', 'Catatan'
    ];

    const fieldsToExport: (keyof Santri)[] = [
      'nis', 'nama', 'nisn', 'nism', 'nik', 'noKk', 'tempatLahir', 'tanggalLahir', 'gender',
      'pendidikanTerakhir', 'anakKe', 'dariBersaudara', 'namaAyah', 'nikAyah', 'pekerjaanAyah', 'pendidikanAyah',
      'namaIbu', 'nikIbu', 'pekerjaanIbu', 'pendidikanIbu', 'alamat', 'rt', 'rw', 'desa',
      'kecamatan', 'kabupaten', 'provinsi', 'jarakRumah', 'noHp', 'statusKeanggotaan',
      'statusDomisili', 'tanggalMasuk', 'tanggalKeluar', 'statusEmis', 'statusVerval', 'catatan'
    ];

    const formatExcelDate = (dStr: string) => {
      if (!dStr) return '';
      const match = dStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) return `${match[3]}-${match[2]}-${match[1]}`;
      return dStr;
    };

    const exportRows = importedSantri.map((row, idx) => {
      const val = dynamicValidationResults[idx];
      const errorMsgString = Object.entries(val?.errors || {})
        .map(([field, msg]) => `[${field}] ${msg}`)
        .join('; ');

      return fieldsToExport.map((field) => {
        let cellVal = String(row[field] || '');
        if (field === 'tanggalLahir' || field === 'tanggalMasuk' || field === 'tanggalKeluar') {
          cellVal = formatExcelDate(cellVal);
        }

        if (field === 'catatan' && errorMsgString) {
          cellVal = cellVal ? `${cellVal} | Masalah: ${errorMsgString}` : `Masalah: ${errorMsgString}`;
        }

        const hasError = val?.errors && !!val.errors[field as string];
        if (hasError) {
          return { value: cellVal, isProblem: true };
        }
        return cellVal;
      });
    });

    onExportExcelXML(`Data_Import_Diperbarui.xls`, 'Data Santri', headers, exportRows);
    setToastMessage(`Berhasil mengekspor berkas data yang diperbarui.`);
  };

  const filteredSantriWithIndices = useMemo(() => {
    return importedSantri
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row, originalIndex }) => {
        const validation = dynamicValidationResults[originalIndex];
        if (filterType === 'valid') {
          return validation?.isValid;
        }
        if (filterType === 'invalid') {
          if (!validation?.isValid) {
            if (selectedProblemCategory === 'all') {
              return true;
            }
            const currentCat = problemCategories.find(c => c.id === selectedProblemCategory);
            if (currentCat && currentCat.matcher) {
              return currentCat.matcher(validation.errors);
            }
            return true;
          }
          return false;
        }
        return true; // 'all'
      });
  }, [importedSantri, filterType, dynamicValidationResults, selectedProblemCategory, problemCategories]);

  const isAllFilteredSelected = useMemo(() => {
    const visibleValidIndices = filteredSantriWithIndices
      .filter(({ originalIndex }) => {
        const validation = dynamicValidationResults[originalIndex];
        return validation && !validation.hasCriticalError;
      })
      .map(({ originalIndex }) => originalIndex);

    if (visibleValidIndices.length === 0) return false;
    return visibleValidIndices.every(idx => selectedImportMap[idx]);
  }, [filteredSantriWithIndices, selectedImportMap, dynamicValidationResults]);

  const toggleAllFiltered = () => {
    const nextMap = { ...selectedImportMap };
    const visibleValidIndices = filteredSantriWithIndices
      .filter(({ originalIndex }) => {
        const validation = dynamicValidationResults[originalIndex];
        return validation && !validation.hasCriticalError;
      })
      .map(({ originalIndex }) => originalIndex);

    if (isAllFilteredSelected) {
      visibleValidIndices.forEach(idx => {
        nextMap[idx] = false;
      });
    } else {
      visibleValidIndices.forEach(idx => {
        nextMap[idx] = true;
      });
    }
    setSelectedImportMap(nextMap);
  };

  const validIndicesToSelect = useMemo(() => {
    const indices: number[] = [];
    const seenNis = new Set<string>();
    const seenNik = new Set<string>();

    importedSantri.forEach((row, idx) => {
      const validation = dynamicValidationResults[idx];
      const isCriticallyValid = validation && !validation.hasCriticalError;

      if (isCriticallyValid) {
        const rowNis = row.nis ? String(row.nis).trim() : "";
        const rowNik = row.nik ? String(row.nik).trim() : "";

        let isDuplicate = false;
        if (rowNis && seenNis.has(rowNis)) {
          isDuplicate = true;
        }
        if (rowNik && seenNik.has(rowNik)) {
          isDuplicate = true;
        }

        if (!isDuplicate) {
          indices.push(idx);
          if (rowNis) seenNis.add(rowNis);
          if (rowNik) seenNik.add(rowNik);
        }
      }
    });
    return indices;
  }, [importedSantri, dynamicValidationResults]);

  const isAllValidSelected = useMemo(() => {
    if (validIndicesToSelect.length === 0) return false;
    return validIndicesToSelect.every(idx => selectedImportMap[idx]);
  }, [validIndicesToSelect, selectedImportMap]);

  if (!isOpen) return null;

  const checkedCount = importedSantri.filter((_, idx) => selectedImportMap[idx]).length;
  const checkedAndValidCount = importedSantri.filter((_, idx) => selectedImportMap[idx] && dynamicValidationResults[idx]?.isValid).length;
  const checkedAndInvalidCount = importedSantri.filter((_, idx) => selectedImportMap[idx] && !dynamicValidationResults[idx]?.isValid).length;

  const selectAllValid = () => {
    const newMap: Record<number, boolean> = {};
    const seenNis = new Set<string>();
    const seenNik = new Set<string>();

    importedSantri.forEach((row, idx) => {
      const validation = dynamicValidationResults[idx];
      const isCriticallyValid = validation && !validation.hasCriticalError;

      if (isCriticallyValid) {
        const rowNis = row.nis ? String(row.nis).trim() : "";
        const rowNik = row.nik ? String(row.nik).trim() : "";

        let isDuplicate = false;
        if (rowNis && seenNis.has(rowNis)) {
          isDuplicate = true;
        }
        if (rowNik && seenNik.has(rowNik)) {
          isDuplicate = true;
        }

        if (!isDuplicate) {
          newMap[idx] = true;
          if (rowNis) seenNis.add(rowNis);
          if (rowNik) seenNik.add(rowNik);
        } else {
          newMap[idx] = false;
        }
      } else {
        newMap[idx] = false;
      }
    });
    setSelectedImportMap(newMap);
  };

  const clearAllSelection = () => {
    const newMap: Record<number, boolean> = {};
    importedSantri.forEach((_, idx) => {
      newMap[idx] = false;
    });
    setSelectedImportMap(newMap);
  };

  const handleCommitImport = async () => {
    if (isImporting) return;
    
    const selectedRows = importedSantri.filter((_, idx) => selectedImportMap[idx] && dynamicValidationResults[idx]?.isValid);
    if (selectedRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportTotal(selectedRows.length);

    // To ensure unique NIS generation, we'll keep track of all allocated NIS
    const allocatedNisSet = new Set<string>();
    // Collect all existing NIS from database
    (santriList || []).forEach(st => {
      if (st.nis && st.nis.trim() !== "") {
        allocatedNisSet.add(st.nis.trim());
      }
    });

    // To ensure unique ID generation (bypassing Postgres sequence lpad length-3 truncation collisions at seq >= 1000)
    let maxIdSeq = 9;
    (santriList || []).forEach(st => {
      if (st.id && st.id.startsWith('S')) {
        const numPart = parseInt(st.id.slice(1), 10);
        // Exclude timestamp-based IDs (which are huge e.g. 17xxxxxxxxxxx) and maintain focus on 3/4/5-digit sequential IDs
        if (!isNaN(numPart) && numPart > maxIdSeq && numPart < 1000000) {
          maxIdSeq = numPart;
        }
      }
    });

    let currentIdSeq = maxIdSeq;
    let adjustedCount = 0;

    // Format RT, RW, and sanitize empty string values for optional DB columns to prevent DB errors
    const formattedRows = selectedRows.map(s => {
      const formattedRt = s.rt ? String(s.rt).trim().replace(/\D/g, '').padStart(3, '0') : null;
      const formattedRw = s.rw ? String(s.rw).trim().replace(/\D/g, '').padStart(3, '0') : null;
      
      let finalNis = s.nis ? String(s.nis).trim() : '';
      
      const entryYear = s.tanggalMasuk && s.tanggalMasuk.trim() !== "" 
        ? s.tanggalMasuk.trim().split('-')[0] 
        : "";
      const prefix = entryYear || ""; // 4 digits year, e.g. '2026'

      // If NIS is empty or already allocated, generate/adjust a unique one!
      if (!finalNis || (finalNis && allocatedNisSet.has(finalNis))) {
        if (!finalNis && (!s.tanggalMasuk || s.tanggalMasuk.trim() === "")) {
          // If the entry date is empty AND NIS is empty, do NOT automatically generate/make a NIS
          finalNis = '';
        } else {
          // Otherwise, generate/adjust a unique NIS
          const activePrefix = prefix || new Date().getFullYear().toString();
          let nextSeq = 1;
          while (true) {
            const candidate = `${activePrefix}${String(nextSeq).padStart(3, '0')}`;
            if (!allocatedNisSet.has(candidate)) {
              finalNis = candidate;
              allocatedNisSet.add(candidate);
              break;
            }
            nextSeq++;
          }
          adjustedCount++;
        }
      } else if (finalNis) {
        allocatedNisSet.add(finalNis);
      }
      
      currentIdSeq++;
      // Format with 6-digit padding so S001000 onwards never collides with standard 3-digit padded S999 IDs
      const generatedId = `S${String(currentIdSeq).padStart(6, '0')}`;
      
      return {
        ...s,
        id: s.id || generatedId,
        nis: finalNis,
        rt: formattedRt || null,
        rw: formattedRw || null,
        tanggalLahir: s.tanggalLahir && s.tanggalLahir.trim() !== "" ? s.tanggalLahir.trim() : null,
        tanggalMasuk: s.tanggalMasuk && s.tanggalMasuk.trim() !== "" ? s.tanggalMasuk.trim() : null,
        tanggalKeluar: s.tanggalKeluar && s.tanggalKeluar.trim() !== "" ? s.tanggalKeluar.trim() : null,
        nik: s.nik && s.nik.trim() !== "" ? s.nik.trim() : null,
        noKk: s.noKk && s.noKk.trim() !== "" ? s.noKk.trim() : null,
        nisn: s.nisn && s.nisn.trim() !== "" ? s.nisn.trim() : null,
        nism: s.nism && s.nism.trim() !== "" ? s.nism.trim() : null,
        nikAyah: s.nikAyah && s.nikAyah.trim() !== "" ? s.nikAyah.trim() : null,
        nikIbu: s.nikIbu && s.nikIbu.trim() !== "" ? s.nikIbu.trim() : null,
        anakKe: s.anakKe !== undefined && s.anakKe !== null && String(s.anakKe).trim() !== "" ? Number(s.anakKe) : null,
        dariBersaudara: s.dariBersaudara !== undefined && s.dariBersaudara !== null && String(s.dariBersaudara).trim() !== "" ? Number(s.dariBersaudara) : null,
        jarakRumah: s.jarakRumah !== undefined && s.jarakRumah !== null && String(s.jarakRumah).trim() !== "" 
          ? Math.min(Math.max(0, Number(s.jarakRumah)), 999.99) 
          : null,
      };
    });

    const CHUNK_SIZE = 50;
    
    try {
      if (onBulkAddSantri) {
        // High-speed chunked batch insert using bulk insertion backend API
        for (let i = 0; i < formattedRows.length; i += CHUNK_SIZE) {
          const chunk = formattedRows.slice(i, i + CHUNK_SIZE);
          await onBulkAddSantri(chunk);
          setImportProgress(Math.min(i + CHUNK_SIZE, formattedRows.length));
          // Yield execution for 100ms for smooth UI rendering
          await new Promise(r => setTimeout(r, 100));
        }
      } else {
        // Fallback row-by-row but yielded in smaller chunks to keep browser fluid
        for (let i = 0; i < formattedRows.length; i++) {
          await onAddSantri(formattedRows[i]);
          setImportProgress(i + 1);
          if (i % 10 === 0) {
            await new Promise(r => setTimeout(r, 10)); // Yield to main thread
          }
        }
      }

      setIsAddSantriOpen(false);
      onClose();
      setImportedSantri([]);
      setSelectedImportMap({});
      setImportedFileName('');
      
      let adjustmentMsg = '';
      if (adjustedCount > 0) {
        adjustmentMsg = ` (${adjustedCount} NIS disesuaikan otomatis agar unik)`;
      }
      setToastMessage(`${formattedRows.length} data santri berhasil diimpor dengan sukses.${adjustmentMsg}`);
    } catch (error: any) {
      console.error("Error during progressive import:", error);
      setToastMessage(`Terjadi kendala saat mengimpor data: ${error.message || error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const isExcelView = importedSantri.length > 0;

  const modalContent = (
    <div 
      id="import-modal-backdrop" 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all ${
        isExcelView 
          ? 'p-0 bg-slate-100 w-screen h-screen overflow-hidden' 
          : 'p-4 bg-slate-900/30'
      }`}
    >
      <motion.div
        id="import-modal-dialog"
        initial={isExcelView ? { opacity: 0, y: 15 } : { scale: 0.98, opacity: 0 }}
        animate={isExcelView ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1 }}
        exit={isExcelView ? { opacity: 0, y: 15 } : { scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.05, ease: 'linear' }}
        className={`bg-white text-slate-700 font-sans relative overflow-hidden flex flex-col ${
          isExcelView 
            ? 'w-screen h-screen max-w-full max-h-screen rounded-none border-none shadow-none' 
            : 'rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh]'
        }`}
      >
        {isImporting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center z-[100] p-6 text-center animate-fadeIn">
            <div className="relative h-24 w-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <FileSpreadsheet className="h-8 w-8 text-emerald-700" />
            </div>
            <h4 className="font-display font-bold text-slate-800 text-base">Mengimpor Data Santri</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed font-medium">
              Harap tidak menutup browser atau mematikan halaman ini. Proses pengimporan data sedang dilakukan secara bertahap agar sistem tetap responsif, stabil, dan aman.
            </p>
            
            <div className="w-full max-w-sm mt-6 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="bg-emerald-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${(importProgress / importTotal) * 100}%` }}
              />
            </div>
            
            <span className="text-xs font-bold text-slate-700 mt-3">
              {importProgress} dari {importTotal} Santri ({Math.round((importProgress / (importTotal || 1)) * 100)}%)
            </span>
          </div>
        )}

        {!isExcelView ? (
          /* Normal Upload/Drag-Drop View in Small Modal */
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-850">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 id="import-modal-title" className="font-display font-bold text-slate-900 text-sm sm:text-base">Import Data Santri (Excel)</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Unggah berkas untuk menambah data santri secara massal</p>
                </div>
              </div>
              <button
                id="import-modal-close"
                onClick={() => {
                  onClose();
                  setImportedSantri([]);
                  setSelectedImportMap({});
                  setImportedFileName('');
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div ref={scrollContainerRef} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Template Download Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 sm:mt-0">
                    <Download className="h-5 w-5 text-emerald-750" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">Unduh Template Import</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                      Gunakan format Excel (.xls) resmi yang sudah dirapikan dengan struktur kolom dan data sampel agar proses import berjalan sukses.
                    </p>
                  </div>
                </div>
                <button
                  id="download-template-btn"
                  onClick={handleDownloadImportTemplate}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Unduh Template
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                id="drag-drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50/30 hover:border-emerald-400 hover:bg-slate-50/80"
                }`}
              >
                <input
                  id="import-file-input"
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-xs border border-emerald-100/30">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">Tarik & Lepas file Excel di sini</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">atau klik untuk memilih dari komputer Anda</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-semibold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-100 shadow-xs">
                  <span>Mendukung .XLS</span>
                  <span className="text-slate-300">•</span>
                  <span>.XLSX</span>
                  <span className="text-slate-300">•</span>
                  <span>.CSV</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                id="import-modal-cancel"
                onClick={() => {
                  onClose();
                  setImportedSantri([]);
                  setSelectedImportMap({});
                  setImportedFileName('');
                }}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </>
        ) : (
          /* FULL-SCREEN EXCEL PREVIEW VIEW */
          <div className="h-full flex flex-col bg-slate-100 font-sans text-xs">
            {/* 1. Excel Title Bar (Green Header) */}
            <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                <FileSpreadsheet className="h-4.5 w-4.5 text-white animate-pulse" />
                <span className="text-emerald-100 font-mono font-bold bg-[#0b592e] px-2 py-0.5 rounded border border-[#0d6133] text-[11px]">
                  {importedFileName || 'untitled.xlsx'}
                </span>
                
                {/* Icon Ganti File next to file name */}
                <button
                  type="button"
                  onClick={() => {
                    setImportedSantri([]);
                    setSelectedImportMap({});
                    setImportedFileName('');
                  }}
                  className="ml-2 inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded transition-all cursor-pointer border border-white/20"
                  title="Ganti Berkas / Upload Ulang"
                >
                  <RefreshCw className="h-3 w-3 animate-spin-slow" />
                  <span>Ganti File</span>
                </button>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setImportedSantri([]);
                  setSelectedImportMap({});
                  setImportedFileName('');
                }}
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/90 hover:text-white cursor-pointer"
                title="Keluar Excel Preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 3. Excel Menu Ribbon Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200/80 p-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-sans shrink-0 select-none w-full">
              {/* Left Side: Filters and Tools */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Section C: Data Filter Toggles (Semua, Tdk bermasalah, Bermasalah) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterType === 'all'
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/20'
                    }`}
                  >
                    <span>Semua</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-200 rounded-md font-mono font-bold text-slate-700">
                      {importedSantri.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterType('valid')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterType === 'valid'
                        ? 'bg-[#107c41] text-white shadow-xs'
                        : 'text-emerald-750 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span>Tdk bermasalah</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono font-bold ${
                      filterType === 'valid' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {importedSantri.filter((_, i) => dynamicValidationResults[i]?.isValid).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterType('invalid')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterType === 'invalid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-750 hover:bg-rose-50/50'
                    }`}
                  >
                    <span>Bermasalah</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono font-bold ${
                      filterType === 'invalid' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {importedSantri.filter((_, i) => !dynamicValidationResults[i]?.isValid).length}
                    </span>
                  </button>
                </div>

                {/* Dropdown Kategori Masalah & Tombol Ekspor saat Filter Bermasalah Aktif */}
                {filterType === 'invalid' && (
                  <div className="flex flex-wrap items-center gap-2 border-l border-slate-200 pl-3">
                    <span className="text-slate-500 font-medium text-xs">Kategori Masalah:</span>
                    <select
                      value={selectedProblemCategory}
                      onChange={(e) => setSelectedProblemCategory(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer max-w-[200px] truncate"
                    >
                      {problemCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                           {cat.label} ({cat.count})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleExportInvalidData}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 px-3 py-1.5 font-bold transition-all cursor-pointer text-xs"
                      title="Ekspor baris bermasalah saat ini ke berkas Excel"
                    >
                      <Download className="h-3.5 w-3.5 text-rose-700" />
                      <span>Ekspor Data Bermasalah</span>
                    </button>
                  </div>
                )}

                {/* Section B: Grid Selection & Fill Tools */}
                <div className="flex items-center gap-2">
                  {hasEmptyNis && (
                    <button
                      type="button"
                      onClick={handleAutoFillNis}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-850 px-3 py-2 font-bold transition-all cursor-pointer text-xs"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-sky-700" />
                      Isi Otomatis NIS
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsReplaceOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#107c41] px-3 py-2 font-bold transition-all cursor-pointer text-xs shadow-xs"
                    title="Cari dan Ganti (Find & Replace) teks di seluruh berkas impor"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#107c41]" />
                    Cari & Ganti (Replace)
                  </button>

                  {hasUserEdits && (
                    <button
                      type="button"
                      onClick={handleExportEditedData}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-2 font-bold transition-all cursor-pointer text-xs shadow-sm animate-pulse"
                      title="Unduh berkas Excel dengan perubahan data yang baru saja Anda edit"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-700" />
                      <span>Unduh Data Diperbarui</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Main Submit Action */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="excel-import-confirm"
                  disabled={isImporting || checkedAndValidCount === 0 || checkedAndInvalidCount > 0}
                  onClick={handleCommitImport}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#107c41] hover:bg-[#0b592e] px-4 py-2 font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
                >
                  <Check className="h-4 w-4" />
                  Import {checkedAndValidCount} Santri
                </button>
              </div>
            </div>

             {/* 4. Alert / Warnings Strip underneath menus */}
            <div className="flex flex-col shrink-0">
              {dbNisDuplicateCount > 0 && (
                <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-[11px] font-medium border-b border-amber-600 select-none">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Terdeteksi <strong>{dbNisDuplicateCount} baris</strong> dengan NIS yang sudah ada di database aplikasi. Kolom NIS baris ini ditandai kuning dan pilihan di-nonaktifkan otomatis untuk mencegah duplikasi.
                  </span>
                </div>
              )}

              {checkedAndInvalidCount > 0 && (
                <div className="bg-rose-600 text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium border-b border-rose-700 select-none">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>
                      Ada <strong>{checkedAndInvalidCount} baris bermasalah</strong> yang masih terpilih. Silakan hilangkan centang baris bermasalah tersebut agar proses import dapat dilakukan.
                    </span>
                  </div>

                  {/* Problem Rows Navigation Buttons */}
                  <div className="flex items-center gap-2 shrink-0 bg-rose-750 px-2.5 py-1 rounded-lg border border-rose-500/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">
                      Navigasi Masalah: {checkedAndInvalidIndices.indexOf(activeErrorNavIdx) !== -1 ? checkedAndInvalidIndices.indexOf(activeErrorNavIdx) + 1 : 0} / {checkedAndInvalidCount}
                    </span>
                    <div className="h-3.5 w-[1px] bg-rose-500/40 mx-1" />
                    <button
                      type="button"
                      onClick={handleNavErrorPrev}
                      className="p-1 hover:bg-white/20 active:scale-95 rounded transition-all cursor-pointer text-white"
                      title="Ke masalah sebelumnya"
                    >
                      <ChevronUp className="h-3.5 w-3.5 font-bold" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNavErrorNext}
                      className="p-1 hover:bg-white/20 active:scale-95 rounded transition-all cursor-pointer text-white"
                      title="Ke masalah selanjutnya"
                    >
                      <ChevronDown className="h-3.5 w-3.5 font-bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Custom keyframes styles for cellular highlights */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes cell-error-blink {
                0%, 100% { border-color: #fca5a5; background-color: rgba(254, 226, 226, 0.45); }
                50% { border-color: #ef4444; background-color: rgba(254, 226, 226, 0.85); }
              }
              @keyframes cell-warning-blink {
                0%, 100% { border-color: #fde047; background-color: rgba(254, 243, 199, 0.45); }
                50% { border-color: #eab308; background-color: rgba(254, 243, 199, 0.85); }
              }
              .animate-cell-error { animation: cell-error-blink 1.5s infinite ease-in-out; }
              .animate-cell-warning { animation: cell-warning-blink 1.5s infinite ease-in-out; }
            `}} />

            {/* 6. Excel Live Sheet Grid (Table Workspace) */}
            <div className="flex-1 min-h-0 bg-slate-100 p-3 overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 w-full overflow-auto bg-white border border-slate-200 shadow-xs rounded-xl flex flex-col">
                <div 
                  ref={excelGridScrollRef}
                  className="overflow-auto flex-1 relative"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 300) {
                      setVisibleCount(prev => Math.min(prev + 50, filteredSantriWithIndices.length));
                    }
                  }}
                >
                  <table className="w-full text-left border-collapse border-spacing-0 table-fixed min-w-[5000px]">
                    <thead>
                      {/* Row 1: Excel Alphabet Column Letters (A, B, C...) */}
                      <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 text-[10px] select-none h-6">
                        {/* Intersection Corner Block */}
                        <th className="p-1 border-b border-r border-slate-200 w-[50px] sticky top-0 left-0 bg-slate-200 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]"></th>
                        {EXCEL_COLUMNS.map((col) => {
                          const stickyClass = col.isSticky
                            ? `sticky top-0 ${col.stickyLeft} bg-slate-100 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.02)]`
                            : 'sticky top-0 bg-slate-100 z-30';
                          return (
                            <th
                              key={col.label}
                              className={`p-1 border-b border-r border-slate-200 text-center font-bold text-slate-400 text-[10px] font-mono select-none ${col.width} ${stickyClass}`}
                            >
                              {col.label}
                            </th>
                          );
                        })}
                      </tr>

                      {/* Row 2: Standard column title headers */}
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] sm:text-xs">
                        {/* Row number header */}
                        <th className="p-2 border-b border-r border-slate-300 w-[50px] sticky top-[24px] left-0 bg-slate-100 text-center text-slate-500 font-bold select-none z-40 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          No
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[60px] sticky top-[24px] left-[50px] bg-slate-50 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.02)] select-none">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="checkbox"
                              checked={isAllFilteredSelected}
                              onChange={toggleAllFiltered}
                              className="h-3.5 w-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                              title="Pilih / Batal Pilih Semua yang Terfilter"
                            />
                          </div>
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[120px] sticky top-[24px] bg-slate-50 z-20 select-none">NIS</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[220px] sticky top-[24px] bg-slate-50 z-20 select-none">Nama Lengkap</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">NISN</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[220px] sticky top-[24px] bg-slate-50 z-20 select-none">NISM</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[180px] sticky top-[24px] bg-slate-50 z-20 select-none">NIK</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[180px] sticky top-[24px] bg-slate-50 z-20 select-none">No KK</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">Tempat Lahir</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[130px] sticky top-[24px] bg-slate-50 z-20 select-none">Tanggal Lahir</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[100px] sticky top-[24px] bg-slate-50 z-20 select-none">Gender</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[160px] sticky top-[24px] bg-slate-50 z-20 select-none">Pendidikan Terakhir</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[100px] sticky top-[24px] bg-slate-50 z-20 select-none">Anak Ke</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[120px] sticky top-[24px] bg-slate-50 z-20 select-none">Jumlah Saudara</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[160px] sticky top-[24px] bg-slate-50 z-20 select-none">Nama Ayah</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[180px] sticky top-[24px] bg-slate-50 z-20 select-none">NIK Ayah</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Pekerjaan Ayah</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Pendidikan Ayah</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[160px] sticky top-[24px] bg-slate-50 z-20 select-none">Nama Ibu</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[180px] sticky top-[24px] bg-slate-50 z-20 select-none">NIK Ibu</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Pekerjaan Ibu</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Pendidikan Ibu</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[240px] sticky top-[24px] bg-slate-50 z-20 select-none">Alamat</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[80px] sticky top-[24px] bg-slate-50 z-20 select-none">RT</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[80px] sticky top-[24px] bg-slate-50 z-20 select-none">RW</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">Desa</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">Kecamatan</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">Kabupaten</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[140px] sticky top-[24px] bg-slate-50 z-20 select-none">Provinsi</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Jarak Rumah (km)</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">No HP Wali</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Status Keanggotaan</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[130px] sticky top-[24px] bg-slate-50 z-20 select-none">Status Domisili</th>

                        <th className="p-2.5 border-b border-r border-slate-200 w-[130px] sticky top-[24px] bg-slate-50 z-20 select-none">Tanggal Masuk</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[130px] sticky top-[24px] bg-slate-50 z-20 select-none">Tanggal Keluar</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Status Emis</th>
                        <th className="p-2.5 border-b border-r border-slate-200 w-[150px] sticky top-[24px] bg-slate-50 z-20 select-none">Status Verval</th>

                        <th className="p-2.5 border-b border-slate-200 w-[200px] sticky top-[24px] bg-slate-50 z-20 select-none">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSantriWithIndices.slice(0, visibleCount).map(({ row, originalIndex: idx }, relativeIdx) => {
                        const validation = dynamicValidationResults[idx];
                        const isChecked = !!selectedImportMap[idx];
                        const hasCriticalError = !!validation?.hasCriticalError;
                        const hasError = !validation?.isValid;

                        const renderImportCell = (field: keyof Santri, label: string) => {
                          let val = String(row[field] || '');
                          if ((field === 'tanggalLahir' || field === 'tanggalMasuk' || field === 'tanggalKeluar') && val) {
                            const matchYmd = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                            if (matchYmd) {
                              val = `${matchYmd[3]}-${matchYmd[2]}-${matchYmd[1]}`;
                            }
                          }

                          const isEditing = editingCell?.idx === idx && editingCell?.field === field;

                          if (isEditing) {
                            if (field === 'pendidikanTerakhir' || field === 'pendidikanAyah' || field === 'pendidikanIbu') {
                              return (
                                <td key={field} className="p-1 border-b border-r border-emerald-300 align-middle bg-emerald-50 min-w-[140px]">
                                  <select
                                    autoFocus
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={commitEditing}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        commitEditing();
                                      } else if (e.key === 'Escape') {
                                        setEditingCell(null);
                                      }
                                    }}
                                    className="w-full text-xs font-semibold text-slate-900 bg-white border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                  >
                                    {PENDIDIKAN_OPTIONS.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }

                            return (
                              <td key={field} className="p-1 border-b border-r border-emerald-300 align-middle bg-emerald-50 min-w-[140px]">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={commitEditing}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      commitEditing();
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="w-full text-xs font-semibold text-slate-900 bg-white border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                  title="Tekan Enter untuk menyimpan, Esc untuk batal"
                                />
                              </td>
                            );
                          }

                          const errorMsg = validation?.errors[field as string];
                          const isCritical = validation?.criticalErrors && !!validation.criticalErrors[field as string];
                          const isActiveMatch = activeMatch?.idx === idx && activeMatch?.field === field;

                          if (errorMsg) {
                            const blinkClass = isCritical ? 'animate-cell-error border-red-200' : 'animate-cell-warning border-amber-200';
                            const bgTextClass = isCritical ? 'text-red-950 bg-red-50/50' : 'text-amber-950 bg-amber-50/50';
                            const iconColor = isCritical ? 'text-red-600' : 'text-amber-600';
                            const isTooltipBelow = relativeIdx < 3;

                            return (
                              <td 
                                key={field} 
                                className={`p-1.5 border-b border-r border-slate-200 align-middle cursor-pointer transition-all ${blinkClass} ${isActiveMatch ? 'ring-2 ring-amber-500 bg-amber-100/50 scale-[1.02] shadow-md z-30' : ''}`}
                                onDoubleClick={() => startEditing(idx, field, row[field])}
                                title="Double klik untuk mengedit langsung"
                              >
                                <div className="relative group w-full h-full">
                                  <div className={`border border-transparent ${bgTextClass} px-2 py-0.5 rounded text-[11px] font-semibold cursor-help flex items-center gap-1.5 select-none`}>
                                    <AlertTriangle className={`h-3 w-3 ${iconColor} shrink-0`} />
                                    <span className="truncate w-full">{val || <span className="italic opacity-60 font-medium">Kosong</span>}</span>
                                  </div>
                                  
                                  {/* Hover Tooltip with detailed error description */}
                                  <div className={`absolute z-50 left-1/2 -translate-x-1/2 hidden group-hover:block w-56 bg-slate-900 text-white text-[11px] rounded-xl p-3 shadow-2xl text-center leading-relaxed font-sans font-medium border border-slate-800 ${
                                    isTooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                                  }`}>
                                    <p className="font-bold text-rose-300 mb-0.5 flex items-center justify-center gap-1">
                                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                      {label} Bermasalah
                                    </p>
                                    <p className="text-slate-200">{errorMsg}</p>
                                    <div className={`absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent ${
                                      isTooltipBelow ? 'bottom-full border-b-slate-900' : 'top-full border-t-slate-900'
                                    }`} />
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td 
                              key={field} 
                              className={`p-2 border-b border-r border-slate-200 text-xs align-middle cursor-pointer transition-all ${isActiveMatch ? 'bg-amber-100 ring-2 ring-amber-500 z-10 font-bold text-amber-950 scale-[1.02] shadow-md' : 'text-slate-700 font-medium hover:bg-slate-50'}`}
                              onDoubleClick={() => startEditing(idx, field, row[field])}
                              title="Double klik untuk mengedit"
                            >
                              <div className="px-1 truncate w-full select-all">{val || <span className="text-slate-350">-</span>}</div>
                            </td>
                          );
                        };

                        return (
                          <tr 
                            key={idx} 
                            data-row-index={idx}
                            className={`transition-colors ${
                              hasError && isChecked 
                                ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                                : isChecked 
                                  ? 'bg-emerald-50/10 hover:bg-emerald-50/25' 
                                  : 'hover:bg-slate-50 bg-white'
                            }`}
                          >
                            {/* Excel row numbering column (Sticky left-0, gray background) */}
                            <td className="p-1.5 border-b border-r border-slate-200 text-center sticky left-0 bg-slate-100 text-slate-500 font-bold font-mono text-[11px] z-10 select-none align-middle w-[50px]">
                              {idx + 1}
                            </td>

                            {/* Checkbox column - Disabled for rows with critical errors */}
                            <td className="p-1 border-b border-r border-slate-200 text-center sticky left-[50px] bg-slate-50 shadow-xs z-10 align-middle w-[60px]">
                              <input
                                type="checkbox"
                                checked={isChecked && !hasCriticalError}
                                disabled={hasCriticalError}
                                onChange={() => {
                                  setSelectedImportMap(prev => ({
                                    ...prev,
                                    [idx]: !prev[idx]
                                  }));
                                }}
                                className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* All columns exactly as in file */}
                            {renderImportCell('nis', 'NIS')}
                            {renderImportCell('nama', 'Nama Lengkap')}
                            {renderImportCell('nisn', 'NISN')}
                            {renderImportCell('nism', 'NISM')}
                            {renderImportCell('nik', 'NIK')}
                            {renderImportCell('noKk', 'No KK')}
                            {renderImportCell('tempatLahir', 'Tempat Lahir')}
                            {renderImportCell('tanggalLahir', 'Tanggal Lahir')}
                            {renderImportCell('gender', 'Gender')}
                            {renderImportCell('pendidikanTerakhir', 'Pendidikan Terakhir')}
                            {renderImportCell('anakKe', 'Anak Ke')}
                            {renderImportCell('dariBersaudara', 'Jumlah Saudara')}
                            {renderImportCell('namaAyah', 'Nama Ayah')}
                            {renderImportCell('nikAyah', 'NIK Ayah')}
                            {renderImportCell('pekerjaanAyah', 'Pekerjaan Ayah')}
                            {renderImportCell('pendidikanAyah', 'Pendidikan Ayah')}
                            {renderImportCell('namaIbu', 'Nama Ibu')}
                            {renderImportCell('nikIbu', 'NIK Ibu')}
                            {renderImportCell('pekerjaanIbu', 'Pekerjaan Ibu')}
                            {renderImportCell('pendidikanIbu', 'Pendidikan Ibu')}
                            {renderImportCell('alamat', 'Alamat')}
                            {renderImportCell('rt', 'RT')}
                            {renderImportCell('rw', 'RW')}
                            {renderImportCell('desa', 'Desa')}
                            {renderImportCell('kecamatan', 'Kecamatan')}
                            {renderImportCell('kabupaten', 'Kabupaten')}
                            {renderImportCell('provinsi', 'Provinsi')}
                            {renderImportCell('jarakRumah', 'Jarak Rumah (km)')}
                            {renderImportCell('noHp', 'No HP Wali')}
                            {renderImportCell('statusKeanggotaan', 'Status Keanggotaan')}
                            {renderImportCell('statusDomisili', 'Status Domisili')}

                            {renderImportCell('tanggalMasuk', 'Tanggal Masuk')}
                            {renderImportCell('tanggalKeluar', 'Tanggal Keluar')}
                            {renderImportCell('statusEmis', 'Status Emis')}
                            {renderImportCell('statusVerval', 'Status Verval')}
                            {renderImportCell('catatan', 'Catatan')}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 7. Excel Status Bar (Bottom Green ribbon) */}
            <div className="bg-[#107c41] text-slate-100 text-[10px] sm:text-[11px] px-4 py-1.5 flex items-center justify-between font-sans shrink-0 select-none border-t border-[#0d6133]">
              <div className="flex items-center gap-4">
                <span className="font-semibold bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  Dipilih: {checkedAndValidCount} baris
                </span>
                {isImporting && (
                  <span className="opacity-75">
                    Sedang mengimpor data: {importProgress} dari {importTotal} santri...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="opacity-75">Sistem Validasi Excel v2.4</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Excel-like Find & Replace Modal */}
      {isReplaceOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center font-sans">
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-300 pointer-events-auto overflow-hidden"
          >
            {/* Modal Header */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[#107c41]" />
                <h3 className="font-bold text-slate-800 text-sm">Temukan dan Ganti (Find & Replace)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsReplaceOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Find Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Cari apa (Find what):</label>
                <input 
                  type="text"
                  value={findText}
                  onChange={(e) => {
                    setFindText(e.target.value);
                    setActiveMatch(null);
                    setActiveMatchIdx(-1);
                  }}
                  placeholder="Masukkan teks yang ingin dicari..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
                />
              </div>

              {/* Replace Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Ganti dengan (Replace with):</label>
                <input 
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Masukkan teks pengganti..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
                />
              </div>

              {/* Collapsible Advance Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowReplaceAdvanced(!showReplaceAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer select-none"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showReplaceAdvanced ? 'Sembunyikan Opsi Lanjutan' : 'Advance (Opsi Lanjutan)'}
                </button>
              </div>

              {/* Advanced Section Content */}
              <AnimatePresence initial={false}>
                {showReplaceAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-4 pt-2 border-t border-slate-100"
                  >
                    {/* Find/Replace Columns */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Cari di kolom:</label>
                      <select
                        value={replaceField}
                        onChange={(e) => {
                          setReplaceField(e.target.value);
                          setActiveMatch(null);
                          setActiveMatchIdx(-1);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 cursor-pointer"
                      >
                        {REPLACE_FIELDS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Matching Options Checkboxes */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={matchCase}
                          onChange={(e) => {
                            setMatchCase(e.target.checked);
                            setActiveMatch(null);
                            setActiveMatchIdx(-1);
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-600">Peka huruf besar/kecil (Match case)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={matchWholeCell}
                          onChange={(e) => {
                            setMatchWholeCell(e.target.checked);
                            setActiveMatch(null);
                            setActiveMatchIdx(-1);
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-600">Cocokkan seluruh isi sel (Match whole cell)</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Matches Info Status */}
              {activeMatchIdx !== -1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Menyoroti kecocokan di kolom <span className="text-emerald-700 font-bold">{String(activeMatch?.field)}</span> pada Baris {activeMatch ? activeMatch.idx + 2 : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleFindNext}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
              >
                Cari Berikutnya
              </button>
              <button
                type="button"
                onClick={handleReplaceOne}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#107c41] text-[#107c41] bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                Ganti (Replace)
              </button>
              <button
                type="button"
                onClick={handleReplaceAll}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#107c41] hover:bg-[#0b592e] text-white shadow-xs transition-all cursor-pointer"
              >
                Ganti Semua (All)
              </button>
              <button
                type="button"
                onClick={() => setIsReplaceOpen(false)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
