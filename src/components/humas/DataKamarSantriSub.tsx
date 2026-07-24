import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { 
  Search, 
  Filter,
  Printer, 
  Download, 
  ArrowLeftRight, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight, 
  X, 
  ChevronDown,
  Eye,
  Info,
  MoreVertical,
  Check,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { Santri, Kompleks, Kamar, Lembaga, Kelas } from '../../types';
import { renderSantriAvatar, getPesantrenProfile } from '../SekretarisHelper';
import SantriDetailModal from '../sekretaris/SantriDetailModal';

interface DataKamarSantriSubProps {
  santriList: Santri[];
  kompleksList: Kompleks[];
  kamarList: Kamar[];
  onUpdateSantriRoom?: (santriId: string, roomText: string, nomorLemari?: string) => void;
  isSelectionMode?: boolean;
  setIsSelectionMode?: (val: boolean) => void;
  canViewPutra?: boolean;
  canViewPutri?: boolean;
  canWritePutra?: boolean;
  canWritePutri?: boolean;
}

export default function DataKamarSantriSub({
  santriList,
  kompleksList,
  kamarList,
  onUpdateSantriRoom,
  isSelectionMode: isSelectionModeProp,
  setIsSelectionMode: setIsSelectionModeProp,
  canViewPutra = true,
  canViewPutri = true,
  canWritePutra = true,
  canWritePutri = true
}: DataKamarSantriSubProps) {

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'Putra' | 'Putri'>('Putra');

  // Synchronize initial gender selection with view permissions
  useEffect(() => {
    if (!canViewPutra && canViewPutri) {
      setGenderFilter('Putri');
    } else if (canViewPutra && !canViewPutri) {
      setGenderFilter('Putra');
    }
  }, [canViewPutra, canViewPutri]);

  const canWriteCurrent = genderFilter === 'Putra' ? canWritePutra : canWritePutri;
  const [kamarStatusFilter, setKamarStatusFilter] = useState<string>('semua');
  const [kompleksFilter, setKompleksFilter] = useState<string>('semua');
  const [kamarFilter, setKamarFilter] = useState<string>('semua');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isKompleksDropdownOpen, setIsKompleksDropdownOpen] = useState(false);
  const [isKamarDropdownOpen, setIsKamarDropdownOpen] = useState(false);
  const [destNomorLemari, setDestNomorLemari] = useState<string>('');

  // Sorting States
  const [sortKey, setSortKey] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load Lembaga and Kelas lists from localStorage to filter properly
  const [lembagasList] = useState<Lembaga[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_lembagas');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [kelasList] = useState<Kelas[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_kelas');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Selection & Bulk Action States
  const [isSelectionModeLocal, setIsSelectionModeLocal] = useState(false);
  const isSelectionMode = isSelectionModeProp !== undefined ? isSelectionModeProp : isSelectionModeLocal;
  const setIsSelectionMode = setIsSelectionModeProp !== undefined ? setIsSelectionModeProp : setIsSelectionModeLocal;
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [actionMenuCoords, setActionMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Move Room Modal States
  const [isMoveRoomModalOpen, setIsMoveRoomModalOpen] = useState(false);
  const [santriToMove, setSantriToMove] = useState<Santri[]>([]);
  const [selectedDestRoomId, setSelectedDestRoomId] = useState<string>('');
  const [selectedDestComplexId, setSelectedDestComplexId] = useState<string>('');

  // Export Dialog state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Confirmation Modal for student room removal
  const [isConfirmRemoveModalOpen, setIsConfirmRemoveModalOpen] = useState(false);
  const [santriToRemove, setSantriToRemove] = useState<Santri[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPageJumpDropdown, setShowPageJumpDropdown] = useState(false);

  // Detail Modal State
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  // Reset page and selection when search, gender, or filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSantriIds([]);
    setIsSelectionMode(false);
  }, [searchQuery, genderFilter, kamarStatusFilter, kompleksFilter, kamarFilter]);

  // Handle Toast Auto Dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Format Room: complex name + room name
  const getKamarFormat = (s: Santri) => {
    if (!s.kamar || s.kamar.trim() === '' || s.kamar.toLowerCase() === 'belum ada' || s.kamar.toLowerCase() === 'belum dapat') {
      return null;
    }
    
    // Find matching room by name
    const room = kamarList.find(r => r.nama && s.kamar && r.nama.toLowerCase() === s.kamar.toLowerCase());
    if (room) {
      const complex = kompleksList.find(k => k.id === room.kompleksId);
      if (complex) {
        let compName = complex.nama;
        // Clean up "Kompleks " prefix and "(Putra)"/"(Putri)" suffix
        compName = compName.replace(/^Kompleks\s+/i, '').replace(/\s*\((Putra|Putri)\)$/i, '');
        
        const cleanRoom = room.nama.trim();
        const cleanComp = compName.trim();
        
        // Avoid repeating name if room name already starts with complex name
        if (cleanRoom.toLowerCase().startsWith(cleanComp.toLowerCase())) {
          return cleanRoom;
        } else {
          return `${cleanComp} ${cleanRoom}`;
        }
      }
    }
    return s.kamar; // Fallback to raw string
  };

  // Combine Desa, Kecamatan, Kabupaten into one string format "desa, kecamatan, kabupaten"
  const getFormattedAlamat = (s: Santri) => {
    const parts = [s.desa, s.kecamatan, s.kabupaten].filter(Boolean).map(x => x!.trim());
    if (parts.length === 0) {
      return s.alamat || s.asal || '-';
    }
    return parts.join(', ');
  };

  // Filter students based on search and selected filters
  const filteredSantri = santriList.filter(s => {
    // 0. Filter out Alumni and Kampung (Non-Asrama)
    if (s.statusKeanggotaan === 'Alumni' || s.statusDomisili === 'Kampung') {
      return false;
    }

    // 1. Gender Filter (Switch as filter)
    if (s.gender !== genderFilter) {
      return false;
    }

    // 2. Search Query
    const formattedRoom = getKamarFormat(s) || 'Belum Mendapatkan Kamar';
    const matchesSearch = 
      (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (getFormattedAlamat(s) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nomorLemari || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      formattedRoom.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Status Tergabung Kamar Filter
    const hasRoom = s.kamar && s.kamar.trim() !== '' && s.kamar.toLowerCase() !== 'belum ada' && s.kamar.toLowerCase() !== 'belum dapat';
    if (kamarStatusFilter === 'sudah' && !hasRoom) {
      return false;
    }
    if (kamarStatusFilter === 'belum' && hasRoom) {
      return false;
    }

    // Only apply Filter 2 & 3 if Filter 1 is NOT 'belum'
    if (kamarStatusFilter !== 'belum') {
      // 4. Kompleks Filter
      if (kompleksFilter !== 'semua') {
        if (!s.kamar) return false;
        const matchingKamar = kamarList.find(r => r.nama && s.kamar && r.nama.toLowerCase() === s.kamar.toLowerCase());
        if (!matchingKamar || matchingKamar.kompleksId !== kompleksFilter) {
          return false;
        }
      }

      // 5. Kamar Filter
      if (kamarFilter !== 'semua') {
        if (!s.kamar || s.kamar.toLowerCase() !== kamarFilter.toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort filtered list dynamically
  const sortedSantri = [...filteredSantri].sort((a, b) => {
    let comparison = 0;
    if (sortKey === 'nama') {
      comparison = a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base', numeric: true });
    } else if (sortKey === 'nis') {
      const nisA = a.nis || '';
      const nisB = b.nis || '';
      comparison = nisA.localeCompare(nisB, 'id', { sensitivity: 'base', numeric: true });
    } else if (sortKey === 'alamat') {
      const addrA = getFormattedAlamat(a);
      const addrB = getFormattedAlamat(b);
      comparison = addrA.localeCompare(addrB, 'id', { sensitivity: 'base', numeric: true });
    } else if (sortKey === 'kamar') {
      const roomA = getKamarFormat(a) || '';
      const roomB = getKamarFormat(b) || '';
      comparison = roomA.localeCompare(roomB, 'id', { sensitivity: 'base', numeric: true });
    } else if (sortKey === 'nomorLemari') {
      const lemariA = a.nomorLemari || '';
      const lemariB = b.nomorLemari || '';
      comparison = lemariA.localeCompare(lemariB, 'id', { sensitivity: 'base', numeric: true });
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination calculation
  const totalItems = sortedSantri.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSantri = sortedSantri.slice(startIndex, endIndex);

  // Count unassigned students for the current gender Filter (excluding Alumni and Kampung)
  const unassignedSantriCount = santriList.filter(s => 
    s.gender === genderFilter && 
    s.statusKeanggotaan !== 'Alumni' && 
    s.statusDomisili !== 'Kampung' &&
    (!s.kamar || s.kamar.trim() === '' || s.kamar.toLowerCase() === 'belum ada' || s.kamar.toLowerCase() === 'belum dapat')
  ).length;

  // Excel Export Handler (XML Format compatible with Excel)
  const handleExportExcel = () => {
    const headers = ['No', 'Nama Lengkap', 'NIS', 'Gender', 'Alamat', 'Kamar Santri', 'No. Lemari'];
    const rows = sortedSantri.map((s, idx) => {
      const formattedRoom = getKamarFormat(s);
      return [
        String(idx + 1),
        s.nama,
        s.nis || '-',
        s.gender,
        getFormattedAlamat(s),
        formattedRoom || 'Belum Mendapatkan Kamar',
        s.nomorLemari || '-'
      ];
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
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7C3AED"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7C3AED"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7C3AED"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7C3AED"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#7C3AED" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Data Kamar Santri">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="200"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="250"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Row ss:Height="26">`;

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
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Data_Kamar_Santri_${genderFilter}_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Handler
  const handlePrintPDF = () => {
    const profile = getPesantrenProfile();
    if (sortedSantri.length === 0) {
      alert('Tidak ada data santri untuk dicetak.');
      return;
    }

    let html = `
      <html>
      <head>
        <title>LAPORAN PENEMPATAN KAMAR SANTRI ${genderFilter.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body { 
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            color: #1e293b; 
            padding: 20px; 
            font-size: 11px;
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #6d28d9; 
            text-align: center; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            text-align: center;
            margin-top: 5px;
            text-transform: uppercase;
          }
          .meta { 
            font-size: 10px; 
            color: #64748b; 
            text-align: center; 
            margin-bottom: 20px; 
            margin-top: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            margin-bottom: 25px; 
          }
          th, td { 
            border: 1px solid #cbd5e1; 
            padding: 8px 10px; 
            text-align: left;
            font-size: 10px; 
          }
          th { 
            background-color: #6d28d9 !important; 
            font-weight: bold; 
            color: #ffffff !important; 
            text-align: center;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .text-center {
            text-align: center;
          }
          .font-mono {
            font-family: monospace;
          }
          .badge-unassigned {
            color: #b91c1c;
            font-weight: bold;
          }
          .footer-signs {
            display: flex; 
            justify-content: space-between; 
            margin-top: 40px; 
            font-size: 11px;
          }
          .sign-box {
            text-align: center; 
            width: 250px;
          }
          .sign-title {
            color: #475569; 
            margin-bottom: 60px;
          }
          .sign-name {
            font-weight: bold; 
            border-bottom: 1px solid #94a3b8; 
            display: inline-block; 
            padding: 0 15px 2px 15px;
          }
          .sign-desc {
            color: #64748b; 
            margin-top: 4px; 
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="title">LAPORAN DATA KAMAR SANTRI ${genderFilter.toUpperCase()}</div>
        <div class="subtitle">${profile.namaPesantren.toUpperCase()}</div>
        <div class="meta">Jumlah: ${sortedSantri.length} Santri • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} • Filter: Gender ${genderFilter}</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">No</th>
              <th style="width: 32%;">Nama Lengkap</th>
              <th style="width: 8%; text-align: center;">NIS</th>
              <th style="width: 27%;">Alamat</th>
              <th style="width: 18%;">Kamar</th>
              <th style="width: 10%; text-align: center;">No. Lemari</th>
            </tr>
          </thead>
          <tbody>
            ${sortedSantri.map((s, idx) => {
              const formattedRoom = getKamarFormat(s);
              const roomHtml = formattedRoom 
                ? `<span>${formattedRoom}</span>` 
                : `<span class="badge-unassigned">Belum Mendapatkan Kamar</span>`;
              return `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td style="font-weight: 600;">${s.nama}</td>
                  <td class="text-center font-mono">${s.nis || '-'}</td>
                  <td>${getFormattedAlamat(s)}</td>
                  <td style="font-weight: 500;">${roomHtml}</td>
                  <td class="text-center font-mono" style="font-weight: 500;">${s.nomorLemari || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer-signs">
          <div class="sign-box">
            <p class="sign-title">Mengetahui,<br/>Kepala Bidang Humas,</p>
            <div class="sign-name">Ustadz Farhan Kamil, M.Pd.</div>
            <p class="sign-desc">Layanan Hubungan Masyarakat</p>
          </div>
          <div class="sign-box">
            <p class="sign-title">${profile.kotaTandaTangan}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br />Sekretaris,</p>
            <div class="sign-name">${profile.namaSekretaris}</div>
            <p class="sign-desc">Sekretariat Pondok Pesantren</p>
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
      alert('Gagal membuka jendela cetak. Jendela pop-up mungkin diblokir oleh peramban Anda.');
    }
  };

  // Move Room Confirmation
  const handleConfirmMoveRoom = () => {
    if (!selectedDestRoomId) return;
    
    santriToMove.forEach(s => {
      onUpdateSantriRoom?.(s.id, selectedDestRoomId, destNomorLemari || undefined);
    });

    setToast({
      message: `${santriToMove.length} santri berhasil dipindahkan ke kamar "${selectedDestRoomId}".`,
      type: 'success'
    });

    setIsMoveRoomModalOpen(false);
    setSelectedDestRoomId('');
    setSelectedDestComplexId('');
    setDestNomorLemari('');
    setSantriToMove([]);
    setSelectedSantriIds([]);
    setIsSelectionMode(false);
  };

  // Remove single student from room
  const handleRemoveFromRoom = (s: Santri) => {
    setSantriToRemove([s]);
    setIsConfirmRemoveModalOpen(true);
  };

  // Remove multiple students from room
  const handleBulkRemoveFromRoom = () => {
    const selectedStudents = sortedSantri.filter(s => selectedSantriIds.includes(s.id));
    if (selectedStudents.length === 0) return;
    setSantriToRemove(selectedStudents);
    setIsConfirmRemoveModalOpen(true);
  };

  // Actual execution after confirmation
  const executeRemoveFromRoom = () => {
    if (santriToRemove.length === 0) return;
    santriToRemove.forEach(s => {
      onUpdateSantriRoom?.(s.id, "");
    });

    setToast({
      message: santriToRemove.length === 1
        ? `${santriToRemove[0].nama} berhasil dikeluarkan dari kamar.`
        : `${santriToRemove.length} santri berhasil dikeluarkan dari kamar.`,
      type: 'success'
    });

    if (santriToRemove.length > 1) {
      setSelectedSantriIds([]);
      setIsSelectionMode(false);
    } else {
      setSelectedSantriIds(prev => prev.filter(id => !santriToRemove.some(r => r.id === id)));
    }

    setIsConfirmRemoveModalOpen(false);
    setSantriToRemove([]);
    setActiveActionMenuId(null);
    setActionMenuCoords(null);
  };

  const renderSortHeader = (key: string, label: string, isSticky: boolean = false, extraClasses: string = '') => {
    const isSorted = sortKey === key;
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
        className={`px-6 py-4 cursor-pointer transition-all select-none font-display text-xs font-bold uppercase tracking-wider hover:bg-slate-100 ${
          isSticky 
            ? `static sm:sticky bg-slate-50 hover:bg-slate-100 z-20 ${extraClasses}` 
            : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 justify-start">
          <span className="text-current">{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-purple-700 shrink-0 font-bold font-sans" />
            ) : (
              <ArrowDown className="h-3 w-3 text-purple-700 shrink-0 font-bold font-sans" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {toast.type === 'success' ? (
                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
              ) : (
                <div className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">!</div>
              )}
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header with Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Data Kamar Santri</span>
            <span 
              onClick={() => {
                if (isSelectionMode) return;
                if (canViewPutra && canViewPutri) {
                  setGenderFilter(genderFilter === 'Putra' ? 'Putri' : 'Putra');
                  setSelectedSantriIds([]);
                  setIsSelectionMode(false);
                }
              }}
              className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                isSelectionMode 
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : canViewPutra && canViewPutri
                  ? 'cursor-pointer active:scale-95'
                  : 'cursor-default'
              } ${
                !isSelectionMode && genderFilter === 'Putra' 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : !isSelectionMode && genderFilter === 'Putri'
                  ? 'text-rose-600 hover:text-rose-700'
                  : ''
              }`}
              title={isSelectionMode ? "Matikan mode pilih untuk mengubah gender" : canViewPutra && canViewPutri ? "Klik untuk mengubah filter gender (Putra ⇄ Putri)" : undefined}
            >
              <span>{genderFilter}</span>
              {canViewPutra && canViewPutri && <ArrowLeftRight className="h-5 w-5 mt-0.5" />}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Menampilkan direktori penempatan asrama dan kamar santri <span className={genderFilter === 'Putra' ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}>{genderFilter}</span> secara terpusat.
          </p>
        </div>
      </div>

      {/* Warning Box for Unassigned Students */}
      {unassignedSantriCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Info className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Ada {unassignedSantriCount} santri {genderFilter.toLowerCase()} yang belum mendapatkan kamar!
              </p>
              <p className="text-xs font-semibold text-amber-700/80 mt-0.5">
                Segera tempatkan mereka ke kompleks dan kamar yang tersedia agar pendataan tertib.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setKamarStatusFilter('belum');
              setKompleksFilter('semua');
              setKamarFilter('semua');
              setShowFilters(true);
              
              // Trigger flash
              setIsFlashing(true);
              setTimeout(() => {
                setIsFlashing(false);
              }, 2000);

              // Scroll to table smoothly
              const element = document.getElementById('kamar-santri-table-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex h-9 px-4 items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shadow-amber-600/10 active:scale-95 cursor-pointer border-none"
          >
            Tempatkan Sekarang
          </button>
        </motion.div>
      )}

      {/* Search and Filters Box */}
      <div className="sticky top-16 z-[45] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-md sm:p-5">
        <div className="flex items-center gap-2">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIS, alamat, nomor lemari, atau nama kamar..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-4 flex items-center justify-center gap-1.5 rounded-xl border font-display text-xs font-bold transition-all hover:bg-slate-50 shrink-0 cursor-pointer ${
              showFilters || kamarStatusFilter !== 'semua' || kompleksFilter !== 'semua' || kamarFilter !== 'semua'
                ? 'border-purple-200 bg-purple-50/30 text-purple-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
            title="Saring Data"
          >
            <Filter className="h-4 w-4 text-current" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Export Button - Far Right, Icon Only */}
          <button
            onClick={() => {
              if (isSelectionMode) return;
              setIsExportModalOpen(true);
            }}
            disabled={isSelectionMode}
            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all outline-none border shrink-0 ${
              isSelectionMode
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 cursor-pointer'
            }`}
            title={isSelectionMode ? "Matikan mode pilih untuk mengekspor data" : "Ekspor Data Kamar Santri"}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Pilih or Dynamic Actions Bar */}
        {isSelectionMode && (
          <div className="mt-3 flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 md:gap-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm h-11">
            <span className="font-display text-xs font-bold text-slate-700 whitespace-nowrap px-1">
              {selectedSantriIds.length} terpilih
            </span>
            
            <div className="h-5 w-[1px] bg-slate-200" />
            
            <div className="flex items-center gap-1.5">
              {/* Bulk Move Kamar */}
              <button
                type="button"
                onClick={() => {
                  if (selectedSantriIds.length === 0) {
                    alert("Silakan pilih minimal 1 santri untuk dipindahkan.");
                    return;
                  }
                  const toMove = sortedSantri.filter(s => selectedSantriIds.includes(s.id));
                  setSantriToMove(toMove);
                  setSelectedDestRoomId('');
                  setDestNomorLemari('');
                  setIsMoveRoomModalOpen(true);
                }}
                className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 active:scale-95 transition-all cursor-pointer font-bold text-xs border-none"
                title="Pindah Kamar Masal"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pindah Kamar</span>
              </button>

              {/* Bulk Keluarkan */}
              <button
                type="button"
                onClick={() => {
                  if (selectedSantriIds.length === 0) {
                    alert("Silakan pilih minimal 1 santri untuk dikeluarkan.");
                    return;
                  }
                  handleBulkRemoveFromRoom();
                }}
                className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer font-bold text-xs border-none"
                title="Keluarkan Masal"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluarkan</span>
              </button>

              <div className="h-5 w-[1px] bg-slate-200" />

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSantriIds([]);
                  setIsSelectionMode(false);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                title="Batal Pilih"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters Panel with cascading logic (Disabled when 'Belum' is chosen) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ease: 'linear', duration: 0.05 }}
              className="mt-4 border-t border-slate-100 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Status Tergabung Kamar */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Penempatan</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                        isStatusDropdownOpen
                          ? 'border-purple-200 bg-purple-50 text-purple-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span>
                        {kamarStatusFilter === 'semua'
                          ? 'Semua Status Kamar'
                          : kamarStatusFilter === 'sudah'
                          ? 'Sudah Dapat Kamar'
                          : 'Belum Dapat Kamar ⚠️'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                    </button>

                    <AnimatePresence>
                      {isStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[110]"
                            onClick={() => setIsStatusDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 mt-2 w-full min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl z-[120] text-slate-700 font-sans"
                          >
                            <div className="space-y-1">
                              {[
                                { value: 'semua', label: 'Semua Status Kamar' },
                                { value: 'sudah', label: 'Sudah Dapat Kamar' },
                                { value: 'belum', label: 'Belum Dapat Kamar ⚠️' }
                              ].map((opt) => {
                                const isActive = kamarStatusFilter === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setKamarStatusFilter(opt.value);
                                      if (opt.value === 'belum') {
                                        setKompleksFilter('semua');
                                        setKamarFilter('semua');
                                      }
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      isActive
                                        ? 'bg-purple-50 text-purple-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isActive && <Check className="h-3.5 w-3.5 text-purple-700 shrink-0" />}
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

                {/* 2. Kompleks (Nonaktif if 'belum' is active) */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    kamarStatusFilter === 'belum' ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    Kompleks Asrama
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={kamarStatusFilter === 'belum'}
                      onClick={() => setIsKompleksDropdownOpen(!isKompleksDropdownOpen)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all whitespace-nowrap ${
                        kamarStatusFilter === 'belum'
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                          : isKompleksDropdownOpen
                          ? 'border-purple-200 bg-purple-50 text-purple-800 cursor-pointer'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <span>
                        {kompleksFilter === 'semua'
                          ? 'Semua Kompleks'
                          : kompleksList.find(c => c.id === kompleksFilter)?.nama || kompleksFilter}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                    </button>

                    <AnimatePresence>
                      {isKompleksDropdownOpen && kamarStatusFilter !== 'belum' && (
                        <>
                          <div
                            className="fixed inset-0 z-[110]"
                            onClick={() => setIsKompleksDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 mt-2 w-full min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl z-[120] text-slate-700 font-sans"
                          >
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setKompleksFilter('semua');
                                  setKamarFilter('semua');
                                  setIsKompleksDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                  kompleksFilter === 'semua'
                                    ? 'bg-purple-50 text-purple-800 font-bold'
                                    : 'hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <span>Semua Kompleks</span>
                                {kompleksFilter === 'semua' && <Check className="h-3.5 w-3.5 text-purple-700 shrink-0" />}
                              </button>
                              {kompleksList
                                .filter(c => !c.gender || c.gender === genderFilter)
                                .map(comp => {
                                  const isActive = kompleksFilter === comp.id;
                                  return (
                                    <button
                                      key={comp.id}
                                      type="button"
                                      onClick={() => {
                                        setKompleksFilter(comp.id);
                                        setKamarFilter('semua');
                                        setIsKompleksDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                        isActive
                                          ? 'bg-purple-50 text-purple-800 font-bold'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{comp.nama}</span>
                                      {isActive && <Check className="h-3.5 w-3.5 text-purple-700 shrink-0" />}
                                    </button>
                                  );
                                })
                              }
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. Kamar (Nonaktif if 'belum' is active) */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    kamarStatusFilter === 'belum' ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    Nama Kamar
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={kamarStatusFilter === 'belum'}
                      onClick={() => setIsKamarDropdownOpen(!isKamarDropdownOpen)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all whitespace-nowrap ${
                        kamarStatusFilter === 'belum'
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                          : isKamarDropdownOpen
                          ? 'border-purple-200 bg-purple-50 text-purple-800 cursor-pointer'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <span>
                        {kamarFilter === 'semua' ? 'Semua Kamar' : kamarFilter}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                    </button>

                    <AnimatePresence>
                      {isKamarDropdownOpen && kamarStatusFilter !== 'belum' && (
                        <>
                          <div
                            className="fixed inset-0 z-[110]"
                            onClick={() => setIsKamarDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 mt-2 w-full min-w-[200px] rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl z-[120] text-slate-700 font-sans"
                          >
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setKamarFilter('semua');
                                  setIsKamarDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                  kamarFilter === 'semua'
                                    ? 'bg-purple-50 text-purple-800 font-bold'
                                    : 'hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <span>Semua Kamar</span>
                                {kamarFilter === 'semua' && <Check className="h-3.5 w-3.5 text-purple-700 shrink-0" />}
                              </button>
                              {kamarList
                                .filter(r => {
                                  const complex = kompleksList.find(c => c.id === r.kompleksId);
                                  const matchesGender = complex && complex.gender === genderFilter;
                                  const matchesKompleks = kompleksFilter === 'semua' || r.kompleksId === kompleksFilter;
                                  return matchesGender && matchesKompleks;
                                })
                                .map(r => {
                                  const isActive = kamarFilter.toLowerCase() === r.nama.toLowerCase();
                                  return (
                                    <button
                                      key={r.id}
                                      type="button"
                                      onClick={() => {
                                        setKamarFilter(r.nama);
                                        setIsKamarDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                        isActive
                                          ? 'bg-purple-50 text-purple-800 font-bold'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{r.nama}</span>
                                      {isActive && <Check className="h-3.5 w-3.5 text-purple-700 shrink-0" />}
                                    </button>
                                  );
                                })
                              }
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              {/* Reset Filters Option */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setKamarStatusFilter('semua');
                    setKompleksFilter('semua');
                    setKamarFilter('semua');
                    setSearchQuery('');
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Atur Ulang Filter
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Main Table View with sticky header & column freeze exactly like data induk */}
      <div id="kamar-santri-table-section" className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-thin">
        {sortedSantri.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-100">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="font-display text-sm font-bold text-slate-700">Tidak Ada Data Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5">
              Santri {genderFilter} tidak ditemukan dengan kata kunci pencarian atau kriteria filter yang sedang aktif.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-left text-sm text-slate-600 min-w-[1000px]">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  
                  {/* Sticky Checklist Column */}
                  {isSelectionMode && (
                    <th className="px-3 py-4 text-center sticky left-0 bg-slate-50 z-30 border-r border-slate-100 w-12 min-w-[48px]">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
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
                    </th>
                  )}

                  {/* Sticky No Column */}
                  <th className={`px-4 py-4 static sm:sticky ${
                    isSelectionMode ? 'sm:left-12' : 'sm:left-0'
                  } bg-slate-50 z-20 sm:shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-100 text-center w-16 min-w-[64px] font-display text-xs font-bold uppercase tracking-wider text-slate-400`}>
                    No.
                  </th>

                  {/* Sticky Nama Lengkap Column */}
                  {renderSortHeader('nama', 'Nama Lengkap', true, isSelectionMode ? 'sm:left-28 sm:shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-100 min-w-[240px]' : 'sm:left-16 sm:shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-100 min-w-[240px]')}

                  {/* Rest of non-sticky columns */}
                  {renderSortHeader('nis', 'NIS')}
                  {renderSortHeader('alamat', 'Alamat')}
                  {renderSortHeader('kamar', 'Kamar')}
                  {renderSortHeader('nomorLemari', 'No. Lemari')}

                  {/* Sticky Aksi Column - On the right side */}
                  <th className="px-2 py-4 text-center w-12 bg-slate-50 font-display text-xs font-bold uppercase tracking-wider text-slate-400 sticky right-0 z-30 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] border-l border-slate-100">
                    Aksi
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSantri.map((s, idx) => {
                  const formattedRoom = getKamarFormat(s);
                  const isSelected = selectedSantriIds.includes(s.id);

                  return (
                    <tr 
                      key={`${s.id}-${idx}`} 
                      onClick={() => {
                        if (isSelectionMode) {
                          if (isSelected) {
                            setSelectedSantriIds(selectedSantriIds.filter(id => id !== s.id));
                          } else {
                            setSelectedSantriIds([...selectedSantriIds, s.id]);
                          }
                        }
                      }}
                      className={`transition-all group duration-300 ${
                        isSelectionMode ? 'cursor-pointer' : ''
                      } ${
                        isFlashing
                          ? 'bg-amber-100/80 animate-pulse'
                          : isSelectionMode && isSelected
                          ? 'bg-purple-50/60 hover:bg-purple-100/60'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      
                      {/* Sticky Checklist Cell */}
                      {isSelectionMode && (
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-4 text-center sticky left-0 transition-colors z-10 border-r border-slate-100 w-12 min-w-[48px] ${
                            isSelected ? 'bg-purple-50' : 'bg-white group-hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSantriIds([...selectedSantriIds, s.id]);
                                } else {
                                  setSelectedSantriIds(selectedSantriIds.filter(id => id !== s.id));
                                }
                              }}
                            />
                          </div>
                        </td>
                      )}

                      {/* Sticky No Cell */}
                      <td className={`px-4 py-4 static sm:sticky ${
                        isSelectionMode ? 'sm:left-12' : 'sm:left-0'
                      } transition-colors z-10 sm:shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 text-center font-mono text-xs font-semibold ${
                        isFlashing
                          ? 'bg-amber-100/80 text-amber-900 font-bold'
                          : isSelectionMode && isSelected
                          ? 'bg-purple-50 text-purple-800 font-bold'
                          : 'bg-white text-slate-500 group-hover:bg-slate-50'
                      }`}>
                        {startIndex + idx + 1}
                      </td>

                      {/* Sticky Nama Lengkap Cell */}
                      <td className={`px-6 py-4 static sm:sticky ${
                        isSelectionMode ? 'sm:left-28' : 'sm:left-16'
                      } transition-colors z-10 sm:shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-50 min-w-[240px] ${
                        isFlashing
                          ? 'bg-amber-100/80'
                          : isSelectionMode && isSelected
                          ? 'bg-purple-50'
                          : 'bg-white group-hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          {renderSantriAvatar(s, "h-9 w-9 shrink-0 rounded-full border border-slate-100 shadow-xs")}
                          <p className="font-display text-sm font-bold text-slate-900 leading-tight">
                            {s.nama}
                          </p>
                        </div>
                      </td>

                      {/* NIS Cell */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                        {s.nis || '-'}
                      </td>

                      {/* Combined Alamat Cell */}
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate" title={getFormattedAlamat(s)}>
                        {getFormattedAlamat(s)}
                      </td>

                      {/* Kamar Cell (Without green pulsing dot) */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {formattedRoom ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl">
                            {formattedRoom}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-extrabold text-rose-700 uppercase tracking-wider border border-rose-100 animate-pulse">
                            Belum Dapat Kamar
                          </span>
                        )}
                      </td>

                      {/* Nomor Lemari Cell */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                        {s.nomorLemari || '-'}
                      </td>

                      {/* Sticky Aksi Column with 3-Dots Dropdown Menu */}
                      <td className={`px-2 py-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] w-12 min-w-[48px] ${
                        activeActionMenuId === s.id ? 'z-30' : 'z-20'
                      }`}>
                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          {!canWriteCurrent ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSantri(s)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-650 cursor-pointer border-none bg-transparent"
                              title="Lihat Biodata Lengkap"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="relative inline-block text-left animate-none">
                              <button
                                type="button"
                                disabled={isSelectionMode}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActionMenuCoords({
                                    top: rect.bottom,
                                    left: rect.right
                                  });
                                  setActiveActionMenuId(activeActionMenuId === s.id ? null : s.id);
                                }}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors border-none bg-transparent ${
                                  isSelectionMode
                                    ? 'text-slate-300 opacity-30 cursor-not-allowed'
                                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer'
                                }`}
                                title={isSelectionMode ? "Matikan mode pilih untuk melihat aksi" : "Aksi Santri"}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {activeActionMenuId === s.id && actionMenuCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  {/* Backdrop overlay with extremely high z-index */}
                                  <div 
                                    className="fixed inset-0 z-[999998] cursor-default bg-transparent" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setActionMenuCoords(null);
                                    }}
                                  />
                                  {/* Floating Dropdown with extremely high z-index */}
                                  <div 
                                    className="fixed w-32 rounded-xl border border-slate-100 bg-white shadow-2xl p-1.5 z-[999999] text-left font-sans"
                                    style={{
                                      top: `${actionMenuCoords.top + 4}px`,
                                      left: `${actionMenuCoords.left - 128}px`
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="space-y-0.5">
                                      {/* Biodata option (Details) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setActionMenuCoords(null);
                                          setSelectedSantri(s);
                                        }}
                                        className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                                      >
                                        <span>Biodata</span>
                                      </button>

                                      {/* Pilih option */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setActionMenuCoords(null);
                                          setIsSelectionMode(true);
                                          if (selectedSantriIds.includes(s.id)) {
                                            setSelectedSantriIds(selectedSantriIds.filter(id => id !== s.id));
                                          } else {
                                            setSelectedSantriIds([...selectedSantriIds, s.id]);
                                          }
                                        }}
                                        className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                                      >
                                        <span>Pilih</span>
                                      </button>

                                      {/* Pindah option */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setActionMenuCoords(null);
                                          setSantriToMove([s]);
                                          const roomObj = kamarList.find(r => r.nama.toLowerCase() === (s.kamar || '').toLowerCase());
                                          setSelectedDestComplexId(roomObj ? roomObj.kompleksId : '');
                                          setSelectedDestRoomId(s.kamar || '');
                                          setDestNomorLemari(s.nomorLemari || '');
                                          setIsMoveRoomModalOpen(true);
                                        }}
                                        className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                                      >
                                        <span>Pindah</span>
                                      </button>

                                      {/* Keluarkan option */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setActionMenuCoords(null);
                                          handleRemoveFromRoom(s);
                                        }}
                                        disabled={!s.kamar || s.kamar.toLowerCase() === 'belum ada' || s.kamar.toLowerCase() === 'belum dapat'}
                                        className="flex w-full items-center px-3 py-2 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:pointer-events-none transition-colors border-none bg-transparent cursor-pointer"
                                      >
                                        <span>Keluarkan</span>
                                      </button>
                                    </div>
                                  </div>
                                </>,
                                document.body
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {sortedSantri.length > 0 && (
        <div className="flex flex-row items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500 font-medium gap-2 select-none">
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
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 focus:border-purple-500 focus:outline-none cursor-pointer"
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

          <div className="flex items-center gap-1 sm:gap-2">
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
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-16 rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-50 text-slate-700"
                    >
                      <div className="space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin">
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
                              className={`w-full text-center py-1.5 rounded-lg text-xs font-semibold transition-colors border-none bg-transparent cursor-pointer ${
                                isActive
                                  ? 'bg-purple-50 text-purple-800 font-bold'
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
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(totalPages)}
              className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reusable Student Detailed Biodata Modal */}
      <SantriDetailModal
        selectedSantri={selectedSantri}
        onClose={() => setSelectedSantri(null)}
      />

      {/* Combined Export Modal - Styled exactly like other export screens */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsExportModalOpen(false)}
          />
          {/* Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50 text-slate-700 font-sans"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-6">
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Ekspor Data Kamar Santri
                </h3>
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-5">
                Pilih format keluaran untuk data kamar santri {genderFilter} yang sedang aktif terfilter.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Pilihan 1: Excel */}
                <button
                  onClick={() => {
                    handleExportExcel();
                    setIsExportModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all duration-250 cursor-pointer text-left outline-none bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-center">Ekspor Excel</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">Format .XLS (Terfilter)</p>
                  </div>
                </button>

                {/* Pilihan 2: PDF / Print */}
                <button
                  onClick={() => {
                    handlePrintPDF();
                    setIsExportModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/20 group transition-all duration-250 cursor-pointer text-left outline-none bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 group-hover:scale-110 transition-transform">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-rose-800 transition-colors text-center">Cetak PDF</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">Tampilan Cetak (Terfilter)</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Pindah Kamar Modal */}
      {isMoveRoomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMoveRoomModalOpen(false)}
          />
          {/* Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50 text-slate-700 font-sans"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-display text-lg font-bold text-slate-950">
                  {santriToMove.length > 1 ? `Pindahkan ${santriToMove.length} Santri` : `Pindahkan Kamar - ${santriToMove[0]?.nama}`}
                </h3>
                <button 
                  onClick={() => setIsMoveRoomModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Pilih kompleks asrama dan kamar baru untuk santri {genderFilter}.
              </p>

              <div className="space-y-4">
                {/* Kompleks Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kompleks</label>
                  <select
                    value={selectedDestComplexId}
                    onChange={(e) => {
                      setSelectedDestComplexId(e.target.value);
                      setSelectedDestRoomId('');
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Kompleks --</option>
                    {kompleksList
                      .filter(c => c.gender === genderFilter)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nama}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Kamar Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kamar yang Tersedia</label>
                  <select
                    value={selectedDestRoomId}
                    onChange={(e) => setSelectedDestRoomId(e.target.value)}
                    disabled={!selectedDestComplexId}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDestComplexId ? '-- Pilih Kamar --' : 'Pilih kompleks asrama terlebih dahulu'}
                    </option>
                    {kamarList
                      .filter(r => r.kompleksId === selectedDestComplexId)
                      .map(r => {
                        const currentOccupants = santriList.filter(s => 
                          s.kamar && 
                          s.kamar.toLowerCase() === r.nama.toLowerCase() &&
                          !santriToMove.some(m => m.id === s.id)
                        ).length;
                        const isFull = r.kapasitas ? currentOccupants >= r.kapasitas : false;
                        const capacityLabel = r.kapasitas ? `${currentOccupants}/${r.kapasitas}` : `${currentOccupants}/∞`;
                        return (
                          <option key={r.id} value={r.nama} disabled={isFull}>
                            {r.nama} {isFull ? '(Penuh)' : `(${capacityLabel})`}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Nomor Lemari Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nomor Lemari (Opsional)</label>
                  <input
                    type="text"
                    value={destNomorLemari}
                    onChange={(e) => setDestNomorLemari(e.target.value)}
                    placeholder="Contoh: L-01, Lemari 2, dsb."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoveRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMoveRoom}
                  disabled={!selectedDestRoomId}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Simpan Penempatan
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Removing Students from Room */}
      {isConfirmRemoveModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              setIsConfirmRemoveModalOpen(false);
              setSantriToRemove([]);
            }}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                {/* Warning icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-100 animate-pulse">
                  <X className="h-6 w-6 stroke-[3]" />
                </div>
                
                <h3 className="font-display text-lg font-bold text-slate-800">
                  Konfirmasi Keluarkan Santri
                </h3>
                
                <div className="text-xs text-slate-500 font-semibold mt-2 max-w-xs leading-relaxed">
                  {santriToRemove.length === 1 ? (
                    <p>Apakah Anda yakin ingin mengeluarkan <span className="font-bold text-rose-600">{santriToRemove[0].nama}</span> dari kamar <span className="font-bold text-slate-700">"{getKamarFormat(santriToRemove[0]) || 'kamar'}"</span>?</p>
                  ) : (
                    <p>Apakah Anda yakin ingin mengeluarkan <span className="font-bold text-rose-600">{santriToRemove.length} santri terpilih</span> dari kamar mereka?</p>
                  )}
                </div>

                <div className="flex w-full items-center justify-center gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmRemoveModalOpen(false);
                      setSantriToRemove([]);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeRemoveFromRoom}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer"
                  >
                    Ya, Keluarkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}



    </div>
  );
}
