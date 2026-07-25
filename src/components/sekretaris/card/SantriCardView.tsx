import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  MoreVertical, 
  CheckSquare, 
  Pencil, 
  Printer, 
  Trash2, 
  Hash, 
  User, 
  Calendar, 
  MapPin,
  ChevronsUpDown
} from 'lucide-react';
import { Santri, Lembaga, Kelas } from '../../../types';
import { demoteSantriToCalonPesertaDidik } from '../../../lib/utils';
import { fetchTableData } from '../../../lib/api';
import { renderSantriAvatar, isCustomPasFoto } from '../../SekretarisHelper';
import { MembershipBadge } from '../components/HelperComponents';
import { AgeFilterConfig, calculateAgeOnDate } from '../AgeFilterModal';

interface SantriCardViewProps {
  paginatedSantri: Santri[];
  isSelectionMode: boolean;
  selectedSantriIds: string[];
  setSelectedSantriIds: (ids: string[]) => void;
  setSelectedSantri: (s: Santri) => void;
  handleStartEditSantri: (s: Santri) => void;
  handlePrintClick: (s: Santri) => void;
  handleDeleteClick: (id: string, name: string) => void;
  activeSantriDropdownId: string | null;
  setActiveSantriDropdownId: (id: string | null) => void;
  setIsSelectionMode: (val: boolean) => void;
  canWritePutra: boolean;
  canWritePutri: boolean;
  ageFilterConfig?: AgeFilterConfig;
  onUpdateSantri?: (s: Santri) => void;
  lembagasList?: Lembaga[];
  kelasList?: Kelas[];
}

