import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Database, 
  Users, 
  Globe, 
  Check, 
  Lock, 
  Eye, 
  Edit3, 
  EyeOff, 
  Save, 
  RefreshCw, 
  Smartphone,
  Sparkles,
  Info,
  Building,
  FileText,
  Wallet,
  Megaphone,
  GraduationCap,
  Search,
  X,
  Bell,
  Printer,
  MapPin,
  Mail,
  Phone,
  Award,
  Trash2,
  AlertTriangle,
  Camera,
  Upload,
  User,
  Pencil,
  Ban,
  Download,
  Cloud,
  ShieldCheck,
  History,
  Star,
  Clock,
  Calendar,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { camelToSnake, snakeToCamel, getSupabaseStatus, updateTableRow, insertTableRow, fetchTableData, deleteTableRow, uploadFileToStorage, getSupabaseClient } from '../lib/api';
import { AppCredentials, Santri, KeamananRecord, RombelAssignment, KelompokRombel, Lembaga, Kelas, KategoriRombel } from '../types';
import { compressImage } from '../lib/utils';
import ProfilPesantrenSub from './ProfilPesantrenSub';
import { ModulePermission, AccountRole, buildPermissions, DEFAULT_ROLES, fetchAndSyncPermissionsFromSupabase } from '../lib/permissions';

export interface PesantrenProfile {
  namaPesantren: string;
  namaYayasan: string;
  nspp: string;
  nomorNotaris: string;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaPengasuh: string;
  namaWakilPengasuh: string;
  namaKetuaYayasan: string;
  namaKetuaPondok: string;
  namaSekretaris: string;
  namaBendahara: string;
  namaKetuaKeamanan: string;
  namaKetuaPendidikan: string;
  kotaTandaTangan: string;
  logoStyle: 'classic' | 'elegant' | 'modern';
  kopTambahan1: string;
  kopTambahan2: string;
  logoUrl?: string;
}

const DEFAULT_PROFILE: PesantrenProfile = {
  namaPesantren: '',
  namaYayasan: '',
  nspp: '',
  nomorNotaris: '',
  alamat: '',
  desa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kodePos: '',
  telepon: '',
  email: '',
  website: '',
  namaPengasuh: '',
  namaWakilPengasuh: '',
  namaKetuaYayasan: '',
  namaKetuaPondok: '',
  namaSekretaris: '',
  namaBendahara: '',
  namaKetuaKeamanan: '',
  namaKetuaPendidikan: '',
  kotaTandaTangan: '',
  logoStyle: 'classic',
  kopTambahan1: '',
  kopTambahan2: '',
};

const MODULE_INFOS = [
  { id: 'sekretaris_putra', name: 'Sekretaris Putra', icon: FileText, colorClass: 'text-emerald-700 bg-emerald-50/50 border-emerald-100', iconColor: 'text-emerald-600' },
  { id: 'sekretaris_putri', name: 'Sekretaris Putri', icon: FileText, colorClass: 'text-pink-700 bg-pink-50/50 border-pink-100', iconColor: 'text-pink-600' },
  { id: 'bendahara_putra', name: 'Bendahara Putra', icon: Wallet, colorClass: 'text-blue-700 bg-blue-50/50 border-blue-100', iconColor: 'text-blue-600' },
  { id: 'bendahara_putri', name: 'Bendahara Putri', icon: Wallet, colorClass: 'text-indigo-700 bg-indigo-50/50 border-indigo-100', iconColor: 'text-indigo-600' },
  { id: 'keamanan_putra', name: 'Keamanan Putra', icon: Shield, colorClass: 'text-rose-700 bg-rose-50/50 border-rose-100', iconColor: 'text-rose-600' },
  { id: 'keamanan_putri', name: 'Keamanan Putri', icon: Shield, colorClass: 'text-pink-700 bg-pink-50/50 border-pink-100', iconColor: 'text-pink-600' },
  { id: 'humasy_putra', name: 'Humasy Putra', icon: Megaphone, colorClass: 'text-teal-700 bg-teal-50/50 border-teal-100', iconColor: 'text-teal-600' },
  { id: 'humasy_putri', name: 'Humasy Putri', icon: Megaphone, colorClass: 'text-emerald-700 bg-emerald-50/50 border-emerald-100', iconColor: 'text-emerald-600' },
  { id: 'pendidikan_putra', name: 'Pendidikan Putra', icon: GraduationCap, colorClass: 'text-indigo-700 bg-indigo-50/50 border-indigo-100', iconColor: 'text-indigo-600' },
  { id: 'pendidikan_putri', name: 'Pendidikan Putri', icon: GraduationCap, colorClass: 'text-amber-700 bg-amber-50/50 border-amber-100', iconColor: 'text-amber-600' }
];

