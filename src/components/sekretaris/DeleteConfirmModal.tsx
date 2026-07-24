import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'single' | 'bulk';
  name: string;
  id?: string;
  ids?: string[];
  onDeleteSantri?: (id: string) => void;
  setSelectedSantriIds?: (ids: string[]) => void;
  setIsSelectionMode?: (val: boolean) => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  type,
  name,
  id,
  ids,
  onDeleteSantri,
  setSelectedSantriIds,
  setIsSelectionMode,
}: DeleteConfirmModalProps) {
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

  const handleConfirmDelete = () => {
    if (type === 'single') {
      if (id && onDeleteSantri) {
        onDeleteSantri(id);
      }
    } else {
      if (ids && onDeleteSantri) {
        ids.forEach(idToDelete => onDeleteSantri(idToDelete));
      }
      if (setSelectedSantriIds) {
        setSelectedSantriIds([]);
      }
      if (setIsSelectionMode) {
        setIsSelectionMode(false);
      }
    }
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity" 
            onClick={onClose}
          />
          {/* Modal Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl z-50 text-slate-700 font-sans"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-slate-950 leading-snug">
                    {type === 'bulk' ? 'Konfirmasi Hapus Masal' : 'Konfirmasi Hapus Data'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {type === 'bulk' ? (
                      <>
                        Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">{name}</span> secara permanen? Tindakan ini tidak dapat dibatalkan.
                      </>
                    ) : (
                      <>
                        Apakah Anda yakin ingin menghapus data santri <span className="font-bold text-slate-950">"{name}"</span>? Semua riwayat dan dokumen pendukung yang terkait akan dihapus secara permanen.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Hapus Permanen
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
