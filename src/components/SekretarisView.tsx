import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutGrid, 
  Plus, 
  User, 
  X,
  Filter,
  ChevronRight,
  ChevronLeft,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Table,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Printer,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  FileText,
  ArrowLeftRight,
  Check,
  Calendar,
  Activity
} from 'lucide-react';
import { Santri } from '../types';
import { DEFAULT_ROLES } from '../lib/permissions';
import { 
  renderSantriAvatar,
  PrintTemplate,
  BulkPrintTemplate,
  getPesantrenProfile
} from './SekretarisHelper';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import SantriDetailModal from './sekretaris/SantriDetailModal';
import BulkEditModal from './sekretaris/BulkEditModal';
import DeleteConfirmModal from './sekretaris/DeleteConfirmModal';
import SantriFormModal from './sekretaris/SantriFormModal';
import OverviewSubModule from './sekretaris/OverviewSubModule';
import MonitoringSubModule from './sekretaris/MonitoringSubModule';
import AgeFilterModal, { AgeFilterConfig, DEFAULT_AGE_FILTER_CONFIG, calculateAgeOnDate } from './sekretaris/AgeFilterModal';

// Extracted Modular Components
import SantriTableView from './sekretaris/table/SantriTableView';
import SantriCardView from './sekretaris/card/SantriCardView';
import { EmptyState } from './sekretaris/components/HelperComponents';

interface SekretarisViewProps {
  santriList: Santri[];
  onAddSantri: (newSantri: Santri) => void;
  onBulkAddSantri?: (newSantriList: Santri[]) => void;
  onUpdateSantri?: (updatedSantri: Santri) => void;
  onDeleteSantri?: (id: string) => void;
  initialSubTab?: 'overview' | 'santri' | 'monitoring';
  isSelectionMode?: boolean;
  setIsSelectionMode?: (val: boolean) => void;
}

type SubTab = 'overview' | 'santri' | 'monitoring';
type ViewMode = 'table' | 'card';