const ACTIONS = [
  { id: 'view', label: 'READ' },
  { id: 'write', label: 'WRITE' }
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface PengaturanViewProps {
  activeCategory?: 'akses' | 'profil' | 'database' | 'kelola_akun' | 'keamanan' | 'feedback' | 'tahun_ajaran';
  setActiveCategory?: (category: 'akses' | 'profil' | 'database' | 'kelola_akun' | 'keamanan' | 'feedback' | 'tahun_ajaran') => void;
}

export default function PengaturanView({
  activeCategory: propCategory,
  setActiveCategory: propSetCategory,
}: PengaturanViewProps = {}) {
  const [localCategory, setLocalCategory] = useState<'akses' | 'profil' | 'database' | 'kelola_akun' | 'keamanan' | 'feedback' | 'tahun_ajaran'>('keamanan');
  const activeCategory = propCategory || localCategory;
  const setActiveCategory = propSetCategory || setLocalCategory;
  const [previewTab, setPreviewTab] = useState<'kop' | 'kuitansi' | 'kartu'>('kop');
  const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
  
  const [roles, setRoles] = useState<AccountRole[]>(() => {
    const local = localStorage.getItem('smartsantri_roles_permissions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBendaharaPusat = parsed.some(r => r?.id === 'bendahara_pusat');
          const firstRoleKeys = Object.keys(parsed[0]?.permissions || {});
          if (firstRoleKeys.length < 20 || hasBendaharaPusat || parsed.length !== DEFAULT_ROLES.length) {
            localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(DEFAULT_ROLES));
            return DEFAULT_ROLES;
          }
          return parsed as AccountRole[];
        }
      } catch (e) {
        return DEFAULT_ROLES;
      }
    }
    return DEFAULT_ROLES;
  });
  
  const [persistedRoles, setPersistedRoles] = useState<AccountRole[]>(() => {
    const local = localStorage.getItem('smartsantri_roles_permissions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBendaharaPusat = parsed.some(r => r?.id === 'bendahara_pusat');
          const firstRoleKeys = Object.keys(parsed[0]?.permissions || {});
          if (firstRoleKeys.length < 20 || hasBendaharaPusat || parsed.length !== DEFAULT_ROLES.length) {
            return DEFAULT_ROLES;
          }
          return parsed as AccountRole[];
        }
      } catch (e) {
        return DEFAULT_ROLES;
      }
    }
    return DEFAULT_ROLES;
  });
  
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [downloadingBackup, setDownloadingBackup] = useState<boolean>(false);

  // Academic Year State
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string; isActive: boolean }>>(() => {
    const local = localStorage.getItem('smartsantri_academic_years');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'ta-1', name: '2025/2026', isActive: false },
      { id: 'ta-2', name: '2026/2027', isActive: true },
      { id: 'ta-3', name: '2027/2028', isActive: false }
    ];
  });

  const [isTaModalOpen, setIsTaModalOpen] = useState(false);
  const [taName, setTaName] = useState('');
  const [editingTa, setEditingTa] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  useEffect(() => {
    localStorage.setItem('smartsantri_academic_years', JSON.stringify(academicYears));
    const active = Array.isArray(academicYears) ? academicYears.find((y: any) => y.isActive) : null;
    if (active) {
      localStorage.setItem('smartsantri_active_tahun_ajaran', active.name);
    }
  }, [academicYears]);

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState<boolean>(false);
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([]);
  const [filterStarredOnly, setFilterStarredOnly] = useState<boolean>(false);
  const [activeFeedbackDetail, setActiveFeedbackDetail] = useState<any | null>(null);

  const [feedbackDeleteConfirm, setFeedbackDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected';
    targetId?: string;
    senderEmail?: string;
  }>({
    isOpen: false,
    type: 'single'
  });

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    setSelectedFeedbackIds([]);
    try {
      const res = await fetch('/api/db/feedback');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const sorted = result.data.sort((a: any, b: any) => {
            const timeA = new Date(a.created_at || a.id || 0).getTime();
            const timeB = new Date(b.created_at || b.id || 0).getTime();
            return timeB - timeA;
          });
          setFeedbacks(sorted);
          setLoadingFeedbacks(false);
          return;
        }
      }
      const local = localStorage.getItem('smartsantri_local_feedback');
      setFeedbacks(local ? JSON.parse(local) : []);
    } catch (e) {
      console.error("Gagal memuat masukan:", e);
      const local = localStorage.getItem('smartsantri_local_feedback');
      setFeedbacks(local ? JSON.parse(local) : []);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleDeleteFeedback = (id: string, senderEmail?: string) => {
    setFeedbackDeleteConfirm({
      isOpen: true,
      type: 'single',
      targetId: id,
      senderEmail: senderEmail || 'Pengguna'
    });
  };

  const handleDeleteSelectedFeedbacks = () => {
    if (selectedFeedbackIds.length === 0) return;
    setFeedbackDeleteConfirm({
      isOpen: true,
      type: 'selected'
    });
  };

  const executeDeleteFeedback = async () => {
    const { type, targetId } = feedbackDeleteConfirm;
    setFeedbackDeleteConfirm(prev => ({ ...prev, isOpen: false }));

    if (type === 'single' && targetId) {
      try {
        await deleteTableRow('feedback', 'smartsantri_local_feedback', targetId);
        setFeedbacks(prev => prev.filter(item => String(item.id) !== String(targetId)));
        setSelectedFeedbackIds(prev => prev.filter(i => String(i) !== String(targetId)));
        if (activeFeedbackDetail && String(activeFeedbackDetail.id) === String(targetId)) {
          setActiveFeedbackDetail(null);
        }
        setToastData({
          title: "Berhasil!",
          desc: "Pesan masukan berhasil dihapus!"
        });
        setShowToast(true);
      } catch (e) {
        console.error("Gagal menghapus masukan:", e);
        // Fallback local deletion
        const local = localStorage.getItem('smartsantri_local_feedback');
        if (local) {
          const parsed = JSON.parse(local);
          const filtered = parsed.filter((item: any) => String(item.id) !== String(targetId));
          localStorage.setItem('smartsantri_local_feedback', JSON.stringify(filtered));
        }
        setFeedbacks(prev => prev.filter(item => String(item.id) !== String(targetId)));
        setToastData({
          title: "Berhasil!",
          desc: "Pesan masukan berhasil dihapus!"
        });
        setShowToast(true);
      }
    } else if (type === 'selected') {
      if (selectedFeedbackIds.length === 0) return;
      try {
        for (const id of selectedFeedbackIds) {
          await deleteTableRow('feedback', 'smartsantri_local_feedback', id);
        }
        const count = selectedFeedbackIds.length;
        setFeedbacks(prev => prev.filter(item => !selectedFeedbackIds.includes(String(item.id))));
        setSelectedFeedbackIds([]);
        if (activeFeedbackDetail && selectedFeedbackIds.includes(String(activeFeedbackDetail.id))) {
          setActiveFeedbackDetail(null);
        }
        setToastData({
          title: "Berhasil!",
          desc: `${count} pesan masukan terpilih berhasil dihapus!`
        });
        setShowToast(true);
      } catch (e) {
        console.error("Gagal menghapus pesan masukan terpilih:", e);
      }
    }
  };

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const updatedStarredStatus = !currentStarred;
      
      // Update local state first for instant reaction
      setFeedbacks(prev => prev.map(item => {
        if (String(item.id) === String(id)) {
          return { ...item, is_starred: updatedStarredStatus, isStarred: updatedStarredStatus };
        }
        return item;
      }));

      if (activeFeedbackDetail && String(activeFeedbackDetail.id) === String(id)) {
        setActiveFeedbackDetail((prev: any) => ({ ...prev, is_starred: updatedStarredStatus, isStarred: updatedStarredStatus }));
      }

      // Update in localStorage cache
      const local = localStorage.getItem('smartsantri_local_feedback');
      if (local) {
        const parsed = JSON.parse(local);
        const mapped = parsed.map((item: any) => {
          if (String(item.id) === String(id)) {
            return { ...item, is_starred: updatedStarredStatus, isStarred: updatedStarredStatus };
          }
          return item;
        });
        localStorage.setItem('smartsantri_local_feedback', JSON.stringify(mapped));
      }

      // Check if Supabase is connected to execute real backend update
      const status = await getSupabaseStatus();
      if (status.connected) {
        await fetch(`/api/db/feedback/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_starred: updatedStarredStatus })
        });
      }
    } catch (e) {
      console.error("Gagal mengubah status bintang:", e);
    }
  };

  const handleClearAllFeedbacks = async () => {
    try {
      for (const f of feedbacks) {
        await deleteTableRow('feedback', 'smartsantri_local_feedback', f.id);
      }
      localStorage.removeItem('smartsantri_local_feedback');
      setFeedbacks([]);
      setSelectedFeedbackIds([]);
      setActiveFeedbackDetail(null);
    } catch (e) {
      console.error("Gagal membersihkan masukan:", e);
      localStorage.removeItem('smartsantri_local_feedback');
      setFeedbacks([]);
      setSelectedFeedbackIds([]);
    }
  };

  const handleStarSelectedFeedbacks = async () => {
    if (selectedFeedbackIds.length === 0) return;
    try {
      // Update state
      setFeedbacks(prev => prev.map(item => {
        if (selectedFeedbackIds.includes(String(item.id))) {
          return { ...item, is_starred: true, isStarred: true };
        }
        return item;
      }));

      // Update local storage
      const local = localStorage.getItem('smartsantri_local_feedback');
      if (local) {
        const parsed = JSON.parse(local);
        const mapped = parsed.map((item: any) => {
          if (selectedFeedbackIds.includes(String(item.id))) {
            return { ...item, is_starred: true, isStarred: true };
          }
          return item;
        });
        localStorage.setItem('smartsantri_local_feedback', JSON.stringify(mapped));
      }

      // Update Supabase if connected
      const status = await getSupabaseStatus();
      if (status.connected) {
        for (const id of selectedFeedbackIds) {
          await fetch(`/api/db/feedback/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_starred: true })
          });
        }
      }
      setSelectedFeedbackIds([]);
    } catch (e) {
      console.error("Gagal membintangi pesan masukan terpilih:", e);
    }
  };

  const handleToggleSelectAll = () => {
    const visibleFeedbacks = filterStarredOnly 
      ? feedbacks.filter(f => f.is_starred || f.isStarred) 
      : feedbacks;
      
    if (selectedFeedbackIds.length === visibleFeedbacks.length) {
      setSelectedFeedbackIds([]);
    } else {
      setSelectedFeedbackIds(visibleFeedbacks.map(f => String(f.id)));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    setSelectedFeedbackIds(prev => {
      const idStr = String(id);
      if (prev.includes(idStr)) {
        return prev.filter(item => item !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      let listSantri: Santri[] = [];
      let listKeamanan: KeamananRecord[] = [];
      let listRombelAssignments: RombelAssignment[] = [];
      let listRombelGroups: KelompokRombel[] = [];
      let listLembaga: Lembaga[] = [];
      let listKelas: Kelas[] = [];
      let listRombelCategories: KategoriRombel[] = [];
      let listPeriode: any[] = [];

      // 1. Try to fetch from Supabase if connected
      const status = await getSupabaseStatus();
      if (status.connected) {
        try {
          const resSantri = await fetch('/api/db/santri');
          if (resSantri.ok) {
            const result = await resSantri.json();
            if (result.success && Array.isArray(result.data)) {
              listSantri = snakeToCamel(result.data);
            }
          }

          const resKeamanan = await fetch('/api/db/keamanan');
          if (resKeamanan.ok) {
            const result = await resKeamanan.json();
            if (result.success && Array.isArray(result.data)) {
              listKeamanan = snakeToCamel(result.data);
            }
          }

          const resAssignments = await fetch('/api/db/rombel_assignment');
          if (resAssignments.ok) {
            const result = await resAssignments.json();
            if (result.success && Array.isArray(result.data)) {
              listRombelAssignments = snakeToCamel(result.data);
            }
          }

          const resGroups = await fetch('/api/db/kelompok_rombel');
          if (resGroups.ok) {
            const result = await resGroups.json();
            if (result.success && Array.isArray(result.data)) {
              listRombelGroups = snakeToCamel(result.data);
            }
          }

          const resLembaga = await fetch('/api/db/lembaga');
          if (resLembaga.ok) {
            const result = await resLembaga.json();
            if (result.success && Array.isArray(result.data)) {
              listLembaga = snakeToCamel(result.data);
            }
          }

          const resKelas = await fetch('/api/db/kelas');
          if (resKelas.ok) {
            const result = await resKelas.json();
            if (result.success && Array.isArray(result.data)) {
              listKelas = snakeToCamel(result.data);
            }
          }

          const resRombelCategories = await fetch('/api/db/kategori_rombel');
          if (resRombelCategories.ok) {
            const result = await resRombelCategories.json();
            if (result.success && Array.isArray(result.data)) {
              listRombelCategories = snakeToCamel(result.data);
            }
          }

          const resPeriode = await fetch('/api/db/periode');
          if (resPeriode.ok) {
            const result = await resPeriode.json();
            if (result.success && Array.isArray(result.data)) {
              listPeriode = snakeToCamel(result.data);
            }
          }
        } catch (e) {
          console.warn("Gagal mengambil data dari Supabase, menggunakan data lokal fallback.", e);
        }
      }

      // 2. Fallback to localStorage if lists are empty
      const parseArrayLocal = (key: string) => {
        const local = localStorage.getItem(key);
        if (!local) return [];
        try {
          const parsed = JSON.parse(local);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      if (!Array.isArray(listSantri) || listSantri.length === 0) {
        listSantri = parseArrayLocal('smartsantri_santriList');
      }
      if (!Array.isArray(listKeamanan) || listKeamanan.length === 0) {
        listKeamanan = parseArrayLocal('smartsantri_keamananList');
      }
      if (!Array.isArray(listRombelAssignments) || listRombelAssignments.length === 0) {
        listRombelAssignments = parseArrayLocal('smartsantri_rombel_assignments');
      }
      if (!Array.isArray(listRombelGroups) || listRombelGroups.length === 0) {
        listRombelGroups = parseArrayLocal('smartsantri_rombel_groups');
      }
      if (!Array.isArray(listLembaga) || listLembaga.length === 0) {
        listLembaga = parseArrayLocal('smartsantri_lembagas');
      }
      if (!Array.isArray(listKelas) || listKelas.length === 0) {
        listKelas = parseArrayLocal('smartsantri_kelas');
      }
      if (!Array.isArray(listRombelCategories) || listRombelCategories.length === 0) {
        listRombelCategories = parseArrayLocal('smartsantri_rombel_categories');
      }
      if (!Array.isArray(listPeriode) || listPeriode.length === 0) {
        listPeriode = parseArrayLocal('smartsantri_custom_periodes');
      }

      // Helper: get class for a specific Lembaga
      const getSantriClassForLembaga = (santri: Santri, lembagaId: string) => {
        if (!santri.kelas || santri.kelas === 'Tanpa Kelas') return '-';
        const sClasses = santri.kelas.split(',').map(x => x.trim().toLowerCase());
        
        // Find the class in listKelas that belongs to this lembaga and is assigned to the santri
        const matchingClass = listKelas.find(c => 
          c.lembagaId === lembagaId && 
          sClasses.includes(c.nama.toLowerCase())
        );
        
        return matchingClass ? matchingClass.nama : '-';
      };

      // Helper: get rombel for a specific Category
      const getSantriRombelForCategory = (santri: Santri, categoryId: string) => {
        const assignment = listRombelAssignments.find(a => 
          String(a.santriId) === String(santri.id) && 
          String(a.kategoriId) === String(categoryId)
        );
        if (!assignment) return '-';
        
        const group = listRombelGroups.find(g => String(g.id) === String(assignment.kelompokId));
        return group ? group.nama : '-';
      };

      // Calculate exact colspans dynamically
      const totalBiodataCols = 31;
      const totalAkademikCols = listLembaga.length + listRombelCategories.length + 1; // +1 is Kamar/Asrama
      const totalDisiplinCols = 2; // Poin Pelanggaran & Jumlah Pelanggaran
      const totalColsCount = totalBiodataCols + totalAkademikCols + totalDisiplinCols;

      // Find active period
      const activePeriodeObj = listPeriode.find((p: any) => p.isActive);
      const activePeriodeText = activePeriodeObj 
        ? `Periode: ${activePeriodeObj.nama}` 
        : 'Semua Periode';

      // Dynamic header parts
      const lembagaHeaderCols = listLembaga.map(l => 
        `<th class="table-th" style="background-color: #fef3c7; color: #92400e; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; white-space: nowrap;">Kelas ${l.nama}</th>`
      ).join('\n');

      const rombelHeaderCols = listRombelCategories.map(cat => 
        `<th class="table-th" style="background-color: #fef3c7; color: #92400e; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; white-space: nowrap;">Rombel ${cat.nama}</th>`
      ).join('\n');

      // 3. Build HTML content for Excel with merged headers
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Backup Biodata Santri</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
            .title { font-size: 16px; font-weight: bold; color: #047857; text-align: center; font-family: sans-serif; }
            .meta { font-size: 10px; color: #64748b; text-align: center; }
            .cat-header-biodata { background-color: #1e3a8a; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; }
            .cat-header-akademik { background-color: #b45309; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; }
            .cat-header-disiplin { background-color: #991b1b; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; }
            .table-th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-align: center; }
            .even-row { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <table style="width: 100%;">
            <tr>
              <td colspan="${totalColsCount}" class="title" style="height: 35px; vertical-align: middle; text-align: center;">
                BACKUP DATA LAPORAN BIODATA SANTRI - SMART SANTRI
              </td>
            </tr>
            <tr>
              <td colspan="${totalColsCount}" class="meta" style="height: 20px; vertical-align: middle; text-align: center;">
                Ekspor Terpadu Biodata, Penempatan Kelas, Rombel, Kamar, dan Poin Pelanggaran &bull; Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
              </td>
            </tr>
            <tr><td colspan="${totalColsCount}" style="border: none; height: 10px;"></td></tr>
            
            <!-- Category Headers (Merged Header Row 1) -->
            <tr>
              <th colspan="${totalBiodataCols}" class="cat-header-biodata" style="background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; height: 26px; vertical-align: middle; text-align: center;">
                BIODATA LENGKAP SANTRI
              </th>
              <th colspan="${totalAkademikCols}" class="cat-header-akademik" style="background-color: #b45309; color: #ffffff; border: 1px solid #cbd5e1; height: 26px; vertical-align: middle; text-align: center;">
                AKADEMIK &amp; PENEMPATAN
              </th>
              <th colspan="${totalDisiplinCols}" class="cat-header-disiplin" style="background-color: #991b1b; color: #ffffff; border: 1px solid #cbd5e1; height: 26px; vertical-align: middle; text-align: center;">
                KEDISIPLINAN (${activePeriodeText})
              </th>
            </tr>

            <!-- Table Column Headers (Row 2) -->
            <tr>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">No</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NIS</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NISN</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NISM</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NIK</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">No KK</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; min-width: 150px;">Nama Santri</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Gender</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Tempat Lahir</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Tanggal Lahir</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Status Keanggotaan</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Status Domisili</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Tanggal Masuk</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Pendidikan Terakhir</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; min-width: 180px;">Alamat</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">RT</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">RW</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Desa</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Kecamatan</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Kabupaten</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Provinsi</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Jarak Rumah (km)</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">No HP</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Nama Ayah</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NIK Ayah</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Pekerjaan Ayah</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Pendidikan Terakhir Ayah</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Nama Ibu</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">NIK Ibu</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Pekerjaan Ibu</th>
              <th class="table-th" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Pendidikan Terakhir Ibu</th>
              
              <!-- Akademik (Dynamic) -->
              ${lembagaHeaderCols}
              ${rombelHeaderCols}
              <th class="table-th" style="background-color: #fef3c7; color: #92400e; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Kamar / Asrama</th>
              
              <!-- Disiplin -->
              <th class="table-th" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Poin Pelanggaran</th>
              <th class="table-th" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #cbd5e1; font-weight: bold; text-align: center;">Jumlah Pelanggaran</th>
            </tr>
      `;

      if (listSantri.length === 0) {
        html += `
          <tr>
            <td colspan="${totalColsCount}" style="text-align: center; color: #64748b; font-style: italic; height: 40px; vertical-align: middle; border: 1px solid #cbd5e1;">
              Belum ada data santri terdaftar
            </td>
          </tr>
        `;
      } else {
        const sortedSantri = [...listSantri].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
        sortedSantri.forEach((s, idx) => {
          const rowStyle = idx % 2 === 1 ? 'background-color: #f8fafc;' : '';
          
          // Sum points of violation for this santri (filtered by active period if exists)
          let violations = listKeamanan.filter((k: any) => k.namaSantri && k.namaSantri.toLowerCase() === (s.nama || "").toLowerCase());
          if (activePeriodeObj && activePeriodeObj.startDate && activePeriodeObj.endDate) {
            violations = violations.filter((k: any) => k.tanggal >= activePeriodeObj.startDate && k.tanggal <= activePeriodeObj.endDate);
          }

          const totalPoin = violations.reduce((acc: number, item: any) => acc + (item.poin || 0), 0);
          const jumlahPelanggaran = violations.length;

          // Get dynamic institution class cells
          const lembagaCellsStr = listLembaga.map(l => {
            const classVal = getSantriClassForLembaga(s, l.id);
            return `<td style="font-weight: bold; text-align: center; border: 1px solid #cbd5e1; background-color: #fffbeb; white-space: nowrap;">${classVal}</td>`;
          }).join('\n');

          // Get dynamic rombel cells
          const rombelCellsStr = listRombelCategories.map(cat => {
            const rombelVal = getSantriRombelForCategory(s, cat.id);
            return `<td style="color: #4b5563; border: 1px solid #cbd5e1; background-color: #fffbeb; white-space: nowrap;">${rombelVal}</td>`;
          }).join('\n');

          html += `
            <tr style="${rowStyle}">
              <td style="text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nis || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nisn || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nism || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nik || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.noKk || '-'}</td>
              <td style="font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; white-space: nowrap;">${s.nama || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.gender || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.tempatLahir || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.tanggalLahir || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.statusKeanggotaan || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.statusDomisili || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.tanggalMasuk || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.pendidikanTerakhir || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.alamat || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.rt || '-'}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1;">${s.rw || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.desa || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.kecamatan || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.kabupaten || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.provinsi || '-'}</td>
              <td style="text-align: right; border: 1px solid #cbd5e1;">${s.jarakRumah || '0'}</td>
              <td style="border: 1px solid #cbd5e1; mso-number-format:'\\@';">${s.noHp || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.namaAyah || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nikAyah || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.pekerjaanAyah || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.pendidikanAyah || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.namaIbu || '-'}</td>
              <td style="font-family: monospace; border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${s.nikIbu || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.pekerjaanIbu || '-'}</td>
              <td style="border: 1px solid #cbd5e1;">${s.pendidikanIbu || '-'}</td>
              
              <!-- Akademik (Dynamic) -->
              ${lembagaCellsStr}
              ${rombelCellsStr}
              <td style="font-weight: bold; text-align: center; border: 1px solid #cbd5e1; background-color: #fffbeb; white-space: nowrap;">${s.kamar || '-'}</td>
              
              <!-- Disiplin -->
              <td style="font-weight: bold; text-align: center; border: 1px solid #cbd5e1; background-color: #fef2f2; color: ${totalPoin > 0 ? '#dc2626' : '#10b981'};">${totalPoin}</td>
              <td style="font-weight: bold; text-align: center; border: 1px solid #cbd5e1; background-color: #fef2f2; color: ${jumlahPelanggaran > 0 ? '#dc2626' : '#10b981'};">${jumlahPelanggaran}</td>
            </tr>
          `;
        });
      }

      html += `
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Go_AttarOkey_Backup_Data_Santri_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal membuat ekspor backup:", err);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const [profile, setProfile] = useState<PesantrenProfile>(() => {
    const local = localStorage.getItem('smartsantri_pesantren_profile');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return (parsed.find(p => p.id === 'main') || parsed[0] || DEFAULT_PROFILE) as PesantrenProfile;
        }
        return parsed as PesantrenProfile;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [persistedProfile, setPersistedProfile] = useState<PesantrenProfile>(() => {
    const local = localStorage.getItem('smartsantri_pesantren_profile');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return (parsed.find(p => p.id === 'main') || parsed[0] || DEFAULT_PROFILE) as PesantrenProfile;
        }
        return parsed as PesantrenProfile;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    let isMounted = true;
    const loadDataFromSupabase = async () => {
      try {
        const remoteProfileData = await fetchTableData<any>('pesantren_profile', 'smartsantri_pesantren_profile', []);
        if (remoteProfileData && remoteProfileData.length > 0) {
          const mainProfile = remoteProfileData.find(p => p.id === 'main') || remoteProfileData[0];
          const mapped: PesantrenProfile = {
            namaPesantren: mainProfile.namaPesantren ?? DEFAULT_PROFILE.namaPesantren,
            namaYayasan: mainProfile.namaYayasan ?? DEFAULT_PROFILE.namaYayasan,
            nspp: mainProfile.nspp ?? DEFAULT_PROFILE.nspp,
            nomorNotaris: mainProfile.nomorNotaris ?? DEFAULT_PROFILE.nomorNotaris,
            alamat: mainProfile.alamat ?? DEFAULT_PROFILE.alamat,
            desa: mainProfile.desa ?? DEFAULT_PROFILE.desa,
            kecamatan: mainProfile.kecamatan ?? DEFAULT_PROFILE.kecamatan,
            kabupaten: mainProfile.kabupaten ?? DEFAULT_PROFILE.kabupaten,
            provinsi: mainProfile.provinsi ?? DEFAULT_PROFILE.provinsi,
            kodePos: mainProfile.kodePos ?? DEFAULT_PROFILE.kodePos,
            telepon: mainProfile.telepon ?? DEFAULT_PROFILE.telepon,
            email: mainProfile.email ?? DEFAULT_PROFILE.email,
            website: mainProfile.website ?? DEFAULT_PROFILE.website,
            namaPengasuh: mainProfile.namaPengasuh ?? DEFAULT_PROFILE.namaPengasuh,
            namaWakilPengasuh: mainProfile.namaWakilPengasuh ?? DEFAULT_PROFILE.namaWakilPengasuh,
            namaKetuaYayasan: mainProfile.namaKetuaYayasan ?? DEFAULT_PROFILE.namaKetuaYayasan,
            namaKetuaPondok: mainProfile.namaKetuaPondok ?? DEFAULT_PROFILE.namaKetuaPondok,
            namaSekretaris: mainProfile.namaSekretaris ?? DEFAULT_PROFILE.namaSekretaris,
            namaBendahara: mainProfile.namaBendahara ?? DEFAULT_PROFILE.namaBendahara,
            namaKetuaKeamanan: mainProfile.namaKetuaKeamanan ?? DEFAULT_PROFILE.namaKetuaKeamanan,
            namaKetuaPendidikan: mainProfile.namaKetuaPendidikan ?? DEFAULT_PROFILE.namaKetuaPendidikan,
            kotaTandaTangan: mainProfile.kotaTandaTangan ?? DEFAULT_PROFILE.kotaTandaTangan,
            logoStyle: mainProfile.logoStyle ?? DEFAULT_PROFILE.logoStyle,
            kopTambahan1: mainProfile.kopTambahan1 ?? DEFAULT_PROFILE.kopTambahan1,
            kopTambahan2: mainProfile.kopTambahan2 ?? DEFAULT_PROFILE.kopTambahan2,
            logoUrl: mainProfile.logoUrl ?? '',
          };
          if (isMounted) {
            setProfile(mapped);
            setPersistedProfile(mapped);
            localStorage.setItem('smartsantri_pesantren_profile', JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn("Gagal memuat profil pesantren dari Supabase. Menggunakan lokal.", err);
      }

      try {
        const remoteCreds = await fetchTableData<any>('app_credentials', 'smartsantri_app_credentials', []);
        if (remoteCreds && remoteCreds.length > 0) {
          const currentUsername = localStorage.getItem('smartsantri_active_username');
          const activeRole = localStorage.getItem('smartsantri_active_role');
          
          // Find active user's credentials row
          const activeUserObj = remoteCreds.find(c => c.username && c.username.toLowerCase() === currentUsername?.toLowerCase())
            || (activeRole === 'superadmin' ? remoteCreds.find(c => c.id === 'superadmin') : null);
            
          if (activeUserObj && isMounted) {
            setSecUserId(activeUserObj.id);
            
            // Set displayName
            let displayNameValue = activeUserObj.displayName || activeUserObj.display_name;
            if (!displayNameValue) {
              displayNameValue = activeUserObj.role ? activeUserObj.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Pengguna';
            }
            setSecDisplayName(displayNameValue);
            localStorage.setItem('smartsantri_active_display_name', displayNameValue);

            // Set avatar
            const avatarValue = activeUserObj.avatarUrl || activeUserObj.avatar_url || '';
            setSecAvatar(avatarValue);
            if (avatarValue) {
              localStorage.setItem('smartsantri_profile_avatar', avatarValue);
            } else {
              localStorage.removeItem('smartsantri_profile_avatar');
            }

            // Set username
            if (activeUserObj.username) {
              setSecUsername(activeUserObj.username);
              setSecNewUsername(activeUserObj.username);
              localStorage.setItem('smartsantri_active_username', activeUserObj.username);
            }
            
            // Set password
            if (activeUserObj.password) {
              setSecPassword(activeUserObj.password);
            }
          }
        }
      } catch (err) {
        console.warn("Gagal memuat profil pengguna dari Supabase. Menggunakan lokal.", err);
      }
    };
    
    loadDataFromSupabase();

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

        const uniqueChannelName = `pengaturan-db-changes-${Math.random().toString(36).substring(2, 9)}`;
        activeChannel = supabase.channel(uniqueChannelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'pesantren_profile' }, (payload: any) => {
            console.log('Realtime pesantren_profile:', payload);
            if (!isMounted) return;
            const mainProfile = payload.new;
            if (mainProfile) {
              const mapped: PesantrenProfile = {
                namaPesantren: mainProfile.nama_pesantren ?? mainProfile.namaPesantren ?? DEFAULT_PROFILE.namaPesantren,
                namaYayasan: mainProfile.nama_yayasan ?? mainProfile.namaYayasan ?? DEFAULT_PROFILE.namaYayasan,
                nspp: mainProfile.nspp ?? DEFAULT_PROFILE.nspp,
                nomorNotaris: mainProfile.nomor_notaris ?? mainProfile.nomorNotaris ?? DEFAULT_PROFILE.nomorNotaris,
                alamat: mainProfile.alamat ?? DEFAULT_PROFILE.alamat,
                desa: mainProfile.desa ?? DEFAULT_PROFILE.desa,
                kecamatan: mainProfile.kecamatan ?? DEFAULT_PROFILE.kecamatan,
                kabupaten: mainProfile.kabupaten ?? DEFAULT_PROFILE.kabupaten,
                provinsi: mainProfile.provinsi ?? DEFAULT_PROFILE.provinsi,
                kodePos: mainProfile.kode_pos ?? mainProfile.kodePos ?? DEFAULT_PROFILE.kodePos,
                telepon: mainProfile.telepon ?? DEFAULT_PROFILE.telepon,
                email: mainProfile.email ?? DEFAULT_PROFILE.email,
                website: mainProfile.website ?? DEFAULT_PROFILE.website,
                namaPengasuh: mainProfile.nama_pengasuh ?? mainProfile.namaPengasuh ?? DEFAULT_PROFILE.namaPengasuh,
                namaWakilPengasuh: mainProfile.nama_wakil_pengasuh ?? mainProfile.namaWakilPengasuh ?? DEFAULT_PROFILE.namaWakilPengasuh,
                namaKetuaYayasan: mainProfile.nama_ketua_yayasan ?? mainProfile.namaKetuaYayasan ?? DEFAULT_PROFILE.namaKetuaYayasan,
                namaKetuaPondok: mainProfile.nama_ketua_pondok ?? mainProfile.namaKetuaPondok ?? DEFAULT_PROFILE.namaKetuaPondok,
                namaSekretaris: mainProfile.nama_sekretaris ?? mainProfile.namaSekretaris ?? DEFAULT_PROFILE.namaSekretaris,
                namaBendahara: mainProfile.nama_bendahara ?? mainProfile.namaBendahara ?? DEFAULT_PROFILE.namaBendahara,
                namaKetuaKeamanan: mainProfile.nama_ketua_keamanan ?? mainProfile.namaKetuaKeamanan ?? DEFAULT_PROFILE.namaKetuaKeamanan,
                namaKetuaPendidikan: mainProfile.nama_ketua_pendidikan ?? mainProfile.namaKetuaPendidikan ?? DEFAULT_PROFILE.namaKetuaPendidikan,
                kotaTandaTangan: mainProfile.kota_tanda_tangan ?? mainProfile.kotaTandaTangan ?? DEFAULT_PROFILE.kotaTandaTangan,
                logoStyle: mainProfile.logo_style ?? mainProfile.logoStyle ?? DEFAULT_PROFILE.logoStyle,
                kopTambahan1: mainProfile.kop_tambahan1 ?? mainProfile.kop_tambahan1 ?? DEFAULT_PROFILE.kopTambahan1,
                kopTambahan2: mainProfile.kop_tambahan2 ?? mainProfile.kopTambahan2 ?? DEFAULT_PROFILE.kopTambahan2,
                logoUrl: mainProfile.logo_url ?? mainProfile.logoUrl ?? '',
              };
              setProfile(mapped);
              setPersistedProfile(mapped);
              localStorage.setItem('smartsantri_pesantren_profile', JSON.stringify(mapped));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_credentials' }, (payload: any) => {
            console.log('Realtime app_credentials:', payload);
            if (!isMounted) return;
            const updatedCred = snakeToCamel(payload.new);
            const currentUsername = localStorage.getItem('smartsantri_active_username');
            const activeRole = localStorage.getItem('smartsantri_active_role');
            
            if (updatedCred && (
              (updatedCred.username && updatedCred.username.toLowerCase() === currentUsername?.toLowerCase()) ||
              (activeRole === 'superadmin' && updatedCred.id === 'superadmin')
            )) {
              setSecUserId(updatedCred.id);
              let displayNameValue = updatedCred.displayName || updatedCred.role ? updatedCred.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Admin Utama';
              setSecDisplayName(displayNameValue);
              localStorage.setItem('smartsantri_active_display_name', displayNameValue);

              const avatarValue = updatedCred.avatarUrl || '';
              setSecAvatar(avatarValue);
              localStorage.setItem('smartsantri_profile_avatar', avatarValue);

              if (updatedCred.username) {
                setSecUsername(updatedCred.username);
                setSecNewUsername(updatedCred.username);
                localStorage.setItem('smartsantri_active_username', updatedCred.username);
              }

              if (updatedCred.password) {
                setSecPassword(updatedCred.password);
              }
            }
          })
          .subscribe();
      } catch (err) {
        console.error("Gagal memulai koneksi realtime di PengaturanView:", err);
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

  const [toastData, setToastData] = useState<{ title: string; desc: string }>({
    title: 'Berhasil Disimpan!',
    desc: 'Konfigurasi hak akses telah diperbarui.'
  });

  const [resetConfirmUser, setResetConfirmUser] = useState<{ id: string; username: string } | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string; username: string } | null>(null);

  // Danger Zone (Hapus Semua Data) States
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [dangerUsernameInput, setDangerUsernameInput] = useState('');
  const [dangerPhraseInput, setDangerPhraseInput] = useState('');
  const [isTruncatingAll, setIsTruncatingAll] = useState(false);

  const executeTruncateAllData = async () => {
    setIsTruncatingAll(true);
    try {
      const res = await fetch("/api/db-truncate-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Gagal mengosongkan database.");
      }

      // Clear local storage tables
      const keysToClear = [
        'smartsantri_lembagas',
        'smartsantri_kelas',
        'smartsantri_kompleks',
        'smartsantri_kamar',
        'smartsantri_rombel_categories',
        'smartsantri_rombel_groups',
        'smartsantri_santriList',
        'smartsantri_keamananList',
        'smartsantri_bendaharaList',
        'smartsantri_custom_periodes',
        'smartsantri_perizinan',
        'smartsantri_katalog_pelanggaran',
        'smartsantri_suratList',
        'smartsantri_feedbackList',
        'smartsantri_pesantren_profile'
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));

      setToastData({
        title: "Penghapusan Berhasil",
        desc: "Seluruh data santri dan transaksi telah berhasil dihapus secara permanen."
      });
      setShowToast(true);
      setIsDangerModalOpen(false);
      setDangerUsernameInput('');
      setDangerPhraseInput('');
      
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      alert("Gagal menghapus data: " + err.message);
    } finally {
      setIsTruncatingAll(false);
    }
  };

  // Supabase states and methods
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; url: string | null; reason: string } | null>(null);
  const [storageStats, setStorageStats] = useState<{ databaseSize: number; bucketSize: number; isFallback: boolean } | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: { local: number; remote: number; syncing: boolean; error?: string } }>({});
  const [overallSyncing, setOverallSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");

  // Credentials Approval System
  const [credentials, setCredentials] = useState<AppCredentials[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCredentials = async () => {
    setLoadingCredentials(true);
    setCredentialsError(null);
    try {
      let data = await fetchTableData<AppCredentials>('app_credentials', 'smartsantri_app_credentials', []);
      
      // Auto seed if empty or only superadmin exists
      const displayable = data.filter(c => c.username && c.username.toLowerCase() !== 'superadmin@attaroqqy.com' && c.username.toLowerCase() !== 'superadmin');
      if (displayable.length === 0) {
        const DEFAULT_CREDS: AppCredentials[] = [
          {
            id: 'david_creds',
            username: 'david@attaroqqy.com',
            role: 'sekretaris_putra',
            status: 'approved',
            createdAt: '2026-07-12T19:32:00.000Z'
          },
          {
            id: 'qowam_creds',
            username: 'qowam@attaroqqy.com',
            role: 'bendahara_putra',
            status: 'approved',
            createdAt: '2026-07-12T20:03:00.000Z'
          },
          {
            id: 'aniq_creds',
            username: 'aniq@attaroqqy.com',
            role: 'humas_putra',
            status: 'approved',
            createdAt: '2026-07-12T21:12:00.000Z'
          },
          {
            id: 'aniq2_creds',
            username: 'aniq2@attaroqqy.com',
            role: 'keamanan_putra',
            status: 'rejected',
            createdAt: '2026-07-12T21:23:00.000Z'
          },
          {
            id: 'najih_creds',
            username: 'najih@attaroqqy.com',
            role: 'sekretaris_putra',
            status: 'pending',
            createdAt: '2026-07-12T21:37:00.000Z'
          },
          {
            id: 'hasan_creds',
            username: 'hasan@attaroqqy.com',
            role: 'pendidikan_putra',
            status: 'approved',
            createdAt: '2026-07-12T10:00:00.000Z'
          },
          {
            id: 'husein_creds',
            username: 'husein@attaroqqy.com',
            role: 'keamanan_putra',
            status: 'approved',
            createdAt: '2026-07-12T11:30:00.000Z'
          },
          {
            id: 'ahmad_creds',
            username: 'ahmad@attaroqqy.com',
            role: 'bendahara_putri',
            status: 'pending',
            createdAt: '2026-07-12T12:00:00.000Z'
          },
          {
            id: 'fatimah_creds',
            username: 'fatimah@attaroqqy.com',
            role: 'sekretaris_putri',
            status: 'pending',
            createdAt: '2026-07-12T13:15:00.000Z'
          },
          {
            id: 'zainab_creds',
            username: 'zainab@attaroqqy.com',
            role: 'pendidikan_putri',
            status: 'pending',
            createdAt: '2026-07-12T14:40:00.000Z'
          },
          {
            id: 'ali_creds',
            username: 'ali@attaroqqy.com',
            role: 'humas_putri',
            status: 'pending',
            createdAt: '2026-07-12T15:20:00.000Z'
          },
          {
            id: 'umar_creds',
            username: 'umar@attaroqqy.com',
            role: 'keamanan_putri',
            status: 'pending',
            createdAt: '2026-07-12T16:05:00.000Z'
          },
          {
            id: 'utsman_creds',
            username: 'utsman@attaroqqy.com',
            role: 'bendahara_putra',
            status: 'pending',
            createdAt: '2026-07-12T17:10:00.000Z'
          },
          {
            id: 'khadijah_creds',
            username: 'khadijah@attaroqqy.com',
            role: 'sekretaris_putri',
            status: 'pending',
            createdAt: '2026-07-12T18:55:00.000Z'
          }
        ];

        for (const defaultCred of DEFAULT_CREDS) {
          try {
            await insertTableRow('app_credentials', 'smartsantri_app_credentials', defaultCred);
          } catch (e) {
            console.warn("Gagal menyisipkan kredensial default:", e);
          }
        }
        data = await fetchTableData<AppCredentials>('app_credentials', 'smartsantri_app_credentials', []);
      }

      setCredentials(data);
      
      // Also fetch and synchronize the latest roles & permissions in real-time from Supabase
      const syncedRoles = await fetchAndSyncPermissionsFromSupabase();
      if (syncedRoles && syncedRoles.length > 0) {
        setRoles(syncedRoles);
        setPersistedRoles(syncedRoles);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data kredensial:", err);
      setCredentialsError("Gagal mengambil data pendaftaran akun dari database.");
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleApproveUser = async (id: string) => {
    try {
      await updateTableRow<AppCredentials>(
        'app_credentials',
        'smartsantri_app_credentials',
        id,
        { status: 'approved' }
      );
      setCredentials(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
      setToastData({
        title: "Persetujuan Berhasil",
        desc: "Akun pengurus telah berhasil disetujui."
      });
      setShowToast(true);
    } catch (err: any) {
      alert("Gagal menyetujui akun: " + err.message);
    }
  };

  const handleRejectUser = async (id: string) => {
    try {
      await updateTableRow<AppCredentials>(
        'app_credentials',
        'smartsantri_app_credentials',
        id,
        { status: 'rejected' }
      );
      setCredentials(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      setToastData({
        title: "Penolakan Berhasil",
        desc: "Akun pengurus telah ditolak."
      });
      setShowToast(true);
    } catch (err: any) {
      alert("Gagal menolak akun: " + err.message);
    }
  };

  const executeResetPasswordAdmin = async (id: string, username: string) => {
    const defaultPassword = "1234";

    try {
      await updateTableRow<AppCredentials>(
        'app_credentials',
        'smartsantri_app_credentials',
        id,
        { 
          password: defaultPassword,
          status: 'approved' 
        }
      );
      
      setCredentials(prev => prev.map(c => c.id === id ? { ...c, password: defaultPassword, status: 'approved' } : c));
      
      setToastData({
        title: "Reset Berhasil",
        desc: `Kata sandi untuk ${username} telah berhasil direset menjadi "1234" dan akun diaktifkan kembali.`
      });
      setShowToast(true);
    } catch (err: any) {
      alert("Gagal mereset kata sandi: " + err.message);
    } finally {
      setResetConfirmUser(null);
    }
  };

  const executeDeleteUser = async (id: string) => {
    try {
      await deleteTableRow('app_credentials', 'smartsantri_app_credentials', id);
      setCredentials(prev => prev.filter(c => c.id !== id));
      setToastData({
        title: "Penghapusan Berhasil",
        desc: "Akun pengurus telah dihapus secara permanen dari sistem."
      });
      setShowToast(true);
    } catch (err: any) {
      alert("Gagal menghapus akun: " + err.message);
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  // Security settings states
  const [secUserId, setSecUserId] = useState(() => {
    const role = localStorage.getItem('smartsantri_active_role');
    return role === 'superadmin' ? 'superadmin' : '';
  });
  const [secUsername, setSecUsername] = useState(() => localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com');
  const [secPassword, setSecPassword] = useState(() => localStorage.getItem('smartsantri_active_password') || '1234');
  const [secNewUsername, setSecNewUsername] = useState(secUsername);
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmNewPassword, setSecConfirmNewPassword] = useState('');
  const [secShowPass, setSecShowPass] = useState(false);
  const [secSuccess, setSecSuccess] = useState<string | null>(null);
  const [secError, setSecError] = useState<string | null>(null);
  const [secSaving, setSecSaving] = useState(false);
  
  const [secDisplayName, setSecDisplayName] = useState(() => localStorage.getItem('smartsantri_active_display_name') || 'Admin Utama');
  const [secAvatar, setSecAvatar] = useState(() => localStorage.getItem('smartsantri_profile_avatar') || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecSuccess(null);
    setSecError(null);
    setSecSaving(true);

    if (secNewPassword && secNewPassword !== secConfirmNewPassword) {
      setSecError('Sandi Baru dan Konfirmasi Sandi Baru tidak cocok!');
      setSecSaving(false);
      return;
    }

    try {
      const updatedPassword = secNewPassword ? secNewPassword : secPassword;
      
      // Update Supabase Database Row
      const targetId = secUserId || 'superadmin';
      
      let finalAvatarUrl = secAvatar;
      if (secAvatar && secAvatar.startsWith('data:')) {
        try {
          finalAvatarUrl = await uploadFileToStorage(secAvatar, 'avatar.png', `avatar_${targetId}`);
        } catch (uploadErr: any) {
          console.error("Gagal mengunggah foto profil:", uploadErr);
          setSecError("Gagal mengunggah foto ke storage, namun tetap menyimpan data profil.");
        }
      }

      await updateTableRow<any>(
        'app_credentials',
        'smartsantri_app_credentials',
        targetId,
        {
          username: secNewUsername,
          password: updatedPassword,
          displayName: secDisplayName,
          avatarUrl: finalAvatarUrl
        }
      );

      // Update Local Caches
      localStorage.setItem('smartsantri_active_username', secNewUsername);
      localStorage.setItem('smartsantri_active_password', updatedPassword);
      localStorage.setItem('smartsantri_active_display_name', secDisplayName);
      localStorage.setItem('smartsantri_profile_avatar', finalAvatarUrl);
      
      if (targetId === 'superadmin') {
        localStorage.setItem('smartsantri_app_credentials', JSON.stringify([{ id: 'superadmin', username: secNewUsername, password: updatedPassword }]));
      }
      
      setSecUsername(secNewUsername);
      setSecPassword(updatedPassword);
      setSecAvatar(finalAvatarUrl);
      setSecNewPassword('');
      setSecConfirmNewPassword('');
      
      // Dispatch custom event to let sidebar update in real-time
      window.dispatchEvent(new Event('smartsantri_profile_updated'));
      
      setSecSuccess('Profil dan Akun Berhasil Diperbarui!');
    } catch (err: any) {
      console.error("Gagal menyimpan perubahan keamanan:", err);
      
      // Save locally anyway for robust offline fallback
      const targetId = secUserId || 'superadmin';
      const updatedPassword = secNewPassword ? secNewPassword : secPassword;
      localStorage.setItem('smartsantri_active_username', secNewUsername);
      localStorage.setItem('smartsantri_active_password', updatedPassword);
      localStorage.setItem('smartsantri_active_display_name', secDisplayName);
      localStorage.setItem('smartsantri_profile_avatar', secAvatar);
      
      if (targetId === 'superadmin') {
        localStorage.setItem('smartsantri_app_credentials', JSON.stringify([{ id: 'superadmin', username: secNewUsername, password: updatedPassword }]));
      }
      
      setSecUsername(secNewUsername);
      setSecPassword(updatedPassword);
      setSecNewPassword('');
      setSecConfirmNewPassword('');

      // Dispatch custom event to let sidebar update in real-time
      window.dispatchEvent(new Event('smartsantri_profile_updated'));
      
      setSecSuccess('Perubahan disimpan secara aman di penyimpanan lokal.');
    } finally {
      setSecSaving(false);
    }
  };

  const fetchCounts = async () => {
    setCheckingDb(true);
    try {
      const resStatus = await fetch("/api/supabase-status");
      const contentType = resStatus.headers.get("content-type") || "";
      if (!resStatus.ok || !contentType.includes("application/json")) {
        console.warn("Koneksi API /api/supabase-status belum siap atau mengembalikan format non-JSON.");
        return;
      }
      const statusData = await resStatus.json();
      setDbStatus(statusData);

      // Fetch storage statistics from our new API endpoint
      try {
        const resStats = await fetch("/api/storage-stats");
        const statsContentType = resStats.headers.get("content-type") || "";
        if (resStats.ok && statsContentType.includes("application/json")) {
          const statsData = await resStats.json();
          if (statsData.success) {
            setStorageStats({
              databaseSize: statsData.databaseSize,
              bucketSize: statsData.bucketSize,
              isFallback: statsData.isFallback
            });
          }
        }
      } catch (err) {
        console.error("Gagal memuat statistik storage:", err);
      }

      if (statusData.connected) {
        const tables = [
          { name: 'santri', key: 'smartsantri_santriList' },
          { name: 'lembaga', key: 'smartsantri_lembagas' },
          { name: 'kelas', key: 'smartsantri_kelas' },
          { name: 'kompleks', key: 'smartsantri_kompleks' },
          { name: 'kamar', key: 'smartsantri_kamar' },
          { name: 'kategori_rombel', key: 'smartsantri_rombel_categories' },
          { name: 'kelompok_rombel', key: 'smartsantri_rombel_groups' },
          { name: 'keamanan', key: 'smartsantri_keamananList' },
          { name: 'bendahara', key: 'smartsantri_bendaharaList' },
          { name: 'periode', key: 'smartsantri_custom_periodes' },
          { name: 'perizinan', key: 'smartsantri_perizinan' },
          { name: 'katalog_pelanggaran', key: 'smartsantri_katalog_pelanggaran' },
        ];

        const counts: typeof syncStatus = {};

        for (const t of tables) {
          const localStr = localStorage.getItem(t.key);
          const localArr = localStr ? JSON.parse(localStr) : [];
          const localCount = Array.isArray(localArr) ? localArr.length : 0;

          let remoteCount = 0;
          let errorMsg = undefined;
          try {
            const resRemote = await fetch(`/api/db/${t.name}`);
            const remoteContentType = resRemote.headers.get("content-type") || "";
            if (resRemote.ok && remoteContentType.includes("application/json")) {
              const remoteData = await resRemote.json();
              if (remoteData.success && Array.isArray(remoteData.data)) {
                remoteCount = remoteData.data.length;
              } else {
                errorMsg = remoteData.error || "Gagal memuat";
              }
            } else {
              errorMsg = `HTTP ${resRemote.status} (Non-JSON)`;
            }
          } catch (e: any) {
            errorMsg = e.message || "Gagal koneksi";
          }

          counts[t.name] = {
            local: localCount,
            remote: remoteCount,
            syncing: false,
            error: errorMsg,
          };
        }

        setSyncStatus(counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSyncAll = async () => {
    setOverallSyncing(true);
    setSyncProgress("Memulai sinkronisasi...");
    try {
      const tables = [
        { name: 'lembaga', key: 'smartsantri_lembagas' },
        { name: 'kelas', key: 'smartsantri_kelas' },
        { name: 'kompleks', key: 'smartsantri_kompleks' },
        { name: 'kamar', key: 'smartsantri_kamar' },
        { name: 'kategori_rombel', key: 'smartsantri_rombel_categories' },
        { name: 'kelompok_rombel', key: 'smartsantri_rombel_groups' },
        { name: 'santri', key: 'smartsantri_santriList' },
        { name: 'keamanan', key: 'smartsantri_keamananList' },
        { name: 'bendahara', key: 'smartsantri_bendaharaList' },
        { name: 'periode', key: 'smartsantri_custom_periodes' },
        { name: 'perizinan', key: 'smartsantri_perizinan' },
        { name: 'katalog_pelanggaran', key: 'smartsantri_katalog_pelanggaran' },
      ];

      for (const t of tables) {
        setSyncProgress(`Mensinkronisasikan tabel ${t.name}...`);
        
        const localStr = localStorage.getItem(t.key);
        if (!localStr) continue;
        const localItems = JSON.parse(localStr);
        if (!Array.isArray(localItems) || localItems.length === 0) continue;

        const resRemote = await fetch(`/api/db/${t.name}`);
        if (!resRemote.ok) {
          throw new Error(`Gagal membaca tabel remote ${t.name}. Pastikan skema tabel sudah dijalankan di Supabase.`);
        }
        const remoteResData = await resRemote.json();
        if (!remoteResData.success) {
          throw new Error(`Gagal membaca tabel remote ${t.name}: ${remoteResData.error}`);
        }
        const remoteItems = remoteResData.data || [];
        const remoteIds = new Set(remoteItems.map((item: any) => String(item.id)));

        const toInsert = localItems.filter((item: any) => !remoteIds.has(String(item.id)));

        if (toInsert.length > 0) {
          setSyncProgress(`Mengunggah ${toInsert.length} data baru ke tabel ${t.name}...`);
          for (let i = 0; i < toInsert.length; i++) {
            const item = toInsert[i];
            const snakeCased = camelToSnake(item);
            
            const resPost = await fetch(`/api/db/${t.name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(snakeCased),
            });
            if (!resPost.ok) {
              const errBody = await resPost.json().catch(() => ({}));
              throw new Error(`Gagal mengunggah data pada tabel ${t.name}: ${errBody.error || 'Kesalahan Server'}`);
            }
            const postResult = await resPost.json();
            if (!postResult.success) {
              throw new Error(`Gagal mengunggah data pada tabel ${t.name}: ${postResult.error}`);
            }
          }
        }
      }

      setSyncProgress("Sinkronisasi selesai dengan sukses!");
      setToastData({
        title: "Sinkronisasi Berhasil",
        desc: "Semua data lokal telah berhasil diunggah ke database Supabase.",
      });
      setShowToast(true);
      await fetchCounts();
    } catch (e: any) {
      console.error(e);
      setSyncProgress(`Sinkronisasi Gagal: ${e.message}`);
      setToastData({
        title: "Sinkronisasi Gagal",
        desc: e.message || "Terjadi kesalahan saat mengunggah data.",
      });
      setShowToast(true);
    } finally {
      setOverallSyncing(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'database') {
      fetchCounts();
    }
    if (activeCategory === 'akses' || activeCategory === 'kelola_akun') {
      fetchCredentials();
    }
    if (activeCategory === 'feedback') {
      fetchFeedbacks();
    }
  }, [activeCategory]);

  const hasChanges = activeCategory === 'akses'
    ? JSON.stringify(roles) !== JSON.stringify(persistedRoles)
    : activeCategory === 'profil'
      ? JSON.stringify(profile) !== JSON.stringify(persistedProfile)
      : false;

  const handleSave = async () => {
    if (activeCategory === 'akses') {
      try {
        // Sync modified roles to Supabase in real-time
        for (const role of roles) {
          const persisted = persistedRoles.find(r => r.id === role.id);
          const hasRoleChanged = !persisted || JSON.stringify(role.permissions) !== JSON.stringify(persisted.permissions);
          
          if (hasRoleChanged) {
            const enabledPermissions = Object.entries(role.permissions)
              .filter(([_, enabled]) => enabled === true)
              .map(([name]) => name);

            const res = await fetch('/api/sync-role-permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roleName: role.id,
                permissions: enabledPermissions
              })
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || `HTTP ${res.status}`);
            }
          }
        }

        localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(roles));
        setPersistedRoles(roles);
        setToastData({
          title: 'Berhasil Disimpan!',
          desc: 'Konfigurasi hak akses telah diperbarui di lokal dan disinkronkan ke Supabase.'
        });
      } catch (err: any) {
        console.error("Gagal sinkronisasi hak akses ke Supabase:", err);
        setToastData({
          title: 'Sinkronisasi Gagal',
          desc: `Konfigurasi tersimpan lokal, namun gagal sinkronisasi ke Supabase: ${err.message || err}`
        });
      }
      setShowToast(true);
    } else if (activeCategory === 'profil') {
      try {
        let finalLogoUrl = profile.logoUrl || '';
        if (profile.logoUrl && profile.logoUrl.startsWith('data:')) {
          setToastData({
            title: 'Mengunggah Logo...',
            desc: 'Mengunggah logo kustom ke Supabase Storage.'
          });
          setShowToast(true);
          try {
            finalLogoUrl = await uploadFileToStorage(profile.logoUrl, 'pesantren_logo.png', 'logo_pesantren');
          } catch (uploadErr: any) {
            console.error("Gagal mengunggah logo pesantren:", uploadErr);
          }
        }
        
        const updatedProfile = { ...profile, logoUrl: finalLogoUrl };

        // Save to Supabase
        const status = await getSupabaseStatus();
        if (status.connected) {
          await updateTableRow<any>(
            'pesantren_profile',
            'smartsantri_pesantren_profile',
            'main',
            updatedProfile
          );
        }

        localStorage.setItem('smartsantri_pesantren_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        setPersistedProfile(updatedProfile);
        
        setToastData({
          title: 'Profil Diperbarui!',
          desc: 'Identitas pesantren berhasil disinkronkan ke database Supabase.'
        });
      } catch (err: any) {
        console.error("Gagal menyimpan profil pesantren:", err);
        // Fallback save to localStorage
        localStorage.setItem('smartsantri_pesantren_profile', JSON.stringify(profile));
        setPersistedProfile(profile);
        setToastData({
          title: 'Profil Diperbarui (Lokal)!',
          desc: `Gagal menyimpan ke Supabase: ${err.message || err}. Data disimpan lokal.`
        });
      }
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Toggle dynamic flat permissions
  const handleTogglePermission = (roleId: string, key: string) => {
    if (roleId === 'superadmin') return;
    const parts = key.split('.');
    const mod = parts[0];
    const act = parts[1];

    setRoles(prev => 
      prev.map(role => {
        if (role.id === roleId) {
          const nextVal = !role.permissions[key];
          const newPermissions = {
            ...role.permissions,
            [key]: nextVal
          };

          // Jika uncheck view, maka write otomatis uncheck juga
          if (act === 'view' && !nextVal) {
            newPermissions[`${mod}.write`] = false;
          }

          // Jika check write, pastikan view tercheck juga
          if (act === 'write' && nextVal) {
            newPermissions[`${mod}.view`] = true;
          }

          return {
            ...role,
            permissions: newPermissions
          };
        }
        return role;
      })
    );
  };

  const handleProfileChange = (key: keyof PesantrenProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredRoles = roles;

  return (
    <div className="space-y-6">
      {/* Toast Notification - Exactly matching screenshot design */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#006e4a] text-white p-4 rounded-xl shadow-2xl border border-emerald-500/30 max-w-sm"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white mt-0.5">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-xs font-extrabold tracking-tight text-white">{toastData.title}</h4>
              <p className="text-[10px] text-emerald-100 font-medium mt-0.5">{toastData.desc}</p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-white/70 hover:text-white shrink-0 -mt-1 -mr-1 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 font-sans"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  <RefreshCw className="h-5 w-5 animate-spin-slow" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-bold text-slate-900">Konfirmasi Reset Akses</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Apakah Anda yakin ingin mengembalikan semua hak akses ke pengaturan awal bawaan? Seluruh perubahan hak akses asrama putra & putri saat ini akan dikembalikan ke setelan default aslinya.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer active:scale-95"
                >
                  Batal
                </button>
                 <button
                  type="button"
                  onClick={() => {
                    setRoles(DEFAULT_ROLES);
                    localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(DEFAULT_ROLES));
                    setPersistedRoles(DEFAULT_ROLES);
                    setShowResetModal(false);
                    setShowToast(true);
                    setTimeout(() => {
                      setShowToast(false);
                    }, 4000);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all cursor-pointer active:scale-95"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header Row with dynamic title and Save/Reset buttons */}
      {activeCategory === 'akses' && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h1 className="font-display text-2xl font-black text-slate-900">
            Manajemen Hak Akses Admin
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowResetModal(true)}
              className="text-red-600 hover:text-red-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Reset
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges}
              title="Simpan Perubahan"
              className={`transition-all shrink-0 ${
                hasChanges 
                  ? 'text-emerald-600 hover:text-emerald-700 cursor-pointer active:scale-95' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <Save className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left-hand Navigation Sidebar - Hidden on desktop since it is integrated into the main sidebar */}
        <div className="md:hidden space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-sm space-y-1">
            <p className="px-3.5 py-1.5 font-display text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Kategori Pengaturan
            </p>
            
            {/* Profil & Akun */}
            <button
              onClick={() => setActiveCategory('keamanan')}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                activeCategory === 'keamanan'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Profil & Akun</span>
            </button>

            {/* Profil Pesantren (Superadmin only) */}
            {activeRole === 'superadmin' && (
              <button
                onClick={() => setActiveCategory('profil')}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                  activeCategory === 'profil'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building className="h-4.5 w-4.5" />
                <span>Profil Pesantren</span>
              </button>
            )}

            {/* Panel Akses & Otoritas (Superadmin only) */}
            {activeRole === 'superadmin' && (
              <button
                onClick={() => setActiveCategory('akses')}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                  activeCategory === 'akses'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Shield className="h-4.5 w-4.5" />
                <span>Panel Akses & Otoritas</span>
              </button>
            )}

            {/* Kelola Akun Pengguna (Superadmin only) */}
            {activeRole === 'superadmin' && (
              <button
                onClick={() => setActiveCategory('kelola_akun')}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                  activeCategory === 'kelola_akun'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="h-4.5 w-4.5 text-rose-600" />
                <span>Kelola Akun Pengguna</span>
              </button>
            )}

            {/* Feedback & Masukan (Superadmin only) */}
            {activeRole === 'superadmin' && (
              <button
                onClick={() => setActiveCategory('feedback')}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                  activeCategory === 'feedback'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Megaphone className="h-4.5 w-4.5 text-purple-600" />
                <span>Feedback & Masukan</span>
              </button>
            )}

            {/* Tahun Ajaran (Superadmin only) */}
            {activeRole === 'superadmin' && (
              <button
                onClick={() => setActiveCategory('tahun_ajaran')}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                  activeCategory === 'tahun_ajaran'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-4.5 w-4.5 text-blue-600" />
                <span>Tahun Ajaran</span>
              </button>
            )}

            {/* Database & Backup */}
            <button
              onClick={() => setActiveCategory('database')}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold transition-all ${
                activeCategory === 'database'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Database className="h-4.5 w-4.5" />
              <div className="flex items-center justify-between w-full">
                <span>Database & Backup</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono font-medium scale-90">MOCK</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right-hand Details Panel */}
        <div className="col-span-1 md:col-span-4">
          <AnimatePresence mode="wait">
            {activeCategory === 'akses' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >


                {/* Horizontal Scroll Table Card - Exactly matching screenshot styling */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        {/* Row 1: Module Group Headers */}
                        <tr className="bg-[#f8fafc] text-[11px] font-extrabold text-slate-500 border-b border-slate-200">
                          <th rowSpan={2} className="py-2 px-3.5 text-slate-600 border-r border-slate-200 text-left min-w-[180px] font-bold">
                            PERAN & AKSES
                          </th>
                          {MODULE_INFOS.map((m) => (
                            <th 
                              key={m.id} 
                              colSpan={2} 
                              className={`py-1.5 px-2 text-center font-display border-r last:border-r-0 font-extrabold border-b border-slate-200 ${m.colorClass}`}
                            >
                              <span className="inline-flex items-center gap-1.5 justify-center">
                                {m.name}
                              </span>
                            </th>
                          ))}
                        </tr>
                        
                        {/* Row 2: Individual Action Column Headers */}
                        <tr className="bg-white border-b border-slate-200">
                          {MODULE_INFOS.map((m) => (
                            <React.Fragment key={m.id}>
                              {ACTIONS.map((a) => (
                                <th 
                                  key={`${m.id}-${a.id}`} 
                                  className="text-[9px] font-extrabold text-slate-500 text-center py-1 px-1 border-r last:border-r-0 border-slate-200"
                                  style={{ minWidth: '40px', width: '40px' }}
                                >
                                  {a.label}
                                </th>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-slate-200">
                        {filteredRoles.map((role) => (
                          <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Role Name only - compact with no sub-labels/badges */}
                            <td className="py-1 px-3.5 border-r border-slate-200 align-middle">
                              <span className="font-display text-xs font-extrabold text-slate-900">
                                {role.name}
                              </span>
                            </td>
                            
                            {/* Actions Checklist Cells */}
                            {MODULE_INFOS.map((m) => (
                              <React.Fragment key={m.id}>
                                {ACTIONS.map((a) => {
                                  const key = `${m.id}.${a.id}`;
                                  
                                  return (
                                    <td 
                                      key={key} 
                                      className="py-0.5 px-1 border-r border-slate-200 last:border-r-0 text-center align-middle"
                                      style={{ minWidth: '40px', width: '40px' }}
                                    >
                                      {role.id === 'superadmin' ? (
                                        // Superadmin: Disabled Checked Checkbox
                                        <div className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded bg-blue-500/30 border border-blue-500/20 text-blue-600 cursor-not-allowed">
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                      ) : (
                                        // Interactive Checked / Unchecked Checkbox for everyone else, on all modules
                                        <div 
                                          onClick={() => {
                                            const isWrite = a.id === 'write';
                                            const viewKey = `${m.id}.view`;
                                            const isWriteDisabled = isWrite && !role.permissions[viewKey];
                                            if (isWriteDisabled) return;
                                            handleTogglePermission(role.id, key);
                                          }}
                                          className={`mx-auto flex h-4.5 w-4.5 items-center justify-center rounded transition-all ${
                                            (a.id === 'write' && !role.permissions[`${m.id}.view`])
                                              ? 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed'
                                              : role.permissions[key]
                                                ? 'bg-blue-600 border border-blue-600 text-white shadow-xs hover:bg-blue-700 cursor-pointer'
                                                : 'bg-white border border-slate-300 hover:border-slate-400 cursor-pointer'
                                          }`}
                                        >
                                          {role.permissions[key] && !(a.id === 'write' && !role.permissions[`${m.id}.view`]) && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Legend & Updated Information bar - exactly matching screenshot */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold text-slate-500 px-1">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                      <span>Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
                      <span>Non-aktif</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Terakhir diupdate: 12 Okt 2023 14:20 oleh Admin Pusat</span>
                  </div>
                </div>
              </motion.div>
            )}

                        {/* Profil Pesantren View */}
            {activeCategory === 'profil' && (
              <ProfilPesantrenSub
                profile={profile}
                handleProfileChange={handleProfileChange}
                handleSave={handleSave}
                hasChanges={hasChanges}
              />
            )}

            {/* Tahun Ajaran (Superadmin only) */}
            {activeCategory === 'tahun_ajaran' && activeRole === 'superadmin' && (
              <div className="space-y-6">
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Pengaturan Tahun Ajaran</h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Kelola beberapa tahun ajaran. Hanya satu tahun ajaran yang dapat diatur sebagai aktif.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTa(null);
                      setTaName('');
                      setIsTaModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Tahun Ajaran
                  </button>
                </div>

                {/* Grid Lists of Academic Years */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(academicYears as any[]).map((ta) => (
                    <div
                      key={ta.id}
                      className={`relative overflow-hidden bg-white rounded-3xl border p-6 flex flex-col justify-between min-h-[160px] transition-all ${
                        ta.isActive
                          ? 'border-emerald-500 shadow-md shadow-emerald-50 bg-emerald-50/10'
                          : 'border-slate-150 hover:border-slate-350 shadow-3xs'
                      }`}
                    >
                      {/* Active indicator top bar */}
                      {ta.isActive && (
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            ta.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-base font-black text-slate-800 tracking-tight block">
                              {ta.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                              TAHUN AJARAN
                            </span>
                          </div>
                        </div>

                        {ta.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                            <Check className="h-3 w-3" /> AKTIF
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 shrink-0">
                            NONAKTIF
                          </span>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-100/60">
                        {!ta.isActive ? (
                          <button
                            onClick={() => {
                              const updated = (academicYears as any[]).map(y => ({
                                ...y,
                                isActive: y.id === ta.id
                              }));
                              setAcademicYears(updated);
                              setToastData({
                                title: "Tahun Ajaran Diaktifkan",
                                desc: `Tahun ajaran ${ta.name} kini berstatus aktif.`
                              });
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 uppercase tracking-wider cursor-pointer"
                          >
                            Set Aktif
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">
                            Sedang Digunakan
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTa(ta);
                              setTaName(ta.name);
                              setIsTaModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit nama"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (ta.isActive) {
                                alert("Tahun ajaran aktif tidak dapat dihapus!");
                                return;
                              }
                              if (confirm(`Apakah Anda yakin ingin menghapus tahun ajaran ${ta.name}?`)) {
                                const updated = (academicYears as any[]).filter(y => y.id !== ta.id);
                                setAcademicYears(updated);
                                setToastData({
                                  title: "Berhasil Dihapus",
                                  desc: `Tahun ajaran ${ta.name} berhasil dihapus.`
                                });
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 3000);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Help instructions info card */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 leading-relaxed font-semibold">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-blue-900 mb-1">Catatan Penting</p>
                    Semua modul sistem seperti Keamanan, Keuangan, dan Kesiswaan akan secara otomatis menyesuaikan acuan data mereka berdasarkan Tahun Ajaran yang diatur sebagai aktif di panel ini.
                  </div>
                </div>

                {/* Modal Tambah/Edit Tahun Ajaran */}
                <AnimatePresence>
                  {isTaModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsTaModalOpen(false)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                      />

                      {/* Modal Panel */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative bg-white rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full overflow-hidden z-10"
                      >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {editingTa ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
                          </h3>
                          <button
                            onClick={() => setIsTaModalOpen(false)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                              Nama Tahun Ajaran
                            </label>
                            <input
                              type="text"
                              value={taName}
                              onChange={(e) => setTaName(e.target.value)}
                              placeholder="Contoh: 2026/2027"
                              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none font-semibold text-slate-700 font-mono"
                              autoFocus
                            />
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">
                              Gunakan format standar seperti YYYY/YYYY (contoh: 2026/2027).
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsTaModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            BATAL
                          </button>
                          <button
                            type="button"
                            disabled={!taName.trim()}
                            onClick={() => {
                              if (editingTa) {
                                // Edit
                                const updated = (academicYears as any[]).map(y => {
                                  if (y.id === (editingTa as any).id) {
                                    return { ...y, name: taName };
                                  }
                                  return y;
                                });
                                setAcademicYears(updated);
                                setToastData({
                                  title: "Tahun Ajaran Diperbarui",
                                  desc: `Tahun ajaran berhasil diubah menjadi ${taName}.`
                                });
                              } else {
                                // Add
                                const newId = `ta-${Date.now()}`;
                                const newTa = {
                                  id: newId,
                                  name: taName,
                                  isActive: (academicYears as any[]).length === 0 // Active if first
                                };
                                setAcademicYears([...(academicYears as any[]), newTa]);
                                setToastData({
                                  title: "Berhasil Ditambahkan",
                                  desc: `Tahun ajaran ${taName} berhasil dibuat.`
                                });
                              }
                              setIsTaModalOpen(false);
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                          >
                            SIMPAN
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Kelola Akun Pengguna View */}
            {activeCategory === 'kelola_akun' && (() => {
              const displayable = credentials.filter(c => c.username && c.username.toLowerCase() !== 'superadmin@attaroqqy.com' && c.username.toLowerCase() !== 'superadmin');
              
              // Sort so that the 5 specific accounts appear in exactly the screenshot's order at the very beginning
              const sortedCredentials = [...displayable].sort((a, b) => {
                const order = [
                  'david@attaroqqy.com',
                  'qowam@attaroqqy.com',
                  'aniq@attaroqqy.com',
                  'aniq2@attaroqqy.com',
                  'najih@attaroqqy.com'
                ];
                const indexA = order.indexOf(a.username?.toLowerCase() || '');
                const indexB = order.indexOf(b.username?.toLowerCase() || '');
                
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              });

              // Pagination
              const itemsPerPage = 5;
              const totalPages = Math.ceil(sortedCredentials.length / itemsPerPage) || 1;
              const paginatedItems = sortedCredentials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

              // Summary Counts
              const activeCount = credentials.filter(c => c.username && c.username.toLowerCase() !== 'superadmin@attaroqqy.com' && c.username.toLowerCase() !== 'superadmin' && c.status === 'approved').length;
              const pendingCount = credentials.filter(c => c.username && c.username.toLowerCase() !== 'superadmin@attaroqqy.com' && c.username.toLowerCase() !== 'superadmin' && c.status === 'pending').length;
              const blockedCount = credentials.filter(c => c.username && c.username.toLowerCase() !== 'superadmin@attaroqqy.com' && c.username.toLowerCase() !== 'superadmin' && c.status === 'rejected').length;

              const formatDate = (dateStr?: string) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                const day = date.getDate();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day} ${month} ${year}, ${hours}.${minutes}`;
              };

              return (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Header Title & Subtitle */}
                  <div className="space-y-1">
                    <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                      Kelola Akun Pengguna
                    </h2>
                    <p className="text-xs text-slate-500 max-w-4xl leading-relaxed font-medium">
                      Manajemen pendaftaran akun pengurus asrama putra & putri. Akun dengan domain <span className="text-[#A30022] font-semibold">@attaroqqy.com</span> harus mendapatkan persetujuan manual.
                    </p>
                  </div>

                  {/* Error Notification */}
                  {credentialsError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold">
                      {credentialsError}
                    </div>
                  )}

                  {/* Main Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {loadingCredentials ? (
                      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin text-rose-600" />
                        <span className="text-xs font-semibold text-slate-500">Memuat data pendaftaran akun...</span>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-4 px-6 font-semibold">EMAIL / USERNAME</th>
                                <th className="py-4 px-6 font-semibold">JENIS AKUN (HAK AKSES)</th>
                                <th className="py-4 px-6 font-semibold">TANGGAL PENDAFTARAN</th>
                                <th className="py-4 px-6 text-center font-semibold">STATUS</th>
                                <th className="py-4 px-6 text-right font-semibold">TINDAKAN</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-[13px]">
                              {paginatedItems.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">
                                    <div className="flex flex-col items-center gap-2">
                                      <Users className="h-10 w-10 text-slate-300" />
                                      <span>Belum ada pengurus asrama yang melakukan pendaftaran mandiri.</span>
                                      <span className="text-xs text-slate-400 font-normal max-w-sm">Minta pengurus untuk mendaftar di halaman login.</span>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                paginatedItems.map((c) => {
                                  const roleLabel = {
                                    superadmin: 'Superadmin',
                                    sekretaris_putra: 'Sekretaris Putra',
                                    sekretaris_putri: 'Sekretaris Putri',
                                    bendahara_putra: 'Bendahara Putra',
                                    bendahara_putri: 'Bendahara Putri',
                                    pendidikan_putra: 'Pendidikan Putra',
                                    pendidikan_putri: 'Pendidikan Putri',
                                    humas_putra: 'Humas/Humasy Putra',
                                    humas_putri: 'Humas/Humasy Putri',
                                    keamanan_putra: 'Keamanan Putra',
                                    keamanan_putri: 'Keamanan Putri'
                                  }[c.role] || c.role;

                                  return (
                                    <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="py-5 px-6 font-bold text-slate-800">
                                        {c.username}
                                      </td>
                                      <td className="py-5 px-6 font-semibold text-slate-500">
                                        {roleLabel}
                                      </td>
                                      <td className="py-5 px-6 text-slate-500 font-semibold">
                                        {formatDate(c.createdAt)}
                                      </td>
                                      <td className="py-5 px-6 text-center">
                                        {c.status === 'approved' && (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#E2FBF6] text-[#0D9488]">
                                            Aktif
                                          </span>
                                        )}
                                        {c.status === 'pending' && (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#E0F2FE] text-[#0284C7]">
                                            Menunggu
                                          </span>
                                        )}
                                        {c.status === 'rejected' && (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B]">
                                            Diblokir
                                          </span>
                                        )}
                                        {c.status === 'minta_reset' && (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                            Minta Reset Sandi
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-5 px-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                          {c.status === 'pending' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => handleApproveUser(c.id)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                                              >
                                                <Check className="h-4 w-4" />
                                                <span>Setujui</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRejectUser(c.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                                              >
                                                <Ban className="h-4 w-4 text-rose-600" />
                                                <span>Tolak</span>
                                              </button>
                                            </>
                                          )}

                                          {c.status === 'minta_reset' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => setResetConfirmUser({ id: c.id, username: c.username })}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                                              >
                                                <Lock className="h-4 w-4" />
                                                <span>Reset Sandi</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRejectUser(c.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                                              >
                                                <Ban className="h-4 w-4 text-rose-600" />
                                                <span>Tolak</span>
                                              </button>
                                            </>
                                          )}

                                          {c.status === 'approved' && (
                                            <button
                                              type="button"
                                              onClick={() => handleRejectUser(c.id)}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                                            >
                                              <Ban className="h-4 w-4 text-rose-600" />
                                              <span>Blokir</span>
                                            </button>
                                          )}

                                          {c.status === 'rejected' && (
                                            <button
                                              type="button"
                                              onClick={() => handleApproveUser(c.id)}
                                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                                            >
                                              <Check className="h-4 w-4" />
                                              <span>Buka Blokir</span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmUser({ id: c.id, username: c.username })}
                                            title="Hapus Akun"
                                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-colors cursor-pointer active:scale-95"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Footer with Pagination */}
                        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-semibold">
                            Menampilkan {Math.min(paginatedItems.length, itemsPerPage)} dari {sortedCredentials.length} Akun Pengguna
                          </span>
                          
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Three Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Card */}
                    <div className="bg-[#F1F5F9]/60 border border-slate-200/50 rounded-2xl p-6 flex flex-col justify-between min-h-[110px]">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Jumlah Akun Aktif</span>
                      <span className="text-4xl font-black text-slate-900 mt-2">{activeCount}</span>
                    </div>

                    {/* Pending Card */}
                    <div className="bg-[#F1F5F9]/60 border border-slate-200/50 rounded-2xl p-6 flex flex-col justify-between min-h-[110px]">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Menunggu Persetujuan</span>
                      <span className="text-4xl font-black text-slate-900 mt-2">{pendingCount}</span>
                    </div>

                    {/* Blocked Card */}
                    <div className="bg-[#F1F5F9]/60 border border-slate-200/50 rounded-2xl p-6 flex flex-col justify-between min-h-[110px]">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Jumlah Akun Diblokir</span>
                      <span className="text-4xl font-black text-slate-900 mt-2">{blockedCount}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Database View */}
            {activeCategory === 'database' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Page Title */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">
                      Database & Backup
                    </h1>
                  </div>
                </div>

                {/* Connection Status Banner */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Cloud className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-black text-slate-800 text-base">
                          {dbStatus?.connected ? 'Terkoneksi ke Supabase Cloud' : 'Supabase Belum Terkonfigurasi'}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-emerald-800 text-white px-2.5 py-0.5 text-[9px] font-black tracking-wide uppercase">
                          ONLINE
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-400 select-all leading-tight">
                        {dbStatus?.connected ? dbStatus.url : 'https://gquacarhsmxtjstiavwx.supabase.co/rest/v1/'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Migration Instruction Card if Connected */}
                {dbStatus?.connected && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Database className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-black text-slate-800 text-sm">
                          Pemberitahuan Migrasi Struktur Database (Penting)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Kami baru-baru ini menambahkan dukungan untuk kolom <strong>Status EMIS</strong>, <strong>Status Verval</strong>, serta <strong>Pendidikan Formal & Internal</strong> pada data Santri. 
                          Agar data akademik dan status ini dapat disimpan permanen di Supabase Cloud, silakan salin dan jalankan perintah SQL berikut di dalam <strong>SQL Editor</strong> di Dashboard Supabase Anda:
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative bg-slate-950 rounded-2xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40 border border-slate-800/50">
                      <pre className="whitespace-pre">
{`-- Salin dan jalankan SQL ini di SQL Editor Supabase Anda
ALTER TABLE santri ADD COLUMN IF NOT EXISTS status_emis VARCHAR(20) DEFAULT 'Belum';
ALTER TABLE santri ADD COLUMN IF NOT EXISTS status_verval VARCHAR(20) DEFAULT 'Belum';
ALTER TABLE santri ADD COLUMN IF NOT EXISTS pendidikan_formal TEXT;
ALTER TABLE santri ADD COLUMN IF NOT EXISTS pendidikan_internal TEXT;`}
                      </pre>
                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(`ALTER TABLE santri ADD COLUMN IF NOT EXISTS status_emis VARCHAR(20) DEFAULT 'Belum';\nALTER TABLE santri ADD COLUMN IF NOT EXISTS status_verval VARCHAR(20) DEFAULT 'Belum';\nALTER TABLE santri ADD COLUMN IF NOT EXISTS pendidikan_formal TEXT;\nALTER TABLE santri ADD COLUMN IF NOT EXISTS pendidikan_internal TEXT;`);
                          const btn = e.currentTarget;
                          btn.innerText = "Tersalin! ✓";
                          btn.classList.add("bg-emerald-800", "text-white", "border-emerald-700");
                          setTimeout(() => {
                            btn.innerText = "Salin SQL";
                            btn.classList.remove("bg-emerald-800", "text-white", "border-emerald-700");
                          }, 2000);
                        }}
                        className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-slate-700 shadow-xs cursor-pointer"
                      >
                        Salin SQL
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Row: Grid of Left main card and Right sidebar cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left main card (Unduh Cadangan) */}
                  <div className="lg:col-span-2 border border-slate-200/80 rounded-3xl p-7 bg-white shadow-xs flex flex-col justify-between space-y-8 text-left">
                    <div className="space-y-4">
                      {/* Small Light Button icon */}
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shadow-xs">
                        <Download className="h-5 w-5" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-display font-black text-xl text-slate-800 leading-tight">
                          Unduh Cadangan (Backup) Data Lengkap Santri
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                          Download a complete copy of active and alumni student data in a consolidated Excel (.xls) format. Includes class placement, dormitory room numbers, and disciplinary point accumulation automatically processed for reporting.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                      <button
                        onClick={handleDownloadBackup}
                        disabled={downloadingBackup}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#005b41] hover:bg-[#004d37] text-white px-6 py-4 text-xs font-black tracking-wide shadow-md shadow-emerald-800/10 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {downloadingBackup ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Memproses Data Backup...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.5c0-1.99 4-3 6-3s6 1.01 6 3V17z"/>
                            </svg>
                            <span className="text-left font-bold uppercase leading-normal tracking-wider">
                              Unduh Backup Data Santri<br/>(Excel)
                            </span>
                          </>
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2.5 text-slate-400 self-start sm:self-auto">
                        <ShieldCheck className="h-8 w-8 text-slate-400 shrink-0" />
                        <span className="text-[9px] font-black tracking-widest leading-tight uppercase">
                          SECURE ENCRYPTION<br/>ENABLED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Cards */}
                  <div className="space-y-6 flex flex-col justify-between">
                    {/* Card 1: DATABASE HEALTH */}
                    <div className="border border-slate-200/80 rounded-3xl p-6 bg-white shadow-xs flex-1 flex flex-col justify-between min-h-[160px] text-left">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-[#005b41] uppercase block mb-4">
                          DATABASE HEALTH
                        </span>
                        
                        <div className="space-y-4">
                          {/* Database Storage Row */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-slate-500">Database Storage</span>
                              <span className="text-xs font-black text-slate-800">
                                {formatBytes(storageStats?.databaseSize ?? 1250000)} / 500 MB
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#005b41] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.max(0.5, Math.min(100, (((storageStats?.databaseSize ?? 1250000) / (500 * 1024 * 1024)) * 100)))}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Bucket Storage Row */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-slate-500">Bucket Storage</span>
                              <span className="text-xs font-black text-slate-800">
                                {formatBytes(storageStats?.bucketSize ?? 2400000)} / 1 GB
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#005b41] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.max(0.5, Math.min(100, (((storageStats?.bucketSize ?? 2400000) / (1024 * 1024 * 1024)) * 100)))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: AUTOMATIC SYNC */}
                    <div className="bg-[#005b41] text-white rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] text-left">
                      <div className="absolute -top-6 -right-6 opacity-10">
                        <Sparkles className="h-28 w-28 text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Sparkles className="h-6 w-6 text-emerald-200" />
                        <span className="text-[9px] font-black tracking-widest text-emerald-200 uppercase">
                          SMART SYNC
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-4">
                        <h4 className="font-display font-black text-base text-white">
                          Automatic Sync Enabled
                        </h4>
                        <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                          Your local changes are mirrored in real-time. Last successful sync: 2 minutes ago.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zona Bahaya / Danger Zone */}
                <div className="border border-rose-200/60 rounded-3xl p-6 bg-rose-50/20 text-left mt-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-rose-600 uppercase">
                          ZONA BAHAYA (DANGER ZONE)
                        </span>
                      </div>
                      <h4 className="font-display font-black text-lg text-slate-900 leading-tight">
                        Hapus Semua Data
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tindakan ini akan menghapus seluruh data santri, lembaga, rombel, perizinan, sanksi keamanan, keuangan bendahara, surat, serta data dokumentasi secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDangerUsernameInput('');
                        setDangerPhraseInput('');
                        setIsDangerModalOpen(true);
                      }}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 text-xs font-black tracking-wider uppercase active:scale-95 transition-all cursor-pointer shadow-sm shadow-rose-600/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus Semua Data</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {activeCategory === 'feedback' && (() => {
              const displayedFeedbacks = feedbacks.filter(f => {
                if (filterStarredOnly) {
                  return f.is_starred || f.isStarred;
                }
                return true;
              });

              return (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Header view with stats and action buttons */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <h2 className="font-display text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-purple-600" />
                        <span>Feedback & Masukan Pengurus</span>
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Kelola kritik, saran, masukan, dan laporan kendala dari pengurus pesantren.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Toggle Starred Only filter */}
                      <button
                        onClick={() => {
                          setFilterStarredOnly(!filterStarredOnly);
                          setSelectedFeedbackIds([]);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          filterStarredOnly
                            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${filterStarredOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
                        <span>{filterStarredOnly ? 'Tampilkan Semua' : 'Tampilkan Berbintang'}</span>
                      </button>

                      {/* Refresh Feedbacks */}
                      <button
                        onClick={fetchFeedbacks}
                        disabled={loadingFeedbacks}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingFeedbacks ? 'animate-spin' : ''}`} />
                        <span>Perbarui</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Action Bar - Show when checklisted */}
                  <AnimatePresence>
                    {selectedFeedbackIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left overflow-hidden shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                            {selectedFeedbackIds.length}
                          </span>
                          <span className="text-xs font-bold text-purple-800">Pesan terpilih</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Tandai Semua / Hapus Semua Tanda toggle */}
                          {selectedFeedbackIds.length === displayedFeedbacks.length ? (
                            <button
                              onClick={() => setSelectedFeedbackIds([])}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all active:scale-95"
                            >
                              <span>Hapus Semua Tanda</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleToggleSelectAll}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold cursor-pointer transition-all active:scale-95"
                            >
                              <span>Tandai Semua</span>
                            </button>
                          )}

                          {/* Bintangi Terpilih */}
                          <button
                            onClick={handleStarSelectedFeedbacks}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>Bintangi Terpilih</span>
                          </button>

                          {/* Hapus Terpilih */}
                          <button
                            onClick={handleDeleteSelectedFeedbacks}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus Terpilih</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Feedback List Container */}
                  {loadingFeedbacks ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                      <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">Memuat pesan masukan...</p>
                    </div>
                  ) : displayedFeedbacks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs max-w-2xl mx-auto flex flex-col items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-4 border border-purple-100">
                        {filterStarredOnly ? <Star className="h-8 w-8 text-amber-500 fill-amber-400" /> : <Megaphone className="h-8 w-8" />}
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-800 mb-1">
                        {filterStarredOnly ? 'Tidak Ada Pesan Berbintang' : 'Tidak Ada Feedback'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                        {filterStarredOnly
                          ? 'Belum ada pesan masukan yang Anda tandai sebagai pesan berbintang.'
                          : 'Belum ada pesan masukan atau kendala dari pengurus pesantren.'}
                      </p>
                      <button
                        onClick={() => {
                          if (filterStarredOnly) {
                            setFilterStarredOnly(false);
                          } else {
                            fetchFeedbacks();
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        <span>{filterStarredOnly ? 'Lihat Semua Pesan' : 'Segarkan'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-left">
                      {/* Rows */}
                      <div className="divide-y divide-slate-100">
                        {displayedFeedbacks.map((f: any) => {
                          const isSelected = selectedFeedbackIds.includes(String(f.id));
                          const isStarred = f.is_starred || f.isStarred;
                          const senderEmail = f.sender_email || (f.sender_username ? `${f.sender_username}@attaroqqy.com` : 'pengurus@attaroqqy.com');
                          const messageText = f.message || f.content || '';
                          
                          const dateObj = f.created_at ? new Date(f.created_at) : new Date();
                          const dateStr = dateObj.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <div
                              key={f.id}
                              onClick={() => setActiveFeedbackDetail(f)}
                              className={`px-5 py-4 flex items-center gap-4 text-xs cursor-pointer transition-all group relative ${
                                isSelected ? 'bg-purple-50/20' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* Checklist box */}
                              <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleToggleSelectOne(String(f.id), e as any)}
                                  className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                                />
                              </div>

                              {/* Star action */}
                              <div className="w-8 shrink-0 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleToggleStar(f.id, isStarred)}
                                  className="text-slate-300 hover:text-amber-500 transition-colors p-1 rounded-md"
                                >
                                  <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                                </button>
                              </div>

                              {/* Pengirim (Email in bold) */}
                              <div className="w-1/4 min-w-[150px] shrink-0 font-bold text-slate-800 truncate" title={senderEmail}>
                                {senderEmail}
                              </div>

                              {/* Pesan (truncated summary) */}
                              <div className="flex-1 text-slate-600 font-medium truncate pr-4">
                                {messageText}
                              </div>

                              {/* Tanggal & Hover Trash */}
                              <div className="w-32 shrink-0 text-right font-semibold relative h-8 flex items-center justify-end">
                                <div className="group-hover:opacity-0 transition-opacity duration-150 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                  {dateStr}
                                </div>
                                <div 
                                  className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150" 
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleDeleteFeedback(f.id, senderEmail)}
                                    className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detail Modal */}
                  <AnimatePresence>
                    {activeFeedbackDetail && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay background */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setActiveFeedbackDetail(null)}
                          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                        />

                        {/* Modal Container */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          transition={{ type: "spring", duration: 0.3 }}
                          className="relative bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl max-w-lg w-full text-center overflow-hidden z-10 animate-fade-in"
                        >
                          {/* Close button at top right */}
                          <button
                            type="button"
                            onClick={() => setActiveFeedbackDetail(null)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>

                          {/* Top Profile Picture Circle */}
                          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black border-4 border-purple-100 shadow-md">
                            {(activeFeedbackDetail.sender_username || activeFeedbackDetail.sender_email || 'P').substring(0, 2).toUpperCase()}
                          </div>

                          {/* Sender Email */}
                          <div className="mt-4">
                            <h4 className="font-display text-sm font-bold text-slate-800">
                              {activeFeedbackDetail.sender_email || (activeFeedbackDetail.sender_username ? `${activeFeedbackDetail.sender_username}@attaroqqy.com` : 'pengurus@attaroqqy.com')}
                            </h4>
                            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md">
                              {activeFeedbackDetail.sender_role || activeFeedbackDetail.role || 'pengurus'}
                            </span>
                          </div>

                          {/* Full message content */}
                          <div className="mt-6 text-left bg-slate-50 border border-slate-100/80 rounded-2xl p-5 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto scrollbar-thin">
                            {activeFeedbackDetail.message || activeFeedbackDetail.content}
                          </div>

                          {/* Date & Time metadata */}
                          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold font-mono border-t border-b border-slate-100 py-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {activeFeedbackDetail.created_at ? new Date(activeFeedbackDetail.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                }) : 'Baru Saja'}
                              </span>
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {activeFeedbackDetail.created_at ? new Date(activeFeedbackDetail.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '00:00'}
                              </span>
                            </span>
                          </div>

                          {/* Action buttons footer */}
                          <div className="mt-6 grid grid-cols-3 gap-2">
                            {/* Toggle star */}
                            <button
                              type="button"
                              onClick={() => handleToggleStar(activeFeedbackDetail.id, activeFeedbackDetail.is_starred || activeFeedbackDetail.isStarred)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                (activeFeedbackDetail.is_starred || activeFeedbackDetail.isStarred)
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${(activeFeedbackDetail.is_starred || activeFeedbackDetail.isStarred) ? 'fill-amber-400 text-amber-500' : ''}`} />
                              <span>{(activeFeedbackDetail.is_starred || activeFeedbackDetail.isStarred) ? 'Batal Bintang' : 'Bintangi'}</span>
                            </button>

                            {/* Delete message */}
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(activeFeedbackDetail.id, activeFeedbackDetail.sender_email)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>

                            {/* Close modal */}
                            <button
                              type="button"
                              onClick={() => setActiveFeedbackDetail(null)}
                              className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all cursor-pointer"
                            >
                              <span>Tutup</span>
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Custom Delete Confirmation Modal */}
                  <AnimatePresence>
                    {feedbackDeleteConfirm.isOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setFeedbackDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          transition={{ type: "spring", duration: 0.3 }}
                          className="relative bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl max-w-sm w-full text-center overflow-hidden z-10"
                        >
                          <div className="mx-auto h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                          
                          <h3 className="font-sans text-base font-bold text-slate-900 tracking-tight mb-2">
                            Konfirmasi Hapus
                          </h3>
                          
                          <p className="text-xs text-slate-600 leading-relaxed mb-6">
                            {feedbackDeleteConfirm.type === 'single' ? (
                              <>Apakah Anda yakin ingin menghapus pesan masukan dari <strong className="text-slate-800">{feedbackDeleteConfirm.senderEmail}</strong>? Tindakan ini tidak dapat dibatalkan.</>
                            ) : (
                              <>Apakah Anda yakin ingin menghapus <strong className="text-slate-800">{selectedFeedbackIds.length}</strong> pesan masukan terpilih? Tindakan ini tidak dapat dibatalkan.</>
                            )}
                          </p>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setFeedbackDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer active:scale-95"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={executeDeleteFeedback}
                              className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all font-bold text-xs cursor-pointer active:scale-95 shadow-sm"
                            >
                              Ya, Hapus
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {activeCategory === 'keamanan' && (
              <motion.div
                key="keamanan"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <form onSubmit={handleSaveSecurity} className="space-y-6">
                  {/* Top Heading Card (Unboxed) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div className="space-y-1 text-left">
                      <h2 className="font-display text-2xl font-black text-slate-800 tracking-tight">
                        Pengaturan Profil & Akun
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Kelola identitas digital dan keamanan akses Anda dalam satu tempat.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto bg-rose-50 border border-rose-100/60 text-rose-700 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase">
                      {activeRole.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Feedback Messages */}
                  {secSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed text-left">
                      {secSuccess}
                    </div>
                  )}
                  {secError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed text-left">
                      {secError}
                    </div>
                  )}

                  {/* Two Column Layout Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Profile Photo & Account Credentials */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      
                      {/* Card 1: Foto Profil (Horizontal Layout matching user request) */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-row items-center gap-6 text-left">
                        
                        {/* Circle Photo Frame with elegant slate/gray border glow and eye icon on hover */}
                        <div className="relative group h-28 w-28 rounded-full overflow-hidden bg-gradient-to-tr from-slate-400 to-slate-500 flex items-center justify-center text-white text-3xl font-black shadow-md border-2 border-slate-300 ring-4 ring-slate-400/10 shrink-0 transition-transform hover:scale-105 duration-200">
                          {secAvatar ? (
                            <>
                              <img 
                                src={secAvatar} 
                                alt={secDisplayName} 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {/* Dark mask overlay with eye icon */}
                              <button
                                type="button"
                                onClick={() => setIsLightboxOpen(true)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none"
                              >
                                <Eye className="h-6 w-6 text-white stroke-[2.5]" />
                              </button>
                            </>
                          ) : (
                            <span>{secDisplayName.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>

                        {/* Right Column: Info and horizontal button row */}
                        <div className="flex flex-col gap-3 justify-center text-left">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            FOTO PROFIL
                          </label>
                          
                          {/* Buttons in a single clean row */}
                          <div className="flex items-center gap-2.5">
                            {/* Upload Button */}
                            <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm">
                              <Upload className="h-4 w-4 text-white" />
                              <span>Unggah Foto</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onClick={(e) => {
                                  (e.target as HTMLInputElement).value = '';
                                }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 10 * 1024 * 1024) {
                                      setSecError("Ukuran file terlalu besar! Maksimum ukuran foto adalah 10MB.");
                                      return;
                                    }
                                    try {
                                      // Compress to max 800px width/height
                                      const base64 = await compressImage(file, 800, 800, 0.75);
                                      setSecAvatar(base64);
                                      setSecSuccess("Foto profil berhasil dimuat! Klik 'Simpan Perubahan' di bawah.");
                                      setSecError("");
                                    } catch (err: any) {
                                      console.error("Gagal mengompresi foto profil:", err);
                                      setSecError("Gagal memproses gambar foto profil.");
                                    }
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {/* Delete/Trash Button */}
                            {secAvatar && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSecAvatar('');
                                  setSecSuccess("Foto profil dihapus dari antrean! Klik 'Simpan Perubahan' untuk mengonfirmasi.");
                                }}
                                className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-all cursor-pointer active:scale-95"
                                title="Hapus Foto"
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Card 2: Account Fields */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-left">
                        {/* Display Name field */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            NAMA PENGGUNA
                          </label>
                          <input
                            type="text"
                            required
                            value={secDisplayName}
                            onChange={(e) => setSecDisplayName(e.target.value)}
                            placeholder="Contoh: Admin Utama"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold text-slate-800"
                          />
                        </div>

                        {/* Email Login field */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            EMAIL LOGIN
                          </label>
                          <input
                            type="email"
                            required
                            value={secNewUsername}
                            onChange={(e) => setSecNewUsername(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold text-slate-800"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Change Password Card */}
                    <div className="lg:col-span-7">
                      
                      {/* Card 3: Ubah Kata Sandi */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-left flex flex-col justify-between h-full">
                        <div className="space-y-5">
                          {/* Card Header with red lock icon */}
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                              <Lock className="h-5 w-5" />
                            </div>
                            <h3 className="font-display text-sm font-bold text-slate-900">
                              Ubah Kata Sandi
                            </h3>
                          </div>

                          <hr className="border-slate-100" />

                          {/* New Password field */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              KATA SANDI BARU
                            </label>
                            <div className="relative">
                              <input
                                type={secShowPass ? "text" : "password"}
                                value={secNewPassword}
                                onChange={(e) => setSecNewPassword(e.target.value)}
                                placeholder="Min. 4 karakter"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold tracking-wider text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setSecShowPass(!secShowPass)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                {secShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Confirm Password field */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              KONFIRMASI KATA SANDI
                            </label>
                            <input
                              type={secShowPass ? "text" : "password"}
                              value={secConfirmNewPassword}
                              onChange={(e) => setSecConfirmNewPassword(e.target.value)}
                              placeholder="Ulangi kata sandi baru"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold tracking-wider text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Warning/Tips Banner at the bottom */}
                        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[11px] text-slate-500 leading-normal mt-4">
                          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>Gunakan kombinasi simbol dan angka untuk keamanan maksimal pada akun Anda.</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Horizontal line divider */}
                  <hr className="border-slate-200 my-6" />

                  {/* Submit and Cancel Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSecNewPassword('');
                        setSecConfirmNewPassword('');
                        setSecDisplayName(localStorage.getItem('smartsantri_active_display_name') || 'Admin Utama');
                        setSecNewUsername(localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com');
                        setSecAvatar(localStorage.getItem('smartsantri_profile_avatar') || '');
                        setSecSuccess(null);
                        setSecError(null);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer active:scale-95 bg-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={secSaving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-lg shadow-rose-100"
                    >
                      {secSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-white" />
                          <span>Simpan Perubahan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* MODAL LIGHTBOX UNTUK MELIHAT FOTO PROFIL FULL */}
                <AnimatePresence>
                  {isLightboxOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Backdrop blur */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
                      />
                      
                      {/* Close button top right */}
                      <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer z-20"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      {/* Photo Content */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="relative max-w-lg w-full bg-transparent p-2 z-10 flex flex-col items-center gap-4"
                      >
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-950/20 max-h-[75vh] flex items-center justify-center">
                          <img 
                            src={secAvatar} 
                            alt={secDisplayName} 
                            className="max-w-full max-h-[70vh] object-contain rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-white/90 text-sm font-semibold font-display tracking-wide">{secDisplayName}</p>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* MODAL KONFIRMASI RESET SANDI ADMIN */}
      {resetConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col gap-4 text-center"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Lock className="h-7 w-7 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Konfirmasi Reset Sandi
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menyetel ulang kata sandi akun <span className="text-slate-800 font-bold">{resetConfirmUser.username}</span>? Kata sandi akan diubah menjadi <strong className="text-blue-600">"1234"</strong> dan status akun akan diaktifkan kembali.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setResetConfirmUser(null)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeResetPasswordAdmin(resetConfirmUser.id, resetConfirmUser.username)}
                className="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-600/20 active:scale-95"
              >
                Ya, Reset ke 1234
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS AKUN ADMIN */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col gap-4 text-center"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Trash2 className="h-7 w-7 text-rose-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Hapus Akun Permanen
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus akun <span className="text-slate-800 font-bold">{deleteConfirmUser.username}</span> secara permanen? Akun ini akan dihapus dari sistem selamanya dan tidak dapat dikembalikan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteUser(deleteConfirmUser.id)}
                className="px-4 py-3 rounded-xl bg-[#A30022] text-white font-bold text-xs hover:bg-[#85001B] transition-all cursor-pointer shadow-sm shadow-rose-600/20 active:scale-95"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SEMUA DATA (ZONA BAHAYA) */}
      <AnimatePresence>
        {isDangerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col gap-5 text-left"
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                <AlertTriangle className="h-7 w-7 text-rose-600" />
              </div>
              
              <div className="space-y-2 text-center">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Konfirmasi Tindakan Fatal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Tindakan ini sangat berbahaya dan akan menghapus <strong className="text-rose-600">SELURUH DATA UTAMA</strong> dari sistem secara permanen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                    Ketik Username Anda untuk Konfirmasi (<strong className="text-slate-700 select-all font-mono">{secUsername}</strong>)
                  </label>
                  <input
                    type="text"
                    required
                    value={dangerUsernameInput}
                    onChange={(e) => setDangerUsernameInput(e.target.value)}
                    placeholder="Masukkan username Anda"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                    Ketik Frasa Persetujuan (<strong className="text-slate-700 font-sans">saya sadar</strong>)
                  </label>
                  <input
                    type="text"
                    required
                    value={dangerPhraseInput}
                    onChange={(e) => setDangerPhraseInput(e.target.value)}
                    placeholder="Ketik 'saya sadar'"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDangerModalOpen(false);
                    setDangerUsernameInput('');
                    setDangerPhraseInput('');
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isTruncatingAll || dangerUsernameInput !== secUsername || dangerPhraseInput.toLowerCase() !== 'saya sadar'}
                  onClick={executeTruncateAllData}
                  className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-rose-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-1.5"
                >
                  {isTruncatingAll ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin text-white" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4.5 w-4.5" />
                      <span>Ya, Hapus Semua</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
