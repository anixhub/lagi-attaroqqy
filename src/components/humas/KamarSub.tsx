import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit, ChevronRight, Users, Award, X, Search, Building2, Tag, BookOpen, AlertCircle, ChevronLeft, ArrowLeftRight, LayoutGrid, List, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, Home, FileSpreadsheet, Printer, Sliders, Hash, ChevronDown
} from 'lucide-react';
import { Kompleks, Kamar, Santri } from '../../types';
import SantriDetailModal from '../sekretaris/SantriDetailModal';
import { getPesantrenProfile } from '../SekretarisHelper';

interface KamarSubProps {
  kompleksList: Kompleks[];
  kamarList: Kamar[];
  santriList: Santri[];
  onAddKompleks: (newKom: Kompleks) => void;
  onUpdateKompleks: (upKom: Kompleks) => void;
  onDeleteKompleks: (id: string) => void;
  onAddKamar: (newKam: Kamar) => void;
  onUpdateKamar: (upKam: Kamar) => void;
  onDeleteKamar: (id: string) => void;
  onUpdateSantriRoom: (santriId: string, roomText: string, kompleksId?: string) => void;
  canViewPutra?: boolean;
  canViewPutri?: boolean;
  canWritePutra?: boolean;
  canWritePutri?: boolean;
}

const calculateAge = (tanggalLahirStr?: string): string => {
  if (!tanggalLahirStr) return '-';
  try {
    let dateParts = tanggalLahirStr.split('-');
    let birthDate: Date;
    if (dateParts.length === 3) {
      if (dateParts[0].length === 4) {
        // YYYY-MM-DD
        birthDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      } else {
        // DD-MM-YYYY
        birthDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
      }
    } else {
      birthDate = new Date(tanggalLahirStr);
    }

    if (isNaN(birthDate.getTime())) return '-';
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '-';
  } catch (e) {
    return '-';
  }
};

