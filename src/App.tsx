import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, FileText, GraduationCap, Users, Shield } from 'lucide-react';
import Header from './components/Header';
import Drawer from './components/Drawer';
import Sidebar from './components/Sidebar';
import HelpModal from './components/HelpModal';
import { fetchTableData, insertTableRow, insertTableRows, updateTableRow, deleteTableRow, subscribeRealtimeChanges, snakeToCamel, safeLocalStorageSetItem } from './lib/api';

// Views
import HomeView from './components/HomeView';
import SekretarisView from './components/SekretarisView';
import BendaharaView from './components/BendaharaView';
import PendidikanView from './components/PendidikanView';
import HumasyView from './components/HumasyView';
import KeamananView from './components/KeamananView';
import PengaturanView from './components/PengaturanView';
import LoginView from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { formatBigDigit, mergeIdField } from './lib/utils';

// Initial Mock Data
import { 
  INITIAL_SANTRI, 
  INITIAL_BENDAHARA, 
  INITIAL_KEAMANAN, 
  INITIAL_HUMAS, 
  INITIAL_PENDIDIKAN 
} from './data';

import { 
  Santri, 
  BendaharaRecord, 
  KeamananRecord, 
  HumasAgenda, 
  KelasPendidikan,
  isEmisTerdaftar
} from './types';
import { DEFAULT_ROLES, fetchAndSyncPermissionsFromSupabase } from './lib/permissions';

