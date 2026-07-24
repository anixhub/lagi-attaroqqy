import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit, ChevronRight, Users, Award, X, Search, Compass, Tag, BookOpen, AlertCircle, ChevronLeft, ArrowLeftRight, LayoutGrid, List, MoreVertical, ArrowUpDown, Download, FileSpreadsheet, Printer, CheckSquare, Eye, ArrowUp, ArrowDown, ChevronDown
} from 'lucide-react';
import { KategoriRombel, KelompokRombel, RombelAssignment, Santri, isEmisTerdaftar } from '../../types';
import SantriDetailModal from '../sekretaris/SantriDetailModal';
import { getPesantrenProfile } from '../SekretarisHelper';

interface RombelSubProps {
  categoriesList: KategoriRombel[];
  groupsList: KelompokRombel[];
  assignmentsList: RombelAssignment[];
  santriList: Santri[];
  onAddCategory: (newCat: KategoriRombel) => void;
  onUpdateCategory: (upCat: KategoriRombel) => void;
  onDeleteCategory: (id: string) => void;
  onAddGroup: (newGrp: KelompokRombel) => void;
  onUpdateGroup: (upGrp: KelompokRombel) => void;
  onDeleteGroup: (id: string) => void;
  onAddAssignment: (newAss: RombelAssignment) => void;
  onRemoveAssignment: (santriId: string, kelompokId: string) => void;
  genderFilter?: 'Putra' | 'Putri';
  canViewPutra?: boolean;
  canViewPutri?: boolean;
  canWritePutra?: boolean;
  canWritePutri?: boolean;
  hideTitle?: boolean;
}

