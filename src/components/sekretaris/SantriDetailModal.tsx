import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Tag, 
  FileText, 
  Download, 
  Mars, 
  Venus, 
  CreditCard, 
  GraduationCap, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Award,
  BookOpen,
  Home,
  Layers,
  Eye,
  Upload,
  Trash2
} from 'lucide-react';
import { Santri, BendaharaRecord, KeamananRecord, Kamar, Kompleks, Kelas, Lembaga, KelompokRombel, RombelAssignment, KategoriRombel } from '../../types';
import { renderSantriAvatar, isCustomPasFoto } from '../SekretarisHelper';
import { uploadFileToStorage, updateTableRow } from '../../lib/api';

const formatDateDMY = (dateVal?: any) => {
  if (dateVal === undefined || dateVal === null) return '-';
  const dateStr = String(dateVal).trim();
  if (!dateStr || dateStr === '-' || dateStr.toLowerCase() === 'undefined' || dateStr.toLowerCase() === 'null') return '-';
  
  try {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    const matchAlready = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (matchAlready) {
      return dateStr;
    }
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }
  return dateStr;
};

interface SantriDetailModalProps {
  selectedSantri: Santri | null;
  onClose: () => void;
  onUpdateSantri?: (updatedSantri: Santri) => void;
  canWrite?: boolean;
}

type TabType = 'biodata' | 'pembayaran' | 'akademik' | 'keamanan';

