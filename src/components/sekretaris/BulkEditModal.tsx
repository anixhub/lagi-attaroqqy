import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, GraduationCap } from 'lucide-react';
import { Santri, Lembaga, Kelas, isDefaultClass } from '../../types';
import { demoteSantriToCalonPesertaDidik } from '../../lib/utils';
import { fetchTableData } from '../../lib/api';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSantriIds: string[];
  santriList: Santri[];
  onUpdateSantri?: (updatedSantri: Santri) => void;
  setSelectedSantriIds: (ids: string[]) => void;
  setIsSelectionMode: (val: boolean) => void;
}

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedSantriIds,
  santriList,
  onUpdateSantri,
  setSelectedSantriIds,
  setIsSelectionMode,
}: BulkEditModalProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [lembagasList, setLembagasList] = useState<Lembaga[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      document.body.style.overflow = 'hidden';

      // Load lembagas & kelas from localStorage
      try {
        const lemStr = localStorage.getItem('smartsantri_lembagas');
        const kelStr = localStorage.getItem('smartsantri_kelas');
        if (lemStr) setLembagasList(JSON.parse(lemStr));
        if (kelStr) setKelasList(JSON.parse(kelStr));
      } catch (e) {
        console.error("Gagal memuat data lembaga/kelas untuk edit masal:", e);
      }

      fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', [])
        .then(data => {
          if (data && data.length > 0) setLembagasList(data);
        })
        .catch(console.error);

      fetchTableData<Kelas>('kelas', 'smartsantri_kelas', [])
        .then(data => {
          if (data && data.length > 0) setKelasList(data);
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
    if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
    const lower = (l.nama || '').toLowerCase();
    if (
      lower.includes('madin') || lower.includes('diniyah') || lower.includes('tpq') ||
      lower.includes('tahfidz') || lower.includes('pondok') || lower.includes('kitab') ||
      lower.includes('internal') || (l.kode && l.kode.toLowerCase().includes('madin')) ||
      (l.kode && l.kode.toLowerCase().includes('tahf'))
    ) {
      return 'Internal';
    }
    return 'Formal';
  };

  const [bulkSelectedFields, setBulkSelectedFields] = useState({
    statusKeanggotaan: false,
    statusDomisili: false,
    statusEmis: false,
    tanggalMasuk: false,
    tanggalKeluar: false,
    catatan: false,
    aktivitasAkademik: false,
  });

  const [bulkForm, setBulkForm] = useState({
    statusKeanggotaan: 'Aktif' as 'Aktif' | 'Alumni' | 'Meninggal',
    statusDomisili: 'Muqim' as 'Muqim' | 'Kampung',
    statusEmis: 'Terdaftar' as 'Terdaftar' | 'Belum',
    tanggalMasuk: getTodayDateString(),
    tanggalKeluar: getTodayDateString(),
    catatan: '',
    pendidikanInternal: '',
  });

  const showTanggalKeluar = bulkSelectedFields.statusKeanggotaan && bulkForm.statusKeanggotaan !== 'Aktif';

  const updateSantriAcademicActivity = (
    santri: Santri,
    selectedInternalIds: string[],
    lembagas: Lembaga[],
    kelases: Kelas[]
  ): Santri => {
    let currentClasses = santri.kelas ? santri.kelas.split(',').map(x => x.trim()).filter(Boolean) : [];
    currentClasses = currentClasses.filter(c => c.toLowerCase() !== 'tanpa kelas');

    const getLemId = (k: any) => String(k ? (k.lembagaId || k.lembaga_id || '') : '').trim();

    // Remove internal classes from internal institutions that are NOT selected
    const unselectedInternalLembagaIds = lembagas
      .filter(l => getLembagaJenis(l) === 'Internal' && !selectedInternalIds.map(String).includes(String(l.id)))
      .map(l => String(l.id));
    const unselectedInternalClassNames = kelases
      .filter(k => unselectedInternalClassNames.includes(getLemId(k)))
      .map(k => k.nama.trim().toLowerCase());

    currentClasses = currentClasses.filter(cls => !unselectedInternalClassNames.includes(cls.toLowerCase()));

    // 4. For each selected internal institution ID, check if santri is already in a class for it
    for (const internalId of selectedInternalIds) {
      const internalClassNames = kelases
        .filter(k => getLemId(k) === String(internalId))
        .map(k => k.nama.trim().toLowerCase());

      const alreadyHasInternalClass = currentClasses.some(cls => {
        const lower = cls.trim().toLowerCase();
        return internalClassNames.includes(lower) || lower === 'calon peserta didik' || lower === 'calon pelajar';
      });

      if (!alreadyHasInternalClass) {
        const defaultCls = kelases.find(k => getLemId(k) === String(internalId) && isDefaultClass(k));
        const newClsName = defaultCls ? defaultCls.nama : 'Calon Peserta Didik';
        currentClasses.push(newClsName);
      }
    }

    const hasSpecificClass = currentClasses.some(c => {
      const lower = c.trim().toLowerCase();
      return lower !== 'calon peserta didik' && lower !== 'calon pelajar' && lower !== 'tanpa kelas';
    });
    if (hasSpecificClass) {
      currentClasses = currentClasses.filter(c => {
        const lower = c.trim().toLowerCase();
        return lower !== 'calon peserta didik' && lower !== 'calon pelajar';
      });
    }

    // Deduplicate and join
    const uniqueClasses = Array.from(new Set(currentClasses));
    const finalKelasString = uniqueClasses.join(', ') || 'Tanpa Kelas';

    return {
      ...santri,
      pendidikanInternal: selectedInternalIds.length > 0 ? selectedInternalIds.join(',') : undefined,
      kelas: finalKelasString,
    };
  };

  const handleClose = () => {
    setBulkSelectedFields({
      statusKeanggotaan: false,
      statusDomisili: false,
      statusEmis: false,
      tanggalMasuk: false,
      tanggalKeluar: false,
      catatan: false,
      aktivitasAkademik: false,
    });
    onClose();
  };

  const handleSave = () => {
    const anySelected = Object.values(bulkSelectedFields).some(Boolean);
    if (!anySelected) {
      alert("Silakan pilih minimal 1 kolom untuk diubah dengan mencentang kotak di kiri kolom.");
      return;
    }

    if (onUpdateSantri) {
      selectedSantriIds.forEach(id => {
        const existing = santriList.find(s => s.id === id);
        if (existing) {
          let updated = { ...existing };
          if (bulkSelectedFields.statusKeanggotaan) {
            updated.statusKeanggotaan = bulkForm.statusKeanggotaan;
            if (bulkForm.statusKeanggotaan === 'Aktif') {
              updated.tanggalKeluar = undefined;
              if (!updated.statusDomisili) updated.statusDomisili = 'Muqim';
            } else {
              updated.statusDomisili = undefined;
            }
          }
          if (bulkSelectedFields.statusDomisili && updated.statusKeanggotaan === 'Aktif') {
            updated.statusDomisili = bulkForm.statusDomisili;
          }
          if (bulkSelectedFields.statusEmis) {
            updated.statusEmis = bulkForm.statusEmis;
            if (bulkForm.statusEmis === 'Belum') {
              const demoted = demoteSantriToCalonPesertaDidik(updated, lembagasList, kelasList);
              updated.kelas = demoted.kelas;
              updated.pendidikanFormal = demoted.pendidikanFormal;
            }
          }
          if (bulkSelectedFields.tanggalMasuk) {
            updated.tanggalMasuk = bulkForm.tanggalMasuk;
          }
          if (bulkSelectedFields.tanggalKeluar && showTanggalKeluar) {
            updated.tanggalKeluar = bulkForm.tanggalKeluar;
          }
          if (bulkSelectedFields.catatan) {
            updated.catatan = bulkForm.catatan;
          }
          if (bulkSelectedFields.aktivitasAkademik) {
            const selectedInternalIds = bulkForm.pendidikanInternal
              ? bulkForm.pendidikanInternal.split(',').map(x => x.trim()).filter(Boolean)
              : [];
            updated = updateSantriAcademicActivity(
              updated,
              selectedInternalIds,
              lembagasList,
              kelasList
            );
          }
          onUpdateSantri(updated);
        }
      });
    }

    // Reset and Close
    setBulkSelectedFields({
      statusKeanggotaan: false,
      statusDomisili: false,
      statusEmis: false,
      tanggalMasuk: false,
      tanggalKeluar: false,
      catatan: false,
      aktivitasAkademik: false,
    });
    setBulkForm({
      statusKeanggotaan: 'Aktif',
      statusDomisili: 'Muqim',
      statusEmis: 'Terdaftar',
      tanggalMasuk: getTodayDateString(),
      tanggalKeluar: getTodayDateString(),
      catatan: '',
      pendidikanInternal: '',
    });
    setSelectedSantriIds([]);
    setIsSelectionMode(false);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs"
            onClick={handleClose}
          />
          {/* Modal Box */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Edit Masal ({selectedSantriIds.length} data terpilih)
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div ref={scrollContainerRef} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* Field: Aktivitas Akademik */}
                <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.aktivitasAkademik ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-aktivitasAkademik"
                      checked={bulkSelectedFields.aktivitasAkademik}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBulkSelectedFields({ ...bulkSelectedFields, aktivitasAkademik: checked });
                      }}
                      className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulk-check-aktivitasAkademik" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                        Aktivitas Akademik (Lembaga Pendidikan)
                      </label>
                      
                      <div className="mt-2">
                        {/* Pendidikan Internal Pondok */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Pendidikan Internal Pondok (Bisa Lebih Dari 1)
                          </label>
                          <div className={`space-y-2 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 ${!bulkSelectedFields.aktivitasAkademik ? 'bg-slate-100/70 text-slate-400' : 'bg-slate-50/50'}`}>
                            {lembagasList.filter(l => getLembagaJenis(l) === 'Internal').length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Belum ada lembaga internal terdaftar.</p>
                            ) : (
                              lembagasList
                                .filter(l => getLembagaJenis(l) === 'Internal')
                                .map(l => {
                                  const selectedIds = bulkForm.pendidikanInternal 
                                    ? bulkForm.pendidikanInternal.split(',').map(x => x.trim()).filter(Boolean) 
                                    : [];
                                  const isChecked = selectedIds.includes(l.id);
                                  return (
                                    <label key={l.id} className={`flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none ${!bulkSelectedFields.aktivitasAkademik ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                      <input
                                        type="checkbox"
                                        disabled={!bulkSelectedFields.aktivitasAkademik}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let nextIds = [...selectedIds];
                                          if (e.target.checked) {
                                            if (!nextIds.includes(l.id)) nextIds.push(l.id);
                                          } else {
                                            nextIds = nextIds.filter(id => id !== l.id);
                                          }
                                          setBulkForm(prev => ({ ...prev, pendidikanInternal: nextIds.join(',') }));
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span>{l.nama}</span>
                                    </label>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Memindahkan/mendaftarkan santri terpilih ke lembaga internal secara serentak. Jika santri sudah terdaftar di lembaga tersebut, kelasnya tetap dipertahankan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Field 1: Status Keanggotaan */}
                <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.statusKeanggotaan ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-statusKeanggotaan"
                      checked={bulkSelectedFields.statusKeanggotaan}
                      onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, statusKeanggotaan: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulk-check-statusKeanggotaan" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                        Status Keanggotaan
                      </label>
                      <select
                        disabled={!bulkSelectedFields.statusKeanggotaan}
                        value={bulkForm.statusKeanggotaan}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setBulkForm(prev => ({
                            ...prev,
                            statusKeanggotaan: val,
                            tanggalKeluar: (val === 'Alumni' || val === 'Meninggal') && !prev.tanggalKeluar ? getTodayDateString() : prev.tanggalKeluar
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Alumni">Alumni</option>
                        <option value="Meninggal">Meninggal</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Field 2: Status Domisili */}
                {bulkForm.statusKeanggotaan === 'Aktif' && (
                  <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.statusDomisili ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="bulk-check-statusDomisili"
                        checked={bulkSelectedFields.statusDomisili}
                        onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, statusDomisili: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="bulk-check-statusDomisili" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                          Status Domisili
                        </label>
                        <select
                          disabled={!bulkSelectedFields.statusDomisili}
                          value={bulkForm.statusDomisili}
                          onChange={(e) => setBulkForm({ ...bulkForm, statusDomisili: e.target.value as any })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60"
                        >
                          <option value="Muqim">Muqim (Asrama)</option>
                          <option value="Kampung">Kampung (Non-Asrama)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Field 3: Status EMIS */}
                <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.statusEmis ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-statusEmis"
                      checked={bulkSelectedFields.statusEmis}
                      onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, statusEmis: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulk-check-statusEmis" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                        Status EMIS
                      </label>
                      <select
                        disabled={!bulkSelectedFields.statusEmis}
                        value={bulkForm.statusEmis}
                        onChange={(e) => setBulkForm({ ...bulkForm, statusEmis: e.target.value as any })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60 cursor-pointer"
                      >
                        <option value="Terdaftar">Terdaftar</option>
                        <option value="Belum">Belum Terdaftar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Field 4: Tanggal Masuk */}
                <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.tanggalMasuk ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-tanggalMasuk"
                      checked={bulkSelectedFields.tanggalMasuk}
                      onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, tanggalMasuk: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulk-check-tanggalMasuk" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                        Tanggal Masuk
                      </label>
                      <input
                        type="date"
                        disabled={!bulkSelectedFields.tanggalMasuk}
                        value={bulkForm.tanggalMasuk}
                        onChange={(e) => setBulkForm({ ...bulkForm, tanggalMasuk: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Field 4: Tanggal Keluar */}
                {showTanggalKeluar && (
                  <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.tanggalKeluar ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="bulk-check-tanggalKeluar"
                        checked={bulkSelectedFields.tanggalKeluar}
                        onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, tanggalKeluar: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="bulk-check-tanggalKeluar" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                          Tanggal Keluar <span className="text-[10px] text-slate-400 font-normal lowercase">(Khusus Alumni)</span>
                        </label>
                        <input
                          type="date"
                          disabled={!bulkSelectedFields.tanggalKeluar}
                          value={bulkForm.tanggalKeluar}
                          onChange={(e) => setBulkForm({ ...bulkForm, tanggalKeluar: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Field 5: Catatan Tambahan */}
                <div className={`p-3.5 rounded-xl border transition-all ${bulkSelectedFields.catatan ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bulk-check-catatan"
                      checked={bulkSelectedFields.catatan}
                      onChange={(e) => setBulkSelectedFields({ ...bulkSelectedFields, catatan: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulk-check-catatan" className="block text-xs font-bold text-slate-700 uppercase cursor-pointer select-none mb-1.5">
                        Catatan Tambahan
                      </label>
                      <textarea
                        rows={2}
                        disabled={!bulkSelectedFields.catatan}
                        value={bulkForm.catatan}
                        onChange={(e) => setBulkForm({ ...bulkForm, catatan: e.target.value })}
                        placeholder="Masukkan keterangan dsb..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200/60"
                      />
                      
                      {/* Suggestions */}
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "kurang kk",
                            "kurang ktp",
                            "kurang ijazah",
                            "kurang akta",
                            "kurang pas foto",
                            "belum dapat majmu'ah",
                            "belum dapat tas"
                          ].map((sug) => (
                            <button
                              type="button"
                              key={sug}
                              onClick={() => {
                                // Enable the checkbox automatically when clicked
                                setBulkSelectedFields(prev => ({ ...prev, catatan: true }));
                                
                                const current = bulkForm.catatan.trim();
                                if (!current) {
                                  setBulkForm(prev => ({ ...prev, catatan: sug }));
                                } else {
                                  const parts = current.split(',').map(p => p.trim()).filter(Boolean);
                                  if (!parts.includes(sug)) {
                                    setBulkForm(prev => ({ ...prev, catatan: [...parts, sug].join(', ') }));
                                  }
                                }
                              }}
                              className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-full px-2 py-0.5 transition-all active:scale-95 border border-slate-200 cursor-pointer"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