export default function RombelSub({
  categoriesList,
  groupsList,
  assignmentsList,
  santriList,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddAssignment,
  onRemoveAssignment,
  genderFilter = 'Putra',
  canViewPutra = true,
  canViewPutri = true,
  canWritePutra = true,
  canWritePutri = true,
  hideTitle = false
}: RombelSubProps) {
  
  // --- STATE MANAGERS ---
  const [selectedGender, setSelectedGender] = useState<'Putra' | 'Putri'>(genderFilter);

  useEffect(() => {
    if (genderFilter) {
      setSelectedGender(genderFilter);
    }
  }, [genderFilter]);

  const canWriteCurrent = selectedGender === 'Putra' ? canWritePutra : canWritePutri;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return categoriesList[0]?.id || '';
  });

  const [activeGroupForDetail, setActiveGroupForDetail] = useState<KelompokRombel | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSelectedCategoryOptionsOpen, setIsSelectedCategoryOptionsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [rombelSortKey, setRombelSortKey] = useState<'name-asc' | 'name-desc' | 'students-desc' | 'students-asc'>('name-asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStudentSortDropdownOpen, setIsStudentSortDropdownOpen] = useState(false);
  const [studentSortKey, setStudentSortKey] = useState<'name-asc' | 'name-desc' | 'nis-asc' | 'nis-desc'>('name-asc');
  
  // Searches and batch select
  const [rombelSearchQuery, setRombelSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Add Member Modal
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedModalStudentIds, setSelectedModalStudentIds] = useState<string[]>([]);
  const [modalStudentSearchQuery, setModalStudentSearchQuery] = useState('');

  // Dropdowns
  const [activeDropdownGroupId, setActiveDropdownGroupId] = useState<string | null>(null);
  const [activeStudentDropdownId, setActiveStudentDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  // Migrate Modal
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [selectedDestGroupId, setSelectedDestGroupId] = useState('');
  const [migrateTargetStudents, setMigrateTargetStudents] = useState<Santri[]>([]);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);

  // Confirmation Modal
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

  const [rombelLeaders, setRombelLeaders] = useState<Record<string, string>>(() => {
    try {
      const local = localStorage.getItem('smartsantri_rombel_leaders');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('smartsantri_rombel_leaders', JSON.stringify(rombelLeaders));
  }, [rombelLeaders]);

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

  const askConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Hapus') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  const handleToggleSelectGroup = (id: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export All Rombels across all Kategori Rombel into a beautifully formatted Excel File
  const exportRombelToExcel = () => {
    const profile = getPesantrenProfile();
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Data Rombel</x:Name>
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
          .title { font-size: 16px; font-weight: bold; color: #059669; text-align: center; font-family: sans-serif; }
          .meta { font-size: 10px; color: #64748b; text-align: center; }
          .lembaga-header { background-color: #059669; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; }
          .class-header { background-color: #ecfdf5; color: #064e3b; font-size: 11px; font-weight: bold; text-align: center; }
          .table-th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
          .even-row { background-color: #f8fafc; }
          .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
        </style>
      </head>
      <body>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" class="title" style="text-align: center; font-size: 16px; font-weight: bold; color: #059669; height: 35px; vertical-align: middle;">
              DATA ROMBEL SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="4" class="meta" style="text-align: center; font-size: 10px; color: #64748b;">
              Laporan terkelompok per Kategori dan per Kelompok Rombel (${selectedGender}) • Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
            </td>
          </tr>
        </table>
        <br/>
    `;

    categoriesList.forEach((cat) => {
      // Find groups belonging to this Category
      const groupsInCat = groupsList.filter(g => g.kategoriId === cat.id);
      if (groupsInCat.length === 0) return;

      html += `
        <table style="width: 100%; margin-bottom: 15px;">
          <tr class="lembaga-header">
            <td colspan="4" style="background-color: #059669; color: #ffffff; font-size: 13px; font-weight: bold; height: 28px; padding: 6px 12px; vertical-align: middle; text-align: center;">
              KATEGORI ROMBEL: ${cat.nama.toUpperCase()}
            </td>
          </tr>
        </table>
      `;

      groupsInCat.forEach((grp) => {
        // Find assigned students for this group filtered by active gender
        const members = getMembersOfGroup(grp.id, selectedGender);

        html += `
          <table style="width: 100%; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <tr class="class-header">
              <td colspan="4" style="background-color: #ecfdf5; color: #064e3b; font-size: 11px; font-weight: bold; height: 24px; padding: 5px 10px; vertical-align: middle; border: 1px solid #cbd5e1; text-align: center;">
                Nama Kelompok: ${grp.nama} &nbsp;|&nbsp; Pembimbing: ${grp.pembimbing} &nbsp;|&nbsp; Kuota: ${grp.kuota || '-'} &nbsp;|&nbsp; Jumlah: ${members.length} Santri
              </td>
            </tr>
            <tr>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 30px; text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">No</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 65px; text-align: center; border: 1px solid #cbd5e1; white-space: nowrap;">NIS</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 412px; text-align: left; border: 1px solid #cbd5e1; white-space: nowrap; padding-left: 8px;">Nama Lengkap Santri</th>
              <th class="table-th" style="background-color: #f1f5f9; font-weight: bold; color: #334155; width: 412px; text-align: left; border: 1px solid #cbd5e1; white-space: nowrap; padding-left: 8px;">Alamat</th>
            </tr>
        `;

        if (members.length === 0) {
          html += `
            <tr>
              <td colspan="4" class="empty-cell" style="color: #94a3b8; font-style: italic; text-align: center; height: 35px; vertical-align: middle; border: 1px solid #cbd5e1;">
                Belum ada santri terdaftar di kelompok rombel ini
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
                <td style="font-family: monospace; border: 1px solid #cbd5e1; white-space: nowrap;">${s.nis}</td>
                <td style="font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; white-space: nowrap;">${s.nama}</td>
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
    link.setAttribute('download', `AttarOkey4.0_Data_Rombel_${selectedGender}_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print All Rombels across all Kategori Rombel of selected gender
  const printRombel = () => {
    const profile = getPesantrenProfile();
    let html = `
      <html>
      <head>
        <title>DATA ROMBEL SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          @media print {
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; page-break-inside: avoid; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
            th { background-color: #f1f5f9 !important; font-weight: bold; color: #334155 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; }
            .title { font-size: 16px; font-weight: bold; color: #059669 !important; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .meta { font-size: 10px; color: #64748b !important; text-align: center; margin-bottom: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .lembaga-header { background-color: #059669 !important; color: #ffffff !important; font-size: 13px; font-weight: bold; padding: 6px 12px; margin-bottom: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .class-header { background-color: #ecfdf5 !important; color: #064e3b !important; font-size: 11px; font-weight: bold; padding: 5px 10px; border: 1px solid #cbd5e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
          }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; padding: 30px; max-width: 900px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-align: center; }
          .title { font-size: 16px; font-weight: bold; color: #059669; text-align: center; }
          .meta { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 15px; }
          .lembaga-header { background-color: #059669; color: #ffffff; font-size: 13px; font-weight: bold; padding: 6px 12px; margin-bottom: 8px; }
          .class-header { background-color: #ecfdf5; color: #064e3b; font-size: 11px; font-weight: bold; padding: 5px 10px; border: 1px solid #cbd5e1; }
          .empty-cell { color: #94a3b8; font-style: italic; text-align: center; }
        </style>
      </head>
      <body>
        <div class="title">DATA ROMBEL SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</div>
        <div class="meta">Laporan terkelompok per Kategori dan per Kelompok Rombel (${selectedGender}) • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
    `;

    categoriesList.forEach((cat) => {
      const groupsInCat = groupsList.filter(g => g.kategoriId === cat.id);
      if (groupsInCat.length === 0) return;

      html += `
        <div class="lembaga-header" style="margin-top: 20px;">
          KATEGORI ROMBEL: ${cat.nama.toUpperCase()}
        </div>
      `;

      groupsInCat.forEach((grp) => {
        const members = getMembersOfGroup(grp.id, selectedGender);

        html += `
          <div class="class-header" style="margin-top: 10px;">
            Nama Kelompok: ${grp.nama} &nbsp;|&nbsp; Pembimbing: ${grp.pembimbing} &nbsp;|&nbsp; Kuota: ${grp.kuota || '-'} &nbsp;|&nbsp; Jumlah: ${members.length} Santri
          </div>
          <table style="width: 100%;">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 65px; text-align: center;">NIS</th>
                <th style="width: 412px; text-align: left; padding-left: 8px;">Nama Lengkap Santri</th>
                <th style="width: 412px; text-align: left; padding-left: 8px;">Alamat</th>
              </tr>
            </thead>
            <tbody>
        `;

        if (members.length === 0) {
          html += `
            <tr>
              <td colspan="4" class="empty-cell">Belum ada santri terdaftar di kelompok rombel ini</td>
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
                <td style="font-family: monospace; text-align: center;">${s.nis}</td>
                <td style="font-weight: bold; color: #1e293b;">${s.nama}</td>
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
    setSelectedGroupIds([]);
    setSelectedStudentIds([]);
    setRombelSearchQuery('');
    setStudentSearchQuery('');
    setActiveGroupForDetail(null);
  }, [selectedCategoryId, selectedGender]);

  useEffect(() => {
    setSelectedStudentIds([]);
    setStudentSearchQuery('');
    setSelectedModalStudentIds([]);
    setModalStudentSearchQuery('');
  }, [activeGroupForDetail?.id]);

  // Modals Forms
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<KategoriRombel | null>(null);

  const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
  const [rombelToEdit, setRombelToEdit] = useState<KelompokRombel | null>(null);

  // Form states - Kategori
  const [catNama, setCatNama] = useState('');
  const [catDeskripsi, setCatDeskripsi] = useState('');

  // Form states - Rombel
  const [romNama, setRomNama] = useState('');
  const [romPembimbing, setRomPembimbing] = useState('');
  const [romKuota, setRomKuota] = useState<number>(20);

  // Handlers for Category Form
  const openAddCategory = () => {
    setCategoryToEdit(null);
    setCatNama('');
    setCatDeskripsi('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: KategoriRombel, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToEdit(cat);
    setCatNama(cat.nama);
    setCatDeskripsi(cat.deskripsi || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNama.trim()) return;

    if (categoryToEdit) {
      onUpdateCategory({
        ...categoryToEdit,
        nama: catNama.trim(),
        deskripsi: catDeskripsi.trim()
      });
    } else {
      const newId = 'R' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      onAddCategory({
        id: newId,
        nama: catNama.trim(),
        deskripsi: catDeskripsi.trim()
      });
      setSelectedCategoryId(newId);
    }
    setIsCategoryModalOpen(false);
  };

  // Handlers for Rombel Form
  const openAddRombel = () => {
    if (!selectedCategoryId) return;
    setRombelToEdit(null);
    setRomNama('');
    setRomPembimbing('');
    setRomKuota(20);
    setIsRombelModalOpen(true);
  };

  const openEditRombel = (rom: KelompokRombel, e: React.MouseEvent) => {
    e.stopPropagation();
    setRombelToEdit(rom);
    setRomNama(rom.nama);
    setRomPembimbing(rom.pembimbing);
    setRomKuota(rom.kuota || 20);
    setIsRombelModalOpen(true);
  };

  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!romNama.trim()) return;

    if (rombelToEdit) {
      onUpdateGroup({
        ...rombelToEdit,
        nama: romNama.trim(),
        pembimbing: romPembimbing.trim() || '',
        kuota: Number(romKuota)
      });
      if (activeGroupForDetail?.id === rombelToEdit.id) {
        setActiveGroupForDetail({
          ...activeGroupForDetail,
          nama: romNama.trim(),
          pembimbing: romPembimbing.trim() || '',
          kuota: Number(romKuota)
        });
      }
    } else {
      onAddGroup({
        id: 'G' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
        kategoriId: selectedCategoryId,
        nama: romNama.trim(),
        pembimbing: romPembimbing.trim() || '',
        kuota: Number(romKuota)
      });
    }
    setIsRombelModalOpen(false);
  };

  // --- FILTERS & COMPUTED VALUES ---
  const activeCategory = categoriesList.find(c => c.id === selectedCategoryId);
  const activeRombels = groupsList.filter(g => g.kategoriId === selectedCategoryId);

  // Get members mapping for groups, optionally filtered by gender
  const getMembersOfGroup = (groupId: string, genderFilter?: 'Putra' | 'Putri') => {
    const assignedIds = assignmentsList
      .filter(a => a.kelompokId === groupId)
      .map(a => a.santriId);
    let members = santriList.filter(s => assignedIds.includes(s.id));
    if (genderFilter) {
      members = members.filter(s => s.gender === genderFilter);
    }
    return members;
  };

  // Filter groups based on search query
  const searchedGroups = activeRombels.filter(g => {
    if (!rombelSearchQuery) return true;
    const query = rombelSearchQuery.toLowerCase();
    return (
      (g.nama || '').toLowerCase().includes(query) ||
      (g.pembimbing || '').toLowerCase().includes(query)
    );
  });

  // Sort groups based on rombelSortKey
  const sortedGroups = [...searchedGroups].sort((a, b) => {
    if (rombelSortKey === 'name-asc') {
      return a.nama.localeCompare(b.nama);
    }
    if (rombelSortKey === 'name-desc') {
      return b.nama.localeCompare(a.nama);
    }
    if (rombelSortKey === 'students-desc') {
      const countA = getMembersOfGroup(a.id, selectedGender).length;
      const countB = getMembersOfGroup(b.id, selectedGender).length;
      return countB - countA;
    }
    if (rombelSortKey === 'students-asc') {
      const countA = getMembersOfGroup(a.id, selectedGender).length;
      const countB = getMembersOfGroup(b.id, selectedGender).length;
      return countA - countB;
    }
    return 0;
  });

  // Filter students of active detailed group based on search query and sort them
  const getFilteredStudentsForActiveGroup = () => {
    if (!activeGroupForDetail) return [];
    const members = getMembersOfGroup(activeGroupForDetail.id, selectedGender);
    
    // Filter
    const filtered = !studentSearchQuery
      ? members
      : members.filter(s => {
          const query = studentSearchQuery.toLowerCase();
          return (
            String(s.nama || '').toLowerCase().includes(query) ||
            String(s.nis || '').toLowerCase().includes(query) ||
            String(s.kamar || '').toLowerCase().includes(query)
          );
        });

    // Sort
    return [...filtered].sort((a, b) => {
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
      return 0;
    });
  };

  // Mobile selected rombel fallback
  const [mobileSelectedRombelId, setMobileSelectedRombelId] = useState('');
  useEffect(() => {
    if (activeRombels.length > 0 && !mobileSelectedRombelId) {
      setMobileSelectedRombelId(activeRombels[0].id);
    }
  }, [activeRombels, mobileSelectedRombelId]);

  // Count total students in selected Category with the current selected gender
  const totalSantriInCatAndGender = activeRombels.reduce((sum, g) => {
    return sum + getMembersOfGroup(g.id, selectedGender).length;
  }, 0);

  // Selection state helpers
  const isAllGroupsSelected = searchedGroups.length > 0 && selectedGroupIds.length === searchedGroups.length;
  const isAnyGroupSelected = selectedGroupIds.length > 0;

  const handleToggleSelectAllGroups = () => {
    if (isAllGroupsSelected) {
      const searchedIds = searchedGroups.map(g => g.id);
      setSelectedGroupIds(prev => prev.filter(id => !searchedIds.includes(id)));
    } else {
      const newSelected = [...selectedGroupIds];
      searchedGroups.forEach(g => {
        if (!newSelected.includes(g.id)) {
          newSelected.push(g.id);
        }
      });
      setSelectedGroupIds(newSelected);
    }
  };

  // Computed visibility values
  const isCol1Visible = false; // Hide sidebar list, use selector dropdown
  const showCol3 = !!activeGroupForDetail;

  let col1Span = "hidden";
  let col2Span = "lg:col-span-12";
  let col3Span = "hidden";

  if (activeGroupForDetail) {
    col1Span = "hidden";
    col2Span = "lg:col-span-6";
    col3Span = "hidden lg:flex lg:col-span-6";
  } else {
    col1Span = "hidden";
    col2Span = "lg:col-span-12";
    col3Span = "hidden";
  }

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
       {/* Main Page Title with Clickable Gender Toggle */}
      {!hideTitle && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Kelola Rombel</span>
              <span 
                onClick={() => setSelectedGender(selectedGender === 'Putra' ? 'Putri' : 'Putra')}
                className={`inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 select-none active:scale-95 ${
                  selectedGender === 'Putra' ? 'text-blue-600' : 'text-rose-600'
                }`}
                title="Klik untuk mengubah gender rombel (Putra ⇄ Putri)"
              >
                <span>{selectedGender}</span>
                <ArrowLeftRight 
                  className={`h-4 w-4 mt-0.5 transition-colors ${
                    selectedGender === 'Putra' ? 'text-blue-400 hover:text-blue-600' : 'text-rose-400 hover:text-rose-600'
                  }`} 
                />
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Mengatur data kategori rombel, kelompok rombel, pembimbing, dan pembagian santri <span className={selectedGender === 'Putra' ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}>{selectedGender}</span> secara terintegrasi.
            </p>
          </div>
        </div>
      )}

      {/* Selectors Bar (Identical to Kelola Kelas) */}
      <div className="flex flex-row items-center gap-2 w-full mb-6">
        {/* Dropdown Kategori Rombel */}
        <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="h-10 px-4 w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-slate-900 flex items-center justify-between shadow-sm transition-all cursor-pointer outline-none font-bold text-xs"
            title="Pilih Kategori Rombel"
          >
            <span className="truncate">{activeCategory ? activeCategory.nama : 'Pilih Kategori Rombel'}</span>
            <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
          </button>

          <AnimatePresence>
            {isCategoryDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1.5 w-full md:w-72 rounded-2xl border border-slate-100 bg-white shadow-xl py-2 z-45 text-left"
                >
                  <div className="max-h-64 overflow-y-auto py-1">
                    {categoriesList.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                        Belum ada kategori terdaftar.
                      </div>
                    ) : (
                      categoriesList.map((c) => {
                        const isSelected = c.id === selectedCategoryId;
                        return (
                          <div
                            key={c.id}
                            className={`group flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-emerald-50/50' : ''
                            }`}
                            onClick={() => {
                              setSelectedCategoryId(c.id);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <span className={`text-xs truncate mr-2 ${isSelected ? 'font-extrabold text-emerald-950' : 'text-slate-600 font-medium'}`}>
                              {c.nama}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 3-Dot Options Button */}
        {canWriteCurrent && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsSelectedCategoryOptionsOpen(!isSelectedCategoryOptionsOpen)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-all cursor-pointer outline-none shadow-sm"
              title="Opsi Kategori Rombel"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {isSelectedCategoryOptionsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-35 cursor-default" 
                    onClick={() => setIsSelectedCategoryOptionsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl py-1.5 z-45 text-left"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSelectedCategoryOptionsOpen(false);
                        openAddCategory();
                      }}
                      className="w-full px-4 py-2 text-xs text-emerald-600 hover:bg-slate-50 hover:text-emerald-800 flex items-center transition-colors cursor-pointer font-bold"
                    >
                      Tambah Kategori
                    </button>
                    {activeCategory && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectedCategoryOptionsOpen(false);
                            openAddRombel();
                          }}
                          className="w-full px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-medium border-t border-slate-50 mt-1 pt-1"
                        >
                          Tambah Kelompok
                        </button>
                         <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectedCategoryOptionsOpen(false);
                            openEditCategory(activeCategory, e);
                          }}
                          className="w-full px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-medium"
                        >
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectedCategoryOptionsOpen(false);
                            askConfirmation(
                              'Hapus Kategori Rombel',
                              `Apakah Anda yakin ingin menghapus kategori rombel "${activeCategory.nama}"? Semua kelompok di bawahnya dan relasi anggotanya akan ikut terhapus permanen!`,
                              () => {
                                onDeleteCategory(activeCategory.id);
                                const remaining = categoriesList.filter(item => item.id !== activeCategory.id);
                                setSelectedCategoryId(remaining[0]?.id || '');
                              }
                            );
                          }}
                          className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center transition-colors cursor-pointer font-bold border-t border-slate-50 mt-1 pt-1"
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

        {/* Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer outline-none shrink-0 shadow-sm"
          title="Ekspor Data Rombel"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">

        {/* Main Grid: Groups under selected Category */}
        <div className={`flex flex-col gap-4 ${col2Span}`}>
          {/* Box 3: Rombel List Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[528px] flex flex-col">
            {!selectedCategoryId ? (
              <div className="flex-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                <Compass className="h-10 w-10 text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="text-sm font-extrabold text-slate-800">Silakan Pilih Kategori Rombel</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Pilih salah satu kategori rombel pada panel sebelah kiri untuk mulai mengelola kelompok belajar, pembimbing, dan anggotanya.
                </p>
              </div>
            ) : activeRombels.length === 0 ? (
              <div className="flex-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                <Users className="h-10 w-10 text-slate-300 mb-2.5" />
                <h4 className="text-sm font-extrabold text-slate-800">Belum Ada Rombel</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                  Kategori ini belum memiliki kelompok rombel terdaftar. Silakan buat kelompok rombel pertama untuk mengelompokkan santri.
                </p>
                {canWriteCurrent && (
                  <button
                    onClick={openAddRombel}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-display text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Rombel Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Search & Sort Control */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 shrink-0">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-0 transition-all">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari rombel atau pembimbing..."
                      value={rombelSearchQuery}
                      onChange={(e) => setRombelSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    />
                    {rombelSearchQuery && (
                      <button
                        onClick={() => setRombelSearchQuery('')}
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
                      className={`h-8 w-8 flex items-center justify-center rounded-xl border font-sans transition-all hover:bg-slate-50 cursor-pointer ${
                        isSortDropdownOpen
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                      title="Urutkan Rombel"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                      {isSortDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={() => setIsSortDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-30 text-slate-700 font-sans"
                          >
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2 pb-1 border-b border-slate-50">
                              Urutkan Berdasarkan
                            </h4>
                            <div className="space-y-1">
                              {[
                                { key: 'name', label: 'Nama' },
                                { key: 'students', label: 'Jumlah Santri' }
                              ].map((opt) => {
                                const isActive = rombelSortKey.startsWith(opt.key);
                                const direction = rombelSortKey.endsWith('desc') ? 'desc' : 'asc';
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      if (isActive) {
                                        setRombelSortKey(direction === 'asc' ? `${opt.key}-desc` as any : `${opt.key}-asc` as any);
                                      } else {
                                        setRombelSortKey(opt.key === 'name' ? 'name-asc' : 'students-desc');
                                      }
                                      setIsSortDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                      isActive
                                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isActive && (
                                      direction === 'asc' ? (
                                        <ArrowUp className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3 text-emerald-600" />
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

                {/* Bulk Action Bar */}
                {selectedGroupIds.length > 0 && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-4 animate-fade-in shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900">
                        {selectedGroupIds.length} Rombel Terpilih
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          askConfirmation(
                            'Konfirmasi Hapus Massal',
                            `Apakah Anda yakin ingin menghapus ${selectedGroupIds.length} kelompok rombel terpilih secara massal? Anggota di dalamnya otomatis akan dikeluarkan.`,
                            () => {
                              selectedGroupIds.forEach(id => onDeleteGroup(id));
                              setSelectedGroupIds([]);
                            }
                          );
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Hapus Massal
                      </button>
                      <button
                        onClick={() => setSelectedGroupIds([])}
                        className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Rombels Content List */}
                {sortedGroups.length === 0 ? (
                  <div className="flex-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center p-8 text-center min-h-[150px]">
                    <Search className="h-10 w-10 text-slate-300 mb-2.5" />
                    <h4 className="text-sm font-extrabold text-slate-800">Hasil Pencarian Nihil</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Tidak ditemukan rombel yang cocok dengan kata kunci "{rombelSearchQuery}". Coba kata kunci yang lain.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pb-24 overflow-y-auto flex-1 pr-1">
                    {sortedGroups.map((g, idx) => {
                      const members = getMembersOfGroup(g.id, selectedGender);
                      const totalMembers = members.length;
                      const isSelected = activeGroupForDetail?.id === g.id;
                      const isGroupSelectedInBulk = selectedGroupIds.includes(g.id);

                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            if (selectedGroupIds.length > 0) {
                              handleToggleSelectGroup(g.id);
                            } else {
                              setActiveGroupForDetail(g);
                            }
                          }}
                          className={`group relative rounded-xl border p-3.5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-row items-center justify-between gap-3 ${
                            isGroupSelectedInBulk
                              ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                              : isSelected
                                ? 'border-emerald-400 bg-emerald-50/25 ring-1 ring-emerald-500/20'
                                : 'border-slate-100 bg-white hover:border-emerald-150'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {selectedGroupIds.length > 0 && (
                              <input
                                type="checkbox"
                                checked={isGroupSelectedInBulk}
                                onChange={() => handleToggleSelectGroup(g.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {g.nama}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                                Pembimbing: <span className="font-semibold text-slate-700">{g.pembimbing}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                                <Users className="h-3 w-3" />
                                <span>{totalMembers} Santri</span>
                              </span>
                            </div>

                            {selectedGroupIds.length === 0 && canWriteCurrent && (
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownGroupId(activeDropdownGroupId === g.id ? null : g.id);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Aksi"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {activeDropdownGroupId === g.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20 cursor-default"
                                      onClick={() => setActiveDropdownGroupId(null)}
                                    />
                                    <div className={`absolute right-0 w-32 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-30 text-left font-sans ${
                                      idx >= 1 && idx >= sortedGroups.length - 2 ? 'bottom-full mb-1' : 'mt-1'
                                    }`}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownGroupId(null);
                                          openEditRombel(g, e);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs flex items-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownGroupId(null);
                                          handleToggleSelectGroup(g.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs flex items-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <span>Pilih</span>
                                      </button>
                                      <div className="border-t border-slate-100 my-1" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownGroupId(null);
                                          askConfirmation(
                                            'Konfirmasi Hapus',
                                            `Apakah Anda yakin ingin menghapus kelompok rombel "${g.nama}"? Anggota di dalamnya otomatis dikeluarkan.`,
                                            () => {
                                              onDeleteGroup(g.id);
                                            }
                                          );
                                        }}
                                        className="w-full px-3 py-1.5 text-xs flex items-center text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-bold"
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
                )}
              </>
            )}
          </div>
        </div>

        {/* Detailed Column 3: Active Rombel Members Management */}
        {showCol3 && (
          <div className={`${col3Span} flex flex-col h-[528px]`}>
            <AnimatePresence mode="wait">
              {!activeGroupForDetail ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 h-full min-h-[350px] flex-1"
                >
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                    <Compass className="h-6 w-6" />
                  </div>
                  <h4 className="font-display text-sm font-extrabold text-slate-700">Detail Rombel</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                    Pilih salah satu rombel di kolom tengah untuk melihat daftar santri secara langsung.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeGroupForDetail.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'tween', duration: 0.15 }}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-hidden h-full flex-1"
                >
                  {/* Detail Panel Header */}
                  {(() => {
                    const groupMembers = getMembersOfGroup(activeGroupForDetail.id, selectedGender);
                    return (
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-extrabold text-slate-900 truncate">
                            {activeGroupForDetail.nama}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {groupMembers.length} Santri
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>Pembimbing: {activeGroupForDetail.pembimbing}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setActiveGroupForDetail(null);
                            }}
                            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Search Box & Sort Button for Students */}
                  <div className="flex items-center gap-2 mt-3 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari santri, NIS, atau kamar..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      />
                      {studentSearchQuery && (
                        <button
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sort Student Button */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setIsStudentSortDropdownOpen(!isStudentSortDropdownOpen)}
                        className={`h-8 w-8 flex items-center justify-center rounded-xl border font-sans transition-all hover:bg-slate-50 cursor-pointer ${
                          isStudentSortDropdownOpen
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                        title="Urutkan"
                      >
                        <ArrowUpDown className="h-4 w-4" />
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
                                  { key: 'nis', label: 'NIS' }
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
                                          setStudentSortKey(opt.key === 'name' ? 'name-asc' : 'nis-asc');
                                        }
                                        setIsStudentSortDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                        isActive
                                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {isActive && (
                                        direction === 'asc' ? (
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
                  </div>

                  {/* Student Bulk Action Bar */}
                  {selectedStudentIds.length > 0 && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl mt-3 animate-fade-in shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-950">
                          {selectedStudentIds.length} Terpilih
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const targetSantris = santriList.filter(s => selectedStudentIds.includes(s.id));
                            setMigrateTargetStudents(targetSantris);
                            setSelectedDestGroupId('');
                            setIsMigrateModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          <span>Pindah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            askConfirmation(
                              'Keluarkan Massal',
                              `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.length} santri terpilih dari rombel ini?`,
                              () => {
                                selectedStudentIds.forEach(id => {
                                  onRemoveAssignment(id, activeGroupForDetail.id);
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

                  {/* Members Listing Panel Container */}
                  <div className="flex-1 flex flex-col min-h-0 mt-4">
                    {/* Scrolling members list */}
                    <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                    {(() => {
                      const filteredMembers = getFilteredStudentsForActiveGroup();

                      if (getMembersOfGroup(activeGroupForDetail.id, selectedGender).length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-450 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                            <Users className="h-8 w-8 text-slate-300 mb-1.5" />
                            <h5 className="text-xs font-bold text-slate-800">Rombel Belum Memiliki Anggota</h5>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                              Tambahkan santri {selectedGender} ke rombel ini dengan mengeklik tombol "Tambah Anggota" di atas.
                            </p>
                          </div>
                        );
                      }

                      if (filteredMembers.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                            <Search className="h-8 w-8 text-slate-300 mb-1.5" />
                            <h5 className="text-xs font-bold text-slate-800">Tidak Cocok</h5>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Pencarian "{studentSearchQuery}" tidak ditemukan pada anggota rombel ini.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 pb-2 animate-fade-in">
                          {filteredMembers.map((s, idx) => {
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
                                className={`group/item flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isStudentSelected
                                    ? 'border-emerald-500 bg-emerald-50/10'
                                    : 'border-slate-50 bg-slate-50/30 hover:bg-slate-50'
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
                                      className="h-3.5 w-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer mr-0.5 shrink-0"
                                    />
                                  )}

                                  <img
                                    src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                    alt={s.nama}
                                    referrerPolicy="no-referrer"
                                    className="h-7.5 w-7.5 rounded-full object-cover shrink-0 border border-slate-200"
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover/item:text-emerald-700 transition-colors">
                                        {s.nama}
                                      </p>
                                      {rombelLeaders[activeGroupForDetail.id] === s.id && (
                                        <Award className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[9px] font-mono text-slate-400 tracking-wider mt-0.5">
                                      {s.nis}{s.kecamatan || s.kabupaten ? ` • ${[s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {/* View Biodata Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSantriForDetail(s);
                                    }}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer"
                                    title="Lihat Detail Biodata"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

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
                                            <span>{isStudentSelected ? 'Batal Pilih' : 'Pilih'}</span>
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveStudentDropdownId(null);
                                              setMigrateTargetStudents([s]);
                                              setSelectedDestGroupId('');
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
                                              const isKetua = rombelLeaders[activeGroupForDetail.id] === s.id;
                                              setRombelLeaders(prev => ({
                                                ...prev,
                                                [activeGroupForDetail.id]: isKetua ? '' : s.id
                                              }));
                                            }}
                                            className="w-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors cursor-pointer font-bold"
                                          >
                                            <span>{rombelLeaders[activeGroupForDetail.id] === s.id ? 'Copot Ketua' : 'Jadikan Ketua'}</span>
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveStudentDropdownId(null);
                                              askConfirmation(
                                                'Konfirmasi Keluarkan',
                                                `Apakah Anda yakin ingin mengeluarkan "${s.nama}" dari rombel ini?`,
                                                () => {
                                                  onRemoveAssignment(s.id, activeGroupForDetail.id);
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
                          })}
                        </div>
                      );
                    })()}
                    </div>

                    {/* Detail Panel Footer / Add Button */}
                    {canWriteCurrent && (
                      <div className="-mx-5 -mb-5 px-5 py-4 bg-slate-50 border-t border-slate-100 mt-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsAddMemberModalOpen(true)}
                          className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Tambah Anggota</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- SIDE DRAWER FOR ROMBEL DETAILS (SANTRI LIST) FOR MOBILE --- */}
      <AnimatePresence>
        {activeGroupForDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveGroupForDetail(null);
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
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-extrabold text-slate-900 truncate">
                    {activeGroupForDetail.nama}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    Pembimbing: {activeGroupForDetail.pembimbing}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setActiveGroupForDetail(null);
                      setSelectedStudentIds([]);
                    }}
                    className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Search & Sort */}
              <div className="p-4 border-b border-slate-50 bg-slate-50/20 shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari santri, NIS, atau kamar..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Sort Student Dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setIsStudentSortDropdownOpen(!isStudentSortDropdownOpen)}
                    className={`h-8 w-8 flex items-center justify-center rounded-xl border font-sans transition-all hover:bg-slate-50 cursor-pointer ${
                      isStudentSortDropdownOpen
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <ArrowUpDown className="h-4 w-4" />
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
                              { key: 'nis', label: 'NIS' }
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
                                      setStudentSortKey(opt.key === 'name' ? 'name-asc' : 'nis-asc');
                                    }
                                    setIsStudentSortDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                                      : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isActive && (
                                    direction === 'asc' ? (
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
              </div>

              {/* Student Bulk Action Bar for Mobile */}
              {selectedStudentIds.length > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl animate-fade-in shrink-0 mx-4 mt-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-950">
                      {selectedStudentIds.length} Terpilih
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const targetSantris = santriList.filter(s => selectedStudentIds.includes(s.id));
                        setMigrateTargetStudents(targetSantris);
                        setSelectedDestGroupId('');
                        setIsMigrateModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span>Pindah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        askConfirmation(
                          'Keluarkan Massal',
                          `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.length} santri terpilih dari rombel ini?`,
                          () => {
                            selectedStudentIds.forEach(id => {
                              onRemoveAssignment(id, activeGroupForDetail.id);
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

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {(() => {
                  const filteredMembers = getFilteredStudentsForActiveGroup();

                  if (getMembersOfGroup(activeGroupForDetail.id, selectedGender).length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                        <Users className="h-8 w-8 text-slate-300 mb-1.5" />
                        <h5 className="text-xs font-bold text-slate-800">Rombel Belum Memiliki Anggota</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Tambahkan santri {selectedGender} ke rombel ini dengan mengeklik tombol "Tambah Anggota" di bawah.
                        </p>
                      </div>
                    );
                  }

                  if (filteredMembers.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <Search className="h-8 w-8 text-slate-300 mb-1.5" />
                        <h5 className="text-xs font-bold text-slate-800">Tidak Cocok</h5>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Pencarian "{studentSearchQuery}" tidak ditemukan pada anggota rombel ini.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredMembers.map((s, idx) => {
                        const isStudentSelected = selectedStudentIds.includes(s.id);
                        return (
                          <div
                            key={`mobile-drawer-mem-${s.id}`}
                            onClick={() => {
                              if (selectedStudentIds.length > 0) {
                                setSelectedStudentIds(prev =>
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              isStudentSelected
                                ? 'border-emerald-500 bg-emerald-50/10'
                                : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-emerald-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
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
                                  className="h-3.5 w-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer mr-0.5 shrink-0"
                                />
                              )}
                              <img
                                src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt={s.nama}
                                referrerPolicy="no-referrer"
                                className="h-9 w-9 rounded-full object-cover border border-slate-150 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-extrabold text-slate-800 truncate">
                                    {s.nama}
                                  </h4>
                                  {rombelLeaders[activeGroupForDetail.id] === s.id && (
                                    <Award className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-450 font-medium mt-0.5 truncate">
                                  NIS: {s.nis} • Kamar {s.kamar || '-'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSantriForDetail(s);
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                title="Lihat Detail Biodata"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

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
                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
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
                                        className="w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center transition-colors cursor-pointer font-bold"
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
                                        className="w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center transition-colors cursor-pointer font-bold"
                                      >
                                        <span>{isStudentSelected ? 'Batal Pilih' : 'Pilih'}</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStudentDropdownId(null);
                                          const targetSantris = [s];
                                          setMigrateTargetStudents(targetSantris);
                                          setSelectedDestGroupId('');
                                          setIsMigrateModalOpen(true);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center transition-colors cursor-pointer font-bold"
                                      >
                                        <span>Pindahkan</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStudentDropdownId(null);
                                          const isKetua = rombelLeaders[activeGroupForDetail.id] === s.id;
                                          setRombelLeaders(prev => ({
                                            ...prev,
                                            [activeGroupForDetail.id]: isKetua ? '' : s.id
                                          }));
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center transition-colors cursor-pointer font-bold"
                                      >
                                        <span>{rombelLeaders[activeGroupForDetail.id] === s.id ? 'Copot Ketua' : 'Jadikan Ketua'}</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStudentDropdownId(null);
                                          askConfirmation(
                                            'Konfirmasi Keluarkan',
                                            `Apakah Anda yakin ingin mengeluarkan "${s.nama}" dari rombel ini?`,
                                            () => {
                                              onRemoveAssignment(s.id, activeGroupForDetail.id);
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
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Drawer Footer Actions */}
              {canWriteCurrent && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Anggota</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: KATEGORI ROMBEL --- */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-5 shadow-2xl w-full max-w-md z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="font-display text-sm font-extrabold text-slate-950">
                  {categoryToEdit ? 'Ubah Kategori Rombel' : 'Tambah Kategori Rombel Baru'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nama Kategori Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catNama}
                    onChange={(e) => setCatNama(e.target.value)}
                    placeholder="Contoh: Halaqah Al-Qur'an, Sorogan Kitab Kuning"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL: ROMBEL GROUP --- */}
      <AnimatePresence>
        {isRombelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRombelModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-5 shadow-2xl w-full max-w-md z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="font-display text-sm font-extrabold text-slate-950">
                  {rombelToEdit ? 'Ubah Kelompok Rombel' : 'Tambah Kelompok Rombel'}
                </h3>
                <button
                  onClick={() => setIsRombelModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveRombel} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nama Kelompok Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={romNama}
                    onChange={(e) => setRomNama(e.target.value)}
                    placeholder="Contoh: Halaqah Al-Fatih, Sorogan Fathul Qorib"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nama Pembimbing / Ustadz <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={romPembimbing}
                    onChange={(e) => setRomPembimbing(e.target.value)}
                    placeholder="Contoh: Ustadz Ma'ruf, Ustadzah Mumpuni"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsRombelModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    Simpan Kelompok Rombel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD MEMBERS MODAL --- */}
      <AnimatePresence>
        {isAddMemberModalOpen && activeGroupForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddMemberModalOpen(false);
                setSelectedModalStudentIds([]);
                setModalStudentSearchQuery('');
              }}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-5 shadow-2xl w-full max-w-lg z-10 flex flex-col h-[520px] justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="font-display text-sm font-extrabold text-slate-900">
                    Tambah Anggota Rombel ({selectedGender})
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Menambahkan santri ke rombel: <span className="font-bold text-slate-800">{activeGroupForDetail.nama}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddMemberModalOpen(false);
                    setSelectedModalStudentIds([]);
                    setModalStudentSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Search Inside Modal */}
              <div className="py-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama santri atau NIS..."
                    value={modalStudentSearchQuery}
                    onChange={(e) => setModalStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                  {modalStudentSearchQuery && (
                    <button
                      onClick={() => setModalStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Select All inside Modal */}
              {(() => {
                const eligibleStudents = santriList.filter(s => {
                  if (s.gender !== selectedGender) return false;
                  
                  // Check if already in this group
                  const isAlreadyInGroup = assignmentsList.some(a => a.santriId === s.id && a.kelompokId === activeGroupForDetail.id);
                  if (isAlreadyInGroup) return false;
                  
                  return true;
                });

                const filteredEligible = eligibleStudents.filter(s => {
                  if (!modalStudentSearchQuery) return true;
                  const query = modalStudentSearchQuery.toLowerCase();
                  return (
                    String(s.nama || '').toLowerCase().includes(query) ||
                    String(s.nis || '').toLowerCase().includes(query) ||
                    String(s.kamar || '').toLowerCase().includes(query) ||
                    (s.kelas && String(s.kelas).toLowerCase().includes(query))
                  );
                });

                const isAllEligibleSelected = filteredEligible.length > 0 && filteredEligible.every(s => selectedModalStudentIds.includes(s.id));

                const handleToggleSelectAllEligible = () => {
                  if (isAllEligibleSelected) {
                    const idsToRemove = filteredEligible.map(s => s.id);
                    setSelectedModalStudentIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                  } else {
                    const newSelected = [...selectedModalStudentIds];
                    filteredEligible.forEach(s => {
                      if (!newSelected.includes(s.id)) {
                        newSelected.push(s.id);
                      }
                    });
                    setSelectedModalStudentIds(newSelected);
                  }
                };

                return (
                  <>
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-xl mb-2 shrink-0 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={handleToggleSelectAllEligible}
                          className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-all ${
                            isAllEligibleSelected 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {isAllEligibleSelected && <CheckSquare className="h-2.5 w-2.5 stroke-[3px]" />}
                        </div>
                        <span>Pilih Semua yang Tampil ({filteredEligible.length})</span>
                      </div>
                      <div>
                        <span>{selectedModalStudentIds.length} terpilih</span>
                      </div>
                    </div>

                    {/* Scrollable list of students */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4 min-h-0">
                      {filteredEligible.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <Users className="h-8 w-8 text-slate-300 mb-1.5" />
                          <p className="text-xs font-bold text-slate-700">Tidak Ada Santri Tersedia</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Semua santri {selectedGender} yang cocok mungkin sudah terdaftar di kelompok rombel ini.
                          </p>
                        </div>
                      ) : (
                        filteredEligible.map(s => {
                          const isChecked = selectedModalStudentIds.includes(s.id);
                          const isAssignedToOtherGroupInCat = assignmentsList.some(a => a.santriId === s.id && a.kategoriId === selectedCategoryId && a.kelompokId !== activeGroupForDetail.id);
                          
                          // Find name of current group if registered in other group under same category
                          const otherGroupName = (() => {
                            if (!isAssignedToOtherGroupInCat) return null;
                            const ass = assignmentsList.find(a => a.santriId === s.id && a.kategoriId === selectedCategoryId);
                            if (!ass) return null;
                            const found = groupsList.find(g => g.id === ass.kelompokId);
                            return found ? found.nama : null;
                          })();

                          return (
                            <div
                              key={`eligible-${s.id}`}
                              onClick={() => {
                                setSelectedModalStudentIds(prev =>
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? 'border-emerald-200 bg-emerald-50/10 shadow-xs'
                                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <CheckSquare className="h-2.5 w-2.5 stroke-[3px]" />}
                                </div>

                                <img
                                  src={s.filePasFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                  alt={s.nama}
                                  referrerPolicy="no-referrer"
                                  className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-200"
                                />

                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-850 truncate leading-tight">{s.nama}</p>
                                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    {s.nis}{s.kecamatan || s.kabupaten ? ` • ${[s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                                {otherGroupName ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                    <ArrowLeftRight className="h-2.5 w-2.5" />
                                    Pindahan: {otherGroupName}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                    Belum Terdaftar
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSantriForDetail(s);
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer bg-transparent"
                                  title="Lihat Detail Biodata"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMemberModalOpen(false);
                          setSelectedModalStudentIds([]);
                          setModalStudentSearchQuery('');
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={selectedModalStudentIds.length === 0}
                        onClick={() => {
                          const selectedStudents = santriList.filter(s => selectedModalStudentIds.includes(s.id));
                          
                          // Check who already has an assignment in ANOTHER group in this same category
                          const studentsWithOtherGroups = selectedStudents.filter(s => {
                            return assignmentsList.some(a => a.santriId === s.id && a.kategoriId === selectedCategoryId);
                          });

                          const proceedAdding = () => {
                            selectedModalStudentIds.forEach(id => {
                              onAddAssignment({
                                santriId: id,
                                kategoriId: selectedCategoryId,
                                kelompokId: activeGroupForDetail.id
                              });
                            });
                            setToast({
                              message: `${selectedModalStudentIds.length} anggota berhasil ditambahkan ke kelompok ${activeGroupForDetail.nama}.`,
                              type: 'success'
                            });
                            setIsAddMemberModalOpen(false);
                            setSelectedModalStudentIds([]);
                            setModalStudentSearchQuery('');
                          };

                          if (studentsWithOtherGroups.length > 0) {
                            const names = studentsWithOtherGroups.map(s => s.nama).join(', ');
                            const message = `${studentsWithOtherGroups.length} santri (${names}) saat ini sudah terdaftar di kelompok lain pada kategori ${activeCategory?.nama || ''}. Apakah Anda yakin ingin memindahkan mereka ke kelompok "${activeGroupForDetail.nama}"?`;
                            
                            askConfirmation(
                              'Konfirmasi Perpindahan Rombel',
                              message,
                              () => {
                                proceedAdding();
                              },
                              'Ya, Pindahkan'
                            );
                          } else {
                            proceedAdding();
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
                          selectedModalStudentIds.length === 0
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                        }`}
                      >
                        Tambah ({selectedModalStudentIds.length} Santri)
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MIGRATE STUDENT(S) MODAL --- */}
      <AnimatePresence>
        {isMigrateModalOpen && activeGroupForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-visible">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsMigrateModalOpen(false);
                setSelectedDestGroupId('');
                setIsDestDropdownOpen(false);
              }}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-5 shadow-2xl w-full max-w-sm z-10 space-y-4 overflow-visible"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="font-display text-sm font-extrabold text-slate-950">
                  Pindahkan Rombel Santri ({selectedGender})
                </h3>
                <button
                  onClick={() => {
                    setIsMigrateModalOpen(false);
                    setSelectedDestGroupId('');
                    setIsDestDropdownOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4 overflow-visible">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                    PILIH ROMBEL TUJUAN <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative overflow-visible">
                    <button
                      type="button"
                      onClick={() => setIsDestDropdownOpen(!isDestDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-850 hover:border-slate-300 focus:outline-none transition-all cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedDestGroupId
                          ? activeRombels.find(g => g.id === selectedDestGroupId)?.nama
                          : '-- Pilih Rombel Tujuan --'}
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
                          {activeRombels.filter(g => g.id !== activeGroupForDetail.id).length === 0 ? (
                            <div className="px-3.5 py-2 text-xs font-medium text-slate-400 italic">
                              Tidak ada rombel tujuan lain yang tersedia
                            </div>
                          ) : (
                            activeRombels
                              .filter(g => g.id !== activeGroupForDetail.id)
                              .map(g => (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDestGroupId(g.id);
                                    setIsDestDropdownOpen(false);
                                  }}
                                  className={`w-full px-3.5 py-2.5 text-xs font-bold text-left flex flex-col hover:bg-slate-50 transition-colors cursor-pointer ${
                                    selectedDestGroupId === g.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'
                                  }`}
                                >
                                  <span>{g.nama}</span>
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">Pembimbing: {g.pembimbing}</span>
                                </button>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsMigrateModalOpen(false);
                    setSelectedDestGroupId('');
                    setIsDestDropdownOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!selectedDestGroupId}
                  onClick={() => {
                    const destGroup = activeRombels.find(g => g.id === selectedDestGroupId);
                    if (!destGroup) return;

                    migrateTargetStudents.forEach(s => {
                      onRemoveAssignment(s.id, activeGroupForDetail.id);
                      onAddAssignment({
                        santriId: s.id,
                        kategoriId: selectedCategoryId,
                        kelompokId: selectedDestGroupId
                      });
                    });

                    setIsMigrateModalOpen(false);
                    setSelectedDestGroupId('');
                    setSelectedStudentIds([]);
                    setIsDestDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
                    !selectedDestGroupId
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  }`}
                >
                  Ya, Pindahkan
                </button>
              </div>
            </motion.div>
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
                  Ekspor Data Rombel
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
                    exportRombelToExcel();
                    setIsExportModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all duration-250 cursor-pointer animate-none bg-transparent text-left outline-none"
                >
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-center">Unduh Excel</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">Format .XLS (Rapi)</p>
                  </div>
                </button>

                {/* Pilihan 2: Cetak PDF */}
                <button
                  onClick={() => {
                    printRombel();
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

      {/* --- CONFIRMATION DIALOG MODAL --- */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-5 shadow-2xl w-full max-w-sm z-10 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-slate-900">{confirmModal.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal mt-1">{confirmModal.message}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  {confirmModal.confirmText || 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Santri Detailed Biodata Modal (Modul Sekretaris style) */}
      <SantriDetailModal 
        selectedSantri={selectedSantriForDetail}
        onClose={() => setSelectedSantriForDetail(null)}
      />

    </div>
  );
}