const compressImageAndGetBase64 = (file: File, maxWidth = 320, maxHeight = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function SantriDetailModal({ selectedSantri, onClose, onUpdateSantri, canWrite = true }: SantriDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('biodata');
  const [localSantri, setLocalSantri] = useState<Santri | null>(selectedSantri);
  const [isUploadingPasFoto, setIsUploadingPasFoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedSantri) {
      setLocalSantri(selectedSantri);
    } else {
      setLocalSantri(null);
    }
  }, [selectedSantri]);

  React.useEffect(() => {
    if (selectedSantri) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSantri]);

  // Handle outside click or Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Query records dynamically from localStorage
  const payments: BendaharaRecord[] = useMemo(() => {
    if (!localSantri) return [];
    try {
      const local = localStorage.getItem('smartsantri_bendaharaList');
      const list: BendaharaRecord[] = local ? JSON.parse(local) : [];
      const filtered = list.filter(r => r.namaSantri.toLowerCase() === localSantri.nama.toLowerCase());
      
      // If none found, generate realistic simulated payments so the view is never empty!
      if (filtered.length === 0) {
        const months = ['Juli 2026', 'Juni 2026', 'Mei 2026', 'April 2026', 'Maret 2026'];
        return months.map((m, idx) => ({
          id: `sim-pay-${idx}`,
          namaSantri: localSantri.nama,
          kamar: localSantri.kamar || 'Kamar Umum',
          bulan: m,
          nominal: 150000,
          status: idx === 0 ? 'Belum Lunas' : 'Lunas',
          tanggalBayar: idx === 0 ? undefined : new Date(2026, 6 - idx, 5).toISOString().split('T')[0]
        }));
      }
      return filtered;
    } catch (e) {
      return [];
    }
  }, [localSantri]);

  const violations: KeamananRecord[] = useMemo(() => {
    if (!localSantri) return [];
    try {
      const local = localStorage.getItem('smartsantri_keamananList');
      const list: KeamananRecord[] = local ? JSON.parse(local) : [];
      return list.filter(r => r.namaSantri.toLowerCase() === localSantri.nama.toLowerCase());
    } catch (e) {
      return [];
    }
  }, [localSantri]);

  const activePermits = useMemo(() => {
    if (!localSantri) return [];
    try {
      const local = localStorage.getItem('smartsantri_perizinan');
      const list = local ? JSON.parse(local) : [];
      return list.filter((p: any) => p.namaSantri.toLowerCase() === localSantri.nama.toLowerCase());
    } catch (e) {
      return [];
    }
  }, [localSantri]);

  const listIzinResmi = useMemo(() => {
    return activePermits.filter((p: any) => !p.isCabut);
  }, [activePermits]);

  const listKeluarIlegal = useMemo(() => {
    return activePermits.filter((p: any) => p.isCabut);
  }, [activePermits]);

  const roomInfo = useMemo(() => {
    if (!localSantri) return null;
    try {
      const kamarLocal = localStorage.getItem('smartsantri_kamar');
      const kamarList: Kamar[] = kamarLocal ? JSON.parse(kamarLocal) : [];
      
      const kompleksLocal = localStorage.getItem('smartsantri_kompleks');
      const kompleksList: Kompleks[] = kompleksLocal ? JSON.parse(kompleksLocal) : [];

      // Find a room where the name matches the student's room name
      const room = kamarList.find(k => k.nama.toLowerCase().trim() === localSantri.kamar?.toLowerCase().trim());
      if (room) {
        const kompleks = kompleksList.find(kp => kp.id === room.kompleksId);
        return { room, kompleks };
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [localSantri]);

  const studentClasses = useMemo(() => {
    if (!localSantri) return [];
    try {
      const kelasLocal = localStorage.getItem('smartsantri_kelas');
      const kelasList: Kelas[] = kelasLocal ? JSON.parse(kelasLocal) : [];

      const lembagaLocal = localStorage.getItem('smartsantri_lembagas');
      const lembagasList: Lembaga[] = lembagaLocal ? JSON.parse(lembagaLocal) : [];

      // Parse classes from localSantri.kelas (comma separated)
      const assignedClassNames = localSantri.kelas 
        ? localSantri.kelas.split(',').map(name => name.trim().toLowerCase()) 
        : [];

      // Find matching kelas records
      const matched = kelasList.filter(k => 
        assignedClassNames.includes(k.nama.toLowerCase().trim())
      ).map(k => {
        const lembaga = lembagasList.find(l => l.id === k.lembagaId);
        return {
          ...k,
          lembagaNama: lembaga ? lembaga.nama : 'Lembaga Umum',
          lembagaKode: lembaga ? lembaga.kode : 'UMUM'
        };
      });

      // If no match but we have a class text, create virtual records so it displays correctly
      if (matched.length === 0 && localSantri.kelas && localSantri.kelas !== 'Tanpa Kelas') {
        const rawClassNames = localSantri.kelas.split(',').map(name => name.trim());
        return rawClassNames.map((name, i) => ({
          id: `virtual-class-${i}`,
          lembagaId: 'virtual-lem',
          nama: name,
          waliKelas: 'Ustadz / Wali Kelas',
          tingkatan: 'Lainnya' as const,
          lembagaNama: name.toLowerCase().includes('madin') || name.toLowerCase().includes('diniyah') ? 'Madrasah Diniyah' : 'Sekolah Formal',
          lembagaKode: 'SCH'
        }));
      }

      return matched;
    } catch (e) {
      return [];
    }
  }, [localSantri]);

  const studentRombels = useMemo(() => {
    if (!localSantri) return [];
    try {
      const assignmentsLocal = localStorage.getItem('smartsantri_rombel_assignments');
      const assignments: RombelAssignment[] = assignmentsLocal ? JSON.parse(assignmentsLocal) : [];

      const groupsLocal = localStorage.getItem('smartsantri_rombel_groups');
      const groups: KelompokRombel[] = groupsLocal ? JSON.parse(groupsLocal) : [];

      const categoriesLocal = localStorage.getItem('smartsantri_rombel_categories');
      const categories: KategoriRombel[] = categoriesLocal ? JSON.parse(categoriesLocal) : [];

      // Filter assignments for this student
      const studentAssigns = assignments.filter(a => a.santriId === localSantri.id);

      const list = studentAssigns.map(a => {
        const group = groups.find(g => g.id === a.kelompokId);
        const category = categories.find(c => c.id === a.kategoriId);
        return {
          groupId: a.kelompokId,
          groupNama: group ? group.nama : 'Kelompok Belajar',
          pembimbing: group ? group.pembimbing : 'Ustadz Pembimbing',
          categoryNama: category ? category.nama : 'Rombongan Belajar',
        };
      });

      return list;
    } catch (e) {
      return [];
    }
  }, [localSantri]);

  const academicClasses = useMemo(() => {
    if (studentClasses && studentClasses.length > 0) {
      return studentClasses.map(cls => ({
        lembaga: cls.lembagaNama ? cls.lembagaNama.toUpperCase() : 'LEMBAGA',
        kelas: cls.nama
      }));
    }
    return [];
  }, [studentClasses]);

  const academicRombels = useMemo(() => {
    if (studentRombels && studentRombels.length > 0) {
      return studentRombels.map(rom => ({
        category: rom.categoryNama || 'Rombongan Belajar',
        group: rom.groupNama
      }));
    }
    return [];
  }, [studentRombels]);

  const displayViolations = useMemo(() => {
    if (violations && violations.length > 0) {
      return violations.map(v => ({
        id: v.id,
        tanggal: v.tanggal,
        jenisPelanggaran: v.jenisPelanggaran,
        poin: v.poin
      }));
    }
    return [];
  }, [violations]);

  const displayPoints = useMemo(() => {
    if (violations && violations.length > 0) {
      return violations.reduce((sum, v) => sum + (v.poin || 0), 0);
    }
    return 0;
  }, [violations]);

  const displayCount = useMemo(() => {
    if (violations && violations.length > 0) {
      return violations.length;
    }
    return 0;
  }, [violations]);

  const displaySikapText = useMemo(() => {
    const pts = displayPoints;
    if (pts === 0) return "Sangat Baik";
    if (pts <= 15) return "Baik";
    if (pts <= 30) return "Cukup Baik";
    if (pts <= 50) return "Kurang Baik";
    return "Sanksi Berat";
  }, [displayPoints]);

  const waterLevelHeight = useMemo(() => {
    const pts = displayPoints;
    return Math.max(15, Math.min(85, 85 - (pts * 0.8)));
  }, [displayPoints]);

  const handleUploadPasFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!localSantri) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPasFoto(true);
      try {
        const base64 = await compressImageAndGetBase64(file);
        const publicUrl = await uploadFileToStorage(base64, file.name, 'filePasFoto');
        
        // Update the row in database
        const updated = await updateTableRow<Santri>('santri', 'smartsantri_santriList', localSantri.id, {
          filePasFoto: publicUrl
        });
        
        // Sync local & parent state
        setLocalSantri(updated);
        onUpdateSantri?.(updated);
      } catch (err: any) {
        console.error("Gagal mengunggah pas foto:", err);
        alert("Gagal memproses pas foto: " + err.message);
      } finally {
        setIsUploadingPasFoto(false);
      }
    }
  };

  const handleRemovePasFoto = async () => {
    if (!localSantri) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus pas foto santri ini?")) {
      setIsUploadingPasFoto(true);
      try {
        // Update the row in database (set to empty string)
        const updated = await updateTableRow<Santri>('santri', 'smartsantri_santriList', localSantri.id, {
          filePasFoto: ''
        });
        
        // Sync local & parent state
        setLocalSantri(updated);
        onUpdateSantri?.(updated);
      } catch (err: any) {
        console.error("Gagal menghapus pas foto:", err);
        alert("Gagal menghapus pas foto: " + err.message);
      } finally {
        setIsUploadingPasFoto(false);
      }
    }
  };

  if (!selectedSantri || !localSantri) return null;

  // Formulate nice address string
  const getAddressStr = () => {
    if (localSantri.desa || localSantri.kecamatan || localSantri.kabupaten) {
      return [
        localSantri.desa,
        localSantri.kecamatan,
        localSantri.kabupaten,
        localSantri.provinsi
      ].filter(Boolean).join(', ');
    }
    return localSantri.asal || 'Jombang, Jawa Timur';
  };

  // Status Badge Colors mapping
  const getStatusBadgeClass = (status: string) => {
    const s = String(status || '').trim().toLowerCase();
    switch (s) {
      case 'alumni':
        return 'bg-[#e2f0d9] text-[#385723]';
      case 'aktif':
        return 'bg-[#d9f2d5] text-[#2e7d32]';
      case 'meninggal':
      case 'wafat':
        return 'bg-rose-100 text-rose-800';
      case 'sakit':
        return 'bg-amber-100 text-amber-800';
      case 'izin pulang':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-[#d9f2d5] text-[#2e7d32]'; // Default to active green
    }
  };

  const getDomisiliBadgeClass = (domisili: string) => {
    const d = String(domisili || '').trim().toLowerCase();
    return d === 'muqim' || d === 'mukim' ? 'bg-[#ffeb3b] text-slate-900' : 'bg-orange-100 text-orange-800';
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 sm:p-4">
        {/* Backdrop click handler */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="relative flex flex-col w-full max-w-2xl h-[85vh] bg-[#e6ecea] rounded-[24px] shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header Card (White Segment exactly like image) */}
          <div className="bg-white p-5 sm:p-6 rounded-t-[24px] border-b border-slate-200/50 shadow-xs relative shrink-0">
            {/* Elegant Top Right Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="Tutup Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Profile Row */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Profile Avatar Frame (Circular exactly like image) */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-inner bg-slate-50 flex items-center justify-center">
                {renderSantriAvatar(localSantri, "w-full h-full object-cover", false)}
              </div>

              {/* Badges, Name, Details */}
              <div className="flex-1 min-w-0">
                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {(() => {
                    const statusKeanggotaan = localSantri.statusKeanggotaan || (localSantri as any).status || 'Aktif';
                    const isAktif = String(statusKeanggotaan).trim().toLowerCase() === 'aktif';
                    
                    return (
                      <>
                        <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getStatusBadgeClass(statusKeanggotaan)}`}>
                          {statusKeanggotaan}
                        </span>
                        {isAktif && (
                          <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getDomisiliBadgeClass(localSantri.statusDomisili || 'Muqim')}`}>
                            {localSantri.statusDomisili || 'Muqim'}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Name */}
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                  {localSantri.nama}
                </h2>

                {/* NIS & Address */}
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate flex items-center gap-2">
                  <span className="font-mono text-slate-700 font-extrabold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{localSantri.nis}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 truncate">{getAddressStr()}</span>
                </p>
              </div>
            </div>

            {/* Pills Tabs Container (Exactly matching image layout) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mt-6">
              {[
                { id: 'biodata', label: 'Biodata' },
                { id: 'pembayaran', label: 'Pembayaran' },
                { id: 'akademik', label: 'Akademik' },
                { id: 'keamanan', label: 'Keamanan' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-2 px-1 text-center text-xs sm:text-sm rounded-full font-bold transition-all ${
                      isActive 
                        ? 'bg-[#39e75f] text-slate-900 shadow-xs' 
                        : 'bg-[#e2e8f0] text-slate-700 hover:bg-slate-300/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Content Viewport with custom minty/gray background */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto bg-[#e6ecea] p-4 sm:p-5 space-y-4"
          >
            {activeTab === 'biodata' && (
              <div className="space-y-4 animate-fadeIn">
                {/* 1. Identitas Pokok Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Identitas Pokok Santri
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const fields = [
                        { label: 'NIK Santri', val: localSantri.nik || '-' },
                        { label: 'No. Kartu Keluarga', val: localSantri.noKk || '-' },
                        { label: 'Tempat, Tgl Lahir', val: `${localSantri.tempatLahir || '-'}${localSantri.tanggalLahir ? `, ${formatDateDMY(localSantri.tanggalLahir)}` : ''}` },
                        { label: 'Gender & Saudara', val: `${localSantri.gender} ${(!localSantri.anakKe || localSantri.anakKe === 0) && (localSantri.dariBersaudara === undefined) ? '' : `(Anak ke ${localSantri.anakKe || '-'}, Jumlah Saudara: ${localSantri.dariBersaudara !== undefined ? localSantri.dariBersaudara : '-'})`}` },
                        { label: 'Tanggal Masuk', val: formatDateDMY(localSantri.tanggalMasuk) },
                      ];
                      
                      if ((localSantri.statusKeanggotaan || 'Aktif') === 'Alumni') {
                        fields.push({ label: 'Tanggal Keluar', val: formatDateDMY(localSantri.tanggalKeluar) });
                      }

                      // Label dynamic configuration requested:
                      // jika data itu santri aktif maka labelnya adalah status keanggotaan dan status domisili.
                      fields.push({ label: 'Status Keanggotaan', val: localSantri.statusKeanggotaan || 'Aktif' });

                      if ((localSantri.statusKeanggotaan || 'Aktif') === 'Aktif') {
                        fields.push({ label: 'Status Domisili', val: localSantri.statusDomisili || 'Muqim' });
                      }

                      return fields.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-extrabold text-slate-500 tracking-wide truncate">
                            {item.label}
                          </span>
                          <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-3 py-1 rounded-full shrink-0 max-w-[220px] text-center truncate">
                            {item.val}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 2. Orang Tua & Kewalian Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Kewalian & Orang Tua
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Nama Ayah', val: localSantri.namaAyah || '-' },
                      { label: 'NIK Ayah', val: localSantri.nikAyah || '-' },
                      { label: 'Pekerjaan Ayah', val: localSantri.pekerjaanAyah || '-' },
                      { label: 'Pendidikan Ayah', val: localSantri.pendidikanAyah || '-' },
                      { label: 'Nama Ibu', val: localSantri.namaIbu || '-' },
                      { label: 'NIK Ibu', val: localSantri.nikIbu || '-' },
                      { label: 'Pekerjaan Ibu', val: localSantri.pekerjaanIbu || '-' },
                      { label: 'Pendidikan Ibu', val: localSantri.pendidikanIbu || '-' },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-slate-500 tracking-wide truncate">
                          {item.label}
                        </span>
                        <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-3 py-1 rounded-full shrink-0 max-w-[220px] text-center truncate">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Alamat & Kontak Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Alamat & Kontak
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-white p-3.5 rounded-[18px] shadow-xs border border-slate-100 text-xs">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase mb-1">Alamat Lengkap</span>
                      <span className="font-black text-slate-800 text-sm block leading-relaxed">{localSantri.alamat || '-'}</span>
                    </div>

                    {[
                      { label: 'RT / RW', val: `RT ${localSantri.rt || '-'} / RW ${localSantri.rw || '-'}` },
                      { label: 'Desa / Kecamatan', val: `${localSantri.desa || '-'}${localSantri.kecamatan ? `, ${localSantri.kecamatan}` : ''}` },
                      { label: 'Kabupaten / Provinsi', val: `${localSantri.kabupaten || '-'}${localSantri.provinsi ? `, ${localSantri.provinsi}` : ''}` },
                      { label: 'No. HP Wali', val: localSantri.noHp || '-' },
                      { label: 'Jarak Rumah', val: localSantri.jarakRumah && localSantri.jarakRumah !== 0 ? `${localSantri.jarakRumah} km` : '-' },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-slate-500 tracking-wide truncate">
                          {item.label}
                        </span>
                        <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-3 py-1 rounded-full shrink-0 max-w-[220px] text-center truncate">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Informasi Kamar & Kompleks Asrama Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Informasi Kamar & Kompleks Asrama
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Kompleks Asrama', val: roomInfo?.kompleks?.nama || '-' },
                      { label: 'Nama Kamar', val: localSantri.kamar || 'Belum Ditentukan' },
                      { label: 'Ketua / PJ Kamar', val: roomInfo?.room?.ketuaKamar || '-' },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-slate-500 tracking-wide truncate">
                          {item.label}
                        </span>
                        <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-3 py-1 rounded-full shrink-0 max-w-[220px] text-center truncate">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Kelengkapan Berkas Administrasi Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Kelengkapan Berkas Administrasi
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Kartu Keluarga (KK)', name: localSantri.fileKk ? 'kartu_keluarga.pdf' : 'Belum diunggah', url: localSantri.fileKk },
                      { label: 'KTP Orang Tua', name: localSantri.fileKtp ? 'ktp_orang_tua.pdf' : 'Belum diunggah', url: localSantri.fileKtp },
                      { label: 'Akta Kelahiran', name: localSantri.fileAkta ? 'akta_kelahiran.pdf' : 'Belum diunggah', url: localSantri.fileAkta },
                      { label: 'Ijazah Terakhir', name: localSantri.fileIjazah ? 'ijazah_terakhir.pdf' : 'Belum diunggah', url: localSantri.fileIjazah },
                      { label: 'Pas Foto Santri (3x4)', name: isCustomPasFoto(localSantri.filePasFoto) ? 'pas_foto_resmi.jpg' : 'Belum diunggah', isPasFoto: true, url: isCustomPasFoto(localSantri.filePasFoto) ? localSantri.filePasFoto : '' },
                    ].map((file, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-full bg-white border border-slate-100 shadow-xs text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                           <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">{file.label}</span>
                            <span className="text-slate-700 font-extrabold truncate block max-w-[240px] mt-0.5">{file.name}</span>
                          </div>
                        </div>
                        {file.name !== 'Belum diunggah' && (
                          file.isPasFoto ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(file.url)}
                              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-1.5 rounded-full transition-colors cursor-pointer"
                              title="Pratinjau Foto"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => {
                                if (file.url) {
                                  const link = document.createElement('a');
                                  link.href = file.url;
                                  link.download = file.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-1.5 rounded-full transition-colors cursor-pointer" 
                              title="Unduh Berkas"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Pembayaran */}
            {activeTab === 'pembayaran' && (
              <div className="space-y-4 animate-fadeIn flex flex-col items-center justify-center min-h-[300px]">
                <div className="bg-[#eefcd2] p-8 rounded-[24px] border border-[#d3e9a5] shadow-xs text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto border border-amber-200">
                    <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800 text-sm tracking-wide">
                      Sedang Dalam Pengembangan
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Modul Keuangan dan Pembayaran Syahriah (SPP) saat ini sedang disinkronisasikan dengan sistem bendahara pusat pesantren.
                    </p>
                  </div>
                  <div className="bg-white/85 px-4 py-2 rounded-full border border-slate-100 inline-block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest shadow-xs">
                    Nantikan Pembaruan Selanjutnya!
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Akademik */}
            {activeTab === 'akademik' && (
              <div className="space-y-4 animate-fadeIn">
                {/* 1. Kelas Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Kelas
                  </h4>
                  <div className="space-y-2">
                    {academicClasses.length > 0 ? (
                      academicClasses.map((cls, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-extrabold text-slate-800 uppercase tracking-wide truncate">
                            {cls.lembaga}
                          </span>
                          <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-4 py-1 rounded-full shrink-0 min-w-[100px] text-center">
                            {cls.kelas}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-500 font-medium bg-white rounded-full border border-slate-100">
                        Belum terdaftar di kelas mana pun
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Rombongan Belajar Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Rombongan Belajar
                  </h4>
                  <div className="space-y-2">
                    {academicRombels.length > 0 ? (
                      academicRombels.map((rom, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-extrabold text-slate-800 truncate">
                            {rom.category}
                          </span>
                          <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-4 py-1 rounded-full shrink-0 min-w-[100px] text-center">
                            {rom.group}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-500 font-medium bg-white rounded-full border border-slate-100">
                        Belum terdaftar di rombongan belajar mana pun
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Dokumen & Riwayat Pendidikan Card */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Dokumen & Riwayat Pendidikan
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'NISN', val: localSantri.nisn || '-' },
                      { label: 'NISM', val: localSantri.nism || '-' },
                      { label: 'Pendidikan Terakhir', val: localSantri.pendidikanTerakhir || '-' },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-slate-500 tracking-wide truncate">
                          {item.label}
                        </span>
                        <span className="bg-[#ffe4a0] text-slate-800 font-extrabold px-3 py-1 rounded-full shrink-0 max-w-[220px] text-center truncate">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Keamanan */}
            {activeTab === 'keamanan' && (
              <div className="space-y-4 animate-fadeIn">
                {/* 2-Column top section */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column Card: Poin Pelanggaran */}
                  <div className="bg-white p-5 rounded-[24px] border border-slate-200/50 shadow-xs flex flex-col items-center justify-center min-h-[160px]">
                    <div className="bg-[#ffebee] text-[#e0533c] font-black text-xs px-4 py-1.5 rounded-full mb-3 text-center tracking-wide">
                      Poin Pelanggaran
                    </div>
                    <div className="text-5xl font-black text-[#e0533c] tracking-tight my-1.5">
                      {displayPoints}
                    </div>
                    <div className="text-xs font-extrabold text-slate-800">
                      {displayCount} Pelanggaran
                    </div>
                  </div>

                  {/* Right Column Card: Keluar Pondok */}
                  <div className="bg-white p-5 rounded-[24px] border border-slate-200/50 shadow-xs flex flex-col items-center justify-center min-h-[160px]">
                    <div className="bg-[#e0f2fe] text-[#0284c7] font-black text-xs px-4 py-1.5 rounded-full mb-3 text-center tracking-wide uppercase">
                      Total Keluar Pondok
                    </div>
                    <div className="text-5xl font-black text-[#0284c7] tracking-tight my-1.5">
                      {activePermits.length}
                    </div>
                    <div className="text-xs font-extrabold text-slate-500 flex flex-col items-center gap-0.5 text-center mt-1">
                      <span className="text-blue-600 font-extrabold">{listIzinResmi.length}x Izin Resmi</span>
                      <span className="text-rose-600 font-extrabold">{listKeluarIlegal.length}x Ilegal</span>
                    </div>
                  </div>
                </div>

                {/* Bottom List: Riwayat Pelanggaran */}
                <div className="bg-[#eefcd2] p-4 rounded-[24px] border border-[#d3e9a5] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide">
                    Riwayat Pelanggaran
                  </h4>
                  <div className="space-y-2">
                    {displayViolations.length > 0 ? (
                      displayViolations.map((v, idx) => (
                        <div 
                          key={`violation-${v.id || ''}-${idx}`} 
                          className="bg-white px-4 py-2.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-400 font-mono font-medium shrink-0">
                            {v.tanggal}
                          </span>
                          <span className="font-extrabold text-slate-800 flex-1 truncate text-center">
                            {v.jenisPelanggaran}
                          </span>
                          <button 
                            className="text-slate-600 hover:text-slate-900 p-1 shrink-0 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-emerald-800 font-medium bg-white rounded-full border border-slate-100">
                        Tidak ada riwayat pelanggaran (Santri Berperilaku Baik)
                      </div>
                    )}
                  </div>
                </div>

                {/* Riwayat Perizinan Resmi Card */}
                <div className="bg-[#e0f2fe]/50 p-4 rounded-[24px] border border-[#bae6fd] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide text-blue-900">
                    Riwayat Perizinan Resmi
                  </h4>
                  <div className="space-y-2">
                    {listIzinResmi.length > 0 ? (
                      listIzinResmi.map((p, idx) => (
                        <div 
                          key={`resmi-${p.id || ''}-${idx}`} 
                          className="bg-white px-4 py-3 rounded-2xl shadow-xs border border-slate-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              {p.jenisIzin}
                            </span>
                            <span className="text-slate-500 font-mono font-medium">
                              {p.tanggalMulai} s.d {p.tanggalSelesai}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 min-w-0">
                            <span className="font-semibold text-slate-700 truncate" title={p.keterangan}>
                              Ket: {p.keterangan || '-'}
                            </span>
                            <span className={`font-black shrink-0 px-2.5 py-0.5 rounded-full text-[10px] ${
                              p.status === 'Izin Aktif' ? 'bg-amber-100 text-amber-800' :
                              p.status === 'Sudah Kembali' ? 'bg-green-100 text-green-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-blue-800 font-medium bg-white rounded-full border border-slate-100">
                        Tidak ada riwayat perizinan resmi
                      </div>
                    )}
                  </div>
                </div>

                {/* Riwayat Keluar Ilegal Card */}
                <div className="bg-[#ffe4e6]/50 p-4 rounded-[24px] border border-[#fecdd3] shadow-xs">
                  <h4 className="text-center font-black text-slate-800 text-sm mb-4 tracking-wide text-rose-800">
                    Riwayat Keluar Ilegal
                  </h4>
                  <div className="space-y-2">
                    {listKeluarIlegal.length > 0 ? (
                      listKeluarIlegal.map((p, idx) => (
                        <div 
                          key={`ilegal-${p.id || ''}-${idx}`} 
                          className="bg-white px-4 py-3 rounded-2xl shadow-xs border border-slate-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="bg-rose-50 text-rose-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              Ilegal
                            </span>
                            <span className="text-slate-500 font-mono font-medium">
                              Waktu: {p.tanggalMulai}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 min-w-0">
                            <span className="font-semibold text-slate-700 truncate" title={p.keterangan}>
                              Kronologi: {p.keterangan || '-'}
                            </span>
                            <span className="font-black shrink-0 px-2.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800">
                              {p.status || 'Keluar Ilegal'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-rose-800 font-medium bg-white rounded-full border border-slate-100">
                        Alhamdulillah, tidak ada riwayat keluar ilegal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer close action */}
          <div className="border-t border-slate-200/50 bg-white px-5 py-3 sm:px-6 sm:py-4 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">ID Santri: {localSantri.id}</span>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
            >
              Tutup Detail
            </button>
          </div>
        </motion.div>
      </div>

      {/* Photo Preview Overlay */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
            <div className="absolute inset-0" onClick={() => setPreviewPhotoUrl(null)} />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.05, ease: 'linear' }}
              className="relative max-w-sm bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-10 flex flex-col items-center"
            >
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute top-3 right-3 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 p-1.5 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Pratinjau Pas Foto</h3>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <img src={previewPhotoUrl} className="max-h-[350px] object-contain" alt="Pas Foto Santri" referrerPolicy="no-referrer" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
