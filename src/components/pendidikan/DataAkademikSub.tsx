import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter,
  Download, 
  ArrowLeftRight, 
  X, 
  Eye,
  Info,
  Check,
  Edit2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  BookOpen,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import { Santri, Lembaga, Kelas, KategoriRombel, KelompokRombel, RombelAssignment, isEmisTerdaftar } from '../../types';
import { renderSantriAvatar, getPesantrenProfile, calculateRealtimeAge } from '../SekretarisHelper';
import SantriDetailModal from '../sekretaris/SantriDetailModal';

interface DataAkademikSubProps {
  santriList: Santri[];
  lembagasList: Lembaga[];
  kelasList: Kelas[];
  categoriesList: KategoriRombel[];
  groupsList: KelompokRombel[];
  assignmentsList: RombelAssignment[];
  onUpdateSantri: (updatedSantri: Santri) => void;
  onUpdateSantriClassBatch?: (santriIds: string[], targetClassName: string) => void;
  onUpdateRombelBatch?: (santriIds: string[], categoryId: string, targetGroupId: string | null) => void;
  onAddAssignment?: (newAss: RombelAssignment) => void;
  onRemoveAssignment?: (santriId: string, kelompokId: string) => void;
  genderFilterProp?: 'Putra' | 'Putri';
  canViewPutra?: boolean;
  canViewPutri?: boolean;
  canWritePutra?: boolean;
  canWritePutri?: boolean;
}