export default function SekretarisView({ 
  santriList, 
  onAddSantri, 
  onBulkAddSantri,
  onUpdateSantri,
  onDeleteSantri,
  initialSubTab,
  isSelectionMode: isSelectionModeProp,
  setIsSelectionMode: setIsSelectionModeProp
}: SekretarisViewProps) {
  // Navigation & Toggles
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab || 'overview');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'table';
    }
    return 'card';
  });
  const [isMonitoringMode, setIsMonitoringMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRealImportModalOpen, setIsRealImportModalOpen] = useState(false);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [genderFilter, setGenderFilter] = useState<string>('semua');
  const [domisiliFilter, setDomisiliFilter] = useState<string>('semua');
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState<boolean>(false);
  const [showDomisiliFilterDropdown, setShowDomisiliFilterDropdown] = useState<boolean>(false);
  const [showGenderFilterDropdown, setShowGenderFilterDropdown] = useState<boolean>(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [ageFilterConfig, setAgeFilterConfig] = useState<AgeFilterConfig>(DEFAULT_AGE_FILTER_CONFIG);

  // Sorting, Pagination, and Column Visibility States
  const [sortKey, setSortKey] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showColumnConfig, setShowColumnConfig] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showPageJumpDropdown, setShowPageJumpDropdown] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    nism: false,
    noKk: false,
    tempatLahir: false,
    tanggalLahir: false,
    gender: false,
    pendidikanTerakhir: false,
    pendidikanFormal: true,
    anakKe: false,
    dariBersaudara: false,
    namaAyah: false,
    nikAyah: false,
    pekerjaanAyah: false,
    pendidikanAyah: false,
    namaIbu: false,
    nikIbu: false,
    pekerjaanIbu: false,
    pendidikanIbu: false,
    alamat: false,
    rt: false,
    rw: false,
    desa: false,
    kecamatan: false,
    kabupaten: false,
    provinsi: false,
    jarakRumah: false,
    noHp: false,
    statusDomisili: false,
    tanggalMasuk: false,
    tanggalKeluar: false,
    statusVerval: false,
    catatan: false,
  });

  // Modal / Wizard States
  const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [printableSantri, setPrintableSantri] = useState<Santri | null>(null);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  const [activeSantriDropdownId, setActiveSantriDropdownId] = useState<string | null>(null);
  const [activeDesktopDropdownId, setActiveDesktopDropdownId] = useState<string | null>(null);
  const [isSelectionModeLocal, setIsSelectionModeLocal] = useState(false);
  const isSelectionMode = isSelectionModeProp !== undefined ? isSelectionModeProp : isSelectionModeLocal;
  const setIsSelectionMode = setIsSelectionModeProp !== undefined ? setIsSelectionModeProp : setIsSelectionModeLocal;
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isMobileBulkOpen, setIsMobileBulkOpen] = useState(false);
  const [isMobileFloatingDropdownOpen, setIsMobileFloatingDropdownOpen] = useState(false);

  const columnConfigRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnConfigRef.current && 
        !columnConfigRef.current.contains(event.target as Node)
      ) {
        setShowColumnConfig(false);
      }
    };
    if (showColumnConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnConfig]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
    name?: string;
    ids?: string[];
  }>({
    isOpen: false,
    type: 'single',
    id: '',
    name: '',
    ids: [],
  });

  const [printableSantriList, setPrintableSantriList] = useState<Santri[] | null>(null);

  // Load permissions from localStorage
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
        canViewPutra = !!roleObj.permissions['sekretaris_putra.view'];
        canViewPutri = !!roleObj.permissions['sekretaris_putri.view'];
        canWritePutra = !!roleObj.permissions['sekretaris_putra.write'];
        canWritePutri = !!roleObj.permissions['sekretaris_putri.write'];
      } else {
        canViewPutra = false;
        canViewPutri = false;
        canWritePutra = false;
        canWritePutri = false;
      }
    }
  } catch (e) {
    console.error('Error parsing permissions in SekretarisView:', e);
  }

  // Determine allowed genders based on permissions
  const allowedGenders = (() => {
    const list: ('semua' | 'Putra' | 'Putri')[] = [];
    if (canViewPutra && canViewPutri) {
      list.push('semua', 'Putra', 'Putri');
    } else if (canViewPutra) {
      list.push('Putra');
    } else if (canViewPutri) {
      list.push('Putri');
    }
    return list;
  })();

  // Check if write is allowed for the currently selected gender filter
  const canWriteCurrentFilter = (() => {
    if (genderFilter === 'Putra') return canWritePutra;
    if (genderFilter === 'Putri') return canWritePutri;
    return canWritePutra || canWritePutri;
  })();

  const selectedSantris = santriList.filter(s => selectedSantriIds.includes(s.id));
  const hasPutraSelected = selectedSantris.some(s => s.gender === 'Putra');
  const hasPutriSelected = selectedSantris.some(s => s.gender === 'Putri');
  const canBulkWrite = (!hasPutraSelected || canWritePutra) && (!hasPutriSelected || canWritePutri);

  // Automatic default filtering based on permissions
  useEffect(() => {
    if (canViewPutra && !canViewPutri) {
      setGenderFilter('Putra');
    } else if (!canViewPutra && canViewPutri) {
      setGenderFilter('Putri');
    } else if (canViewPutra && canViewPutri) {
      setGenderFilter('semua');
    }
  }, [canViewPutra, canViewPutri]);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleExportExcelXML = (filename: string, sheetName: string, headers: string[], rows: any[][]) => {
    // Calculate ideal column widths based on content lengths
    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach(row => {
        const cell = row[colIndex];
        const val = cell && typeof cell === 'object' && 'value' in cell ? cell.value : cell;
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
  <Style ss:ID="ProblemCell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#9D174D" ss:Bold="1"/>
   <Interior ss:Color="#FCE7F3" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="@"/>
   <Protection/>
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
      row.forEach(cell => {
        let cellVal = '';
        let styleIDAttr = '';
        if (cell && typeof cell === 'object' && 'value' in cell) {
          cellVal = String(cell.value || '');
          if (cell.isProblem) {
            styleIDAttr = ' ss:StyleID="ProblemCell"';
          }
        } else {
          cellVal = String(cell || '');
        }

        const cleanVal = cellVal
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        xml += `\n    <Cell${styleIDAttr}><Data ss:Type="String">${cleanVal}</Data></Cell>`;
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

  const handleExportExcelSantri = () => {
    // Definisi kolom ekspor yang sesuai urutan data
    const exportColumns = [
      { id: 'nis', label: 'NIS', isAlwaysVisible: true, getValue: (s: Santri) => s.nis || '' },
      { id: 'nama', label: 'Nama Lengkap', isAlwaysVisible: true, getValue: (s: Santri) => s.nama || '' },
      { id: 'nisn', label: 'NISN', isAlwaysVisible: false, colKey: 'nisn', getValue: (s: Santri) => s.nisn || '' },
      { id: 'nism', label: 'NISM', isAlwaysVisible: false, colKey: 'nism', getValue: (s: Santri) => s.nism || '' },
      { id: 'nik', label: 'NIK', isAlwaysVisible: false, colKey: 'nik', getValue: (s: Santri) => s.nik || '' },
      ...(ageFilterConfig.enabled ? [{
        id: 'umur',
        label: `Umur ${ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate ? `(Per ${new Date(ageFilterConfig.customDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})` : '(Hari ini)'}`,
        isAlwaysVisible: true,
        getValue: (s: Santri) => {
          const refDate = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
            ? new Date(ageFilterConfig.customDate)
            : new Date();
          const age = calculateAgeOnDate(s.tanggalLahir, refDate);
          return age !== null ? `${age} Tahun` : '';
        }
      }] : []),
      { id: 'noKk', label: 'No. KK', isAlwaysVisible: false, colKey: 'noKk', getValue: (s: Santri) => s.noKk || '' },
      { id: 'tempatLahir', label: 'Tempat Lahir', isAlwaysVisible: true, getValue: (s: Santri) => s.tempatLahir || '' },
      { id: 'tanggalLahir', label: 'Tanggal Lahir', isAlwaysVisible: true, getValue: (s: Santri) => s.tanggalLahir || '' },
      { id: 'gender', label: 'Gender', isAlwaysVisible: false, colKey: 'gender', getValue: (s: Santri) => s.gender || '' },
      { id: 'pendidikanTerakhir', label: 'Pendidikan Terakhir', isAlwaysVisible: false, colKey: 'pendidikanTerakhir', getValue: (s: Santri) => s.pendidikanTerakhir || '' },
      { id: 'anakKe', label: 'Anak Ke', isAlwaysVisible: false, colKey: 'anakKe', getValue: (s: Santri) => s.anakKe !== undefined ? String(s.anakKe) : '' },
      { id: 'dariBersaudara', label: 'Jumlah Saudara', isAlwaysVisible: false, colKey: 'dariBersaudara', getValue: (s: Santri) => s.dariBersaudara !== undefined ? String(s.dariBersaudara) : '' },
      { id: 'namaAyah', label: 'Nama Ayah', isAlwaysVisible: false, colKey: 'namaAyah', getValue: (s: Santri) => s.namaAyah || '' },
      { id: 'nikAyah', label: 'NIK Ayah', isAlwaysVisible: false, colKey: 'nikAyah', getValue: (s: Santri) => s.nikAyah || '' },
      { id: 'pekerjaanAyah', label: 'Pekerjaan Ayah', isAlwaysVisible: false, colKey: 'pekerjaanAyah', getValue: (s: Santri) => s.pekerjaanAyah || '' },
      { id: 'pendidikanAyah', label: 'Pendidikan Ayah', isAlwaysVisible: false, colKey: 'pendidikanAyah', getValue: (s: Santri) => s.pendidikanAyah || '' },
      { id: 'namaIbu', label: 'Nama Ibu', isAlwaysVisible: false, colKey: 'namaIbu', getValue: (s: Santri) => s.namaIbu || '' },
      { id: 'nikIbu', label: 'NIK Ibu', isAlwaysVisible: false, colKey: 'nikIbu', getValue: (s: Santri) => s.nikIbu || '' },
      { id: 'pekerjaanIbu', label: 'Pekerjaan Ibu', isAlwaysVisible: false, colKey: 'pekerjaanIbu', getValue: (s: Santri) => s.pekerjaanIbu || '' },
      { id: 'pendidikanIbu', label: 'Pendidikan Ibu', isAlwaysVisible: false, colKey: 'pendidikanIbu', getValue: (s: Santri) => s.pendidikanIbu || '' },
      { id: 'alamat', label: 'Alamat', isAlwaysVisible: false, colKey: 'alamat', getValue: (s: Santri) => s.alamat || '' },
      { id: 'rt', label: 'RT', isAlwaysVisible: false, colKey: 'rt', getValue: (s: Santri) => s.rt || '' },
      { id: 'rw', label: 'RW', isAlwaysVisible: false, colKey: 'rw', getValue: (s: Santri) => s.rw || '' },
      { id: 'desa', label: 'Desa / Kelurahan', isAlwaysVisible: true, getValue: (s: Santri) => s.desa || '' },
      { id: 'kecamatan', label: 'Kecamatan', isAlwaysVisible: true, getValue: (s: Santri) => s.kecamatan || '' },
      { id: 'kabupaten', label: 'Kabupaten / Kota', isAlwaysVisible: true, getValue: (s: Santri) => s.kabupaten || '' },
      { id: 'provinsi', label: 'Provinsi', isAlwaysVisible: true, getValue: (s: Santri) => s.provinsi || '' },
      { id: 'jarakRumah', label: 'Jarak Rumah (km)', isAlwaysVisible: false, colKey: 'jarakRumah', getValue: (s: Santri) => s.jarakRumah !== undefined ? String(s.jarakRumah) : '' },
      { id: 'noHp', label: 'No. HP Wali', isAlwaysVisible: false, colKey: 'noHp', getValue: (s: Santri) => s.noHp || '' },
      { id: 'statusDomisili', label: 'Status Domisili', isAlwaysVisible: false, colKey: 'statusDomisili', getValue: (s: Santri) => s.statusDomisili || '' },
      { id: 'statusKeanggotaan', label: 'Status Keanggotaan', isAlwaysVisible: false, colKey: 'statusKeanggotaan', getValue: (s: Santri) => s.statusKeanggotaan || '' },
      { id: 'tanggalMasuk', label: 'Tanggal Masuk', isAlwaysVisible: false, colKey: 'tanggalMasuk', getValue: (s: Santri) => s.tanggalMasuk || '' },
      { id: 'tanggalKeluar', label: 'Tanggal Keluar', isAlwaysVisible: false, colKey: 'tanggalKeluar', getValue: (s: Santri) => s.tanggalKeluar || '' },
      { id: 'statusVerval', label: 'Status Verval', isAlwaysVisible: false, colKey: 'statusVerval', getValue: (s: Santri) => s.statusVerval || 'Proses' },
      { id: 'catatan', label: 'Catatan', isAlwaysVisible: true, getValue: (s: Santri) => s.catatan || '' }
    ];

    // Filter columns that are visible
    const activeColumns = exportColumns.filter(col => col.isAlwaysVisible || (col.colKey && visibleColumns[col.colKey]));

    const headers = activeColumns.map(col => col.label);
    const rows = sortedSantri.map(s => activeColumns.map(col => col.getValue(s)));

    const dateStr = new Date().toISOString().split('T')[0];
    handleExportExcelXML(`Data_Santri_${dateStr}.xls`, 'Data Santri', headers, rows);
  };



  const printSingleSantri = (s: Santri) => {
    const profile = getPesantrenProfile();
    const photoHTML = s.filePasFoto && s.filePasFoto.startsWith('http') && !s.filePasFoto.includes('avatar_default') && !s.filePasFoto.includes('default')
      ? `<img src="${s.filePasFoto}" alt="${s.nama}" style="width: 100%; height: 100%; object-fit: cover;" />`
      : `<div style="background: linear-gradient(135deg, #059669, #0d9488); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; width: 100%; height: 100%; font-size: 36px; text-transform: uppercase; font-family: sans-serif;">
          ${(s.nama || 'S').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
        </div>`;

    const logoHTML = profile.logoUrl && profile.logoUrl.trim()
      ? `<img src="${profile.logoUrl.trim()}" alt="Logo" referrerPolicy="no-referrer" />`
      : `<svg viewBox="0 0 100 100" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="#065f46" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <path d="M50 30 C39 30 30 39 30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 C70 39 61 30 50 30 Z" fill="#065f46" />
          <path d="M50 35 L53 43 L62 43 L55 48 L58 56 L50 51 L42 56 L45 48 L38 43 L47 43 Z" fill="#ffffff" />
        </svg>`;

    const contactParts = [];
    if (profile.telepon && profile.telepon.trim()) {
      contactParts.push(`Telp: ${profile.telepon.trim()}`);
    }
    if (profile.email && profile.email.trim()) {
      contactParts.push(`Email: ${profile.email.trim()}`);
    }
    const contactHTML = contactParts.length > 0
      ? `<p style="font-size: 10px; color: #475569; margin: 2px 0 0 0; font-weight: 500;">${contactParts.join(' | ')}</p>`
      : '';

    const now = new Date();
    const formattedDateTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const headerTitle = `Biodata-${(s.nama || '').trim()}`;

    // Helper to format any date string to Indonesian format (e.g., 3 Januari 2026)
    const formatIndonesianDateStr = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '-';
      const trimmed = dateStr.trim();
      if (!trimmed || trimmed === '-') return '-';

      const monthNamesIndonesian = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      // Check if already contains any Indonesian month
      for (const m of monthNamesIndonesian) {
        if (trimmed.toLowerCase().includes(m.toLowerCase())) {
          return trimmed;
        }
      }

      // Try parsing YYYY-MM-DD
      const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
      const matchYmd = trimmed.match(ymdRegex);
      if (matchYmd) {
        const year = parseInt(matchYmd[1], 10);
        const month = parseInt(matchYmd[2], 10) - 1;
        const day = parseInt(matchYmd[3], 10);
        if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
          return `${day} ${monthNamesIndonesian[month]} ${year}`;
        }
      }

      // Try parsing DD-MM-YYYY or DD/MM/YYYY
      const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
      const matchDmy = trimmed.match(dmyRegex);
      if (matchDmy) {
        const day = parseInt(matchDmy[1], 10);
        const month = parseInt(matchDmy[2], 10) - 1;
        const year = parseInt(matchDmy[3], 10);
        if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
          return `${day} ${monthNamesIndonesian[month]} ${year}`;
        }
      }

      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return `${parsedDate.getDate()} ${monthNamesIndonesian[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
      }

      return trimmed;
    };

    const html = `
      <html>
      <head>
        <title>Biodata-${(s.nama || '').trim()}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          @page {
            size: auto;
            margin: 1cm 1.5cm 1cm 1.5cm;
          }
          @media print {
            @page {
              margin: 1cm 1.5cm 1cm 1.5cm;
            }
            body {
              font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
              width: 100% !important;
              position: relative;
              box-sizing: border-box;
            }
            .no-print { display: none; }
            .print-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 8px;
              font-size: 10px;
              color: #64748b;
              font-family: "Inter", sans-serif;
              font-weight: 500;
              width: 100% !important;
              box-sizing: border-box;
            }
          }
          body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.3; }
          .print-header { display: none; }
          .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #065f46; padding-bottom: 8px; margin-bottom: 12px; }
          .header-logo { width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .header-logo img { width: 100%; height: 100%; object-fit: contain; }
          .header-content { flex-grow: 1; }
          .header-content h3 { margin: 0; font-size: 10px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
          .header-content h2 { margin: 2px 0; font-size: 16px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.2; }
          .header-content p { margin: 2px 0 0 0; font-size: 9px; color: #475569; font-weight: 500; line-height: 1.3; }
          
          .profile-section { display: flex; gap: 20px; margin-bottom: 12px; align-items: flex-start; }
          .profile-photo { width: 90px; height: 115px; border-radius: 6px; border: 2px solid #cbd5e1; overflow: hidden; flex-shrink: 0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .profile-details { flex-grow: 1; }
          .profile-details h1 { margin: 0 0 6px 0; font-size: 18px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
          .profile-meta { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
          .meta-label { font-size: 9px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
          .meta-val { font-size: 11px; font-weight: 600; color: #334155; }
          
          .section-title { font-size: 10px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin: 12px 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .grid-2 { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; }
          .info-table { width: 100%; border-collapse: collapse; font-size: 10px; }
          .info-table td { padding: 4px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .info-table td.label { width: 120px; color: #64748b; font-weight: 500; }
          .info-table td.value { font-weight: 600; color: #1e293b; }
          
          .memo-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 10px; color: #334155; margin-top: 4px; line-height: 1.4; }
          
          .signature-grid { display: grid; grid-template-cols: 1fr 1fr; text-align: center; margin-top: 20px; font-size: 10px; gap: 40px; }
          .signature-col { display: flex; flex-direction: column; justify-content: space-between; height: 100px; }
          .signature-col p { margin: 0; line-height: 1.4; font-weight: 500; color: #475569; }
          .signature-line { font-weight: bold; border-bottom: 1.5px solid #64748b; display: inline-block; padding: 0 16px 4px 16px; margin: 0 auto; width: 220px; text-align: center; color: #1e293b; }
        </style>
      </head>
      <body>
        <table style="width: 100%; border-collapse: collapse; border: 0; margin: 0; padding: 0;">
          <thead style="display: table-header-group;">
            <tr>
              <td style="border: 0; padding: 0;">
                <div class="print-header">
                  <div>${formattedDateTime}</div>
                  <div>${headerTitle}</div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody style="display: table-row-group;">
            <tr>
              <td style="border: 0; padding: 0;">
                <div class="header">
          <div class="header-logo">
            ${logoHTML}
          </div>
          <div class="header-content">
            <h3>${profile.namaYayasan}</h3>
            <h2>${profile.namaPesantren.toUpperCase()}</h2>
            <p>${profile.alamat}, Ds. ${profile.desa}, Kec. ${profile.kecamatan}, Kab. ${profile.kabupaten}, ${profile.provinsi}</p>
            ${contactHTML}
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-photo">
            ${photoHTML}
          </div>
          <div class="profile-details">
            <h1>${s.nama}</h1>
            <div class="profile-meta">
              <div>
                <span class="meta-label">NIS (Nomor Induk Santri)</span>
                <span class="meta-val" style="font-family: monospace;">${s.nis || '-'}</span>
              </div>
              <div>
                <span class="meta-label">Status Keanggotaan</span>
                <span class="meta-val" style="color: #065f46;">${s.statusKeanggotaan || 'Aktif'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">I. DATA PRIBADI</div>
        <table style="width: 100%; border-collapse: collapse; border: 0; margin: 0; padding: 0; table-layout: fixed;">
          <tr>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Jenis Kelamin</td>
                  <td class="value">: ${s.gender || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Tempat, Tgl Lahir</td>
                  <td class="value">: ${s.tempatLahir || '-'}${s.tanggalLahir ? `, ${formatIndonesianDateStr(s.tanggalLahir)}` : ''}</td>
                </tr>
                <tr>
                  <td class="label">Pendidikan Terakhir</td>
                  <td class="value">: ${s.pendidikanTerakhir || 'Tidak Sekolah'}</td>
                </tr>
              </table>
            </td>
            <td style="width: 4%; border: 0; padding: 0;"></td>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">NIK</td>
                  <td class="value" style="font-family: monospace;">: ${s.nik || '-'}</td>
                </tr>
                <tr>
                  <td class="label">No. Kartu Keluarga</td>
                  <td class="value" style="font-family: monospace;">: ${s.noKk || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Anak Ke</td>
                  <td class="value">: ${s.anakKe && s.anakKe !== 0 ? s.anakKe : '-'}</td>
                </tr>
                <tr>
                  <td class="label">Jumlah Saudara</td>
                  <td class="value">: ${s.dariBersaudara !== undefined && s.dariBersaudara !== null ? s.dariBersaudara : '-'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">II. DATA ORANG TUA / WALI</div>
        <table style="width: 100%; border-collapse: collapse; border: 0; margin: 0; padding: 0; table-layout: fixed;">
          <tr>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Nama Ayah</td>
                  <td class="value">: ${s.namaAyah || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Pendidikan Ayah</td>
                  <td class="value">: ${s.pendidikanAyah || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Pekerjaan Ayah</td>
                  <td class="value">: ${s.pekerjaanAyah || '-'}</td>
                </tr>
              </table>
            </td>
            <td style="width: 4%; border: 0; padding: 0;"></td>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Nama Ibu</td>
                  <td class="value">: ${s.namaIbu || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Pendidikan Ibu</td>
                  <td class="value">: ${s.pendidikanIbu || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Pekerjaan Ibu</td>
                  <td class="value">: ${s.pekerjaanIbu || '-'}</td>
                </tr>
                <tr>
                  <td class="label">No. HP Wali</td>
                  <td class="value" style="font-family: monospace;">: ${s.noHp || '-'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">III. ALAMAT DOMISILI</div>
        <table style="width: 100%; border-collapse: collapse; border: 0; margin: 0; padding: 0; table-layout: fixed;">
          <tr>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Alamat Lengkap</td>
                  <td class="value">: ${s.alamat || '-'}</td>
                </tr>
                <tr>
                  <td class="label">RT / RW</td>
                  <td class="value">: ${s.rt || '-'} / ${s.rw || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Desa / Kelurahan</td>
                  <td class="value">: ${s.desa || '-'}</td>
                </tr>
              </table>
            </td>
            <td style="width: 4%; border: 0; padding: 0;"></td>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Kecamatan</td>
                  <td class="value">: ${s.kecamatan || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Kabupaten</td>
                  <td class="value">: ${s.kabupaten || '-'}</td>
                </tr>
                <tr>
                  <td class="label">Provinsi</td>
                  <td class="value">: ${s.provinsi || '-'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">IV. ADMINISTRASI & AKADEMIK</div>
        <table style="width: 100%; border-collapse: collapse; border: 0; margin: 0; padding: 0; table-layout: fixed;">
          <tr>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">NISN</td>
                  <td class="value" style="font-family: monospace;">: ${s.nisn || '-'}</td>
                </tr>
                <tr>
                  <td class="label">NISM</td>
                  <td class="value" style="font-family: monospace;">: ${s.nism || '-'}</td>
                </tr>
              </table>
            </td>
            <td style="width: 4%; border: 0; padding: 0;"></td>
            <td style="width: 48%; vertical-align: top; border: 0; padding: 0;">
              <table class="info-table">
                <tr>
                  <td class="label">Domisili Pesantren</td>
                  <td class="value">: ${s.statusDomisili || 'Muqim'}</td>
                </tr>
                <tr>
                  <td class="label">Tanggal Masuk</td>
                  <td class="value" style="font-family: monospace;">: ${formatIndonesianDateStr(s.tanggalMasuk)}</td>
                </tr>
                ${s.tanggalKeluar ? `
                <tr>
                  <td class="label">Tanggal Keluar</td>
                  <td class="value" style="font-family: monospace;">: ${formatIndonesianDateStr(s.tanggalKeluar)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">V. CATATAN</div>
        <div class="memo-box">
          ${s.catatan || 'Tidak ada catatan kepengurusan khusus untuk santri ini.'}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; text-align: center; border: 0;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-bottom: 40px; border: 0;">
              <p style="margin: 0; color: #475569; font-weight: 500; visibility: hidden; line-height: 1.4;">Spacer</p>
              <p style="margin: 0; color: #475569; font-weight: 500; line-height: 1.4;">Wali Santri,</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-bottom: 40px; border: 0;">
              <p style="margin: 0; color: #475569; font-weight: 500; line-height: 1.4;">${profile.kotaTandaTangan}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style="margin: 0; color: #475569; font-weight: 500; line-height: 1.4;">Sekretaris Pesantren,</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: bottom; border: 0;">
              <div style="font-weight: bold; border-bottom: 1.5px solid #64748b; display: inline-block; padding: 0 16px 4px 16px; width: 220px; text-align: center; color: #1e293b; margin: 0 auto;">(..........................................)</div>
            </td>
            <td style="vertical-align: bottom; border: 0;">
              <div style="font-weight: bold; border-bottom: 1.5px solid #64748b; display: inline-block; padding: 0 16px 4px 16px; width: 220px; text-align: center; color: #1e293b; margin: 0 auto;">${profile.namaSekretaris}</div>
            </td>
          </tr>
        </table>

              </td>
            </tr>
          </tbody>
        </table>

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

  const printBulkSantri = (list: Santri[]) => {
    const profile = getPesantrenProfile();
    if (!list || list.length === 0) {
      alert('Tidak ada data santri untuk dicetak.');
      return;
    }

    // Definisi kolom ekspor yang sesuai urutan data
    const exportColumns = [
      { id: 'nis', label: 'NIS', isAlwaysVisible: true, getValue: (s: Santri) => s.nis || '' },
      { id: 'nama', label: 'Nama Lengkap', isAlwaysVisible: true, getValue: (s: Santri) => s.nama || '' },
      { id: 'nisn', label: 'NISN', isAlwaysVisible: false, colKey: 'nisn', getValue: (s: Santri) => s.nisn || '' },
      { id: 'nism', label: 'NISM', isAlwaysVisible: false, colKey: 'nism', getValue: (s: Santri) => s.nism || '' },
      { id: 'nik', label: 'NIK', isAlwaysVisible: false, colKey: 'nik', getValue: (s: Santri) => s.nik || '' },
      { id: 'noKk', label: 'No. KK', isAlwaysVisible: false, colKey: 'noKk', getValue: (s: Santri) => s.noKk || '' },
      { id: 'tempatLahir', label: 'Tempat Lahir', isAlwaysVisible: true, getValue: (s: Santri) => s.tempatLahir || '' },
      { id: 'tanggalLahir', label: 'Tanggal Lahir', isAlwaysVisible: true, getValue: (s: Santri) => s.tanggalLahir || '' },
      { id: 'gender', label: 'Gender', isAlwaysVisible: false, colKey: 'gender', getValue: (s: Santri) => s.gender || '' },
      { id: 'pendidikanTerakhir', label: 'Pendidikan Terakhir', isAlwaysVisible: false, colKey: 'pendidikanTerakhir', getValue: (s: Santri) => s.pendidikanTerakhir || '' },
      { id: 'pendidikanFormal', label: 'Pendidikan Formal', isAlwaysVisible: false, colKey: 'pendidikanFormal', getValue: (s: Santri) => s.pendidikanFormal || '' },
      { id: 'anakKe', label: 'Anak Ke', isAlwaysVisible: false, colKey: 'anakKe', getValue: (s: Santri) => s.anakKe !== undefined ? String(s.anakKe) : '' },
      { id: 'dariBersaudara', label: 'Jumlah Saudara', isAlwaysVisible: false, colKey: 'dariBersaudara', getValue: (s: Santri) => s.dariBersaudara !== undefined ? String(s.dariBersaudara) : '' },
      { id: 'namaAyah', label: 'Nama Ayah', isAlwaysVisible: false, colKey: 'namaAyah', getValue: (s: Santri) => s.namaAyah || '' },
      { id: 'nikAyah', label: 'NIK Ayah', isAlwaysVisible: false, colKey: 'nikAyah', getValue: (s: Santri) => s.nikAyah || '' },
      { id: 'pekerjaanAyah', label: 'Pekerjaan Ayah', isAlwaysVisible: false, colKey: 'pekerjaanAyah', getValue: (s: Santri) => s.pekerjaanAyah || '' },
      { id: 'pendidikanAyah', label: 'Pendidikan Ayah', isAlwaysVisible: false, colKey: 'pendidikanAyah', getValue: (s: Santri) => s.pendidikanAyah || '' },
      { id: 'namaIbu', label: 'Nama Ibu', isAlwaysVisible: false, colKey: 'namaIbu', getValue: (s: Santri) => s.namaIbu || '' },
      { id: 'nikIbu', label: 'NIK Ibu', isAlwaysVisible: false, colKey: 'nikIbu', getValue: (s: Santri) => s.nikIbu || '' },
      { id: 'pekerjaanIbu', label: 'Pekerjaan Ibu', isAlwaysVisible: false, colKey: 'pekerjaanIbu', getValue: (s: Santri) => s.pekerjaanIbu || '' },
      { id: 'pendidikanIbu', label: 'Pendidikan Ibu', isAlwaysVisible: false, colKey: 'pendidikanIbu', getValue: (s: Santri) => s.pendidikanIbu || '' },
      { id: 'alamat', label: 'Alamat', isAlwaysVisible: false, colKey: 'alamat', getValue: (s: Santri) => s.alamat || '' },
      { id: 'rt', label: 'RT', isAlwaysVisible: false, colKey: 'rt', getValue: (s: Santri) => s.rt || '' },
      { id: 'rw', label: 'RW', isAlwaysVisible: false, colKey: 'rw', getValue: (s: Santri) => s.rw || '' },
      { id: 'desa', label: 'Desa / Kelurahan', isAlwaysVisible: true, getValue: (s: Santri) => s.desa || '' },
      { id: 'kecamatan', label: 'Kecamatan', isAlwaysVisible: true, getValue: (s: Santri) => s.kecamatan || '' },
      { id: 'kabupaten', label: 'Kabupaten / Kota', isAlwaysVisible: true, getValue: (s: Santri) => s.kabupaten || '' },
      { id: 'provinsi', label: 'Provinsi', isAlwaysVisible: true, getValue: (s: Santri) => s.provinsi || '' },
      { id: 'jarakRumah', label: 'Jarak Rumah (km)', isAlwaysVisible: false, colKey: 'jarakRumah', getValue: (s: Santri) => s.jarakRumah !== undefined ? String(s.jarakRumah) : '' },
      { id: 'noHp', label: 'No. HP Wali', isAlwaysVisible: false, colKey: 'noHp', getValue: (s: Santri) => s.noHp || '' },
      { id: 'statusDomisili', label: 'Status Domisili', isAlwaysVisible: false, colKey: 'statusDomisili', getValue: (s: Santri) => s.statusDomisili || '' },
      { id: 'statusKeanggotaan', label: 'Status Keanggotaan', isAlwaysVisible: false, colKey: 'statusKeanggotaan', getValue: (s: Santri) => s.statusKeanggotaan || '' },
      { id: 'tanggalMasuk', label: 'Tanggal Masuk', isAlwaysVisible: false, colKey: 'tanggalMasuk', getValue: (s: Santri) => s.tanggalMasuk || '' },
      { id: 'tanggalKeluar', label: 'Tanggal Keluar', isAlwaysVisible: false, colKey: 'tanggalKeluar', getValue: (s: Santri) => s.tanggalKeluar || '' },
      { id: 'statusVerval', label: 'Status Verval', isAlwaysVisible: false, colKey: 'statusVerval', getValue: (s: Santri) => s.statusVerval || 'Proses' },
      { id: 'catatan', label: 'Catatan', isAlwaysVisible: true, getValue: (s: Santri) => s.catatan || '' }
    ];

    const activeColumns = exportColumns.filter(col => col.isAlwaysVisible || (col.colKey && visibleColumns[col.colKey]));

    let html = `
      <html>
      <head>
        <title>LAPORAN DATA SANTRI (${list.length} Santri) - ${profile.namaPesantren.toUpperCase()}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          @media print {
            body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 0; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; word-break: break-word; }
            th { background-color: #047857 !important; font-weight: bold; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; }
            .title { font-size: 16px; font-weight: bold; color: #047857 !important; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .meta { font-size: 10px; color: #64748b !important; text-align: center; margin-bottom: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; word-break: break-word; }
          th { background-color: #047857; font-weight: bold; color: #ffffff; text-align: center; }
          .title { font-size: 16px; font-weight: bold; color: #047857; text-align: center; }
          .meta { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">LAPORAN DATA SANTRI - ${profile.namaPesantren.toUpperCase()}</div>
        <div class="meta">Laporan Data Santri Terdaftar • Jumlah: ${list.length} Santri • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              ${activeColumns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    list.forEach((s, idx) => {
      html += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          ${activeColumns.map(col => {
            const val = col.getValue(s);
            const style = col.id === 'nis' || col.id === 'nisn' || col.id === 'nism' || col.id === 'nik' || col.id === 'noKk' || col.id === 'noHp'
              ? 'style="font-family: monospace; text-align: center;"'
              : '';
            return `<td ${style}>${val !== undefined && val !== null && String(val).trim() !== '' ? val : '-'}</td>`;
          }).join('')}
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px;">
          <div style="text-align: center; width: 250px;">
            <p style="color: #64748b; margin-bottom: 50px;">Mengetahui,</p>
            <div style="font-weight: bold; border-bottom: 1px solid #94a3b8; display: inline-block; padding: 0 20px 2px 20px;">${profile.namaPengasuh}</div>
            <p style="color: #64748b; margin-top: 4px; font-size: 10px;">Pengasuh Pondok Pesantren</p>
          </div>
          <div style="text-align: center; width: 250px;">
            <p style="color: #64748b; margin-bottom: 50px;">${profile.kotaTandaTangan}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br />Sekretaris,</p>
            <div style="font-weight: bold; border-bottom: 1px solid #94a3b8; display: inline-block; padding: 0 20px 2px 20px;">${profile.namaSekretaris}</div>
            <p style="color: #64748b; margin-top: 4px; font-size: 10px;">Sekretariat Pusat</p>
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

  const handlePrintPDFSantri = () => {
    printBulkSantri(sortedSantri);
  };

  // (States moved to top of component)
  
  // Listen for real-time NIS conflict resolution warnings from App.tsx
  useEffect(() => {
    const checkConflictNotice = () => {
      const notice = localStorage.getItem('smartsantri_nis_conflict_toast');
      if (notice) {
        setToastMessage(notice);
        localStorage.removeItem('smartsantri_nis_conflict_toast');
      }
    };
    checkConflictNotice();
    const interval = setInterval(checkConflictNotice, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 7000); // 7 seconds for collision toast readability
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintableSantri(null);
      setPrintableSantriList(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleAddSantriLocal = async (newSantri: Santri) => {
    try {
      await onAddSantri(newSantri);
      setToastMessage(`Data santri baru "${newSantri.nama}" berhasil ditambahkan.`);
    } catch (err: any) {
      setToastMessage(`Gagal menambahkan santri: ${err.message || 'Error tidak diketahui'}`);
    }
  };

  const handleUpdateSantriLocal = async (updatedSantri: Santri) => {
    if (onUpdateSantri) {
      try {
        await onUpdateSantri(updatedSantri);
        setToastMessage(`Data santri "${updatedSantri.nama}" berhasil diperbarui.`);
      } catch (err: any) {
        setToastMessage(`Gagal memperbarui data santri: ${err.message || 'Error tidak diketahui'}`);
      }
    }
  };

  // (Editing states moved to top of component)
  const detailScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedSantri && detailScrollRef.current) {
      detailScrollRef.current.scrollTop = 0;
    }
  }, [selectedSantri?.id]);

  // (Additional states moved to top of component)

  const handleStartEditSantri = (s: Santri) => {
    const hasWritePermission = s.gender === 'Putra' ? canWritePutra : canWritePutri;
    if (!hasWritePermission) {
      alert("Akses ditolak: Anda tidak memiliki akses tulis untuk data santri ini.");
      return;
    }
    setEditingSantri(s);
    setIsAddSantriOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    const s = santriList.find(x => x.id === id);
    if (s) {
      const hasWritePermission = s.gender === 'Putra' ? canWritePutra : canWritePutri;
      if (!hasWritePermission) {
        alert("Akses ditolak: Anda tidak memiliki akses untuk menghapus data santri ini.");
        return;
      }
    }
    setDeleteConfirm({
      isOpen: true,
      type: 'single',
      id,
      name,
      ids: []
    });
  };

  const handlePrintClick = (s: Santri) => {
    printSingleSantri(s);
  };

  const isDomisiliDisabled = statusFilter !== 'semua' && statusFilter !== 'Aktif';

  // Filter Data
  const filteredSantri = santriList.filter((s) => {
    // Enforcement of gender view permission
    const isGenderViewable = s.gender === 'Putra' ? canViewPutra : canViewPutri;
    if (!isGenderViewable) return false;

    const matchesSearch = 
      (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis || '').includes(searchQuery) ||
      (s.asal && s.asal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.kamar && s.kamar.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'semua' || s.statusKeanggotaan === statusFilter;

    const matchesGender = genderFilter === 'semua' || s.gender === genderFilter;
    const matchesDomisili = isDomisiliDisabled || domisiliFilter === 'semua' || s.statusDomisili === domisiliFilter;

    let matchesAge = true;
    if (ageFilterConfig.enabled) {
      const refDate = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
        ? new Date(ageFilterConfig.customDate)
        : new Date();

      const age = calculateAgeOnDate(s.tanggalLahir, refDate);
      if (age === null) {
        matchesAge = false;
      } else if (ageFilterConfig.mode === 'exact') {
        const target = parseInt(ageFilterConfig.exactAge, 10);
        if (!isNaN(target) && age !== target) matchesAge = false;
      } else if (ageFilterConfig.mode === 'min') {
        const min = parseInt(ageFilterConfig.minAge, 10);
        if (!isNaN(min) && age < min) matchesAge = false;
      } else if (ageFilterConfig.mode === 'max') {
        const max = parseInt(ageFilterConfig.maxAge, 10);
        if (!isNaN(max) && age > max) matchesAge = false;
      } else if (ageFilterConfig.mode === 'range') {
        const min = parseInt(ageFilterConfig.minAge, 10);
        const max = parseInt(ageFilterConfig.maxAge, 10);
        if (!isNaN(min) && age < min) matchesAge = false;
        if (!isNaN(max) && age > max) matchesAge = false;
      }
    }

    return matchesSearch && matchesStatus && matchesGender && matchesDomisili && matchesAge;
  });

  // Sort Data
  const sortedSantri = [...filteredSantri].sort((a, b) => {
    if (sortKey === 'umur') {
      const refDate = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
        ? new Date(ageFilterConfig.customDate)
        : new Date();
      const ageA = calculateAgeOnDate(a.tanggalLahir, refDate) ?? -1;
      const ageB = calculateAgeOnDate(b.tanggalLahir, refDate) ?? -1;
      if (ageA < ageB) return sortDirection === 'asc' ? -1 : 1;
      if (ageA > ageB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    let valA = a[sortKey as keyof Santri] ?? '';
    let valB = b[sortKey as keyof Santri] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, genderFilter, domisiliFilter, ageFilterConfig]);

  // Pagination calculation
  const totalItems = sortedSantri.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSantri = sortedSantri.slice(startIndex, endIndex);



  return (
    <div className="space-y-6">
      
      {/* Tab Switcher & Action Headers inside Sticky Wrapper */}
      {subTab !== 'monitoring' && (
        <div className="bg-slate-50/60 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 space-y-4 border-b border-slate-200/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl flex flex-wrap items-center gap-x-2">
              {subTab === 'overview' ? (
                'Overview Sekretariat'
              ) : subTab === 'santri' ? (
                <>
                  <span>Data Induk</span>
                  <span 
                    onClick={() => {
                      if (isSelectionMode || allowedGenders.length <= 1) return;
                      const currentIndex = allowedGenders.indexOf(genderFilter as any);
                      const nextIndex = (currentIndex + 1) % allowedGenders.length;
                      setGenderFilter(allowedGenders[nextIndex] as any);
                    }}
                    className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                      isSelectionMode || allowedGenders.length <= 1
                        ? 'opacity-80 cursor-not-allowed text-slate-500'
                        : 'cursor-pointer active:scale-95'
                    } ${
                      !isSelectionMode && allowedGenders.length > 1 && genderFilter === 'semua' 
                        ? 'text-emerald-600 hover:text-emerald-700' 
                        : !isSelectionMode && allowedGenders.length > 1 && genderFilter === 'Putra' 
                        ? 'text-indigo-600 hover:text-indigo-700' 
                        : !isSelectionMode && allowedGenders.length > 1 && genderFilter === 'Putri'
                        ? 'text-rose-600 hover:text-rose-700'
                        : genderFilter === 'Putra'
                        ? 'text-indigo-600'
                        : genderFilter === 'Putri'
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                    title={
                      isSelectionMode 
                        ? "Matikan mode pilih untuk mengubah gender" 
                        : allowedGenders.length <= 1
                        ? "Akses filter gender dikunci untuk peran Anda"
                        : "Klik untuk mengubah filter gender (Semua ⇄ Putra ⇄ Putri)"
                    }
                  >
                    <span>
                      {genderFilter === 'semua' ? 'Semua Santri' : genderFilter === 'Putra' ? 'Santri Putra' : 'Santri Putri'}
                    </span>
                    {allowedGenders.length > 1 && <ArrowLeftRight className="h-5 w-5 mt-0.5 shrink-0" />}
                  </span>
                </>
              ) : (
                'Data Induk'
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {subTab === 'overview' ? (
                'Ringkasan eksekutif, statistik pendaftaran, distribusi gender, dan riwayat santri.'
              ) : (
                <>
                  Menampilkan direktori biodata, status, and data pribadi{' '}
                  <span className={
                    genderFilter === 'semua' 
                      ? 'text-emerald-600 font-bold' 
                      : genderFilter === 'Putra' 
                      ? 'text-indigo-600 font-bold' 
                      : 'text-rose-600 font-bold'
                  }>
                    {genderFilter === 'semua' ? 'Semua Santri' : genderFilter === 'Putra' ? 'Santri Putra' : 'Santri Putri'}
                  </span>{' '}
                  secara terpusat.
                </>
              )}
            </p>
          </div>

          {/* Top Segmented Layout Tabs & Export Button */}
          {subTab !== 'overview' && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {viewMode === 'table' && (
                <button
                  id="btn-toggle-monitoring"
                  onClick={() => setIsMonitoringMode(prev => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-xs font-bold transition-all border cursor-pointer ${
                    isMonitoringMode
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm ring-2 ring-rose-200'
                      : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-800'
                  }`}
                  title={isMonitoringMode ? 'Nonaktifkan Mode Monitoring Data' : 'Aktifkan Mode Monitoring Data'}
                >
                  <Activity className="h-4 w-4" />
                </button>
              )}

              <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  id="tab-view-table"
                  onClick={() => setViewMode('table')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mode Tabel"
                >
                  <Table className="h-4 w-4" />
                </button>
                <button
                  id="tab-view-card"
                  onClick={() => setViewMode('card')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mode Kartu"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              <button
                id="btn-export-trigger"
                onClick={() => setIsExportModalOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                title="Ekspor Data"
              >
                <Download className="h-5 w-5" />
              </button>

              {/* Tambah Santri Mobile Button next to export */}
              {subTab === 'santri' && canWriteCurrentFilter && (
                <button
                  id="btn-add-santri-mobile"
                  onClick={() => {
                    setEditingSantri(null);
                    setIsAddSantriOpen(true);
                  }}
                  className="flex md:hidden h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all shadow-xs bg-emerald-700 text-white hover:bg-emerald-800 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Tambah Santri"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Controls Card (Search, View Toggle, Filter Button) */}
        {subTab !== 'overview' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
          
          {/* Real-time Search Box with Filter & Sort inline on mobile */}
          <div className="flex items-center gap-2 w-full md:flex-1">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIS, asal kota, atau kamar santri..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter & Sort Buttons (sejajar pencarian, hanya icon) */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {/* Filter Button (Mobile: Icon only) */}
              <button
                id="btn-filter-toggle-mobile"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border font-display text-xs font-bold transition-all hover:bg-slate-50 shrink-0 ${
                  isSelectionMode ? 'hidden' : 'flex'
                } ${
                  showFilters || statusFilter !== 'semua' || genderFilter !== 'semua' || domisiliFilter !== 'semua' || ageFilterConfig.enabled
                    ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                title="Filter"
              >
                <Filter className="h-5 w-5 text-current" />
              </button>

              {/* Sort Button (Mobile: Icon only, Card mode & Santri subtab) */}
              {viewMode === 'card' && subTab === 'santri' && (
                <div className={`relative shrink-0 ${isSelectionMode ? 'hidden' : 'block'}`}>
                  <button
                    id="btn-sort-card-toggle-mobile"
                    type="button"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className={`h-11 w-11 flex items-center justify-center rounded-xl border font-display text-xs font-bold transition-all hover:bg-slate-50 ${
                      showSortDropdown
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                    title="Urutkan"
                  >
                    <ArrowUpDown className="h-5 w-5 text-current" />
                  </button>

                  {/* Mobile Sort Options Dropdown */}
                  <AnimatePresence>
                    {showSortDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowSortDropdown(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-50 text-slate-700 font-sans"
                        >
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2 pb-1 border-b border-slate-50">
                            Urutkan Berdasarkan
                          </h4>
                          <div className="space-y-1">
                            {[
                              { key: 'nama', label: 'Nama' },
                              { key: 'nis', label: 'NIS' },
                              { key: 'tanggalLahir', label: 'Tgl Lahir' },
                              { key: 'alamat', label: 'Alamat' },
                              { key: 'tanggalMasuk', label: 'Dibuat / Tgl Masuk' }
                            ].map((opt) => {
                              const isActive = sortKey === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    if (sortKey === opt.key) {
                                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortKey(opt.key);
                                      setSortDirection('asc');
                                    }
                                    setShowSortDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                      : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isActive && (
                                    sortDirection === 'asc' ? (
                                      <ArrowUp className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                    )
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}


            </div>
          </div>

          <div className={`${isSelectionMode ? 'flex' : 'hidden md:flex'} items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 md:gap-3 w-full md:w-auto flex-nowrap overflow-visible py-0.5`}>

            {/* Filter Toggle Button */}
            <button
              id="btn-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-row flex-1 sm:flex-none h-11 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 sm:px-4 font-display text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all hover:bg-slate-50 shrink-0 whitespace-nowrap ${
                isSelectionMode ? 'hidden sm:flex' : 'flex'
              } ${
                showFilters || statusFilter !== 'semua' || genderFilter !== 'semua' || domisiliFilter !== 'semua' || ageFilterConfig.enabled
                  ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
              title="Filter"
            >
              <Filter className="h-4 w-4 text-current" />
              <span className="inline">Filter</span>
            </button>

            {/* Sort Button (Only for Card mode & Santri subtab) */}
            {viewMode === 'card' && subTab === 'santri' && (
              <div className={`relative flex-1 sm:flex-none shrink-0 ${isSelectionMode ? 'hidden sm:block' : 'block'}`}>
                <button
                  id="btn-sort-card-toggle"
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`w-full flex flex-row h-11 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border px-1.5 sm:px-3.5 font-display text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap ${
                    showSortDropdown
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  title="Urutkan"
                >
                  <ArrowUpDown className="h-4 w-4 text-current" />
                  <span className="inline">Urutkan</span>
                </button>
                
                {/* Sort Options Dropdown */}
                <AnimatePresence>
                  {showSortDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSortDropdown(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-52 sm:w-56 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-50 text-slate-700 font-sans"
                      >
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2 pb-1 border-b border-slate-50">
                          Urutkan Berdasarkan
                        </h4>
                        <div className="space-y-1">
                          {[
                            { key: 'nama', label: 'Nama' },
                            { key: 'nis', label: 'NIS' },
                            { key: 'tanggalLahir', label: 'Tgl Lahir' },
                            { key: 'alamat', label: 'Alamat' },
                            { key: 'tanggalMasuk', label: 'Dibuat / Tgl Masuk' }
                          ].map((opt) => {
                            const isActive = sortKey === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  if (sortKey === opt.key) {
                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortKey(opt.key);
                                    setSortDirection('asc');
                                  }
                                  setShowSortDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                    : 'hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isActive && (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                  )
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}



            {/* Column Visibility Configuration Button (Only for Table mode & Santri subtab) */}
            {viewMode === 'table' && subTab === 'santri' && (
              <div 
                ref={columnConfigRef}
                className={`relative flex-1 sm:flex-none shrink-0 ${isSelectionMode ? 'hidden sm:block' : 'block'}`}
              >
                <button
                  id="btn-column-visibility-toggle"
                  type="button"
                  onClick={() => setShowColumnConfig(!showColumnConfig)}
                  className={`w-full flex flex-row h-11 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border px-1.5 sm:px-3.5 font-display text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap ${
                    showColumnConfig
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  title="Pengatur Kolom"
                >
                  <Settings className="h-4 w-4 text-current" />
                  <span className="inline">Kolom</span>
                </button>
                
                {/* Column Visibility Selector Dropdown Popover */}
                <AnimatePresence>
                  {showColumnConfig && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setShowColumnConfig(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-56 sm:w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl z-50 text-slate-700"
                      >
                        <div className="mb-3 border-b border-slate-100 pb-2.5 flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            Visibilitas
                          </h4>
                          {(() => {
                            const allChecked = Object.values(visibleColumns).every(Boolean);
                            const isIndeterminate = Object.values(visibleColumns).some(Boolean) && !allChecked;
                            return (
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 select-none">
                                <input
                                  type="checkbox"
                                  checked={allChecked}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isIndeterminate;
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    const nextCols: Record<string, boolean> = {};
                                    Object.keys(visibleColumns).forEach((k) => {
                                      nextCols[k] = val;
                                    });
                                    setVisibleColumns(nextCols);
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span>{allChecked ? 'Batal Semua' : 'Pilih Semua'}</span>
                              </label>
                            );
                          })()}
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {Object.keys(visibleColumns).map((colKey) => {
                            const labels: Record<string, string> = {
                              nism: 'NISM',
                              noKk: 'No. KK',
                              tempatLahir: 'Tempat Lahir',
                              tanggalLahir: 'Tanggal Lahir',
                              gender: 'Gender',
                              pendidikanTerakhir: 'Pendidikan Terakhir',
                              anakKe: 'Anak Ke',
                              dariBersaudara: 'Jumlah Saudara',
                              namaAyah: 'Nama Ayah',
                              nikAyah: 'NIK Ayah',
                              pekerjaanAyah: 'Pekerjaan Ayah',
                              pendidikanAyah: 'Pendidikan Ayah',
                              namaIbu: 'Nama Ibu',
                              nikIbu: 'NIK Ibu',
                              pekerjaanIbu: 'Pekerjaan Ibu',
                              pendidikanIbu: 'Pendidikan Ibu',
                              alamat: 'Alamat',
                              rt: 'RT',
                              rw: 'RW',
                              desa: 'Desa / Kelurahan',
                              kecamatan: 'Kecamatan',
                              kabupaten: 'Kabupaten / Kota',
                              provinsi: 'Provinsi',
                              jarakRumah: 'Jarak Rumah',
                              noHp: 'Nomor HP',
                              statusDomisili: 'Status Domisili',
                              tanggalMasuk: 'Tanggal Masuk',
                              tanggalKeluar: 'Tanggal Keluar',
                              statusVerval: 'Status Verval',
                              catatan: 'Catatan',
                            };
                            return (
                              <label 
                                key={colKey} 
                                className="flex items-center gap-2.5 px-1 py-0.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns[colKey]}
                                  onChange={(e) => {
                                    setVisibleColumns({
                                      ...visibleColumns,
                                      [colKey]: e.target.checked
                                    });
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {labels[colKey] || colKey}
                              </label>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Add Record Button */}
            {isSelectionMode && subTab === 'santri' ? (
              <div className="hidden md:flex items-center justify-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm z-30 w-auto shrink-0 max-w-full overflow-visible scrollbar-none">
                <span className="font-display text-xs font-bold text-slate-700 whitespace-nowrap">
                  {selectedSantriIds.length} terpilih
                </span>
                
                <div className="h-5 w-[1px] bg-slate-200 hidden md:block" />
                <div className="hidden md:flex items-center gap-1.5">
                  {/* Bulk Edit Button */}
                  {canBulkWrite && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSantriIds.length === 0) {
                          alert("Silakan pilih minimal 1 santri untuk diedit masal.");
                          return;
                        }
                        const writableIds = selectedSantriIds.filter(id => {
                          const s = santriList.find(x => x.id === id);
                          if (!s) return false;
                          return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                        });
                        if (writableIds.length === 0) {
                          alert("Anda tidak memiliki izin edit untuk data santri yang terpilih.");
                          return;
                        }
                        if (writableIds.length < selectedSantriIds.length) {
                          alert(`Beberapa santri didepak dari daftar edit masal karena Anda tidak memiliki izin edit.`);
                          setSelectedSantriIds(writableIds);
                        }
                        setIsBulkEditOpen(true);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                      title="Edit Masal"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* Bulk Print Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSantriIds.length === 0) {
                        alert("Silakan pilih minimal 1 santri untuk dicetak masal.");
                        return;
                      }
                      const toPrint = santriList.filter(s => selectedSantriIds.includes(s.id));
                      printBulkSantri(toPrint);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                    title="Print Masal"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  {/* Bulk Delete Button */}
                  {canBulkWrite && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSantriIds.length === 0) {
                          alert("Silakan pilih minimal 1 santri untuk dihapus masal.");
                          return;
                        }
                        const writableIds = selectedSantriIds.filter(id => {
                          const s = santriList.find(x => x.id === id);
                          if (!s) return false;
                          return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                        });
                        if (writableIds.length === 0) {
                          alert("Anda tidak memiliki izin hapus untuk data santri yang terpilih.");
                          return;
                        }
                        setDeleteConfirm({
                          isOpen: true,
                          type: 'bulk',
                          ids: [...writableIds],
                          name: `${writableIds.length} data santri terpilih`
                        });
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                      title="Hapus Masal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Mobile Actions Group */}
                <div className="flex md:hidden items-center gap-2">
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() => setIsMobileBulkOpen(!isMobileBulkOpen)}
                      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Aksi Masal</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileBulkOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isMobileBulkOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setIsMobileBulkOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-40 text-slate-700 font-sans text-left"
                          >
                            {canBulkWrite && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMobileBulkOpen(false);
                                  if (selectedSantriIds.length === 0) {
                                    alert("Silakan pilih minimal 1 santri untuk diedit masal.");
                                    return;
                                  }
                                  const writableIds = selectedSantriIds.filter(id => {
                                    const s = santriList.find(x => x.id === id);
                                    if (!s) return false;
                                    return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                                  });
                                  if (writableIds.length === 0) {
                                    alert("Anda tidak memiliki izin edit untuk data santri yang terpilih.");
                                    return;
                                  }
                                  if (writableIds.length < selectedSantriIds.length) {
                                    alert(`Beberapa santri didepak dari daftar edit masal karena Anda tidak memiliki izin edit.`);
                                    setSelectedSantriIds(writableIds);
                                  }
                                  setIsBulkEditOpen(true);
                                }}
                                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Masal</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileBulkOpen(false);
                                if (selectedSantriIds.length === 0) {
                                  alert("Silakan pilih minimal 1 santri untuk dicetak masal.");
                                  return;
                                }
                                const toPrint = santriList.filter(s => selectedSantriIds.includes(s.id));
                                printBulkSantri(toPrint);
                              }}
                              className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Masal</span>
                            </button>

                            {canBulkWrite && (
                              <>
                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsMobileBulkOpen(false);
                                    if (selectedSantriIds.length === 0) {
                                      alert("Silakan pilih minimal 1 santri untuk dihapus masal.");
                                      return;
                                    }
                                    const writableIds = selectedSantriIds.filter(id => {
                                      const s = santriList.find(x => x.id === id);
                                      if (!s) return false;
                                      return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                                    });
                                    if (writableIds.length === 0) {
                                      alert("Anda tidak memiliki izin hapus untuk data santri yang terpilih.");
                                      return;
                                    }
                                    setDeleteConfirm({
                                      isOpen: true,
                                      type: 'bulk',
                                      ids: [...writableIds],
                                      name: `${writableIds.length} data santri terpilih`
                                    });
                                  }}
                                  className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Masal</span>
                                </button>
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="h-5 w-[1px] bg-slate-200" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedSantriIds([]);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 active:scale-95 transition-all cursor-pointer"
                    title="Batal Pilih"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="hidden md:block h-5 w-[1px] bg-slate-200" />

                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedSantriIds([]);
                  }}
                  className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 active:scale-95 transition-all cursor-pointer"
                  title="Batal Pilih"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              subTab === 'santri' && canWriteCurrentFilter && (
                <button
                  id="btn-add-santri"
                  onClick={() => {
                    setEditingSantri(null);
                    setIsAddSantriOpen(true);
                  }}
                  className="hidden md:flex flex-row flex-[2] sm:flex-none h-11 items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1.5 sm:px-4 font-display text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:scale-95 cursor-pointer"
                  title="Tambah data"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Tambah Data Santri</span>
                  <span className="sm:hidden">Data Santri</span>
                </button>
              )
            )}
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
              className="mt-4 border-t border-slate-100 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status Keanggotaan</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusFilterDropdown(!showStatusFilterDropdown)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all hover:bg-slate-50 whitespace-nowrap ${
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

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status Domisili</label>
                  <div className={`relative ${isDomisiliDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <button
                      type="button"
                      disabled={isDomisiliDisabled}
                      onClick={() => setShowDomisiliFilterDropdown(!showDomisiliFilterDropdown)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all whitespace-nowrap ${
                        isDomisiliDisabled
                          ? 'border-slate-200 bg-slate-100/70 text-slate-400 pointer-events-none'
                          : showDomisiliFilterDropdown
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {isDomisiliDisabled ? 'Tidak Berlaku' : (domisiliFilter === 'semua' ? 'Semua Domisili' : domisiliFilter)}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                    </button>

                    <AnimatePresence>
                      {showDomisiliFilterDropdown && !isDomisiliDisabled && (
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

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Filter Umur</label>
                  <button
                    type="button"
                    onClick={() => setIsAgeModalOpen(true)}
                    className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                      ageFilterConfig.enabled
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {ageFilterConfig.enabled ? (
                          ageFilterConfig.mode === 'exact'
                            ? `Umur: ${ageFilterConfig.exactAge || 0} Thn`
                            : ageFilterConfig.mode === 'min'
                            ? `Umur: ≥ ${ageFilterConfig.minAge || 0} Thn`
                            : ageFilterConfig.mode === 'max'
                            ? `Umur: ≤ ${ageFilterConfig.maxAge || 0} Thn`
                            : `Umur: ${ageFilterConfig.minAge || '0'} - ${ageFilterConfig.maxAge || '∞'} Thn`
                        ) : (
                          'Semua Umur'
                        )}
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                      ageFilterConfig.enabled 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {ageFilterConfig.enabled ? 'Aktif' : 'Atur'}
                    </span>
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    id="btn-reset-filters"
                    onClick={() => {
                      setStatusFilter('semua');
                      setGenderFilter(canViewPutra && canViewPutri ? 'semua' : (canViewPutra ? 'Putra' : 'Putri'));
                      setDomisiliFilter('semua');
                      setSearchQuery('');
                      setAgeFilterConfig(DEFAULT_AGE_FILTER_CONFIG);
                    }}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    Atur Ulang Filter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
      </div>
      )}

      {/* Floating Bulk Actions Bar on Mobile (sticky, always below the search/controls card but remains floating at top when scrolled) */}
      {isSelectionMode && subTab === 'santri' && (
        <div className="md:hidden sticky top-[72px] z-35 w-full px-0 -mt-3 mb-4 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-2xl px-4 py-2.5 shadow-md w-full pointer-events-auto">
            <span className="font-display text-xs font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{selectedSantriIds.length} terpilih</span>
            </span>
            
            <div className="flex items-center gap-2">
              {/* Custom Dropdown Aksi Masal tanpa Icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMobileFloatingDropdownOpen(!isMobileFloatingDropdownOpen)}
                  className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-between gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all select-none"
                >
                  <span>Aksi Masal</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isMobileFloatingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMobileFloatingDropdownOpen && (
                    <>
                      {/* Click outside backdrop overlay */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMobileFloatingDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg z-50 text-slate-700 font-sans text-left"
                      >
                        {canBulkWrite && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileFloatingDropdownOpen(false);
                              if (selectedSantriIds.length === 0) {
                                alert("Silakan pilih minimal 1 santri terlebih dahulu.");
                                return;
                              }
                              const writableIds = selectedSantriIds.filter(id => {
                                const s = santriList.find(x => x.id === id);
                                if (!s) return false;
                                return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                              });
                              if (writableIds.length === 0) {
                                alert("Anda tidak memiliki izin edit untuk data santri yang terpilih.");
                                return;
                              }
                              if (writableIds.length < selectedSantriIds.length) {
                                alert(`Beberapa santri didepak dari daftar edit masal karena Anda tidak memiliki izin edit.`);
                                setSelectedSantriIds(writableIds);
                              }
                              setIsBulkEditOpen(true);
                            }}
                            className="flex w-full items-center px-2.5 py-2 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Ubah Data
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileFloatingDropdownOpen(false);
                            if (selectedSantriIds.length === 0) {
                              alert("Silakan pilih minimal 1 santri terlebih dahulu.");
                              return;
                            }
                            const toPrint = santriList.filter(s => selectedSantriIds.includes(s.id));
                            printBulkSantri(toPrint);
                          }}
                          className="flex w-full items-center px-2.5 py-2 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Cetak Kartu
                        </button>

                        {canBulkWrite && (
                          <>
                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileFloatingDropdownOpen(false);
                                if (selectedSantriIds.length === 0) {
                                  alert("Silakan pilih minimal 1 santri terlebih dahulu.");
                                  return;
                                }
                                const writableIds = selectedSantriIds.filter(id => {
                                  const s = santriList.find(x => x.id === id);
                                  if (!s) return false;
                                  return s.gender === 'Putra' ? canWritePutra : canWritePutri;
                                });
                                if (writableIds.length === 0) {
                                  alert("Anda tidak memiliki izin hapus untuk data santri yang terpilih.");
                                  return;
                                }
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'bulk',
                                  ids: [...writableIds],
                                  name: `${writableIds.length} data santri terpilih`
                                });
                              }}
                              className="flex w-full items-center px-2.5 py-2 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Hapus Data
                            </button>
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-5 w-[1px] bg-slate-200/80" />

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedSantriIds([]);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer text-slate-500"
                title="Batal Pilih"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RENDERER (TABLE, CARD, or OVERVIEW MODE) */}
      <div className="min-h-[400px]">
        {subTab === 'overview' ? (
          <OverviewSubModule santriList={santriList} />
        ) : subTab === 'monitoring' ? (
          <MonitoringSubModule santriList={santriList} />
        ) : (
          filteredSantri.length === 0 ? (
            <EmptyState message="Santri tidak ditemukan dengan kriteria pencarian ini." />
          ) : viewMode === 'table' ? (
            <SantriTableView
              paginatedSantri={paginatedSantri}
              startIndex={startIndex}
              isSelectionMode={isSelectionMode}
              selectedSantriIds={selectedSantriIds}
              setSelectedSantriIds={setSelectedSantriIds}
              visibleColumns={visibleColumns}
              sortKey={sortKey}
              sortDirection={sortDirection}
              setSortKey={setSortKey}
              setSortDirection={setSortDirection}
              setSelectedSantri={setSelectedSantri}
              handleStartEditSantri={handleStartEditSantri}
              handlePrintClick={handlePrintClick}
              handleDeleteClick={handleDeleteClick}
              activeDesktopDropdownId={activeDesktopDropdownId}
              setActiveDesktopDropdownId={setActiveDesktopDropdownId}
              activeSantriDropdownId={activeSantriDropdownId}
              setActiveSantriDropdownId={setActiveSantriDropdownId}
              setIsSelectionMode={setIsSelectionMode}
              canWritePutra={canWritePutra}
              canWritePutri={canWritePutri}
              ageFilterConfig={ageFilterConfig}
              onUpdateSantri={handleUpdateSantriLocal}
              isMonitoringMode={isMonitoringMode}
            />
          ) : (
            <SantriCardView
              paginatedSantri={paginatedSantri}
              isSelectionMode={isSelectionMode}
              selectedSantriIds={selectedSantriIds}
              setSelectedSantriIds={setSelectedSantriIds}
              setSelectedSantri={setSelectedSantri}
              handleStartEditSantri={handleStartEditSantri}
              handlePrintClick={handlePrintClick}
              handleDeleteClick={handleDeleteClick}
              activeSantriDropdownId={activeSantriDropdownId}
              setActiveSantriDropdownId={setActiveSantriDropdownId}
              setIsSelectionMode={setIsSelectionMode}
              canWritePutra={canWritePutra}
              canWritePutri={canWritePutri}
              ageFilterConfig={ageFilterConfig}
              onUpdateSantri={handleUpdateSantriLocal}
            />
          )
        )}
      </div>

      {/* Pagination Controls Footer for Santri only */}
      {subTab === 'santri' && filteredSantri.length > 0 && (
        <div className="flex flex-row items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500 font-medium gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline font-display">Baris per Halaman:</span>
            <span title="Baris per Halaman"><Eye className="h-4 w-4 text-slate-400 sm:hidden shrink-0" /></span>
            <div className="relative shrink-0">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
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
              Menampilkan <b>{startIndex + 1}</b> - <b>{endIndex}</b> dari <b>{totalItems}</b> santri
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 select-none">
            {currentPage > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPageJumpDropdown(!showPageJumpDropdown)}
                className="h-8.5 px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-display text-xs font-bold active:scale-95 transition-all cursor-pointer"
                title="Pilih Halaman"
              >
                <span>{currentPage} / {totalPages}</span>
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
                        {Array.from({ length: totalPages || 1 }).map((_, idx) => {
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
                                  ? 'bg-emerald-50 text-emerald-800 font-bold'
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

            {currentPage < totalPages && totalPages > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals & Popovers */}
      <SantriFormModal
        isOpen={isAddSantriOpen}
        onClose={() => {
          setIsAddSantriOpen(false);
          setEditingSantri(null);
        }}
        editingSantri={editingSantri}
        onAddSantri={handleAddSantriLocal}
        onUpdateSantri={handleUpdateSantriLocal}
        setIsRealImportModalOpen={setIsRealImportModalOpen}
        activeGenderFilter={genderFilter}
        santriList={santriList}
        canWritePutra={canWritePutra}
        canWritePutri={canWritePutri}
      />

      {/* DETAILED BIODATA VIEW MODAL (BIODATA LENGKAP) */}
      <SantriDetailModal 
        selectedSantri={selectedSantri} 
        onClose={() => setSelectedSantri(null)} 
        onUpdateSantri={handleUpdateSantriLocal}
        canWrite={selectedSantri ? (selectedSantri.gender === 'Putri' ? canWritePutri : canWritePutra) : false}
      />

      <PrintTemplate printableSantri={printableSantri} renderSantriAvatar={renderSantriAvatar} />
      <BulkPrintTemplate printableSantriList={printableSantriList} renderSantriAvatar={renderSantriAvatar} />

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedSantriIds={selectedSantriIds}
        santriList={santriList}
        onUpdateSantri={onUpdateSantri}
        setSelectedSantriIds={setSelectedSantriIds}
        setIsSelectionMode={setIsSelectionMode}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        type={deleteConfirm.type}
        name={deleteConfirm.name || ''}
        id={deleteConfirm.id}
        ids={deleteConfirm.ids}
        onDeleteSantri={onDeleteSantri}
        setSelectedSantriIds={setSelectedSantriIds}
        setIsSelectionMode={setIsSelectionMode}
      />

      {/* Modal Import Data Excel */}
      <ImportModal
        isOpen={isRealImportModalOpen}
        onClose={() => setIsRealImportModalOpen(false)}
        onAddSantri={onAddSantri}
        onBulkAddSantri={onBulkAddSantri}
        setIsAddSantriOpen={setIsAddSantriOpen}
        setToastMessage={setToastMessage}
        santriList={santriList}
        onExportExcelXML={handleExportExcelXML}
      />

      {/* Modal Ekspor Data */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        subTab={subTab as any}
        onExportExcel={() => {
          handleExportExcelSantri();
        }}
        onPrintPDF={() => {
          handlePrintPDFSantri();
        }}
      />

      {/* Modal Filter Umur */}
      <AgeFilterModal
        isOpen={isAgeModalOpen}
        onClose={() => setIsAgeModalOpen(false)}
        config={ageFilterConfig}
        onApply={(newConfig) => setAgeFilterConfig(newConfig)}
        onReset={() => setAgeFilterConfig(DEFAULT_AGE_FILTER_CONFIG)}
      />

      {/* Floating Success Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-white border border-emerald-150 px-4 py-3.5 rounded-2xl shadow-xl max-w-sm sm:max-w-md min-w-[280px]"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">Berhasil!</p>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