export default function App() {
  // Initialize default roles permissions and fetch latest in real-time from Supabase
  React.useEffect(() => {
    if (!localStorage.getItem('smartsantri_roles_permissions')) {
      try {
        localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(DEFAULT_ROLES));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Background sync on app load to ensure permissions are always up to date in real-time
    fetchAndSyncPermissionsFromSupabase().catch(err => {
      console.warn("Gagal sinkronisasi hak akses background dari Database:", err);
    });
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('smartsantri_is_logged_in') === 'true';
  });

  // Navigation
  const [activeModule, setActiveModule] = useState<string>('home');

  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  const handleChangeModule = (mod: string, subTab?: string) => {
    if (isSelectionMode) return;
    setActiveModule(mod);
    if (subTab) {
      setActiveSubTab(subTab);
    } else {
      switch (mod) {
        case 'home':
          setActiveSubTab('dashboard');
          break;
        case 'sekretaris':
          setActiveSubTab('santri');
          break;
        case 'bendahara':
          setActiveSubTab('');
          break;
        case 'pendidikan':
          setActiveSubTab('lembaga');
          break;
        case 'humasy':
          setActiveSubTab('kamar');
          break;
        case 'keamanan':
          setActiveSubTab('overview');
          break;
        case 'pengaturan':
          {
            const role = localStorage.getItem('smartsantri_active_role') || 'superadmin';
            setActiveSubTab(role === 'superadmin' ? 'akses' : 'keamanan');
          }
          break;
        default:
          setActiveSubTab('');
          break;
      }
    }
  };

  // Unified States for Pesantren Records (Full online Supabase state)
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [bendaharaList, setBendaharaList] = useState<BendaharaRecord[]>([]);
  const [keamananList, setKeamananList] = useState<KeamananRecord[]>([]);
  const [humasList, setHumasList] = useState<HumasAgenda[]>([]);
  const [pendidikanList, setPendidikanList] = useState<KelasPendidikan[]>([]);
  
  // Track newly added or modified santri to prevent initial load from overwriting them while async requests are pending
  const pendingOperations = React.useRef<Map<string, { data: Santri; timestamp: number }>>(new Map());
  // Track recently deleted santri IDs to prevent realtime listeners from re-inserting them
  const deletedSantriIds = React.useRef<Map<string, number>>(new Map());
 
  // On mount, load data once from Supabase and set up automatic WebSockets Supabase Realtime listener
  React.useEffect(() => {
    const cleanSantri = (s: any) => {
      let updated = { ...s };
      const unifiedStatus = s.statusKeanggotaan || s.status || 'Aktif';
      updated.statusKeanggotaan = unifiedStatus as any;
      if (s.kelas === 'VII Tsanawiyah A') {
        updated.kelas = 'Tanpa Kelas';
      }
      if (s.kamar === 'Al-Ghazali 01' || s.kamar === 'Al Ghazali 01') {
        updated.kamar = 'Tanpa Kamar';
      }
      if (s.nik !== undefined && s.nik !== null) updated.nik = formatBigDigit(s.nik);
      if (s.nisn !== undefined && s.nisn !== null) updated.nisn = formatBigDigit(s.nisn);
      if (s.noKk !== undefined && s.noKk !== null) updated.noKk = formatBigDigit(s.noKk);
      if (s.nikAyah !== undefined && s.nikAyah !== null) updated.nikAyah = formatBigDigit(s.nikAyah);
      if (s.nikIbu !== undefined && s.nikIbu !== null) updated.nikIbu = formatBigDigit(s.nikIbu);
      if (s.noHp !== undefined && s.noHp !== null) updated.noHp = formatBigDigit(s.noHp);
      return updated;
    };

    const loadAllData = () => {
      fetchTableData<Santri>('santri', 'smartsantri_santriList', [])
        .then(list => {
          let hasDummy = false;
          const cleaned = list.map(s => {
            let updated = { ...s };
            // Ensure statusKeanggotaan is always set
            const unifiedStatus = s.statusKeanggotaan || (s as any).status || 'Aktif';
            updated.statusKeanggotaan = unifiedStatus as any;

            if (s.kelas === 'VII Tsanawiyah A') {
              hasDummy = true;
              updated.kelas = 'Tanpa Kelas';
            }
            if (updated.kelas && updated.kelas.toLowerCase().includes('calon pelajar')) {
              hasDummy = true;
              updated.kelas = updated.kelas.replace(/calon pelajar/gi, 'Calon Peserta Didik');
              updateTableRow('santri', 'smartsantri_santriList', updated.id, updated).catch(() => {});
            }
            if (s.kamar === 'Al-Ghazali 01' || s.kamar === 'Al Ghazali 01') {
              hasDummy = true;
              updated.kamar = 'Tanpa Kamar';
            }
            return updated;
          });

          setSantriList((prev) => {
            const now = Date.now();
            // Clean up operations older than 15 seconds
            for (const [id, op] of pendingOperations.current.entries()) {
              if (now - op.timestamp > 15000) {
                pendingOperations.current.delete(id);
              }
            }
            // Clean up deleted items older than 60 seconds
            for (const [id, time] of deletedSantriIds.current.entries()) {
              if (now - time > 60000) {
                deletedSantriIds.current.delete(id);
              }
            }

            // Map server's cleaned list, overriding any items with active pending updates
            const updatedCleaned = cleaned
              .filter(item => !deletedSantriIds.current.has(item.id))
              .map(item => {
                const pending = pendingOperations.current.get(item.id);
                if (pending) {
                  return pending.data;
                }
                return item;
              });

            // Find pending items that are not yet in the cleaned list (such as brand new ones)
            const brandNewPending = Array.from(pendingOperations.current.values())
              .filter((op: { data: Santri; timestamp: number }) => !deletedSantriIds.current.has(op.data.id) && !cleaned.some(c => c.id === op.data.id))
              .map((op: { data: Santri; timestamp: number }) => op.data);

            const resultList = [...brandNewPending, ...updatedCleaned];
            if (JSON.stringify(prev) === JSON.stringify(resultList)) {
              return prev;
            }
            return resultList;
          });

          if (hasDummy) {
            list.forEach(async (s) => {
              if (s.kelas === 'VII Tsanawiyah A' || s.kamar === 'Al-Ghazali 01' || s.kamar === 'Al Ghazali 01') {
                try {
                  const updatedKamar = s.kamar === 'Al-Ghazali 01' || s.kamar === 'Al Ghazali 01' ? 'Tanpa Kamar' : s.kamar;
                  const updatedKelas = s.kelas === 'VII Tsanawiyah A' ? 'Tanpa Kelas' : s.kelas;
                  await updateTableRow('santri', 'smartsantri_santriList', s.id, { ...s, kelas: updatedKelas, kamar: updatedKamar });
                } catch (e) {
                  console.error('Failed to update dummy class/room in DB:', e);
                }
              }
            });
          }
        });

      fetchTableData<BendaharaRecord>('bendahara', 'smartsantri_bendaharaList', [])
        .then(data => {
          setBendaharaList(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        });

      fetchTableData<KeamananRecord>('keamanan', 'smartsantri_keamananList', [])
        .then(data => {
          setKeamananList(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        });
    };

    loadAllData();

    // Subscribe to WebSocket realtime changes from server
    const unsubscribeWs = subscribeRealtimeChanges((payload: any) => {
      if (payload.event === 'db_change') {
        if (payload.table === 'santri') {
          if (payload.action === 'delete' && payload.id) {
            setSantriList(prev => prev.filter(s => s.id !== payload.id));
          } else if ((payload.action === 'insert' || payload.action === 'update') && payload.data) {
            const camelData = snakeToCamel(payload.data) as Santri;
            setSantriList(prev => {
              const idx = prev.findIndex(s => s.id === camelData.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...camelData };
                return next;
              }
              return [camelData, ...prev];
            });
          }
        } else if (payload.table === 'bendahara') {
          if (payload.action === 'delete' && payload.id) {
            setBendaharaList(prev => prev.filter(b => b.id !== payload.id));
          } else if ((payload.action === 'insert' || payload.action === 'update') && payload.data) {
            const camelData = snakeToCamel(payload.data) as BendaharaRecord;
            setBendaharaList(prev => {
              const idx = prev.findIndex(b => b.id === camelData.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...camelData };
                return next;
              }
              return [camelData, ...prev];
            });
          }
        } else if (payload.table === 'keamanan') {
          if (payload.action === 'delete' && payload.id) {
            setKeamananList(prev => prev.filter(k => k.id !== payload.id));
          } else if ((payload.action === 'insert' || payload.action === 'update') && payload.data) {
            const camelData = snakeToCamel(payload.data) as KeamananRecord;
            setKeamananList(prev => {
              const idx = prev.findIndex(k => k.id === camelData.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...camelData };
                return next;
              }
              return [camelData, ...prev];
            });
          }
        }
        loadAllData();
      }
    });

    // Re-fetch immediately when screen/tab regains focus or visibility
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAllData();
      }
    };
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      unsubscribeWs();
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  // Route newly logged-in users to their corresponding view immediately
  React.useEffect(() => {
    if (isLoggedIn) {
      setActiveModule('home');
      setActiveSubTab('dashboard');
    }
  }, [isLoggedIn]);

  // Handle resetting all local data
  const handleResetAllLocalData = () => {
    localStorage.removeItem('smartsantri_santriList');
    localStorage.removeItem('smartsantri_bendaharaList');
    localStorage.removeItem('smartsantri_keamananList');
    localStorage.removeItem('smartsantri_kompleks');
    localStorage.removeItem('smartsantri_kamar');
    localStorage.removeItem('smartsantri_rombel_assignments');
    localStorage.removeItem('smartsantri_lembaga_kelas');
    setSantriList([]);
    setBendaharaList([]);
    setKeamananList([]);
    setHumasList([]);
    setPendidikanList([]);
  };

  // Administrative handlers passed down as props
  const handleAddSantri = async (newSantri: Santri) => {
    // 1. Fetch the absolute latest list of santri from the database to detect any extremely recent additions
    let latestList: Santri[] = [];
    try {
      latestList = await fetchTableData<Santri>('santri', 'smartsantri_santriList', []);
    } catch (e) {
      console.warn("Gagal fetch data santri terbaru sebelum simpan:", e);
      latestList = santriList;
    }

    let finalSantri = { ...newSantri };

    // 2. If finalSantri has a NIS, check if that NIS already exists in the absolute latest database list
    if (finalSantri.nis && finalSantri.nis.trim() !== "") {
      const activeNis = finalSantri.nis.trim();
      const isConflicting = latestList.some(s => s.nis && s.nis.trim() === activeNis && s.id !== finalSantri.id);
      
      if (isConflicting) {
        // High-precision dynamic generation of the next sequence on the fly!
        const entryYear = finalSantri.tanggalMasuk ? finalSantri.tanggalMasuk.split('-')[0] : new Date().getFullYear().toString();
        const prefix = entryYear; // 4 digits year, e.g. '2026'
        
        // Find all NIS already present in the latest database list starting with this prefix
        const allocatedNisSet = new Set<string>();
        latestList.forEach(s => {
          if (s.nis && s.nis.trim() !== "") {
            allocatedNisSet.add(s.nis.trim());
          }
        });

        let nextSeq = 1;
        while (true) {
          const candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
          if (!allocatedNisSet.has(candidate)) {
            finalSantri.nis = candidate;
            break;
          }
          nextSeq++;
        }
        
        console.warn(`Deteksi tabrakan NIS! NIS ${activeNis} dialihkan menjadi ${finalSantri.nis}.`);
        // Store a collision toast message in localStorage for SekretarisView to display
        localStorage.setItem(
          'smartsantri_nis_conflict_toast', 
          `Tabrakan NIS Teratasi: NIS ${activeNis} baru saja digunakan oleh admin lain. Data disimpan dengan NIS unik baru ${finalSantri.nis} secara aman.`
        );
      }
    }

    // Update state first with the final sanitized santri details
    pendingOperations.current.set(finalSantri.id, { data: finalSantri, timestamp: Date.now() });
    setSantriList((prev) => [finalSantri, ...prev.filter(x => x.id !== finalSantri.id)]);
    
    // Commit to database
    try {
      const saved = await insertTableRow('santri', 'smartsantri_santriList', finalSantri);
      const savedUnifiedStatus = saved.statusKeanggotaan || (saved as any).status || finalSantri.statusKeanggotaan || 'Aktif';
      saved.statusKeanggotaan = savedUnifiedStatus;

      // Preserve identification fields from finalSantri if missing/invalid/truncated in saved response
      const idFields: (keyof Santri)[] = ['nik', 'nisn', 'noKk', 'nikAyah', 'nikIbu', 'noHp', 'nism', 'nis', 'rt', 'rw'];
      for (const field of idFields) {
        (saved as any)[field] = mergeIdField(finalSantri[field], saved[field]);
      }

      pendingOperations.current.set(finalSantri.id, { data: saved, timestamp: Date.now() });
      setSantriList((prev) => prev.map(s => s.id === finalSantri.id ? saved : s));
    } catch (dbErr: any) {
      pendingOperations.current.delete(finalSantri.id);
      console.error("Gagal melakukan insert ke database:", dbErr);
      // Re-fetch latest list to ensure correct state in case of failure
      fetchTableData<Santri>('santri', 'smartsantri_santriList', []).then(setSantriList);
      throw dbErr;
    }
  };

  const handleBulkAddSantri = async (newSantriList: Santri[]) => {
    setSantriList((prev) => [...newSantriList, ...prev]);
    await insertTableRows('santri', 'smartsantri_santriList', newSantriList);
  };

  const handleUpdateSantri = async (updatedSantri: Santri) => {
    let processed = { ...updatedSantri };
    
    // Check if status is updated to Alumni
    const isNowAlumni = updatedSantri.statusKeanggotaan === 'Alumni';
    if (isNowAlumni) {
      processed.statusKeanggotaan = 'Alumni';
      processed.kelas = '';
      processed.kamar = '';
      processed.nomorLemari = '';
    }

    pendingOperations.current.set(processed.id, { data: processed, timestamp: Date.now() });
    
    // Immediately update local React state and sync to localStorage
    setSantriList((prev) => {
      const nextList = prev.map((s) => s.id === processed.id ? processed : s);
      safeLocalStorageSetItem('smartsantri_santriList', JSON.stringify(nextList));
      return nextList;
    });
    
    try {
      const saved = await updateTableRow('santri', 'smartsantri_santriList', processed.id, processed);
      const mergedSaved = { ...processed };
      if (saved && typeof saved === 'object') {
        for (const k of Object.keys(saved)) {
          if (saved[k] !== undefined) {
            (mergedSaved as any)[k] = saved[k];
          }
        }
      }
      const idFields: (keyof Santri)[] = ['nik', 'nisn', 'noKk', 'nikAyah', 'nikIbu', 'noHp', 'nism', 'nis', 'rt', 'rw'];
      for (const field of idFields) {
        (mergedSaved as any)[field] = mergeIdField(processed[field], mergedSaved[field]);
      }
      mergedSaved.statusKeanggotaan = mergedSaved.statusKeanggotaan || processed.statusKeanggotaan || 'Aktif';
      // Keep in pendingOperations with updated timestamp so incoming stale realtime events don't overwrite it immediately
      pendingOperations.current.set(processed.id, { data: mergedSaved, timestamp: Date.now() });
      setSantriList((prev) => {
        const nextList = prev.map(s => s.id === processed.id ? mergedSaved : s);
        safeLocalStorageSetItem('smartsantri_santriList', JSON.stringify(nextList));
        return nextList;
      });
    } catch (dbErr: any) {
      console.warn("Update remote database failed, keeping local update:", dbErr);
    }
  };

  const handleDeleteSantri = async (id: string) => {
    deletedSantriIds.current.set(id, Date.now());
    pendingOperations.current.delete(id);

    const santriToDelete = santriList.find((s) => s.id === id);
    if (!santriToDelete) {
      setSantriList((prev) => {
        const nextList = prev.filter((s) => s.id !== id);
        safeLocalStorageSetItem('smartsantri_santriList', JSON.stringify(nextList));
        return nextList;
      });
      await deleteTableRow('santri', 'smartsantri_santriList', id);
      return;
    }

    const { nama: targetNama, id: targetId } = santriToDelete;

    // 1. Cascade delete in Keamanan (Riwayat Pelanggaran)
    const matchingKeamanan = keamananList.filter((k) => k.namaSantri === targetNama);
    if (matchingKeamanan.length > 0) {
      setKeamananList((prev) => prev.filter((k) => k.namaSantri !== targetNama));
      for (const rec of matchingKeamanan) {
        try {
          await deleteTableRow('keamanan', 'smartsantri_keamananList', rec.id);
        } catch (err) {
          console.error(`Error deleting keamanan record ${rec.id}:`, err);
        }
      }
    }

    // 2. Cascade delete in Bendahara (Keuangan / Pembayaran Bulanan)
    const matchingBendahara = bendaharaList.filter((b) => b.namaSantri === targetNama);
    if (matchingBendahara.length > 0) {
      setBendaharaList((prev) => prev.filter((b) => b.namaSantri !== targetNama));
      for (const rec of matchingBendahara) {
        try {
          await deleteTableRow('bendahara', 'smartsantri_bendaharaList', rec.id);
        } catch (err) {
          console.error(`Error deleting bendahara record ${rec.id}:`, err);
        }
      }
    }

    // 3. Delete the Santri itself
    setSantriList((prev) => {
      const nextList = prev.filter((s) => s.id !== id);
      safeLocalStorageSetItem('smartsantri_santriList', JSON.stringify(nextList));
      return nextList;
    });
    await deleteTableRow('santri', 'smartsantri_santriList', id);
  };

  const handleToggleBendahara = async (id: string) => {
    let targetRec = bendaharaList.find((r) => r.id === id);
    if (!targetRec) return;

    const isLunasNow = targetRec.status === 'Belum Lunas';
    const newStatus: 'Lunas' | 'Belum Lunas' = isLunasNow ? 'Lunas' : 'Belum Lunas';
    const updated: BendaharaRecord = {
      ...targetRec,
      status: newStatus,
      tanggalBayar: isLunasNow ? new Date().toISOString().split('T')[0] : undefined
    };

    setBendaharaList((prev) => 
      prev.map((rec) => (rec.id === id ? updated : rec))
    );

    await updateTableRow<BendaharaRecord>('bendahara', 'smartsantri_bendaharaList', id, {
      status: newStatus,
      tanggalBayar: updated.tanggalBayar
    });
  };

  const handleAddKeamanan = async (newRec: KeamananRecord) => {
    setKeamananList((prev) => [newRec, ...prev]);
    await insertTableRow('keamanan', 'smartsantri_keamananList', newRec);
  };

  const handleDeleteKeamanan = async (id: string) => {
    setKeamananList((prev) => prev.filter((item) => item.id !== id));
    await deleteTableRow('keamanan', 'smartsantri_keamananList', id);
  };

  // Helper to render current screen
  const renderView = () => {
    let viewContent: React.ReactNode = null;
    let moduleLabel = 'Beranda';

    switch (activeModule) {
      case 'home':
        moduleLabel = 'Beranda';
        viewContent = (
          <HomeView
            santriList={santriList}
            keamananList={keamananList}
            bendaharaList={bendaharaList}
            onChangeModule={handleChangeModule}
            onResetAllLocalData={handleResetAllLocalData}
          />
        );
        break;
      case 'sekretaris':
        moduleLabel = 'Sekretariat';
        viewContent = (
          <SekretarisView
            santriList={santriList}
            onAddSantri={handleAddSantri}
            onBulkAddSantri={handleBulkAddSantri}
            onUpdateSantri={handleUpdateSantri}
            onDeleteSantri={handleDeleteSantri}
            initialSubTab={activeSubTab as any}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />
        );
        break;
      case 'bendahara':
        moduleLabel = 'Keuangan';
        viewContent = (
          <BendaharaView
            bendaharaList={bendaharaList}
            onToggleStatus={handleToggleBendahara}
          />
        );
        break;
      case 'pendidikan':
        moduleLabel = 'Pendidikan & Rombel';
        viewContent = (
          <PendidikanView
            pendidikanList={pendidikanList}
            santriList={santriList}
            onUpdateSantri={handleUpdateSantri}
            setSantriList={setSantriList}
            activeSubTab={activeSubTab}
            onChangeSubTab={setActiveSubTab}
          />
        );
        break;
      case 'humasy':
        moduleLabel = 'Humas & Asrama';
        viewContent = (
          <HumasyView
            humasList={humasList}
            santriList={santriList}
            onUpdateSantri={handleUpdateSantri}
            setSantriList={setSantriList}
            activeSubTab={activeSubTab}
            onChangeSubTab={setActiveSubTab}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />
        );
        break;
      case 'keamanan':
        moduleLabel = 'Keamanan & Perizinan';
        viewContent = (
          <KeamananView
            keamananList={keamananList}
            onAddKeamanan={handleAddKeamanan}
            onDeleteKeamanan={handleDeleteKeamanan}
            santriList={santriList}
            activeSubTab={activeSubTab}
            onChangeSubTab={setActiveSubTab}
          />
        );
        break;
      case 'pengaturan':
        moduleLabel = 'Pengaturan Sistem';
        viewContent = (
          <PengaturanView 
            activeCategory={activeSubTab as any} 
            setActiveCategory={setActiveSubTab as any} 
          />
        );
        break;
      default:
        moduleLabel = 'Beranda';
        viewContent = (
          <HomeView
            santriList={santriList}
            keamananList={keamananList}
            bendaharaList={bendaharaList}
            onChangeModule={handleChangeModule}
            onResetAllLocalData={handleResetAllLocalData}
          />
        );
        break;
    }

    return (
      <ErrorBoundary key={activeModule} moduleName={moduleLabel}>
        {viewContent}
      </ErrorBoundary>
    );
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-row selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Sidebar - Persistent floating sidebar on desktop, hidden on mobile */}
      <Sidebar 
        activeModule={activeModule}
        activeSubTab={activeSubTab}
        onChangeModule={handleChangeModule}
        isSelectionMode={isSelectionMode}
        onLogout={() => setIsLoggedIn(false)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Upper Navigation Header bar */}
        <Header 
          activeModule={activeModule}
          activeSubTab={activeSubTab}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        {/* Main Drawer Container (Mobile Menu) */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeModule={activeModule}
          activeSubTab={activeSubTab}
          onChangeModule={handleChangeModule}
          isSelectionMode={isSelectionMode}
          onLogout={() => setIsLoggedIn(false)}
          onOpenHelp={() => setShowHelpModal(true)}
        />

        {/* Global Help Modal */}
        <HelpModal 
          isOpen={showHelpModal} 
          onClose={() => setShowHelpModal(false)} 
        />

        {/* Main Responsive Content Zone */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-6 sm:px-6 lg:px-8 focus:outline-none">
          
          {/* Animated slide transitions for active module view */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>

        </main>

        {/* Modern minimal footer */}
        <footer className="w-full border-t border-slate-200/60 bg-white py-5 text-center mt-12 hidden md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs font-semibold">
            <p>© 2026 AttarOkey 4.0. Hak Cipta Dilindungi Pengurus Pesantren.</p>
            <div className="flex gap-4">
              <span className="text-emerald-700">Tepat • Cepat • Teratur</span>
              <span>v1.2.0 Stable</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