export default function SantriCardView({
  paginatedSantri,
  isSelectionMode,
  selectedSantriIds,
  setSelectedSantriIds,
  setSelectedSantri,
  handleStartEditSantri,
  handlePrintClick,
  handleDeleteClick,
  activeSantriDropdownId,
  setActiveSantriDropdownId,
  setIsSelectionMode,
  canWritePutra,
  canWritePutri,
  ageFilterConfig,
  onUpdateSantri,
  lembagasList,
  kelasList
}: SantriCardViewProps) {
  const [internalLembagas, setInternalLembagas] = React.useState<Lembaga[]>(lembagasList || []);
  const [internalKelas, setInternalKelas] = React.useState<Kelas[]>(kelasList || []);

  React.useEffect(() => {
    if (lembagasList) setInternalLembagas(lembagasList);
    if (kelasList) setInternalKelas(kelasList);
  }, [lembagasList, kelasList]);

  React.useEffect(() => {
    if ((!lembagasList || lembagasList.length === 0) || (!kelasList || kelasList.length === 0)) {
      const loadEdu = async () => {
        try {
          const lems = await fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', []);
          const kls = await fetchTableData<Kelas>('kelas', 'smartsantri_kelas', []);
          if (lems && lems.length > 0) setInternalLembagas(lems);
          if (kls && kls.length > 0) setInternalKelas(kls);
        } catch {}
      };
      loadEdu();
    }
  }, []);

  const activeLembagas = lembagasList || internalLembagas;
  const activeKelas = kelasList || internalKelas;

  const [activeEmisDropdownId, setActiveEmisDropdownId] = React.useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const [lastAction, setLastAction] = React.useState<'select' | 'deselect' | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
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

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    initialSelectedIdsRef.current = selectedSantriIds;
    draggedRef.current = false;
    
    // Find closest card to determine clicked target
    const cardEl = target.closest('[data-drag-id]');
    clickedIdRef.current = cardEl?.getAttribute('data-drag-id') || null;

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

  const handleCardClick = (e: React.MouseEvent, index: number, s: Santri) => {
    if (!isSelectionMode) return;
    if (draggedRef.current) return;

    toggleSingleSelection(s.id, e.shiftKey);
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="relative select-none"
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {paginatedSantri.map((s, index) => {
          const isSelected = selectedSantriIds.includes(s.id);
          const canWriteForSantri = s.gender === 'Putra' ? canWritePutra : canWritePutri;
          const isPutri = s.gender === 'Putri';
          const genderBgColor = isPutri ? 'bg-pink-500' : 'bg-[#00b0f0]';
          
          // Initials helper
          const getInitials = (name: string): string => {
            const words = (name || '').trim().split(/\s+/);
            if (words.length === 0 || !words[0]) return '?';
            if (words.length === 1) {
              return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
            }
            return (words[0][0] + words[1][0]).toUpperCase();
          };

          const hasUploadedPhoto = isCustomPasFoto(s.filePasFoto);
          
          // Address helper
          const formattedAddress = [s.desa, s.kecamatan, s.kabupaten]
            .filter(val => val && val.trim() !== '')
            .join(', ');
          const addressText = formattedAddress || s.alamat || s.asal || '-';

          return (
            <div 
              key={s.id} 
              data-drag-id={s.id}
              onClick={(e) => handleCardClick(e, index, s)}
              className={`group relative flex flex-row items-center gap-6 rounded-lg border p-6 transition-all duration-200 select-none ${
                isSelectionMode
                  ? isSelected
                    ? 'border-[#a5d8f3] bg-[#e3f7fc] cursor-pointer shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Selection Checkbox / 3-Dots Menu (Top Right) */}
              {isSelectionMode ? (
                <div 
                  className="absolute top-4 right-4 z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(e, index, s);
                  }}
                >
                  {isSelected ? (
                    <div className="w-5 h-5 bg-[#0d6efd] rounded flex items-center justify-center text-white shadow-xs cursor-pointer active:scale-90 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-white border border-slate-300 rounded hover:border-slate-400 transition-colors cursor-pointer active:scale-90 transition-transform" />
                  )}
                </div>
              ) : (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSantriDropdownId(activeSantriDropdownId === s.id ? null : s.id);
                    }}
                    className="dropdown-trigger-btn text-slate-500 hover:text-slate-800 p-1 rounded-lg transition-colors cursor-pointer active:scale-90"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-500" />
                  </button>

                  {/* Dropdown Popover matching Image Reference exactly */}
                  <AnimatePresence>
                    {activeSantriDropdownId === s.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSantriDropdownId(null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="dropdown-container-box absolute right-0 mt-1 w-24 rounded-sm border border-slate-300 bg-white py-1 shadow-md z-40 text-slate-700 font-sans"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSantriDropdownId(null);
                              setIsSelectionMode(true);
                              setLastSelectedIndex(index);
                              setLastAction('select');
                              if (!selectedSantriIds.includes(s.id)) {
                                setSelectedSantriIds([...selectedSantriIds, s.id]);
                              }
                            }}
                            className="flex w-full items-center px-4 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            Pilih
                          </button>

                        {canWriteForSantri && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSantriDropdownId(null);
                              handleStartEditSantri(s);
                            }}
                            className="flex w-full items-center px-4 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveSantriDropdownId(null);
                            handlePrintClick(s);
                          }}
                          className="flex w-full items-center px-4 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                        >
                          Print
                        </button>

                        {canWriteForSantri && (
                          <>
                            <div className="my-1 border-t border-slate-200" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSantriDropdownId(null);
                                handleDeleteClick(s.id, s.nama);
                              }}
                              className="flex w-full items-center px-4 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer font-bold transition-colors"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Photo Section */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-slate-200/80 shadow-xs bg-slate-50 flex-shrink-0 flex items-center justify-center">
              {hasUploadedPhoto ? (
                <img 
                  src={s.filePasFoto} 
                  className="w-full h-full object-cover" 
                  alt={s.nama} 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-sans font-extrabold text-2xl sm:text-3xl text-white ${genderBgColor}`}>
                  {getInitials(s.nama)}
                </div>
              )}
              {/* Selection blue overlay tint matching Image 2 reference exactly */}
              {isSelectionMode && isSelected && (
                <div className="absolute inset-0 bg-[#00b0f0]/30 mix-blend-multiply pointer-events-none" />
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
              <div>
                {/* Pills/Badges exactly like Reference Image */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-tight ${
                    s.statusKeanggotaan === 'Alumni' 
                      ? 'bg-[#e2f0d9] text-[#385723]' 
                      : s.statusKeanggotaan === 'Meninggal'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-[#d9f2d5] text-[#2e7d32]'
                  }`}>
                    {s.statusKeanggotaan || 'Aktif'}
                  </span>
                  {s.statusKeanggotaan === 'Aktif' && (
                    <span className="inline-flex items-center justify-center rounded-full bg-[#ffeb3b] text-slate-900 px-2.5 py-0.5 text-[10px] font-bold tracking-tight">
                      {s.statusDomisili || 'Muqim'}
                    </span>
                  )}
                  <span className={`inline-flex items-center justify-center rounded-full ${genderBgColor} text-white px-2.5 py-0.5 text-[10px] font-bold tracking-tight`}>
                    {s.gender || 'Putra'}
                  </span>
                  {ageFilterConfig?.enabled && (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold tracking-tight">
                      {(() => {
                        const refDate = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
                          ? new Date(ageFilterConfig.customDate)
                          : new Date();
                        const age = calculateAgeOnDate(s.tanggalLahir, refDate);
                        const subtext = ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
                          ? `Per ${new Date(ageFilterConfig.customDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'Hari ini';
                        return age !== null ? `Umur: ${age} Thn (${subtext})` : 'Umur: -';
                      })()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-sans text-lg sm:text-xl font-bold text-[#1a1a1a] tracking-tight leading-tight mb-1 truncate">
                  {s.nama}
                </h3>

                {/* ID & Address (NIS, dot spacer, and sub-district/district/province details) */}
                <p className="text-xs text-slate-500 font-medium font-sans truncate mb-4" title={addressText}>
                  {s.nis || '-'} <span className="mx-1 text-slate-400 font-bold">·</span> {addressText}
                </p>
              </div>

              {/* Red Pill Button 'Lihat Selengkapnya >' */}
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    if (!isSelectionMode) {
                      e.stopPropagation();
                      setSelectedSantri(s);
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelectionMode
                      ? 'bg-[#b01616]/60 text-white/80'
                      : 'bg-[#b01616] text-white hover:bg-[#8f1212] active:scale-95 shadow-sm'
                  }`}
                >
                  <span>Lihat Selengkapnya &gt;</span>
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  </div>
);
}