export default function KamarSub({
  kompleksList,
  kamarList,
  santriList,
  onAddKompleks,
  onUpdateKompleks,
  onDeleteKompleks,
  onAddKamar,
  onUpdateKamar,
  onDeleteKamar,
  onUpdateSantriRoom,
  canViewPutra = true,
  canViewPutri = true,
  canWritePutra = true,
  canWritePutri = true
}: KamarSubProps) {
  // Active selection
  const [selectedGender, setSelectedGender] = useState<'Putra' | 'Putri'>('Putra');

  // Synchronize initial gender selection with view permissions
  useEffect(() => {
    if (!canViewPutra && canViewPutri) {
      setSelectedGender('Putri');
    } else if (canViewPutra && !canViewPutri) {
      setSelectedGender('Putra');
    }
  }, [canViewPutra, canViewPutri]);

  const canWriteCurrent = selectedGender === 'Putra' ? canWritePutra : canWritePutri;
  const [selectedKompleksId, setSelectedKompleksId] = useState<string>(kompleksList[0]?.id || '');
  const [isKompleksDropdownOpen, setIsKompleksDropdownOpen] = useState(false);
  const [isSelectedKompleksOptionsOpen, setIsSelectedKompleksOptionsOpen] = useState(false);
  const [mobileSelectedRoomId, setMobileSelectedRoomId] = useState<string>('');
  const [activeRoomForDetail, setActiveRoomForDetail] = useState<Kamar | null>(null);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

  // Search and Select states
  const [roomSortKey, setRoomSortKey] = useState<'name-asc' | 'name-desc' | 'students-desc' | 'students-asc'>('name-asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeDropdownRoomId, setActiveDropdownRoomId] = useState<string | null>(null);
  const [roomDropdownCoords, setRoomDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSortKey, setStudentSortKey] = useState<'name-asc' | 'name-desc' | 'nis-asc' | 'nis-desc' | 'nomor-lemari-asc' | 'nomor-lemari-desc'>('name-asc');
  const [isStudentSortDropdownOpen, setIsStudentSortDropdownOpen] = useState(false);
  const [activeStudentDropdownId, setActiveStudentDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [studentToMigrate, setStudentToMigrate] = useState<Santri | null>(null);
  const [roomLeaders, setRoomLeaders] = useState<Record<string, string>>({});
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [migrateTargetStudents, setMigrateTargetStudents] = useState<Santri[]>([]);
  const [selectedDestRoomId, setSelectedDestRoomId] = useState<string>('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const [selectedDestComplexId, setSelectedDestComplexId] = useState<string>('');
  const [isDestComplexDropdownOpen, setIsDestComplexDropdownOpen] = useState(false);
  const [destNomorLemari, setDestNomorLemari] = useState<string>('');

  // Add Member Modal states
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [modalStudentSearchQuery, setModalStudentSearchQuery] = useState('');
  const [selectedModalStudentIds, setSelectedModalStudentIds] = useState<string[]>([]);

  // Custom confirmation modal state
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
    confirmText: 'Hapus'
  });

  const [selectedSantriForDetail, setSelectedSantriForDetail] = useState<Santri | null>(null);

  const [editingNomorLemariStudentId, setEditingNomorLemariStudentId] = useState<string | null>(null);
  const [tempNomorLemari, setTempNomorLemari] = useState('');
  const [isAutoNumberingDropdownOpen, setIsAutoNumberingDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close student dropdown when any container inside scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (activeStudentDropdownId) {
        setActiveStudentDropdownId(null);
        setDropdownCoords(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeStudentDropdownId]);

  // Sync state with URL query param ?room=... for browser back/forward history support
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const foundRoom = kamarList.find(r => r.id === roomParam || r.nama.toLowerCase().replace(/\s+/g, '-') === roomParam);
        if (foundRoom) {
          setActiveRoomForDetail(foundRoom);
        } else {
          setActiveRoomForDetail(null);
        }
      } else {
        setActiveRoomForDetail(null);
      }
    };

    handlePopState(); // run once on mount

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [kamarList]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeRoomForDetail) {
      if (params.get('room') !== activeRoomForDetail.id) {
        params.set('room', activeRoomForDetail.id);
        window.history.pushState(null, '', `?${params.toString()}`);
      }
    } else {
      if (params.has('room')) {
        params.delete('room');
        window.history.pushState(null, '', `?${params.toString()}`);
      }
    }
  }, [activeRoomForDetail]);

  const askConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Hapus') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  const handleToggleSelectRoom = (id: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export All Rooms across all Kompleks into a beautifully formatted Excel File
  const exportRoomsToExcel = () => {
    const profile = getPesantrenProfile();
    const filteredKompleks = kompleksList.filter(kom => kom.gender === selectedGender);

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Data Kamar & Kompleks</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 11px; }
          .title { font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center; font-family: sans-serif; }
          .meta { font-size: 10px; color: #64748b; text-align: center; }
          .lembaga-header { background-color: #4f46e5; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; }
          .class-header { background-color: #e0e7ff; color: #1e1b4b; font-size: 11px; font-weight: bold; text-align: center; }
          .table-th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
          .even-row { background-color: #f8fafc; }
          .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
        </style>
      </head>
      <body>
        <table style="width: 100%;">
          <tr>
            <td colspan="5" class="title" style="text-align: center; font-size: 16px; font-weight: bold; color: #4f46e5; height: 35px; vertical-align: middle;">
              DATA KAMAR SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="5" class="meta" style="text-align: center; font-size: 10px; color: #64748b;">
              Laporan terkelompok per Kompleks dan per Kamar (${selectedGender}) • Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
            </td>
          </tr>
        </table>
        <br/>
    `;

    filteredKompleks.forEach((kom) => {
      // Find rooms belonging to this Kompleks
      const roomsInKom = kamarList.filter(r => r.kompleksId === kom.id);
      if (roomsInKom.length === 0) return;

      html += `
        <table style="width: 100%; margin-bottom: 15px;">
          <tr class="lembaga-header">
            <td colspan="5" style="background-color: #4f46e5; color: #ffffff; font-size: 13px; font-weight: bold; height: 28px; padding: 6px 12px; vertical-align: middle; text-align: center;">
              KOMPLEKS: ${kom.nama.toUpperCase()} (${(kom.gender || 'PUTRA').toUpperCase()})
            </td>
          </tr>
        </table>
      `;

      roomsInKom.forEach((rm) => {
        // Get members of this room
        const members = santriList.filter(s => {
          if (s.gender !== kom.gender) return false;
          if (s.statusKeanggotaan === 'Alumni' || s.statusDomisili === 'Kampung') return false;
          return (s.kamar || '').trim().toLowerCase() === rm.nama.trim().toLowerCase();
        });

        html += `
          <table style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <tr class="class-header">
              <td colspan="5" style="background-color: #e0e7ff; color: #1e1b4b; font-size: 11px; font-weight: bold; height: 24px; padding: 5px 10px; vertical-align: middle; border: 1px solid #cbd5e1; text-align: center;">
                Nama Kamar: ${rm.nama} &nbsp;|&nbsp; Ketua Kamar: ${rm.ketuaKamar} &nbsp;|&nbsp; Kapasitas: ${rm.kapasitas} &nbsp;|&nbsp; Jumlah: ${members.length} Santri
              </td>
            </tr>
            <tr>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 30px; text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">No</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 65px; text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">NIS</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 367px; text-align: left; border: 1px solid #cbd5e1; white-space: nowrap; padding-left: 8px;">Nama Lengkap Santri</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 90px; text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">No. Lemari</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 367px; text-align: left; border: 1px solid #cbd5e1; white-space: nowrap; padding-left: 8px;">Alamat</th>
            </tr>
        `;

        if (members.length === 0) {
          html += `
            <tr>
              <td colspan="5" class="empty-cell" style="color: #94a3b8; font-style: italic; text-align: center; height: 35px; vertical-align: middle; border: 1px solid #cbd5e1;">
                Belum ada santri terdaftar di kamar ini
              </td>
            </tr>
          `;
        } else {
          const sortedMembers = [...members].sort((a, b) => a.nama.localeCompare(b.nama));
          sortedMembers.forEach((s, idx) => {
            const rowClassStyle = idx % 2 === 1 ? 'background-color: #f8fafc;' : '';

            // Construct alamat safely
            const addressParts: string[] = [];
            if (s.desa) addressParts.push(`Ds. ${s.desa.trim()}`);
            if (s.kecamatan) addressParts.push(`Kec. ${s.kecamatan.trim()}`);
            if (s.kabupaten) addressParts.push(`Kab. ${s.kabupaten.trim()}`);

            let fullAlamat = addressParts.join(', ');
            if (!fullAlamat) {
              fullAlamat = s.alamat ? s.alamat.trim() : (s.asal ? s.asal.trim() : '-');
            }

            html += `
              <tr style="${rowClassStyle}">
                <td style="text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">${idx + 1}</td>
                <td style="font-family: monospace; border: 1px solid #cbd5e1; white-space: nowrap; text-align: center;">${s.nis || '-'}</td>
                <td style="font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; white-space: nowrap;">${s.nama}</td>
                <td style="font-family: monospace; border: 1px solid #cbd5e1; white-space: nowrap; text-align: center;">${s.nomorLemari || '-'}</td>
                <td style="border: 1px solid #cbd5e1;">${fullAlamat}</td>
              </tr>
            `;
          });
        }

        html += `
          </table>
          <br/>
        `;
      });
    });

    html += `
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AttarOkey4.0_Data_Kamar_${selectedGender}_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print All Rooms across all Kompleks of selected gender
  const printRooms = () => {
    const profile = getPesantrenProfile();
    const filteredKompleks = kompleksList.filter(kom => kom.gender === selectedGender);

    let html = `
      <html>
      <head>
        <title>DATA KAMAR SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          @media print {
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; page-break-inside: avoid; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
            th { background-color: #f1f5f9 !important; font-weight: bold; color: #334155 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; }
            .title { font-size: 16px; font-weight: bold; color: #4f46e5 !important; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .meta { font-size: 10px; color: #64748b !important; text-align: center; margin-bottom: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .lembaga-header { background-color: #4f46e5 !important; color: #ffffff !important; font-size: 13px; font-weight: bold; padding: 6px 12px; margin-bottom: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .class-header { background-color: #e0e7ff !important; color: #1e1b4b !important; font-size: 11px; font-weight: bold; padding: 5px 10px; border: 1px solid #cbd5e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
          }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; padding: 30px; max-width: 900px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-align: center; }
          .title { font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center; }
          .meta { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 15px; }
          .lembaga-header { background-color: #4f46e5; color: #ffffff; font-size: 13px; font-weight: bold; padding: 6px 12px; margin-bottom: 8px; }
          .class-header { background-color: #e0e7ff; color: #1e1b4b; font-size: 11px; font-weight: bold; padding: 5px 10px; border: 1px solid #cbd5e1; }
          .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
        </style>
      </head>
      <body>
        <div class="title">DATA KAMAR SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</div>
        <div class="meta">Laporan terkelompok per Kompleks dan per Kamar (${selectedGender}) • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
    `;

    filteredKompleks.forEach((kom) => {
      const roomsInKom = kamarList.filter(r => r.kompleksId === kom.id);
      if (roomsInKom.length === 0) return;

      html += `
        <div class="lembaga-header" style="margin-top: 20px;">
          KOMPLEKS: ${kom.nama.toUpperCase()} (${(kom.gender || 'PUTRA').toUpperCase()})
        </div>
      `;

      roomsInKom.forEach((rm) => {
        const members = santriList.filter(s => {
          if (s.gender !== kom.gender) return false;
          if (s.statusKeanggotaan === 'Alumni' || s.statusDomisili === 'Kampung') return false;
          return (s.kamar || '').trim().toLowerCase() === rm.nama.trim().toLowerCase();
        });

        html += `
          <div class="class-header" style="margin-top: 10px;">
            Nama Kamar: ${rm.nama} &nbsp;|&nbsp; Ketua Kamar: ${rm.ketuaKamar} &nbsp;|&nbsp; Kapasitas: ${rm.kapasitas} &nbsp;|&nbsp; Jumlah: ${members.length} Santri
          </div>
          <table style="width: 100%;">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 65px; text-align: center;">NIS</th>
                <th style="width: 367px; text-align: left; padding-left: 8px;">Nama Lengkap Santri</th>
                <th style="width: 90px; text-align: center;">No. Lemari</th>
                <th style="width: 367px; text-align: left; padding-left: 8px;">Alamat</th>
              </tr>
            </thead>
            <tbody>
        `;

        if (members.length === 0) {
          html += `
            <tr>
              <td colspan="5" class="empty-cell">Belum ada santri terdaftar di kamar ini</td>
            </tr>
          `;
        } else {
          const sortedMembers = [...members].sort((a, b) => a.nama.localeCompare(b.nama));
          sortedMembers.forEach((s, idx) => {
            const addressParts: string[] = [];
            if (s.desa) addressParts.push(`Ds. ${s.desa.trim()}`);
            if (s.kecamatan) addressParts.push(`Kec. ${s.kecamatan.trim()}`);
            if (s.kabupaten) addressParts.push(`Kab. ${s.kabupaten.trim()}`);

            let fullAlamat = addressParts.join(', ');
            if (!fullAlamat) {
              fullAlamat = s.alamat ? s.alamat.trim() : (s.asal ? s.asal.trim() : '-');
            }

            html += `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="font-family: monospace; text-align: center;">${s.nis || '-'}</td>
                <td style="font-weight: bold; color: #1e293b;">${s.nama}</td>
                <td style="font-family: monospace; text-align: center;">${s.nomorLemari || '-'}</td>
                <td>${fullAlamat}</td>
              </tr>
            `;
          });
        }

        html += `
            </tbody>
          </table>
          <br/>
        `;
      });
    });

    html += `
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

  // Reset selections on context change
  useEffect(() => {
    setSelectedRoomIds([]);
    setSelectedStudentIds([]);
    setRoomSearchQuery('');
    setStudentSearchQuery('');
    setActiveRoomForDetail(null);
  }, [selectedKompleksId, selectedGender]);

  useEffect(() => {
    setSelectedStudentIds([]);
    setStudentSearchQuery('');
    setSelectedModalStudentIds([]);
    setModalStudentSearchQuery('');
  }, [activeRoomForDetail?.id]);

  // Modals
  const [isKompleksModalOpen, setIsKompleksModalOpen] = useState(false);
  const [kompleksToEdit, setKompleksToEdit] = useState<Kompleks | null>(null);

  const [isKamarModalOpen, setIsKamarModalOpen] = useState(false);
  const [kamarToEdit, setKamarToEdit] = useState<Kamar | null>(null);

  // Form states - Kompleks
  const [komNama, setKomNama] = useState('');
  const [komKode, setKomKode] = useState('');
  const [komDeskripsi, setKomDeskripsi] = useState('');

  // Form states - Kamar
  const [kamNama, setKamNama] = useState('');
  const [kamKetua, setKamKetua] = useState('');
  const [kamKapasitas, setKamKapasitas] = useState<number>(15);

  // Handlers for Kompleks Form
  const openAddKompleks = () => {
    setKompleksToEdit(null);
    setKomNama('');
    setKomKode('');
    setKomDeskripsi('');
    setIsKompleksModalOpen(true);
  };

  const openEditKompleks = (kom: Kompleks, e: React.MouseEvent) => {
    e.stopPropagation();
    setKompleksToEdit(kom);
    setKomNama(kom.nama);
    setKomKode(kom.kode);
    setKomDeskripsi(kom.deskripsi || '');
    setIsKompleksModalOpen(true);
  };

  const handleSaveKompleks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!komNama.trim()) return;

    const words = komNama.trim().split(/\s+/);
    let initials = words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (initials.length < 3) {
      initials = komNama.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    const randSuffix = Math.floor(100 + Math.random() * 900).toString();
    const generatedKode = `${initials}-${randSuffix}-${selectedGender === 'Putra' ? 'PA' : 'PI'}`;

    if (kompleksToEdit) {
      onUpdateKompleks({
        ...kompleksToEdit,
        nama: komNama.trim(),
        kode: komKode.trim() || kompleksToEdit.kode || generatedKode,
        deskripsi: komDeskripsi.trim(),
        gender: kompleksToEdit.gender || selectedGender
      });
    } else {
      const newId = 'KMP-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      onAddKompleks({
        id: newId,
        nama: komNama.trim(),
        kode: komKode.trim() || generatedKode,
        deskripsi: komDeskripsi.trim(),
        gender: selectedGender
      });
      // Auto select newly created complex
      setSelectedKompleksId(newId);
    }
    setIsKompleksModalOpen(false);
  };

  // Handlers for Kamar Form
  const openAddKamar = () => {
    if (!selectedKompleksId) return;
    setKamarToEdit(null);
    setKamNama('');
    setKamKetua('');
    setKamKapasitas(15);
    setIsKamarModalOpen(true);
  };

  const openEditKamar = (kam: Kamar, e: React.MouseEvent) => {
    e.stopPropagation();
    setKamarToEdit(kam);
    setKamNama(kam.nama);
    setKamKetua(kam.ketuaKamar);
    setKamKapasitas(kam.kapasitas || 15);
    setIsKamarModalOpen(true);
  };

  const handleSaveKamar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kamNama.trim()) return;

    if (kamarToEdit) {
      onUpdateKamar({
        ...kamarToEdit,
        nama: kamNama.trim(),
        ketuaKamar: kamarToEdit.ketuaKamar || '',
        kapasitas: Number(kamKapasitas)
      });
      // Sync active detail state
      if (activeRoomForDetail?.id === kamarToEdit.id) {
        setActiveRoomForDetail({
          ...activeRoomForDetail,
          nama: kamNama.trim(),
          ketuaKamar: kamarToEdit.ketuaKamar || '',
          kapasitas: Number(kamKapasitas)
        });
      }
    } else {
      onAddKamar({
        id: 'KMR-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
        kompleksId: selectedKompleksId,
        nama: kamNama.trim(),
        ketuaKamar: '',
        kapasitas: Number(kamKapasitas)
      });
    }
    setIsKamarModalOpen(false);
  };

  // Filtered list of complexes based on selected gender
  const filteredKompleks = kompleksList.filter(l => (l.gender || 'Putra') === selectedGender);

  // Sync selectedKompleksId to the first of newly selected gender if current selection is invalid
  useEffect(() => {
    const currentGenderKompleks = kompleksList.filter(l => (l.gender || 'Putra') === selectedGender);
    const exists = currentGenderKompleks.some(l => l.id === selectedKompleksId);
    if (!exists) {
      setSelectedKompleksId(currentGenderKompleks[0]?.id || '');
    }
  }, [selectedGender, kompleksList]);

  // Filtered Rooms under current selected complex
  const activeRooms = kamarList.filter(c => c.kompleksId === selectedKompleksId);

  // Filtered rooms based on Room Search Query
  const searchedRooms = activeRooms.filter(c => {
    if (!roomSearchQuery) return true;
    const query = roomSearchQuery.toLowerCase();
    return (
      (c.nama || '').toLowerCase().includes(query) ||
      (c.ketuaKamar || '').toLowerCase().includes(query)
    );
  });

  // Helper to get members of a specific room
  const getMembersOfRoom = (roomName: string) => {
    return santriList.filter(s => {
      if (s.gender !== selectedGender) return false;
      if (s.statusKeanggotaan === 'Alumni' || s.statusDomisili === 'Kampung') return false;
      return (s.kamar || '').trim().toLowerCase() === roomName.trim().toLowerCase();
    });
  };

  // Sort rooms
  const sortedRooms = [...searchedRooms].sort((a, b) => {
    if (roomSortKey === 'name-asc') {
      return a.nama.localeCompare(b.nama);
    }
    if (roomSortKey === 'name-desc') {
      return b.nama.localeCompare(a.nama);
    }
    if (roomSortKey === 'students-desc') {
      return getMembersOfRoom(b.nama).length - getMembersOfRoom(a.nama).length;
    }
    if (roomSortKey === 'students-asc') {
      return getMembersOfRoom(a.nama).length - getMembersOfRoom(b.nama).length;
    }
    return 0;
  });

  // Calculate total santri in currently active rooms of selected complex & gender
  const totalSantriInKompleks = activeRooms.reduce((acc, c) => acc + getMembersOfRoom(c.nama).length, 0);

  // Sync selected room on mobile when activeRooms changes
  useEffect(() => {
    const hasCurrentMobileRoom = activeRooms.some(c => c.id === mobileSelectedRoomId);
    if (!hasCurrentMobileRoom && activeRooms.length > 0) {
      setMobileSelectedRoomId(activeRooms[0].id);
    } else if (activeRooms.length === 0) {
      setMobileSelectedRoomId('');
    }
  }, [selectedKompleksId, kamarList, selectedGender]);

  // Active Kompleks item
  const selectedKompleks = kompleksList.find(l => l.id === selectedKompleksId);

  // Quick remove of a student from this room
  const handleRemoveFromRoom = (santriId: string) => {
    if (confirm('Apakah Anda yakin ingin mengeluarkan santri ini dari kamar?')) {
      onUpdateSantriRoom(santriId, '');
    }
  };

  // Helper to select/deselect all rooms
  const handleSelectAllRooms = () => {
    if (searchedRooms.length === 0) return;
    const allSelected = searchedRooms.every(c => selectedRoomIds.includes(c.id));
    if (allSelected) {
      const searchedIds = searchedRooms.map(c => c.id);
      setSelectedRoomIds(prev => prev.filter(id => !searchedIds.includes(id)));
    } else {
      const newSelected = [...selectedRoomIds];
      searchedRooms.forEach(c => {
        if (!newSelected.includes(c.id)) {
          newSelected.push(c.id);
        }
      });
      setSelectedRoomIds(newSelected);
    }
  };

  // Computed visibility values
  const isCol1Visible = false; // Left sidebar hidden, complexes selected via Selectors Bar dropdown
  const showCol3 = !!activeRoomForDetail;

  let col1Span = "hidden";
  let col2Span = "flex w-full lg:col-span-12";
  let col3Span = "hidden";

  if (activeRoomForDetail) {
    col1Span = "hidden";
    col2Span = "flex w-full lg:col-span-6";
    col3Span = "hidden lg:flex lg:col-span-6";
  } else {
    col1Span = "hidden";
    col2Span = "flex w-full lg:col-span-12";
    col3Span = "hidden";
  }

  // Members in detail
  const classMembers = activeRoomForDetail ? getMembersOfRoom(activeRoomForDetail.nama) : [];

  const filteredClassMembers = classMembers.filter(s => {
    if (!studentSearchQuery) return true;
    const q = studentSearchQuery.toLowerCase();
    return (s.nama || '').toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q);
  });

  const handleAutoNumbering = (mode: 'sequential' | 'random' | 'reset') => {
    if (!activeRoomForDetail) return;
    
    // Sort current filtered class members to match displayed order
    const sortedClassMembers = [...filteredClassMembers].sort((a, b) => {
      if (studentSortKey === 'name-asc') {
        return a.nama.localeCompare(b.nama);
      }
      if (studentSortKey === 'name-desc') {
        return b.nama.localeCompare(a.nama);
      }
      if (studentSortKey === 'nis-asc') {
        return a.nis.localeCompare(b.nis);
      }
      if (studentSortKey === 'nis-desc') {
        return b.nis.localeCompare(a.nis);
      }
      if (studentSortKey === 'nomor-lemari-asc') {
        return (a.nomorLemari || '').localeCompare(b.nomorLemari || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (studentSortKey === 'nomor-lemari-desc') {
        return (b.nomorLemari || '').localeCompare(a.nomorLemari || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });

    if (mode === 'reset') {
      sortedClassMembers.forEach(s => {
        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, '');
      });
      setToast({ message: 'Nomor lemari semua anggota berhasil direset.', type: 'success' });
    } else if (mode === 'sequential') {
      sortedClassMembers.forEach((s, idx) => {
        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, String(idx + 1));
      });
      setToast({ message: 'Nomor lemari berhasil dibuat secara urut (1, 2, 3...).', type: 'success' });
    } else if (mode === 'random') {
      const n = sortedClassMembers.length;
      const nums = Array.from({ length: n }, (_, i) => String(i + 1));
      // Shuffle nums
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      sortedClassMembers.forEach((s, idx) => {
        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, nums[idx]);
      });
      setToast({ message: 'Nomor lemari berhasil diacak.', type: 'success' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert Popup */}
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
      {/* Title Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Kelola Kamar</span>
            <span
              onClick={() => {
                if (canViewPutra && canViewPutri) {
                  setSelectedGender(selectedGender === 'Putra' ? 'Putri' : 'Putra');
                }
              }}
              className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                canViewPutra && canViewPutri ? 'cursor-pointer active:scale-95' : 'cursor-default'
              } ${
                selectedGender === 'Putra' ? 'text-blue-600' : 'text-rose-600'
              }`}
              title={canViewPutra && canViewPutri ? "Klik untuk mengubah gender kompleks (Putra ⇄ Putri)" : undefined}
            >
              <span>{selectedGender}</span>
              {canViewPutra && canViewPutri && (
                <ArrowLeftRight 
                  className={`h-4 w-4 mt-0.5 transition-colors ${
                    selectedGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                  }`} 
                />
              )}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mengatur data kompleks asrama, kamar, ketua kamar, kapasitas maksimal, dan pembagian kamar santri <span className={selectedGender === 'Putra' ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}>{selectedGender}</span>.
          </p>
        </div>
      </div>

      {/* Selectors Bar Section */}
      <div className="flex flex-row items-center gap-2 w-full mb-6">
        {/* Complexes List Dropdown Button */}
        <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsKompleksDropdownOpen(!isKompleksDropdownOpen)}
            className="h-10 px-4 w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-slate-900 flex items-center justify-between shadow-sm transition-all cursor-pointer outline-none font-bold text-xs"
            title="Pilih Kompleks Asrama"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="truncate">
                {selectedKompleks ? selectedKompleks.nama : 'Pilih Kompleks Asrama'}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform text-slate-400 shrink-0 ${isKompleksDropdownOpen ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {isKompleksDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10 cursor-default" 
                  onClick={() => setIsKompleksDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-20 text-slate-700 font-sans"
                >
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {filteredKompleks.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                        Belum ada kompleks {selectedGender}
                      </div>
                    ) : (
                      filteredKompleks.map((l) => {
                        const isSelected = l.id === selectedKompleksId;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setSelectedKompleksId(l.id);
                              setIsKompleksDropdownOpen(false);
                              setActiveRoomForDetail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-800 font-black'
                                : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span className="truncate">{l.nama}</span>
                            {isSelected && (
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 3-Dot Options Button next to Selected Complex dropdown */}
        {canWriteCurrent && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsSelectedKompleksOptionsOpen(!isSelectedKompleksOptionsOpen)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-purple-600 hover:bg-slate-50 transition-colors cursor-pointer outline-none shadow-sm"
              title="Pilihan Kompleks"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {isSelectedKompleksOptionsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10 cursor-default" 
                    onClick={() => setIsSelectedKompleksOptionsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl z-20 text-slate-700 font-sans"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectedKompleksOptionsOpen(false);
                        openAddKompleks();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                    >
                      <span>Tambah Kompleks</span>
                    </button>
                    {selectedKompleks && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSelectedKompleksOptionsOpen(false);
                            openAddKamar();
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer border-t border-slate-50"
                        >
                          <span>Tambah Kamar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            setIsSelectedKompleksOptionsOpen(false);
                            openEditKompleks(selectedKompleks, e);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer border-t border-slate-50"
                        >
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSelectedKompleksOptionsOpen(false);
                            askConfirmation(
                              'Konfirmasi Hapus Kompleks',
                              `Apakah Anda yakin ingin menghapus kompleks "${selectedKompleks.nama}"? Seluruh kamar di dalamnya juga akan terhapus.`,
                              () => {
                                onDeleteKompleks(selectedKompleks.id);
                                // Auto select another complex
                                const remaining = filteredKompleks.filter(l => l.id !== selectedKompleks.id);
                                if (remaining.length > 0) {
                                  setSelectedKompleksId(remaining[0].id);
                                } else {
                                  setSelectedKompleksId('');
                                }
                              }
                            );
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer border-t border-slate-50"
                        >
                          <span>Hapus</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Right Area: Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-all cursor-pointer outline-none shrink-0 shadow-sm"
          title="Ekspor Data Kamar"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Main Grid: Rooms under selected Kompleks */}
        <div className={`flex flex-col gap-4 ${col2Span}`}>
          {/* Rooms List Grid Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[528px] flex flex-col">
            {activeRooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center flex-1 flex flex-col justify-center items-center">
                <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">Belum Ada Kamar Terdaftar</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kompleks ini belum memiliki kamar terdaftar. Klik tombol "Tambah Kamar" untuk memulai.
                </p>
              </div>
            ) : (
              <>
                {/* Search Control */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 shrink-0">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-0 transition-all">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kamar, ketua kamar..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                    {roomSearchQuery && (
                      <button
                        onClick={() => setRoomSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Control */}
                  <div className="relative shrink-0 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-purple-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Urutkan Kamar"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </button>

                    {isSortDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-20 cursor-default" 
                          onClick={() => setIsSortDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-30 text-left font-sans">
                          <button
                            onClick={() => {
                              setRoomSortKey('name-asc');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-medium ${
                              roomSortKey === 'name-asc' ? 'bg-purple-50 text-purple-600 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Nama (A-Z)
                          </button>
                          <button
                            onClick={() => {
                              setRoomSortKey('name-desc');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-medium ${
                              roomSortKey === 'name-desc' ? 'bg-purple-50 text-purple-600 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Nama (Z-A)
                          </button>
                          <button
                            onClick={() => {
                              setRoomSortKey('students-desc');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-medium ${
                              roomSortKey === 'students-desc' ? 'bg-purple-50 text-purple-600 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Santri Terbanyak
                          </button>
                          <button
                            onClick={() => {
                              setRoomSortKey('students-asc');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-medium ${
                              roomSortKey === 'students-asc' ? 'bg-purple-50 text-purple-600 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Santri Tersedikit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedRoomIds.length > 0 && (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-3 rounded-xl mb-4 animate-fade-in shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                      <span className="text-xs font-bold text-purple-900">
                        {selectedRoomIds.length} Kamar Terpilih
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          askConfirmation(
                            'Hapus Kamar Terpilih',
                            `Apakah Anda yakin ingin menghapus ${selectedRoomIds.length} kamar terpilih secara massal? Seluruh santri di dalamnya akan kehilangan penugasan kamar.`,
                            () => {
                              selectedRoomIds.forEach(id => {
                                const room = kamarList.find(x => x.id === id);
                                if (room) {
                                  // Reset members
                                  const members = getMembersOfRoom(room.nama);
                                  members.forEach(m => onUpdateSantriRoom(m.id, ''));
                                }
                                onDeleteKamar(id);
                              });
                              setSelectedRoomIds([]);
                            }
                          );
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Masal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRoomIds([])}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Rooms List Scroll View */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2.5 pb-24">
                    {sortedRooms.map((c, idx) => {
                      const isRoomSelectedInBulk = selectedRoomIds.includes(c.id);
                      const isSelected = activeRoomForDetail?.id === c.id;
                      const members = getMembersOfRoom(c.nama);
                      const currentOcc = members.length;
                      const maxCap = c.kapasitas || 15;
                      const isFull = currentOcc >= maxCap;
                      const fillPercent = Math.min(100, Math.round((currentOcc / maxCap) * 100));

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (selectedRoomIds.length > 0) {
                              handleToggleSelectRoom(c.id);
                            } else {
                              setActiveRoomForDetail(c);
                            }
                          }}
                          className={`group relative rounded-xl border p-3.5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-row items-center justify-between gap-3 ${
                            isRoomSelectedInBulk
                              ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/20'
                              : isSelected
                                ? 'border-purple-400 bg-purple-50/25 ring-1 ring-purple-500/20'
                                : 'border-slate-100 bg-white hover:border-purple-150'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {selectedRoomIds.length > 0 && (
                              <input
                                type="checkbox"
                                checked={isRoomSelectedInBulk}
                                onChange={() => handleToggleSelectRoom(c.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {c.nama}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                                Ketua Kamar: <span className="font-semibold text-slate-700">{c.ketuaKamar}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Capacity status progress bar and badge */}
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isFull 
                                      ? 'bg-rose-500' 
                                      : fillPercent >= 80 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                              <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                isFull 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                  : fillPercent >= 80 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                <Users className="h-3 w-3" />
                                <span>{currentOcc}/{maxCap}</span>
                              </span>
                            </div>

                            {selectedRoomIds.length === 0 && canWriteCurrent && (
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setRoomDropdownCoords({
                                      top: rect.bottom,
                                      left: rect.right
                                    });
                                    setActiveDropdownRoomId(activeDropdownRoomId === c.id ? null : c.id);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                  title="Aksi"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {activeDropdownRoomId === c.id && roomDropdownCoords && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-[150] cursor-default" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownRoomId(null);
                                        setRoomDropdownCoords(null);
                                      }}
                                    />
                                    <div 
                                      className="fixed w-32 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-[151] text-left font-sans"
                                      style={{
                                        top: `${roomDropdownCoords.top + 4}px`,
                                        left: `${roomDropdownCoords.left - 128}px`
                                      }}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownRoomId(null);
                                          setRoomDropdownCoords(null);
                                          openEditKamar(c, e);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-medium"
                                      >
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownRoomId(null);
                                          setRoomDropdownCoords(null);
                                          setSelectedRoomIds([c.id]);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-medium"
                                      >
                                        <span>Pilih</span>
                                      </button>
                                      <div className="border-t border-slate-100 my-1" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownRoomId(null);
                                          setRoomDropdownCoords(null);
                                          askConfirmation(
                                            'Konfirmasi Hapus Kamar',
                                            `Apakah Anda yakin ingin menghapus kamar "${c.nama}"? Santri di dalam kamar ini tidak akan terhapus, tetapi asrama mereka akan dikosongkan.`,
                                            () => {
                                              members.forEach(m => onUpdateSantriRoom(m.id, ''));
                                              onDeleteKamar(c.id);
                                            }
                                          );
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center transition-colors cursor-pointer font-bold"
                                      >
                                        <span>Hapus</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Column 3: Active Room Detail & Roster (Shown on demand) */}
        {showCol3 && activeRoomForDetail && (
          <div className={`flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[528px] ${col3Span} animate-fade-in`}>
            
            {/* Detail Room Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveRoomForDetail(null)}
                  className="lg:hidden mt-0.5 h-8 w-8 shrink-0 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Kembali"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider block mb-1">ANGGOTA KAMAR</span>
                  <h3 className="font-display text-base font-extrabold text-slate-900 leading-tight truncate">{activeRoomForDetail.nama}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium truncate">Ketua Kamar: <strong className="text-slate-700">{activeRoomForDetail.ketuaKamar}</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveRoomForDetail(null)}
                  className="hidden lg:flex h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Room Occupancy Ratio */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600">Rasio Keterisian Kamar</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        classMembers.length >= (activeRoomForDetail.kapasitas || 15) 
                          ? 'bg-rose-500' 
                          : (classMembers.length / (activeRoomForDetail.kapasitas || 15)) >= 0.8 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (classMembers.length / (activeRoomForDetail.kapasitas || 15)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">{classMembers.length}/{activeRoomForDetail.kapasitas || 15}</span>
                </div>
              </div>
            </div>

            {/* Members Roster List */}
            <div className="flex-1 flex flex-col min-h-0 pt-1">
              {/* Student Bulk Action Bar */}
              {selectedStudentIds.length > 0 && (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-2.5 rounded-xl mb-3 animate-fade-in shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                    <span className="text-xs font-bold text-purple-950">
                      {selectedStudentIds.length} Terpilih
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const targetStudents = classMembers.filter(s => selectedStudentIds.includes(s.id));
                        setMigrateTargetStudents(targetStudents);
                        setSelectedDestComplexId('');
                        setSelectedDestRoomId('');
                        setDestNomorLemari('');
                        setIsMigrateModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span>Pindah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        askConfirmation(
                          'Keluarkan Massal',
                          `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.length} santri terpilih dari kamar ini?`,
                          () => {
                            selectedStudentIds.forEach(id => {
                              onUpdateSantriRoom(id, '');
                            });
                            setSelectedStudentIds([]);
                          },
                          'Keluarkan'
                        );
                      }}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Keluarkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Search & Sort Roster bar */}
              <div className="flex items-center gap-2 shrink-0 mb-3">
                {/* Auto Numbering Button & Dropdown */}
                {canWriteCurrent && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsAutoNumberingDropdownOpen(!isAutoNumberingDropdownOpen)}
                      className="h-8 px-2 flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-purple-600 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                      title="Atur Penomoran Lemari"
                    >
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      <span>Atur Lemari</span>
                    </button>
                    {isAutoNumberingDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10 cursor-default" 
                          onClick={() => setIsAutoNumberingDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-1 w-48 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-20 text-left">
                          <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                            Penomoran Lemari
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('sequential');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>Buat Nomor Urut</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('random');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>Buat Nomor Acak</span>
                          </button>
                          <div className="border-t border-slate-50 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('reset');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari santri di kamar..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-[11px] font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  {studentSearchQuery && (
                    <button onClick={() => setStudentSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Sort Member Button */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setIsStudentSortDropdownOpen(!isStudentSortDropdownOpen)}
                    className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                      isStudentSortDropdownOpen
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-650'
                    }`}
                    title="Urutkan Anggota"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {isStudentSortDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10 cursor-default" 
                          onClick={() => setIsStudentSortDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-20 text-slate-700 font-sans"
                        >
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2 pb-1 border-b border-slate-50">
                            Urutkan Berdasarkan
                          </h4>
                          <div className="space-y-1">
                            {[
                              { key: 'name', label: 'Nama' },
                              { key: 'nis', label: 'NIS' },
                              { key: 'nomor-lemari', label: 'Nomor Lemari' }
                            ].map((opt) => {
                              const isActive = studentSortKey.startsWith(opt.key);
                              const direction = studentSortKey.endsWith('desc') ? 'desc' : 'asc';
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    if (isActive) {
                                      setStudentSortKey(direction === 'asc' ? `${opt.key}-desc` as any : `${opt.key}-asc` as any);
                                    } else {
                                      setStudentSortKey(opt.key === 'name' ? 'name-asc' : opt.key === 'nis' ? 'nis-asc' : 'nomor-lemari-asc');
                                    }
                                    setIsStudentSortDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-indigo-50 text-indigo-800 font-bold'
                                      : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isActive && (
                                    direction === 'asc' ? (
                                      <ArrowUp className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
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
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {classMembers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-150 p-6 text-center text-slate-400">
                    <Users className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Kamar Kosong</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Belum ada santri yang ditugaskan di kamar ini. Klik tombol "Tambah Anggota Baru" di bawah untuk menugaskan santri.
                    </p>
                  </div>
                ) : filteredClassMembers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-150 p-6 text-center text-slate-400">
                    <Search className="h-5 w-5 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Tidak Ditemukan</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(() => {
                      const sortedClassMembers = [...filteredClassMembers].sort((a, b) => {
                        if (studentSortKey === 'name-asc') {
                          return a.nama.localeCompare(b.nama);
                        }
                        if (studentSortKey === 'name-desc') {
                          return b.nama.localeCompare(a.nama);
                        }
                        if (studentSortKey === 'nis-asc') {
                          return a.nis.localeCompare(b.nis);
                        }
                        if (studentSortKey === 'nis-desc') {
                          return b.nis.localeCompare(a.nis);
                        }
                        if (studentSortKey === 'nomor-lemari-asc') {
                          return (a.nomorLemari || '').localeCompare(b.nomorLemari || '', undefined, { numeric: true, sensitivity: 'base' });
                        }
                        if (studentSortKey === 'nomor-lemari-desc') {
                          return (b.nomorLemari || '').localeCompare(a.nomorLemari || '', undefined, { numeric: true, sensitivity: 'base' });
                        }
                        return 0;
                      });

                      return sortedClassMembers.map((s, idx) => {
                        const isStudentSelected = selectedStudentIds.includes(s.id);
                        return (
                          <div 
                            key={`desktop-mem-${s.id}`}
                            onClick={() => {
                              if (selectedStudentIds.length > 0) {
                                setSelectedStudentIds(prev => 
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isStudentSelected
                                ? 'border-purple-500 bg-purple-50/30'
                                : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {selectedStudentIds.length > 0 && (
                                <input
                                  type="checkbox"
                                  checked={isStudentSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setSelectedStudentIds(prev => 
                                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                    );
                                  }}
                                  className="h-3.5 w-3.5 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer mr-0.5 shrink-0"
                                />
                              )}
                              {/* Inline Nomor Lemari Column */}
                              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                {editingNomorLemariStudentId === s.id ? (
                                  <input
                                    type="text"
                                    value={tempNomorLemari}
                                    onChange={(e) => setTempNomorLemari(e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={() => {
                                      onUpdateSantriRoom(s.id, activeRoomForDetail.nama, tempNomorLemari);
                                      setEditingNomorLemariStudentId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, tempNomorLemari);
                                        setEditingNomorLemariStudentId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingNomorLemariStudentId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="w-12 h-7 px-1 text-center border-2 border-purple-500 rounded-lg text-xs font-mono font-bold focus:outline-none"
                                  />
                                ) : (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNomorLemariStudentId(s.id);
                                      setTempNomorLemari(s.nomorLemari || '');
                                    }}
                                    className="w-12 h-7 flex items-center justify-center border border-dashed border-slate-300 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-mono font-black text-slate-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Klik untuk mengedit nomor lemari (Bebas angka & huruf)"
                                  >
                                    {s.nomorLemari || '-'}
                                  </div>
                                )}
                              </div>
                              <img 
                                src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                alt={s.nama} 
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{s.nama}</p>
                                  {activeRoomForDetail.ketuaKamar === s.nama && (
                                    <span title="Ketua Kamar"><Award className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" /></span>
                                  )}
                                </div>
                                <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                                  {s.nis}{s.kecamatan || s.kabupaten ? ` • ${[s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Umur per hari ini, cukup angka */}
                              <div 
                                className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-mono shrink-0" 
                                title={`Umur: ${calculateAge(s.tanggalLahir)} Tahun`}
                              >
                                {calculateAge(s.tanggalLahir)}
                              </div>

                              {/* Student action dropdown */}
                              {canWriteCurrent && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownCoords({
                                        top: rect.bottom,
                                        left: rect.right
                                      });
                                      setActiveStudentDropdownId(activeStudentDropdownId === s.id ? null : s.id);
                                    }}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                                    title="Menu"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {activeStudentDropdownId === s.id && dropdownCoords && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-[150] cursor-default" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStudentDropdownId(null);
                                          setDropdownCoords(null);
                                        }}
                                      />
                                      <div 
                                        className="fixed w-36 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-[151] text-left font-sans"
                                        style={{
                                          top: `${dropdownCoords.top + 4}px`,
                                          left: `${dropdownCoords.left - 144}px`
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setSelectedSantriForDetail(s);
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>Biodata</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setSelectedStudentIds(prev => 
                                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                            );
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>{selectedStudentIds.includes(s.id) ? 'Batal Pilih' : 'Pilih'}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setMigrateTargetStudents([s]);
                                            setSelectedDestRoomId('');
                                            setIsMigrateModalOpen(true);
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>Pindahkan</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            const isKetua = activeRoomForDetail.ketuaKamar === s.nama;
                                            const newKetua = isKetua ? '' : s.nama;
                                            onUpdateKamar({
                                              ...activeRoomForDetail,
                                              ketuaKamar: newKetua
                                            });
                                            setActiveRoomForDetail({
                                              ...activeRoomForDetail,
                                              ketuaKamar: newKetua
                                            });
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>{activeRoomForDetail.ketuaKamar === s.nama ? 'Copot Ketua' : 'Jadikan Ketua'}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            askConfirmation(
                                              'Konfirmasi Keluarkan',
                                              `Apakah Anda yakin ingin mengeluarkan "${s.nama}" dari kamar ini?`,
                                              () => {
                                                onUpdateSantriRoom(s.id, '');
                                              },
                                              'Keluarkan'
                                            );
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center transition-colors cursor-pointer font-bold border-t border-slate-50 mt-1"
                                        >
                                          <span>Keluarkan</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Footer Actions */}
            {canWriteCurrent && (
              <div className="pt-3 border-t border-slate-100 bg-white shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  disabled={classMembers.length >= (activeRoomForDetail.kapasitas || 15)}
                  className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    classMembers.length >= (activeRoomForDetail.kapasitas || 15)
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Anggota Baru</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* --- SIDE DRAWER FOR KAMAR DETAILS (SANTRI LIST) FOR MOBILE --- */}
      <AnimatePresence>
        {activeRoomForDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveRoomForDetail(null);
                setSelectedStudentIds([]);
              }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/20 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-extrabold text-slate-900 truncate">
                    {activeRoomForDetail.nama}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    Ketua: {activeRoomForDetail.ketuaKamar || 'Belum ditentukan'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setActiveRoomForDetail(null);
                      setSelectedStudentIds([]);
                    }}
                    className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Search & Sort */}
              <div className="p-4 border-b border-slate-50 bg-slate-50/20 shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {/* Auto Numbering Button & Dropdown */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsAutoNumberingDropdownOpen(!isAutoNumberingDropdownOpen)}
                      className="h-8 px-2 flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                    >
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      <span>Atur Lemari</span>
                    </button>
                    {isAutoNumberingDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10 cursor-default" 
                          onClick={() => setIsAutoNumberingDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-1 w-48 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-20 text-left">
                          <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                            Penomoran Lemari
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('sequential');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>Buat Nomor Urut</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('random');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>Buat Nomor Acak</span>
                          </button>
                          <div className="border-t border-slate-50 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              handleAutoNumbering('reset');
                              setIsAutoNumberingDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer font-bold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari santri di kamar..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {studentSearchQuery && (
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Mobile Sort Button */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsStudentSortDropdownOpen(!isStudentSortDropdownOpen)}
                      className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                        isStudentSortDropdownOpen
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                    {isStudentSortDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10 cursor-default" 
                          onClick={() => setIsStudentSortDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-20 text-slate-700 font-sans">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2 pb-1 border-b border-slate-50">
                            Urutkan Berdasarkan
                          </h4>
                          <div className="space-y-1">
                            {[
                              { key: 'name', label: 'Nama' },
                              { key: 'nis', label: 'NIS' },
                              { key: 'nomor-lemari', label: 'Nomor Lemari' }
                            ].map((opt) => {
                              const isActive = studentSortKey.startsWith(opt.key);
                              const direction = studentSortKey.endsWith('desc') ? 'desc' : 'asc';
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    if (isActive) {
                                      setStudentSortKey(direction === 'asc' ? `${opt.key}-desc` as any : `${opt.key}-asc` as any);
                                    } else {
                                      setStudentSortKey(opt.key === 'name' ? 'name-asc' : opt.key === 'nis' ? 'nis-asc' : 'nomor-lemari-asc');
                                    }
                                    setIsStudentSortDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-indigo-50 text-indigo-800 font-bold'
                                      : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isActive && (
                                    direction === 'asc' ? (
                                      <ArrowUp className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
                                    ) : (
                                      <ArrowDown className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
                                    )
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bulk Actions Bar inside Drawer */}
                {selectedStudentIds.length > 0 && (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-2.5 rounded-xl animate-fade-in shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                      <span className="text-xs font-bold text-purple-950">
                        {selectedStudentIds.length} Terpilih
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const targetStudents = classMembers.filter(s => selectedStudentIds.includes(s.id));
                          setMigrateTargetStudents(targetStudents);
                          setSelectedDestComplexId('');
                          setSelectedDestRoomId('');
                          setDestNomorLemari('');
                          setIsMigrateModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        <span>Pindah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          askConfirmation(
                            'Keluarkan Massal',
                            `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.length} santri terpilih dari kamar ini?`,
                            () => {
                              selectedStudentIds.forEach(id => {
                                onUpdateSantriRoom(id, '');
                              });
                              setSelectedStudentIds([]);
                            },
                            'Keluarkan'
                          );
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Keluarkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {classMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Kamar Kosong</p>
                    <p className="text-[10px] text-slate-400 mt-1">Belum ada santri ditugaskan.</p>
                  </div>
                ) : filteredClassMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <Search className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Tidak Ditemukan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const sortedClassMembers = [...filteredClassMembers].sort((a, b) => {
                        if (studentSortKey === 'name-asc') return a.nama.localeCompare(b.nama);
                        if (studentSortKey === 'name-desc') return b.nama.localeCompare(a.nama);
                        if (studentSortKey === 'nis-asc') return a.nis.localeCompare(b.nis);
                        if (studentSortKey === 'nis-desc') return b.nis.localeCompare(a.nis);
                        if (studentSortKey === 'nomor-lemari-asc') return (a.nomorLemari || '').localeCompare(b.nomorLemari || '', undefined, { numeric: true });
                        if (studentSortKey === 'nomor-lemari-desc') return (b.nomorLemari || '').localeCompare(a.nomorLemari || '', undefined, { numeric: true });
                        return 0;
                      });

                      return sortedClassMembers.map((s, idx) => {
                        const isSelectedForBulk = selectedStudentIds.includes(s.id);
                        return (
                          <div
                            key={`drawer-mem-${s.id}`}
                            onClick={() => {
                              if (selectedStudentIds.length > 0) {
                                setSelectedStudentIds(prev =>
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelectedForBulk
                                ? 'border-purple-200 bg-purple-50/50'
                                : 'border-slate-100 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {selectedStudentIds.length > 0 && (
                                <input
                                  type="checkbox"
                                  checked={isSelectedForBulk}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setSelectedStudentIds(prev => 
                                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                    );
                                  }}
                                  className="h-3.5 w-3.5 rounded text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                />
                              )}
                              {/* Lemari Box */}
                              <div onClick={(e) => e.stopPropagation()}>
                                {editingNomorLemariStudentId === s.id ? (
                                  <input
                                    type="text"
                                    value={tempNomorLemari}
                                    onChange={(e) => setTempNomorLemari(e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={() => {
                                      onUpdateSantriRoom(s.id, activeRoomForDetail.nama, tempNomorLemari);
                                      setEditingNomorLemariStudentId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, tempNomorLemari);
                                        setEditingNomorLemariStudentId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingNomorLemariStudentId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="w-10 h-7 px-1 text-center border-2 border-indigo-500 rounded-lg text-xs font-mono font-bold focus:outline-none"
                                  />
                                ) : (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNomorLemariStudentId(s.id);
                                      setTempNomorLemari(s.nomorLemari || '');
                                    }}
                                    className="w-10 h-7 flex items-center justify-center border border-dashed border-slate-300 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-black text-slate-700 cursor-pointer transition-colors shadow-2xs"
                                    title="Klik untuk mengedit nomor lemari"
                                  >
                                    {s.nomorLemari || '-'}
                                  </div>
                                )}
                              </div>

                              <img 
                                src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                alt={s.nama} 
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200"
                              />

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{s.nama}</p>
                                  {activeRoomForDetail.ketuaKamar === s.nama && (
                                    <span title="Ketua Kamar"><Award className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" /></span>
                                  )}
                                </div>
                                <p className="text-[9px] font-mono text-slate-400 mt-0.5">{s.nis}</p>
                              </div>
                            </div>

                            {/* Actions Buttons inside Item */}
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Umur per hari ini, cukup angka */}
                              <div 
                                className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-mono shrink-0" 
                                title={`Umur: ${calculateAge(s.tanggalLahir)} Tahun`}
                              >
                                {calculateAge(s.tanggalLahir)}
                              </div>

                              {canWriteCurrent && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownCoords({
                                        top: rect.bottom,
                                        left: rect.right
                                      });
                                      setActiveStudentDropdownId(activeStudentDropdownId === s.id ? null : s.id);
                                    }}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {activeStudentDropdownId === s.id && dropdownCoords && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-[150] cursor-default" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStudentDropdownId(null);
                                          setDropdownCoords(null);
                                        }}
                                      />
                                      <div 
                                        className="fixed w-36 rounded-xl border border-slate-100 bg-white shadow-lg py-1 z-[151] text-left font-sans"
                                        style={{
                                          top: `${dropdownCoords.top + 4}px`,
                                          left: `${dropdownCoords.left - 144}px`
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setSelectedSantriForDetail(s);
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>Biodata</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setSelectedStudentIds(prev => 
                                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                            );
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>{selectedStudentIds.includes(s.id) ? 'Batal Pilih' : 'Pilih'}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            setMigrateTargetStudents([s]);
                                            setSelectedDestComplexId('');
                                            setSelectedDestRoomId('');
                                            setDestNomorLemari('');
                                            setIsMigrateModalOpen(true);
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>Pindahkan</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            const newKetua = activeRoomForDetail.ketuaKamar === s.nama ? '' : s.nama;
                                            onUpdateKamar({
                                              ...activeRoomForDetail,
                                              ketuaKamar: newKetua
                                            });
                                            setActiveRoomForDetail({
                                              ...activeRoomForDetail,
                                              ketuaKamar: newKetua
                                            });
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                        >
                                          <span>{activeRoomForDetail.ketuaKamar === s.nama ? 'Copot Ketua' : 'Jadikan Ketua'}</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStudentDropdownId(null);
                                            askConfirmation(
                                              'Konfirmasi Keluarkan',
                                              `Apakah Anda yakin ingin mengeluarkan "${s.nama}" dari kamar ini?`,
                                              () => {
                                                onUpdateSantriRoom(s.id, '');
                                              },
                                              'Keluarkan'
                                            );
                                          }}
                                          className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center transition-colors cursor-pointer font-bold border-t border-slate-50 mt-1"
                                        >
                                          <span>Keluarkan</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Drawer Footer / Floating Add Button */}
              {canWriteCurrent && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    disabled={classMembers.length >= (activeRoomForDetail.kapasitas || 15)}
                    className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      classMembers.length >= (activeRoomForDetail.kapasitas || 15)
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Anggota Baru</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 1: Kompleks Form Modal */}
      <AnimatePresence>
        {isKompleksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsKompleksModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 z-10"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold text-slate-900">
                  {kompleksToEdit ? 'Edit Kompleks Asrama' : 'Tambah Kompleks Asrama Baru'}
                </h3>
                <button onClick={() => setIsKompleksModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveKompleks} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">NAMA KOMPLEKS</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kompleks Sunan Ampel"
                    value={komNama}
                    onChange={(e) => setKomNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">DESKRIPSI (OPSIONAL)</label>
                  <textarea
                    placeholder="Deskripsi singkat mengenai kompleks asrama"
                    value={komDeskripsi}
                    onChange={(e) => setKomDeskripsi(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKompleksModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Kamar Form Modal */}
      <AnimatePresence>
        {isKamarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsKamarModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 z-10"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold text-slate-900">
                  {kamarToEdit ? 'Edit Data Kamar' : 'Tambah Kamar Baru'}
                </h3>
                <button onClick={() => setIsKamarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveKamar} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">NAMA KAMAR</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamar 01"
                    value={kamNama}
                    onChange={(e) => setKamNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">KAPASITAS MAKSIMAL</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={kamKapasitas}
                    onChange={(e) => setKamKapasitas(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKamarModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add Member (Assign Student to Room) Modal */}
      <AnimatePresence>
        {isAddMemberModalOpen && activeRoomForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMemberModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 z-10 flex flex-col max-h-[500px]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-display text-sm font-extrabold text-slate-900">Tambah Anggota - {activeRoomForDetail.nama}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Daftar santri {selectedGender} yang belum memiliki kamar atau ingin dipindahkan.</p>
                </div>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Inside Modal */}
              <div className="p-3 border-b border-slate-50 bg-slate-50/50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama santri atau NIS..."
                    value={modalStudentSearchQuery}
                    onChange={(e) => setModalStudentSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white outline-none"
                  />
                  {modalStudentSearchQuery && (
                    <button onClick={() => setModalStudentSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {(() => {
                  const eligibleStudents = santriList.filter(s => {
                    if (s.gender !== selectedGender) return false;
                    // Exclude alumni & kampung
                    if (s.statusKeanggotaan === 'Alumni' || s.statusDomisili === 'Kampung') return false;
                    // Exclude students already in this room
                    if ((s.kamar || '').toLowerCase() === activeRoomForDetail.nama.toLowerCase()) return false;
                    
                    if (!modalStudentSearchQuery) return true;
                    const q = modalStudentSearchQuery.toLowerCase();
                    return (s.nama || '').toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q);
                  });

                  if (eligibleStudents.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada santri yang sesuai pencarian.
                      </div>
                    );
                  }

                  const isAllSelected = eligibleStudents.length > 0 && eligibleStudents.every(s => selectedModalStudentIds.includes(s.id));

                  const handleSelectAllModal = () => {
                    if (isAllSelected) {
                      const filteredIds = eligibleStudents.map(s => s.id);
                      setSelectedModalStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
                    } else {
                      const newSelected = [...selectedModalStudentIds];
                      eligibleStudents.forEach(s => {
                        if (!newSelected.includes(s.id)) {
                          newSelected.push(s.id);
                        }
                      });
                      setSelectedModalStudentIds(newSelected);
                    }
                  };

                  return (
                    <>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[10px] text-slate-505 font-bold shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllModal}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors select-none cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() => {}}
                            className="h-3 w-3 text-purple-600 border-slate-300 rounded pointer-events-none"
                          />
                          <span>Pilih Semua ({eligibleStudents.length})</span>
                        </button>
                        <span className="text-purple-600 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded-full">{selectedModalStudentIds.length} terpilih</span>
                      </div>

                      <div className="space-y-1.5">
                        {eligibleStudents.map(s => {
                          const isSelected = selectedModalStudentIds.includes(s.id);
                          return (
                            <div 
                              key={`eligible-${s.id}`}
                              onClick={() => {
                                setSelectedModalStudentIds(prev => 
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50/20' 
                                  : 'border-slate-100 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="h-3.5 w-3.5 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                                />
                                <img 
                                  src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                  alt={s.nama} 
                                  referrerPolicy="no-referrer"
                                  className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{s.nama}</p>
                                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    {s.nis}{s.kecamatan || s.kabupaten ? ` • ${[s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                                {s.kamar ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                    <ArrowLeftRight className="h-2.5 w-2.5" />
                                    Kamar Saat Ini: {s.kamar}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                    Belum Ada Kamar
                                  </span>
                                )}

                                <div 
                                  className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-mono shrink-0" 
                                  title={`Umur: ${calculateAge(s.tanggalLahir)} Tahun`}
                                >
                                  {calculateAge(s.tanggalLahir)}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSantriForDetail(s);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-100 rounded-lg transition-all cursor-pointer bg-transparent"
                                >
                                  Biodata
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500">{selectedModalStudentIds.length} santri terpilih</span>
                  {selectedModalStudentIds.length > ((activeRoomForDetail.kapasitas || 15) - classMembers.length) && (
                    <span className="text-[9px] font-bold text-rose-600 mt-0.5">
                      Melebihi kapasitas! (Sisa kuota: {Math.max(0, (activeRoomForDetail.kapasitas || 15) - classMembers.length)})
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMemberModalOpen(false);
                      setSelectedModalStudentIds([]);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedModalStudentIds.length === 0 || 
                      selectedModalStudentIds.length > ((activeRoomForDetail.kapasitas || 15) - classMembers.length)
                    }
                    onClick={() => {
                      selectedModalStudentIds.forEach(id => {
                        onUpdateSantriRoom(id, activeRoomForDetail.nama);
                      });
                      setToast({
                        message: `${selectedModalStudentIds.length} anggota berhasil ditambahkan ke kamar ${activeRoomForDetail.nama}.`,
                        type: 'success'
                      });
                      setIsAddMemberModalOpen(false);
                      setSelectedModalStudentIds([]);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan Anggota
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Migrate Modal */}
      <AnimatePresence>
        {isMigrateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-visible">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
              onClick={() => {
                setIsMigrateModalOpen(false);
                setSelectedDestComplexId('');
                setSelectedDestRoomId('');
                setDestNomorLemari('');
                setIsDestDropdownOpen(false);
                setIsDestComplexDropdownOpen(false);
              }}
            />
            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-visible">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl z-10 text-slate-700 font-sans space-y-4 overflow-visible"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 text-purple-650">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-black text-slate-900">
                      {migrateTargetStudents.length > 1 ? `Pindahkan ${migrateTargetStudents.length} Santri` : `Pindahkan Kamar - ${migrateTargetStudents[0]?.nama}`}
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      Pilih kompleks asrama, kamar tujuan, dan nomor lemari baru.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 overflow-visible">
                  {/* Kompleks Dropdown */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                      PILIH KOMPLEKS <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative overflow-visible">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDestComplexDropdownOpen(!isDestComplexDropdownOpen);
                          setIsDestDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-850 hover:border-slate-300 focus:outline-none transition-all cursor-pointer"
                      >
                        <span className="truncate">
                          {selectedDestComplexId
                            ? kompleksList.find(c => c.id === selectedDestComplexId)?.nama
                            : '-- Pilih Kompleks --'}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isDestComplexDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDestComplexDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={() => setIsDestComplexDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl py-1.5 z-30 text-left font-sans">
                            {kompleksList
                              .filter(c => c.gender === selectedGender)
                              .map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDestComplexId(c.id);
                                    setSelectedDestRoomId('');
                                    setIsDestComplexDropdownOpen(false);
                                  }}
                                  className={`w-full px-3.5 py-2 text-xs font-bold text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                                    selectedDestComplexId === c.id ? 'bg-purple-50 text-purple-850' : 'text-slate-700'
                                  }`}
                                >
                                  {c.nama}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Kamar Dropdown */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                      PILIH KAMAR TUJUAN <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative overflow-visible">
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedDestComplexId) return;
                          setIsDestDropdownOpen(!isDestDropdownOpen);
                          setIsDestComplexDropdownOpen(false);
                        }}
                        disabled={!selectedDestComplexId}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-850 hover:border-slate-300 focus:outline-none transition-all disabled:bg-slate-100/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span className="truncate">
                          {selectedDestRoomId
                            ? selectedDestRoomId
                            : selectedDestComplexId
                            ? '-- Pilih Kamar Tujuan --'
                            : 'Pilih kompleks asrama terlebih dahulu'}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isDestDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDestDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={() => setIsDestDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl py-1.5 z-30 text-left font-sans">
                            {(() => {
                              const availableRooms = kamarList.filter(
                                r => r.kompleksId === selectedDestComplexId && r.nama !== activeRoomForDetail?.nama
                              );

                              if (availableRooms.length === 0) {
                                return (
                                  <div className="px-3.5 py-2.5 text-xs font-medium text-slate-400 italic">
                                    Tidak ada kamar tujuan lain di kompleks ini
                                  </div>
                                );
                              }

                              return availableRooms.map(r => {
                                const currentOccupants = santriList.filter(s => 
                                  s.kamar && r.nama &&
                                  s.kamar.toLowerCase() === r.nama.toLowerCase() &&
                                  !migrateTargetStudents.some(m => m.id === s.id)
                                ).length;
                                const isFull = r.kapasitas ? currentOccupants >= r.kapasitas : false;
                                const capacityLabel = r.kapasitas ? `${currentOccupants}/${r.kapasitas}` : `${currentOccupants}/∞`;
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    disabled={isFull}
                                    onClick={() => {
                                      setSelectedDestRoomId(r.nama);
                                      setIsDestDropdownOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-2 text-xs font-bold text-left flex flex-col hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                                      selectedDestRoomId === r.nama ? 'bg-purple-50 text-purple-850' : 'text-slate-700'
                                    }`}
                                  >
                                    <span>{r.nama} {isFull ? '(Penuh)' : ''}</span>
                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Kapasitas: {capacityLabel} | Ketua: {r.ketuaKamar || '-'}</span>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Nomor Lemari Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                      NOMOR LEMARI (OPSIONAL)
                    </label>
                    <input
                      type="text"
                      value={destNomorLemari}
                      onChange={(e) => setDestNomorLemari(e.target.value)}
                      placeholder="Contoh: L-01, Lemari 2, dsb."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-2 shrink-0 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMigrateModalOpen(false);
                      setSelectedDestComplexId('');
                      setSelectedDestRoomId('');
                      setDestNomorLemari('');
                      setIsDestDropdownOpen(false);
                      setIsDestComplexDropdownOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDestRoomId}
                    onClick={() => {
                      migrateTargetStudents.forEach(s => {
                        onUpdateSantriRoom(s.id, selectedDestRoomId, destNomorLemari);
                      });
                      setIsMigrateModalOpen(false);
                      setSelectedStudentIds([]); // clear selection
                      setSelectedDestComplexId('');
                      setSelectedDestRoomId('');
                      setDestNomorLemari('');
                      setIsDestDropdownOpen(false);
                      setIsDestComplexDropdownOpen(false);
                      setToast({
                        message: `Berhasil memindahkan ${migrateTargetStudents.length} santri ke kamar ${selectedDestRoomId}.`,
                        type: 'success'
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-xs ${
                      selectedDestRoomId
                        ? 'bg-purple-650 hover:bg-purple-750 cursor-pointer active:scale-95'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Simpan Penempatan
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="fixed inset-0 bg-slate-900"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50 text-slate-700 font-sans"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-6">
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Ekspor Data Kamar
                </h3>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pilihan 1: Excel */}
                <button
                  onClick={() => {
                    exportRoomsToExcel();
                    setIsExportModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 group transition-all duration-250 cursor-pointer animate-none bg-transparent text-left outline-none"
                >
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-800 transition-colors text-center">Unduh Excel</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">Format .XLS (Rapi)</p>
                  </div>
                </button>

                {/* Pilihan 2: Cetak PDF */}
                <button
                  onClick={() => {
                    printRooms();
                    setIsExportModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/20 group transition-all duration-250 cursor-pointer animate-none bg-transparent text-left outline-none"
                >
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-rose-800 transition-colors text-center">Cetak PDF</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">Tampilan Cetak / PDF</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-100 z-10 text-center">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-display text-sm font-extrabold text-slate-900">{confirmModal.title}</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{confirmModal.message}</p>
              
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {confirmModal.confirmText || 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Santri Modal */}
      {selectedSantriForDetail && (
        <SantriDetailModal
          selectedSantri={selectedSantriForDetail}
          onClose={() => setSelectedSantriForDetail(null)}
        />
      )}

    </div>
  );
}