export default function DataAkademikSub({
  santriList,
  lembagasList,
  kelasList,
  categoriesList,
  groupsList,
  assignmentsList,
  onUpdateSantri,
  onUpdateSantriClassBatch,
  onUpdateRombelBatch,
  onAddAssignment,
  onRemoveAssignment,
  genderFilterProp = 'Putra',
  canViewPutra = true,
  canViewPutri = true,
  canWritePutra = true,
  canWritePutri = true
}: DataAkademikSubProps) {

  // Primary mode state: 'formal' (Pendidikan Formal), 'internal' (Internal Pondok), or 'rombel' (Rombongan Belajar)
  const [academicType, setAcademicType] = useState<'formal' | 'internal' | 'rombel'>('formal');

  // Helper to determine whether a Lembaga is Formal or Internal
  const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
    if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
    const lower = (l.nama || '').toLowerCase();
    const kode = (l.kode || '').toLowerCase();
    if (
      lower.includes('madin') || 
      lower.includes('diniyah') || 
      lower.includes('tpq') || 
      lower.includes('tahfidz') || 
      lower.includes('pondok') || 
      lower.includes('kitab') || 
      lower.includes('internal') ||
      kode.includes('madin') ||
      kode.includes('tahf')
    ) {
      return 'Internal';
    }
    return 'Formal';
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'Putra' | 'Putri'>(genderFilterProp);

  useEffect(() => {
    if (genderFilterProp) {
      setGenderFilter(genderFilterProp);
    }
  }, [genderFilterProp]);

  const canWriteCurrent = genderFilter === 'Putra' ? canWritePutra : canWritePutri;
  
  // Specific Filters
  const [selectedLembagaFilter, setSelectedLembagaFilter] = useState<string>('semua');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('semua');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('semua');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('semua');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>('semua'); // 'sudah', 'belum', 'semua'

  // Sorting States
  const [sortKey, setSortKey] = useState<string>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selection & Bulk Action States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);

  // Edit Assignment Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [santriToEdit, setSantriToEdit] = useState<Santri[]>([]);
  
  // Dynamic multi-column edit selections
  // For Kelas: Record<lembagaId, classId | 'remove' | 'no_change'>
  const [selectedClassesByLembaga, setSelectedClassesByLembaga] = useState<Record<string, string>>({});
  // For Rombel: Record<categoryId, groupId | 'remove' | 'no_change'>
  const [selectedGroupsByCategory, setSelectedGroupsByCategory] = useState<Record<string, string>>({});

  // Export Dialog state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPageJumpDropdown, setShowPageJumpDropdown] = useState(false);

  // Row Action Dropdown State
  const [openDropdownRowId, setOpenDropdownRowId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  // Transfer Student Modal State
  const [transferStudent, setTransferStudent] = useState<Santri | null>(null);
  const [transferLembagaId, setTransferLembagaId] = useState<string>('');
  const [destClassId, setDestClassId] = useState<string>('');

  // Custom filter dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isLembagaDropdownOpen, setIsLembagaDropdownOpen] = useState(false);
  const [isKelasDropdownOpen, setIsKelasDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Horizontal Scroll Navigation state and refs
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth + 4;
      setCanScrollLeft(hasHorizontalScroll && scrollLeft > 2);
      setCanScrollRight(hasHorizontalScroll && scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
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
  };

  // Active Lembagas list based on gender filter and selected mode (formal vs internal)
  const activeLembagas = lembagasList.filter(l => {
    const matchesGender = !l.gender || l.gender === (genderFilter as string) || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua';
    if (!matchesGender) return false;
    if (academicType === 'rombel') return true;
    const jenis = getLembagaJenis(l);
    if (academicType === 'formal') return jenis === 'Formal';
    if (academicType === 'internal') return jenis === 'Internal';
    return true;
  });

  // Reset page, filters and selection when major criteria change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSantriIds([]);
    setIsSelectionMode(false);
    setOpenDropdownRowId(null);
  }, [searchQuery, genderFilter, academicType, selectedLembagaFilter, selectedKelasFilter, selectedCategoryFilter, selectedGroupFilter, assignmentStatusFilter]);

  // Reset dropdown when page or size changes
  useEffect(() => {
    setOpenDropdownRowId(null);
  }, [currentPage, pageSize]);

  // Handle Toast Auto Dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Helper to resolve student institution & class
  const getStudentClassInfo = (s: Santri) => {
    const sClasses = s.kelas ? s.kelas.split(',').map(x => x.trim()) : [];
    // Filter active classes that exist in our database
    const activeClasses = sClasses.map(clsName => {
      const found = kelasList.find(c => c.nama.toLowerCase() === clsName.toLowerCase());
      if (found) {
        const lemId = String((found as any).lembagaId || (found as any).lembaga_id || '');
        const lem = lembagasList.find(l => String(l.id) === lemId);
        return {
          className: found.nama,
          institutionCode: lem ? (lem.kode || lem.nama) : 'Internal',
          lembagaId: lemId
        };
      }
      return null;
    }).filter(Boolean) as { className: string; institutionCode: string; lembagaId: string }[];

    // Include internal institution from s.pendidikanInternal if not already present
    if (s.pendidikanInternal) {
      const internalIds = s.pendidikanInternal.split(',').map(x => x.trim()).filter(Boolean);
      internalIds.forEach(idVal => {
        const lem = lembagasList.find(l => 
          String(l.id) === idVal || 
          (l.nama && l.nama.toLowerCase() === idVal.toLowerCase()) ||
          (l.kode && l.kode.toLowerCase() === idVal.toLowerCase())
        );
        if (lem) {
          const alreadyIn = activeClasses.some(c => c.lembagaId === String(lem.id));
          if (!alreadyIn) {
            activeClasses.push({
              className: 'Calon Peserta Didik',
              institutionCode: lem.kode || lem.nama,
              lembagaId: String(lem.id)
            });
          }
        }
      });
    }

    return activeClasses;
  };

  // Helper to get student's class name in a specific Lembaga
  const getStudentClassInLembaga = (s: Santri, l: Lembaga): string | null => {
    const norm = (str?: string | null) => (str || '').trim().toLowerCase();
    const targetId = norm(l.id);
    const targetNama = norm(l.nama);
    const targetKode = norm(l.kode);

    // 1. Check s.pendidikanFormal
    if (s.pendidikanFormal) {
      const formalParts = s.pendidikanFormal.split(',').map(x => norm(x)).filter(Boolean);
      for (const pf of formalParts) {
        if (
          pf === targetId ||
          (targetNama && pf === targetNama) ||
          (targetKode && pf === targetKode) ||
          (targetNama && targetNama.length > 2 && (pf.includes(targetNama) || targetNama.includes(pf))) ||
          (targetKode && targetKode.length > 2 && (pf.includes(targetKode) || targetKode.includes(pf)))
        ) {
          const dashParts = pf.split('-');
          if (dashParts.length > 1) {
            const clsPart = dashParts.slice(1).join('-').trim();
            if (clsPart) return clsPart.toUpperCase();
          }
          return 'Calon Peserta Didik';
        }
      }
    }

    // 2. Check s.pendidikanInternal
    if (s.pendidikanInternal) {
      const internalParts = s.pendidikanInternal.split(',').map(x => norm(x)).filter(Boolean);
      for (const pi of internalParts) {
        if (
          pi === targetId ||
          (targetNama && pi === targetNama) ||
          (targetKode && pi === targetKode) ||
          (targetNama && targetNama.length > 2 && (pi.includes(targetNama) || targetNama.includes(pi))) ||
          (targetKode && targetKode.length > 2 && (pi.includes(targetKode) || targetKode.includes(pi)))
        ) {
          const dashParts = pi.split('-');
          if (dashParts.length > 1) {
            const clsPart = dashParts.slice(1).join('-').trim();
            if (clsPart) return clsPart.toUpperCase();
          }
          return 'Calon Peserta Didik';
        }
      }
    }

    // 3. Check s.kelas matching any class in kelasList belonging to this lembaga
    if (s.kelas) {
      const sClasses = s.kelas.split(',').map(x => norm(x)).filter(Boolean);
      const classesOfL = kelasList.filter(k => {
        const lemId = norm((k as any).lembagaId || (k as any).lembaga_id);
        return lemId === targetId;
      });
      for (const k of classesOfL) {
        if (k.nama && sClasses.includes(norm(k.nama))) {
          return k.nama;
        }
      }
    }

    return null;
  };

  // Helper to resolve student Rombel groups
  const getStudentRombelInfo = (s: Santri) => {
    const sAssignments = assignmentsList.filter(a => a.santriId === s.id);
    const assignedGroups = sAssignments.map(asg => {
      const group = groupsList.find(g => g.id === asg.kelompokId);
      const category = categoriesList.find(c => c.id === asg.kategoriId);
      if (group) {
        return {
          groupId: group.id,
          groupName: group.nama,
          categoryName: category ? category.nama : 'Lainnya'
        };
      }
      return null;
    }).filter(Boolean) as { groupId: string; groupName: string; categoryName: string }[];

    return assignedGroups;
  };

  // Combine address parts safely
  const getFormattedAlamat = (s: Santri) => {
    const parts = [s.desa, s.kecamatan, s.kabupaten].filter(Boolean).map(x => x!.trim());
    if (parts.length === 0) {
      return s.alamat || s.asal || '-';
    }
    return parts.join(', ');
  };

  // Filter students based on academic query, gender and academic filters
  const filteredSantri = santriList.filter(s => {
    // 0. Filter out Alumni
    if (s.statusKeanggotaan === 'Alumni') {
      return false;
    }

    // 1. Gender check
    if (s.gender !== genderFilter) {
      return false;
    }

    const classInfo = getStudentClassInfo(s);
    const rombelInfo = getStudentRombelInfo(s);

    // 2. Search Query Matching (Name, NIS, Address, Class, Rombel)
    const classStr = classInfo.map(c => `${c.institutionCode} ${c.className}`).join(', ');
    const rombelStr = rombelInfo.map(r => `${r.categoryName} ${r.groupName}`).join(', ');
    const matchesSearch = 
      String(s.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.nis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFormattedAlamat(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
      classStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rombelStr.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Mode specific filtering
    if (academicType === 'internal') {
      const hasClass = classInfo.some(c => activeLembagas.some(al => al.id === c.lembagaId));
      
      // Assignment Status Filter
      if (assignmentStatusFilter === 'sudah' && !hasClass) return false;
      if (assignmentStatusFilter === 'belum' && hasClass) return false;

      // Lembaga Filter
      if (selectedLembagaFilter !== 'semua' && hasClass) {
        const matchesLembaga = classInfo.some(c => {
          const foundClass = kelasList.find(cls => cls.nama.toLowerCase() === c.className.toLowerCase());
          return foundClass && foundClass.lembagaId === selectedLembagaFilter;
        });
        if (!matchesLembaga) return false;
      }

      // Kelas Filter
      if (selectedKelasFilter !== 'semua' && hasClass) {
        const matchesKelas = classInfo.some(c => c.className.toLowerCase() === selectedKelasFilter.toLowerCase());
        if (!matchesKelas) return false;
      }
    } else {
      // Rombel mode
      const hasRombel = rombelInfo.length > 0;

      // Assignment Status Filter
      if (assignmentStatusFilter === 'sudah' && !hasRombel) return false;
      if (assignmentStatusFilter === 'belum' && hasRombel) return false;

      // Category Filter
      if (selectedCategoryFilter !== 'semua' && hasRombel) {
        const matchesCat = assignmentsList.some(a => a.santriId === s.id && a.kategoriId === selectedCategoryFilter);
        if (!matchesCat) return false;
      }

      // Group Filter
      if (selectedGroupFilter !== 'semua' && hasRombel) {
        const matchesGroup = assignmentsList.some(a => a.santriId === s.id && a.kelompokId === selectedGroupFilter);
        if (!matchesGroup) return false;
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
    } else if (sortKey.startsWith('lembaga_')) {
      const lemId = sortKey.replace('lembaga_', '');
      const classA = getStudentClassInfo(a).find(c => c.lembagaId === lemId)?.className || '';
      const classB = getStudentClassInfo(b).find(c => c.lembagaId === lemId)?.className || '';
      comparison = classA.localeCompare(classB, 'id', { sensitivity: 'base', numeric: true });
    } else if (sortKey.startsWith('rombel_')) {
      const catId = sortKey.replace('rombel_', '');
      const getGroupForCategory = (s: Santri) => {
        const asg = assignmentsList.find(as => as.santriId === s.id && as.kategoriId === catId);
        if (!asg) return '';
        const grp = groupsList.find(g => g.id === asg.kelompokId);
        return grp ? grp.nama : '';
      };
      const groupA = getGroupForCategory(a);
      const groupB = getGroupForCategory(b);
      comparison = groupA.localeCompare(groupB, 'id', { sensitivity: 'base', numeric: true });
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination calculation
  const totalItems = sortedSantri.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSantri = sortedSantri.slice(startIndex, endIndex);

  useEffect(() => {
    updateScrollButtons();
    const timer = setTimeout(() => updateScrollButtons(), 100);
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [paginatedSantri]);

  // Count unassigned students
  const unassignedCount = santriList.filter(s => {
    if (s.gender !== genderFilter) return false;
    if (academicType === 'rombel') {
      const rombelInfo = getStudentRombelInfo(s);
      return rombelInfo.length === 0;
    } else {
      const classInfo = getStudentClassInfo(s);
      const hasClassInActiveLembagas = classInfo.some(c => activeLembagas.some(al => al.id === c.lembagaId));
      return !hasClassInActiveLembagas;
    }
  }).length;

  // Edit action trigger
  const handleOpenEditModal = (students: Santri[]) => {
    setSantriToEdit(students);
    
    if (academicType === 'internal') {
      const initialClasses: Record<string, string> = {};
      
      activeLembagas.forEach(lem => {
        if (students.length === 1) {
          // Pre-populate with student's current class for this lembaga if it exists
          const classInfo = getStudentClassInfo(students[0]);
          const match = classInfo.find(c => c.lembagaId === lem.id);
          if (match) {
            const cls = kelasList.find(c => c.nama.toLowerCase() === match.className.toLowerCase() && c.lembagaId === lem.id);
            initialClasses[lem.id] = cls ? cls.id : 'remove';
          } else {
            initialClasses[lem.id] = 'remove';
          }
        } else {
          // Bulk edit starts with "no_change" so we don't overwrite untouched columns
          initialClasses[lem.id] = 'no_change';
        }
      });
      setSelectedClassesByLembaga(initialClasses);
    } else {
      const initialGroups: Record<string, string> = {};
      
      categoriesList.forEach(cat => {
        if (students.length === 1) {
          // Pre-populate with student's current group for this category if it exists
          const asg = assignmentsList.find(a => a.santriId === students[0].id && a.kategoriId === cat.id);
          if (asg) {
            initialGroups[cat.id] = asg.kelompokId;
          } else {
            initialGroups[cat.id] = 'remove';
          }
        } else {
          // Bulk edit starts with "no_change"
          initialGroups[cat.id] = 'no_change';
        }
      });
      setSelectedGroupsByCategory(initialGroups);
    }
    
    setIsEditModalOpen(true);
  };

  // Save edit changes
  const handleSaveEditAssignment = () => {
    if (santriToEdit.length === 0) return;

    if (academicType === 'internal') {
      // We will loop through each student and calculate their new "kelas" string
      santriToEdit.forEach(s => {
        // Get current assigned classes (as class names)
        const currentClassesInfo = getStudentClassInfo(s);
        
        // Construct the list of new class names
        const finalClassNames: string[] = [];
        let updatedEmis = s.statusEmis;
        let updatedInternalStr = s.pendidikanInternal || '';
        let internalArr = updatedInternalStr.split(',').map(x => x.trim()).filter(Boolean);

        // For each active lembaga, decide which class to keep/add/remove
        activeLembagas.forEach(lem => {
          const action = selectedClassesByLembaga[lem.id];
          
          if (action === 'no_change') {
            // Keep existing assignment if there was one
            const match = currentClassesInfo.find(c => c.lembagaId === lem.id);
            if (match) {
              finalClassNames.push(match.className);
            }
          } else if (action === 'remove') {
            // Remove assignment
            internalArr = internalArr.filter(id => id.toLowerCase() !== String(lem.id).toLowerCase() && (lem.nama ? id.toLowerCase() !== lem.nama.toLowerCase() : true));
          } else if (action) {
            // A specific class ID or placement was selected
            if (!internalArr.some(id => id.toLowerCase() === String(lem.id).toLowerCase() || (lem.nama && id.toLowerCase() === lem.nama.toLowerCase()))) {
              internalArr.push(lem.id);
            }

            const targetClass = kelasList.find(c => c.id === action);
            if (targetClass) {
              finalClassNames.push(targetClass.nama);
              updatedEmis = 'Terdaftar';
            } else {
              finalClassNames.push('Calon Peserta Didik');
            }
          }
        });

        // We also keep classes of other lembagas that are not currently "active" in the current gender filter
        const activeLembagaIds = activeLembagas.map(l => l.id);
        const originalClasses = s.kelas ? s.kelas.split(',').map(x => x.trim()).filter(Boolean) : [];
        originalClasses.forEach(originalName => {
          const foundClass = kelasList.find(c => c.nama.toLowerCase() === originalName.toLowerCase());
          if (foundClass) {
            if (!activeLembagaIds.includes(foundClass.lembagaId)) {
              if (!finalClassNames.includes(foundClass.nama)) {
                finalClassNames.push(foundClass.nama);
              }
            }
          } else {
            // Keep unstructured class names if any
            if (!finalClassNames.includes(originalName)) {
              finalClassNames.push(originalName);
            }
          }
        });

        const finalClassString = finalClassNames.join(', ') || 'Tanpa Kelas';
        
        onUpdateSantri({
          ...s,
          kelas: finalClassString,
          statusEmis: updatedEmis,
          pendidikanInternal: internalArr.join(', ')
        });
      });

      setToast({
        message: `Penempatan kelas untuk ${santriToEdit.length} santri berhasil diperbarui.`,
        type: 'success'
      });
    } else {
      // Rombongan Belajar assignment
      const santriIds = santriToEdit.map(s => s.id);

      categoriesList.forEach(cat => {
        const action = selectedGroupsByCategory[cat.id];
        if (action === 'no_change') {
          // Keep existing assignment for this category (do nothing)
          return;
        }

        const targetGroupId = action === 'remove' ? null : action;

        if (onUpdateRombelBatch) {
          onUpdateRombelBatch(santriIds, cat.id, targetGroupId);
        } else if (onAddAssignment && onRemoveAssignment) {
          // Fallback to manual sequence
          santriToEdit.forEach(s => {
            // Remove from this category first
            const currentAsg = assignmentsList.find(a => a.santriId === s.id && a.kategoriId === cat.id);
            if (currentAsg) {
              onRemoveAssignment(s.id, currentAsg.kelompokId);
            }
            if (targetGroupId) {
              onAddAssignment({
                santriId: s.id,
                kategoriId: cat.id,
                kelompokId: targetGroupId
              });
            }
          });
        }
      });

      setToast({
        message: `Penempatan rombel untuk ${santriToEdit.length} santri berhasil diperbarui.`,
        type: 'success'
      });
    }

    setIsEditModalOpen(false);
    setSelectedSantriIds([]);
    setIsSelectionMode(false);
    setSantriToEdit([]);
  };

  // Excel Export Handler (XML Format compatible with Excel)
  const handleExportExcel = () => {
    const isKelas = academicType === 'internal';
    
    const dynamicHeaders: string[] = [];
    if (isKelas) {
      activeLembagas.forEach(lem => {
        dynamicHeaders.push(lem.nama);
      });
    } else {
      categoriesList.forEach(cat => {
        dynamicHeaders.push(cat.nama);
      });
    }

    const headers = ['No', 'Nama Lengkap', 'NIS', 'Gender', 'Alamat', ...dynamicHeaders];
    
    const rows = sortedSantri.map((s, idx) => {
      const dynamicValues: string[] = [];
      if (isKelas) {
        const classInfo = getStudentClassInfo(s);
        activeLembagas.forEach(lem => {
          const match = classInfo.find(c => c.lembagaId === lem.id);
          dynamicValues.push(match ? match.className : '-');
        });
      } else {
        categoriesList.forEach(cat => {
          const asg = assignmentsList.find(a => a.santriId === s.id && a.kategoriId === cat.id);
          const grp = asg ? groupsList.find(g => g.id === asg.kelompokId) : null;
          dynamicValues.push(grp ? grp.nama : '-');
        });
      }

      return [
        String(idx + 1),
        s.nama,
        s.nis || '-',
        s.gender,
        getFormattedAlamat(s),
        ...dynamicValues
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
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Data Akademik">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="200"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>`;

    dynamicHeaders.forEach(() => {
      xml += `\n   <Column ss:Width="120"/>`;
    });

    xml += `\n   <Row ss:Height="26">`;

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
    link.setAttribute('download', `Data_Akademik_${academicType}_${genderFilter}_${dateStr}.xls`);
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

    const isKelas = academicType === 'internal';
    
    const dynamicHeaders: string[] = [];
    if (isKelas) {
      activeLembagas.forEach(lem => {
        dynamicHeaders.push(lem.nama);
      });
    } else {
      categoriesList.forEach(cat => {
        dynamicHeaders.push(cat.nama);
      });
    }

    let html = `
      <html>
      <head>
        <title>LAPORAN DATA AKADEMIK ${academicType.toUpperCase()} SANTRI ${genderFilter.toUpperCase()} - SMART SANTRI</title>
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
            color: #4f46e5; 
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
            background-color: #4f46e5 !important; 
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
        <div class="title">LAPORAN DATA AKADEMIK (${academicType === 'rombel' ? 'ROMBONGAN BELAJAR' : 'INTERNAL PONDOK'})</div>
        <div class="subtitle">${profile.namaPesantren.toUpperCase()}</div>
        <div class="meta">Jumlah: ${sortedSantri.length} Santri • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} • Filter: Gender ${genderFilter}</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">No</th>
              <th style="width: 25%;">Nama Lengkap</th>
              <th style="width: 12%; text-align: center;">NIS</th>
              <th style="width: 25%;">Alamat</th>
              ${dynamicHeaders.map(hdr => `<th>${hdr}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sortedSantri.map((s, idx) => {
              let dynamicCellsHtml = '';
              if (isKelas) {
                const classInfo = getStudentClassInfo(s);
                dynamicCellsHtml = activeLembagas.map(lem => {
                  const match = classInfo.find(c => c.lembagaId === lem.id);
                  return `<td>${match ? match.className : '-'}</td>`;
                }).join('');
              } else {
                dynamicCellsHtml = categoriesList.map(cat => {
                  const asg = assignmentsList.find(a => a.santriId === s.id && a.kategoriId === cat.id);
                  const grp = asg ? groupsList.find(g => g.id === asg.kelompokId) : null;
                  return `<td>${grp ? grp.nama : '-'}</td>`;
                }).join('');
              }

              return `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td style="font-weight: 600;">${s.nama}</td>
                  <td class="text-center font-mono">${s.nis || '-'}</td>
                  <td>${getFormattedAlamat(s)}</td>
                  ${dynamicCellsHtml}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer-signs">
          <div class="sign-box">
            <p class="sign-title">Mengetahui,<br/>Kepala Bidang Pendidikan,</p>
            <div class="sign-name">Ustadz Farhan, S.Pd.</div>
            <p class="sign-desc">Layanan Pendidikan & Kurikulum</p>
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

  const renderSortHeader = (key: string, label: string, isSticky: boolean = false, extraClasses: string = '') => {
    const isSorted = sortKey === key;
    return (
      <th 
        key={key}
        onClick={() => {
          if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortKey(key);
            setSortDirection('asc');
          }
        }}
        className={`px-6 py-4 cursor-pointer transition-all select-none font-display text-xs font-bold uppercase tracking-wider hover:bg-indigo-100/50 relative ${
          isSticky 
            ? `static sm:sticky bg-slate-50 hover:bg-slate-100 z-20 ${extraClasses}` 
            : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 justify-start">
          <span className="text-current">{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-indigo-700 shrink-0 font-bold font-sans" />
            ) : (
              <ArrowDown className="h-3 w-3 text-indigo-700 shrink-0 font-bold font-sans" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500 shrink-0" />
          )}
        </div>

        {/* Scroll Left Button placed on right side of 'nama' header column */}
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
      </th>
    );
  };

  const renderScrollButtons = () => {
    if (!canScrollRight) return null;
    return (
      <button
        id="table-scroll-right-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scrollTable('right');
        }}
        className="absolute right-0 top-[26px] -translate-y-1/2 translate-x-1/2 z-[100] flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100"
        title="Gulir Kanan"
      >
        <ChevronRight className="h-4 w-4 stroke-[2.5] translate-x-[0.5px]" />
      </button>
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
      
      {/* Header with Title and Type Selection Dropdown next to Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Data Akademik</span>
            <span 
              onClick={() => {
                if (isSelectionMode) return;
                setGenderFilter(genderFilter === 'Putra' ? 'Putri' : 'Putra');
                setSelectedSantriIds([]);
                setIsSelectionMode(false);
              }}
              className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none ${
                isSelectionMode 
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'cursor-pointer active:scale-95'
              } ${
                !isSelectionMode && genderFilter === 'Putra' 
                  ? 'text-indigo-600 hover:text-indigo-700' 
                  : !isSelectionMode && genderFilter === 'Putri'
                  ? 'text-rose-600 hover:text-rose-700'
                  : ''
              }`}
              title={isSelectionMode ? "Matikan mode pilih untuk mengubah gender" : "Klik untuk mengubah filter gender (Putra ⇄ Putri)"}
            >
              <span>{genderFilter}</span>
              <ArrowLeftRight className="h-5 w-5 mt-0.5" />
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mengelola data pendidikan internal dan rombongan belajar santri <span className={genderFilter === 'Putra' ? 'text-indigo-600 font-bold' : 'text-rose-600 font-bold'}>{genderFilter}</span> secara terintegrasi.
          </p>
        </div>

        {/* Pojok kanan atas: Dropdown untuk memilih Rombel / Akademik Formal / Internal Pondok */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          
          <select
            value={academicType}
            onChange={(e) => {
              setAcademicType(e.target.value as 'formal' | 'internal' | 'rombel');
              setSelectedLembagaFilter('semua');
              setSelectedKelasFilter('semua');
              setSelectedCategoryFilter('semua');
              setSelectedGroupFilter('semua');
              setSelectedSantriIds([]);
              setIsSelectionMode(false);
            }}
            disabled={isSelectionMode}
            className={`h-10 px-3.5 rounded-full border border-indigo-200 bg-white text-indigo-700 font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all flex-1 sm:flex-initial sm:w-auto ${
              isSelectionMode ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="Pilih Jenis Data Akademik"
          >
            <option value="formal">Pendidikan Formal</option>
            <option value="internal">Pendidikan Internal Pondok</option>
            <option value="rombel">Rombongan Belajar</option>
          </select>

          {/* Export Button */}
          <button
            onClick={() => {
              if (isSelectionMode) return;
              setIsExportModalOpen(true);
            }}
            disabled={isSelectionMode}
            className={`h-10 px-4 rounded-full flex items-center justify-center gap-2 transition-all outline-none font-bold text-xs flex-1 sm:flex-initial sm:w-auto whitespace-nowrap ${
              isSelectionMode
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 cursor-pointer'
            }`}
            title={isSelectionMode ? "Matikan mode pilih untuk mengekspor data" : "Ekspor Data Akademik"}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

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
              placeholder={`Cari nama, NIS, alamat, atau ${academicType === 'rombel' ? 'kelompok belajar' : 'kelas internal'}...`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
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

          {/* Filter Toggle Button - Icon Only, directly to the right of search input */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all hover:bg-slate-50 shrink-0 cursor-pointer ${
              showFilters || assignmentStatusFilter !== 'semua' || selectedLembagaFilter !== 'semua' || selectedKelasFilter !== 'semua' || selectedCategoryFilter !== 'semua' || selectedGroupFilter !== 'semua'
                ? 'border-indigo-200 bg-indigo-50/30 text-indigo-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
            title="Filter Data Akademik"
          >
            <Filter className="h-4 w-4 text-current" />
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
              {/* Bulk Edit Penempatan */}
              <button
                type="button"
                onClick={() => {
                  if (selectedSantriIds.length === 0) {
                    alert("Silakan pilih minimal 1 santri untuk diedit.");
                    return;
                  }
                  const toEdit = sortedSantri.filter(s => selectedSantriIds.includes(s.id));
                  handleOpenEditModal(toEdit);
                }}
                className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer font-bold text-xs border-none"
                title={`Ubah ${academicType === 'rombel' ? 'Rombel' : 'Kelas Internal'} Masal`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ubah {academicType === 'rombel' ? 'Rombel' : 'Kelas Internal'}</span>
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

        {/* Filters Panel */}
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
                
                {/* 1. Status Terdaftar */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Penempatan</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                        isStatusDropdownOpen
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span>
                        {assignmentStatusFilter === 'semua'
                          ? 'Semua Status'
                          : assignmentStatusFilter === 'sudah'
                          ? 'Sudah Ditempatkan'
                          : 'Belum Ditempatkan ⚠️'}
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
                                { value: 'semua', label: 'Semua Status' },
                                { value: 'sudah', label: 'Sudah Ditempatkan' },
                                { value: 'belum', label: 'Belum Ditempatkan ⚠️' }
                              ].map((opt) => {
                                const isActive = assignmentStatusFilter === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setAssignmentStatusFilter(opt.value);
                                      setIsStatusDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      isActive
                                        ? 'bg-indigo-50 text-indigo-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isActive && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
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

                {/* 2 & 3. Cascading inputs depending on academicType */}
                {academicType === 'internal' ? (
                  <>
                    {/* Lembaga Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Lembaga Internal Pondok
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLembagaDropdownOpen(!isLembagaDropdownOpen)}
                          className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                            isLembagaDropdownOpen
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            {selectedLembagaFilter === 'semua'
                              ? 'Semua Lembaga'
                              : lembagasList.find(l => l.id === selectedLembagaFilter)
                              ? `${lembagasList.find(l => l.id === selectedLembagaFilter)?.nama}`
                              : selectedLembagaFilter}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                        </button>

                        <AnimatePresence>
                          {isLembagaDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[110]" 
                                onClick={() => setIsLembagaDropdownOpen(false)} 
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
                                      setSelectedLembagaFilter('semua');
                                      setSelectedKelasFilter('semua');
                                      setIsLembagaDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      selectedLembagaFilter === 'semua'
                                        ? 'bg-indigo-50 text-indigo-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>Semua Lembaga</span>
                                    {selectedLembagaFilter === 'semua' && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
                                  </button>
                                  {lembagasList
                                    .filter(l => (!l.gender || l.gender === (genderFilter as string) || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua') && getLembagaJenis(l) === 'Internal')
                                    .map(lem => {
                                      const isActive = selectedLembagaFilter === lem.id;
                                      return (
                                        <button
                                          key={lem.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedLembagaFilter(lem.id);
                                            setSelectedKelasFilter('semua');
                                            setIsLembagaDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                            isActive
                                              ? 'bg-indigo-50 text-indigo-800 font-bold'
                                              : 'hover:bg-slate-50 text-slate-600'
                                          }`}
                                        >
                                          <span>{lem.nama}</span>
                                          {isActive && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
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

                    {/* Kelas Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kelas</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsKelasDropdownOpen(!isKelasDropdownOpen)}
                          className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                            isKelasDropdownOpen
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            {selectedKelasFilter === 'semua' ? 'Semua Kelas' : selectedKelasFilter}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                        </button>

                        <AnimatePresence>
                          {isKelasDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[110]" 
                                onClick={() => setIsKelasDropdownOpen(false)} 
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
                                      setSelectedKelasFilter('semua');
                                      setIsKelasDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      selectedKelasFilter === 'semua'
                                        ? 'bg-indigo-50 text-indigo-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>Semua Kelas</span>
                                    {selectedKelasFilter === 'semua' && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
                                  </button>
                                  {kelasList
                                    .filter(c => {
                                      const lemObj = lembagasList.find(l => l.id === c.lembagaId);
                                      const matchesGender = !lemObj || !lemObj.gender || lemObj.gender === genderFilter;
                                      const matchesLembaga = selectedLembagaFilter === 'semua' || c.lembagaId === selectedLembagaFilter;
                                      const matchesType = !lemObj || getLembagaJenis(lemObj) === 'Internal';
                                      return matchesGender && matchesLembaga && matchesType;
                                    })
                                    .map(cls => {
                                      const isActive = selectedKelasFilter === cls.nama;
                                      return (
                                        <button
                                          key={cls.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedKelasFilter(cls.nama);
                                            setIsKelasDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                            isActive
                                              ? 'bg-indigo-50 text-indigo-800 font-bold'
                                              : 'hover:bg-slate-50 text-slate-600'
                                          }`}
                                        >
                                          <span>{cls.nama}</span>
                                          {isActive && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
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
                  </>
                ) : (
                  <>
                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kategori Rombel</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                            isCategoryDropdownOpen
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            {selectedCategoryFilter === 'semua'
                              ? 'Semua Kategori'
                              : categoriesList.find(c => c.id === selectedCategoryFilter)?.nama || selectedCategoryFilter}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                        </button>

                        <AnimatePresence>
                          {isCategoryDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[110]" 
                                onClick={() => setIsCategoryDropdownOpen(false)} 
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
                                      setSelectedCategoryFilter('semua');
                                      setSelectedGroupFilter('semua');
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      selectedCategoryFilter === 'semua'
                                        ? 'bg-indigo-50 text-indigo-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>Semua Kategori</span>
                                    {selectedCategoryFilter === 'semua' && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
                                  </button>
                                  {categoriesList.map(cat => {
                                    const isActive = selectedCategoryFilter === cat.id;
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCategoryFilter(cat.id);
                                          setSelectedGroupFilter('semua');
                                          setIsCategoryDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                          isActive
                                            ? 'bg-indigo-50 text-indigo-800 font-bold'
                                            : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                      >
                                        <span>{cat.nama}</span>
                                        {isActive && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
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

                    {/* Group Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kelompok Rombel</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                          className={`w-full flex flex-row h-11 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all hover:bg-slate-50 whitespace-nowrap cursor-pointer ${
                            isGroupDropdownOpen
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            {selectedGroupFilter === 'semua'
                              ? 'Semua Kelompok'
                              : groupsList.find(g => g.id === selectedGroupFilter)?.nama || selectedGroupFilter}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                        </button>

                        <AnimatePresence>
                          {isGroupDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[110]" 
                                onClick={() => setIsGroupDropdownOpen(false)} 
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
                                      setSelectedGroupFilter('semua');
                                      setIsGroupDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                      selectedGroupFilter === 'semua'
                                        ? 'bg-indigo-50 text-indigo-800 font-bold'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>Semua Kelompok</span>
                                    {selectedGroupFilter === 'semua' && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
                                  </button>
                                  {groupsList
                                    .filter(g => selectedCategoryFilter === 'semua' || g.kategoriId === selectedCategoryFilter)
                                    .map(grp => {
                                      const isActive = selectedGroupFilter === grp.id;
                                      return (
                                        <button
                                          key={grp.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedGroupFilter(grp.id);
                                            setIsGroupDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                                            isActive
                                              ? 'bg-indigo-50 text-indigo-800 font-bold'
                                              : 'hover:bg-slate-50 text-slate-600'
                                          }`}
                                        >
                                          <span>{grp.nama}</span>
                                          {isActive && <Check className="h-3.5 w-3.5 text-indigo-700 shrink-0" />}
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
                  </>
                )}

              </div>

              {/* Reset Filters Option */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentStatusFilter('semua');
                    setSelectedLembagaFilter('semua');
                    setSelectedKelasFilter('semua');
                    setSelectedCategoryFilter('semua');
                    setSelectedGroupFilter('semua');
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

      {/* Main Table View with sticky header */}
      <div id="academic-table-section" className="relative group/table overflow-visible">
        {renderScrollButtons()}
        <div 
          ref={containerRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-thin select-none"
        >
        {sortedSantri.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-100">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="font-display text-sm font-bold text-slate-700">Tidak Ada Data Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5">
              Santri {genderFilter} tidak ditemukan dengan kata kunci pencarian atau kriteria filter akademis yang sedang aktif.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin max-h-[600px] min-h-[280px]">
            <table className="w-full border-collapse text-left text-sm text-slate-600 min-w-[1000px]">
              
              {/* STICKY HEADER always on top ("berada di atas selalu") */}
              <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none sticky top-0 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <tr>
                  
                  {/* Sticky Checklist Column */}
                  {isSelectionMode && (
                    <th className="px-3 py-4 text-center sticky left-0 bg-slate-50 z-40 border-r border-slate-100 w-12 min-w-[48px]">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                  <th className={`px-2 py-4 static sm:sticky ${
                    isSelectionMode ? 'sm:left-12' : 'sm:left-0'
                  } bg-slate-50 z-40 sm:shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-slate-100 text-center w-[42px] min-w-[42px] max-w-[42px] font-display text-xs font-bold uppercase tracking-wider text-slate-400`}>
                    No.
                  </th>

                  {/* Sticky Nama Lengkap Column */}
                  {renderSortHeader('nama', 'Nama Lengkap', true, isSelectionMode ? 'sm:left-28 sm:shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-slate-100 min-w-[240px]' : 'sm:left-16 sm:shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-slate-100 min-w-[240px]')}

                  {/* Rest of non-sticky columns */}
                  {renderSortHeader('nis', 'NIS')}
                  {renderSortHeader('alamat', 'Alamat')}
                  {academicType !== 'rombel' ? (
                    activeLembagas.map(lem => renderSortHeader('lembaga_' + lem.id, lem.nama))
                  ) : (
                    categoriesList.map(cat => renderSortHeader('rombel_' + cat.id, cat.nama))
                  )}

                  {/* Sticky Aksi Column - On the right side */}
                  <th className="px-2 py-4 text-center w-12 bg-slate-50 font-display text-xs font-bold uppercase tracking-wider text-slate-400 sticky right-0 z-40 shadow-[-2px_0_5px_rgba(0,0,0,0.03)] border-l border-slate-100">
                    Aksi
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedSantri.map((s, idx) => {
                  const classInfo = getStudentClassInfo(s);
                  const rombelInfo = getStudentRombelInfo(s);
                  const isSelected = selectedSantriIds.includes(s.id);

                  return (
                    <tr 
                      key={s.id} 
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
                        isSelectionMode && isSelected
                          ? 'bg-indigo-50/60 hover:bg-indigo-100/60'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      
                      {/* Sticky Checklist Cell */}
                      {isSelectionMode && (
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-4 text-center sticky left-0 transition-colors z-20 border-r border-slate-100 w-12 min-w-[48px] ${
                            isSelected ? 'bg-indigo-50' : 'bg-white group-hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                      } transition-colors z-20 sm:shadow-[2px_0_5px_rgba(0,0,0,0.01)] border-r border-slate-100 text-center font-mono text-xs font-semibold ${
                        isSelectionMode && isSelected
                          ? 'bg-indigo-50 text-indigo-800 font-bold'
                          : 'bg-white text-slate-500 group-hover:bg-slate-50'
                      }`}>
                        {startIndex + idx + 1}
                      </td>

                      {/* Sticky Nama Lengkap Cell */}
                      <td className={`px-6 py-4 static sm:sticky ${
                        isSelectionMode ? 'sm:left-28' : 'sm:left-16'
                      } transition-colors z-20 sm:shadow-[2px_0_5px_rgba(0,0,0,0.01)] border-r border-slate-50 min-w-[240px] ${
                        isSelectionMode && isSelected
                          ? 'bg-indigo-50'
                          : 'bg-white group-hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0 select-none">
                            {renderSantriAvatar(s, "h-9 w-9 shrink-0 rounded-full border border-slate-100 shadow-xs")}
                            {(() => {
                              const age = calculateRealtimeAge(s.tanggalLahir);
                              return age !== null ? (
                                <span className="absolute -bottom-1 -left-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-white border border-white shadow-xs" title={`Umur realtime: ${age} tahun`}>
                                  {age}
                                </span>
                              ) : null;
                            })()}
                          </div>
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

                      {/* Academic Assignment Details Cells */}
                      {academicType !== 'rombel' ? (
                        activeLembagas.map(lem => {
                          const clsName = getStudentClassInLembaga(s, lem);
                          return (
                            <td key={lem.id} className="px-6 py-4 text-xs font-semibold whitespace-nowrap">
                              {clsName ? (
                                <span className={`inline-flex items-center rounded-xl px-2.5 py-1 font-extrabold border shadow-xs ${
                                  clsName === 'Calon Peserta Didik'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                                }`}>
                                  {clsName}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">-</span>
                              )}
                            </td>
                          );
                        })
                      ) : (
                        categoriesList.map(cat => {
                          const asg = assignmentsList.find(a => a.santriId === s.id && a.kategoriId === cat.id);
                          const grp = asg ? groupsList.find(g => g.id === asg.kelompokId) : null;
                          return (
                            <td key={cat.id} className="px-6 py-4 text-xs font-semibold whitespace-nowrap">
                              {grp ? (
                                <span className="inline-flex items-center rounded-xl bg-purple-50 text-purple-800 px-2.5 py-1 font-extrabold border border-purple-100 shadow-xs">
                                  {grp.nama}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">-</span>
                              )}
                            </td>
                          );
                        })
                      )}

                      {/* Sticky Aksi Column with 3-Dots Dropdown Menu */}
                      <td className={`px-2 py-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.01)] overflow-visible w-12 min-w-[48px] ${
                        openDropdownRowId === s.id ? 'z-50' : 'z-20'
                      }`}>
                        <div className="flex items-center justify-center overflow-visible" onClick={(e) => e.stopPropagation()}>
                          
                          <div className="relative">
                            {canWriteCurrent ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdownRowId(openDropdownRowId === s.id ? null : s.id)}
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 cursor-pointer shadow-2xs active:scale-90 ${
                                    openDropdownRowId === s.id ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : ''
                                  }`}
                                  title="Aksi Lainnya"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                <AnimatePresence>
                                  {openDropdownRowId === s.id && (
                                    <>
                                      {/* Overlay to catch clicks and close the menu */}
                                      <div 
                                        className="fixed inset-0 z-40 bg-transparent" 
                                        onClick={() => setOpenDropdownRowId(null)} 
                                      />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: ((idx >= paginatedSantri.length - 2 && idx >= 2) || (idx === paginatedSantri.length - 1 && idx > 0)) ? 4 : -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`absolute right-0 ${
                                          ((idx >= paginatedSantri.length - 2 && idx >= 2) || (idx === paginatedSantri.length - 1 && idx > 0))
                                            ? 'bottom-full mb-1.5 origin-bottom-right'
                                            : 'top-full mt-1.5 origin-top-right'
                                        } w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-50 text-left font-sans`}
                                      >
                                        {/* Biodata option */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedSantri(s);
                                            setOpenDropdownRowId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-none text-left"
                                        >
                                          <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                          <span>Biodata</span>
                                        </button>

                                        {/* Pindah option */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setTransferStudent(s);
                                            setOpenDropdownRowId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-none text-left"
                                        >
                                          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                          <span>Pindah</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsSelectionMode(true);
                                            if (isSelected) {
                                              setSelectedSantriIds(selectedSantriIds.filter(id => id !== s.id));
                                            } else {
                                              setSelectedSantriIds([...selectedSantriIds, s.id]);
                                            }
                                            setOpenDropdownRowId(null);
                                          }}
                                          className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border-none text-left ${
                                            isSelected 
                                              ? 'bg-indigo-50 text-indigo-800' 
                                              : 'text-slate-600 hover:bg-slate-50'
                                          }`}
                                        >
                                          <Check className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                          <span>{isSelected ? 'Batal Pilih' : 'Pilih Santri'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleOpenEditModal([s]);
                                            setOpenDropdownRowId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-none text-left"
                                        >
                                          <Edit2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                          <span>Ubah Penempatan</span>
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedSantri(s)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 cursor-pointer shadow-2xs active:scale-90"
                                title="Lihat Detail Biodata"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>

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
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
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
                                  ? 'bg-indigo-50 text-indigo-800 font-bold'
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

      {/* --- EDIT PENEMPATAN MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10 font-sans border border-slate-100"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-display text-lg font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Ubah Penempatan {academicType === 'rombel' ? 'Rombel' : 'Internal Pondok'}</span>
              </h3>
              
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                Mengubah penempatan untuk <span className="text-indigo-600 font-extrabold">{santriToEdit.length} santri</span> {genderFilter.toLowerCase()} sekaligus secara massal.
              </p>

              <div className="mt-5 space-y-4">
                
                {academicType === 'internal' ? (
                  <div className="space-y-4.5 max-h-[350px] overflow-y-auto pr-1">
                    {activeLembagas.map(lem => {
                      const value = selectedClassesByLembaga[lem.id] || 'no_change';
                      const isFormalLembaga = (lem as any).jenis === 'Formal';
                      const hasUnregisteredEmis = santriToEdit.some(s => !isEmisTerdaftar(s.statusEmis));
                      
                      let availableClasses = kelasList.filter(c => c.lembagaId === lem.id);
                      if (isFormalLembaga && hasUnregisteredEmis) {
                        availableClasses = availableClasses.filter(c => (c as any).isDefault || c.nama.trim().toLowerCase() === 'calon peserta didik');
                        if (availableClasses.length === 0) {
                          availableClasses = [{
                            id: 'default-' + lem.id,
                            lembagaId: String(lem.id),
                            nama: 'Calon Peserta Didik',
                            waliKelas: '-',
                            tingkatan: 'Lainnya',
                            isDefault: true
                          } as any];
                        }
                      }

                      return (
                        <div key={lem.id} className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Kelas {lem.nama}
                          </label>
                          <select
                            value={value}
                            onChange={(e) => {
                              setSelectedClassesByLembaga(prev => ({
                                ...prev,
                                [lem.id]: e.target.value
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {santriToEdit.length > 1 && (
                              <option value="no_change">— Tidak ada perubahan —</option>
                            )}
                            <option value="remove">Set Tanpa Kelas / Keluarkan</option>
                            {availableClasses.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.nama}
                              </option>
                            ))}
                          </select>
                          {isFormalLembaga && hasUnregisteredEmis && (
                            <p className="text-[11px] font-medium text-amber-700 mt-1">
                              ⚠️ Terdapat santri belum terdaftar EMIS. Pada pendidikan formal, kelas dibatasi ke <strong>"Calon Peserta Didik"</strong>.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4.5 max-h-[350px] overflow-y-auto pr-1">
                    {categoriesList.map(cat => {
                      const value = selectedGroupsByCategory[cat.id] || 'no_change';
                      return (
                        <div key={cat.id} className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {cat.nama}
                          </label>
                          <select
                            value={value}
                            onChange={(e) => {
                              setSelectedGroupsByCategory(prev => ({
                                ...prev,
                                [cat.id]: e.target.value
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {santriToEdit.length > 1 && (
                              <option value="no_change">— Tidak ada perubahan —</option>
                            )}
                            <option value="remove">Set Tanpa Kelompok (Keluarkan)</option>
                            {groupsList
                              .filter(g => g.kategoriId === cat.id)
                              .map(grp => (
                                <option key={grp.id} value={grp.id}>
                                  {grp.nama} {grp.pembimbing ? `(Pembimbing: ${grp.pembimbing})` : ''}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Modal Actions */}
              <div className="mt-6.5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditAssignment}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer border-none"
                >
                  Simpan Perubahan
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXPORT MODAL DIALOG --- */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl z-10 font-sans border border-slate-100"
            >
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-display text-base font-extrabold text-slate-800 uppercase tracking-wider">Ekspor Data Akademik</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Silakan pilih format ekspor dokumen laporannya.</p>

              <div className="mt-5 grid grid-cols-2 gap-3.5">
                
                {/* Excel Export Option */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportExcel();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/20 text-center flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-indigo-50/45 outline-none"
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">EX</div>
                  <span className="text-xs font-bold text-indigo-950">Format Excel (.xls)</span>
                </button>

                {/* PDF Print Option */}
                <button
                  type="button"
                  onClick={() => {
                    handlePrintPDF();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/20 text-center flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-indigo-50/45 outline-none"
                >
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg font-bold">PDF</div>
                  <span className="text-xs font-bold text-indigo-950">Laporan Cetak (PDF)</span>
                </button>

              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 text-[10px] text-slate-400 flex items-start gap-2 border border-slate-100 font-medium">
                <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Dokumen yang diunduh mencakup seluruh filter aktif (Gender: {genderFilter}, Jenis: {academicType === 'rombel' ? 'Rombel' : 'Internal Pondok'})</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SINGLE DETAIL MODAL MOUNT --- */}
      <SantriDetailModal 
        selectedSantri={selectedSantri} 
        onClose={() => setSelectedSantri(null)} 
      />

      {/* --- PINDAH KELAS MODAL --- */}
      <AnimatePresence>
        {transferStudent && (() => {
          const studentGender = transferStudent.gender || genderFilter;
          const targetKind = academicType === 'internal' ? 'Internal' : 'Formal';
          const eligibleLembagas = lembagasList.filter(l => 
            getLembagaJenis(l) === targetKind && (!l.gender || (l.gender as string) === (studentGender as string) || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua')
          );
          const activeLemId = transferLembagaId || (eligibleLembagas[0]?.id || '');
          const currentLemObj = lembagasList.find(l => l.id === activeLemId) || eligibleLembagas[0];
          const isFormalTarget = (currentLemObj?.jenis === 'Formal' || targetKind === 'Formal');
          const isStudentEmis = isEmisTerdaftar(transferStudent.statusEmis);

          let targetClasses = kelasList.filter(k => {
            const lemId = String((k as any).lembagaId || (k as any).lembaga_id || '');
            return lemId === String(activeLemId);
          });

          if (isFormalTarget && !isStudentEmis) {
            targetClasses = targetClasses.filter(c => (c as any).isDefault || c.nama.trim().toLowerCase() === 'calon peserta didik');
            if (targetClasses.length === 0) {
              targetClasses = [{
                id: 'default-' + activeLemId,
                lembagaId: String(activeLemId),
                nama: 'Calon Peserta Didik',
                waliKelas: '-',
                tingkatan: 'Lainnya',
                isDefault: true
              } as any];
            }
          }

          const handleExecuteTransferModal = () => {
            if (!transferStudent || !activeLemId) return;
            const destClassObj = targetClasses.find(c => c.id === destClassId) || targetClasses[0] || { nama: 'Calon Peserta Didik' };
            const targetLemObj = lembagasList.find(l => l.id === activeLemId);

            if (onUpdateSantri) {
              let newFormal = transferStudent.pendidikanFormal;
              let newInternal = transferStudent.pendidikanInternal;
              
              if (isFormalTarget) {
                newFormal = destClassObj.nama !== 'Calon Peserta Didik' 
                  ? `${targetLemObj?.nama || ''} - ${destClassObj.nama}` 
                  : `${targetLemObj?.nama || ''} - Calon Peserta Didik`;
              } else {
                newInternal = destClassObj.nama !== 'Calon Peserta Didik' ? `${targetLemObj?.nama || ''} - ${destClassObj.nama}` : `${targetLemObj?.nama || ''}`;
              }

              let updatedClasses = transferStudent.kelas ? transferStudent.kelas.split(',').map(x => x.trim()).filter(Boolean) : [];
              if (!updatedClasses.includes(destClassObj.nama) && destClassObj.nama !== 'Calon Peserta Didik') {
                updatedClasses.push(destClassObj.nama);
              }

              onUpdateSantri({
                ...transferStudent,
                kelas: updatedClasses.join(', '),
                pendidikanFormal: newFormal,
                pendidikanInternal: newInternal
              });
            }

            setToast({
              message: `${transferStudent.nama} dipindahkan ke ${targetLemObj?.nama || ''} - ${destClassObj.nama}.`,
              type: 'success'
            });
            setTransferStudent(null);
            setTransferLembagaId('');
            setDestClassId('');
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Pindahkan Santri
                  </h3>
                  <button onClick={() => { setTransferStudent(null); setTransferLembagaId(''); setDestClassId(''); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs font-medium text-slate-600">
                  <p className="leading-relaxed">
                    Pindahkan <strong className="text-slate-800 font-extrabold">{transferStudent.nama}</strong> ({studentGender}) ke:
                  </p>

                  {/* Kotak 1: Pilih Lembaga */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      1. Pilih Lembaga Tujuan ({targetKind})
                    </label>
                    <select
                      value={activeLemId}
                      onChange={(e) => {
                        setTransferLembagaId(e.target.value);
                        setDestClassId('');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      {eligibleLembagas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kotak 2: Pilih Kelas */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      2. Pilih Kelas Tujuan
                    </label>
                    {targetClasses.length === 0 ? (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium leading-relaxed">
                        <span className="font-extrabold block mb-0.5">⚠️ Tidak ada kelas tujuan</span>
                        Lembaga <strong>{currentLemObj?.nama}</strong> belum memiliki kelas tujuan.
                      </div>
                    ) : (
                      <select
                        value={destClassId}
                        onChange={(e) => setDestClassId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {targetClasses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nama} {c.waliKelas && c.waliKelas !== '-' ? `(${c.waliKelas})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {isFormalTarget && !isStudentEmis && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium leading-relaxed">
                      ⚠️ Santri belum terdaftar EMIS. Pada pendidikan formal, kelas tujuan dibatasi hanya ke <strong>"Calon Peserta Didik"</strong>.
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => { setTransferStudent(null); setTransferLembagaId(''); setDestClassId(''); }}
                    className="px-3 py-1.5 border border-slate-250 text-slate-500 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleExecuteTransferModal}
                    disabled={!destClassId}
                    className="px-4.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    PINDAHKAN
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
