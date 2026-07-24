import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subTab: 'santri' | 'surat';
  onExportExcel: () => void;
  onPrintPDF: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  subTab,
  onExportExcel,
  onPrintPDF
}: ExportModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <div id="export-modal-dialog-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            id="export-modal-backdrop"
            className="fixed inset-0 bg-slate-900/30 z-40" 
            onClick={onClose}
          />
          
          {/* Modal Dialog */}
          <motion.div
            id="export-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.05, ease: 'linear' }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50 text-slate-700 font-sans relative"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 id="export-modal-title" className="font-display text-lg font-bold text-slate-950">
                Ekspor Data ({subTab === 'santri' ? 'Santri' : 'Surat'})
              </h3>
              <button 
                id="export-modal-close-btn"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Pilih format dokumen yang Anda butuhkan untuk mengunduh atau mencetak data {subTab === 'santri' ? 'santri aktif' : 'arsip surat'} saat ini.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Pilihan 1: Excel */}
              <button
                id="export-excel-btn"
                onClick={() => {
                  onExportExcel();
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-150 hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all duration-250 cursor-pointer animate-none bg-transparent text-left outline-none"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-center">Ekspor Excel</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 text-center">Format .XLS (Rapi)</p>
                </div>
              </button>

              {/* Pilihan 2: PDF / Print */}
              <button
                id="export-pdf-btn"
                onClick={() => {
                  onPrintPDF();
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-150 hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all duration-250 cursor-pointer animate-none bg-transparent text-left outline-none"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 group-hover:scale-110 transition-transform">
                  <Printer className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-rose-800 transition-colors text-center">Cetak PDF</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 text-center">Format PDF / Cetak</p>
                </div>
              </button>
            </div>

            <div className="mt-5 text-[11px] text-slate-400 text-center border-t border-slate-50 pt-3">
              * Data yang diekspor disesuaikan dengan hasil pencarian & filter aktif saat ini.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;
}
