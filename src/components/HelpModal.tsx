import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, MessageCircle, Instagram, Mail, Send, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [pesantrenPhone, setPesantrenPhone] = useState('083835106287');
  const [pesantrenEmail, setPesantrenEmail] = useState('aniq.munawar@gmail.com');
  const [pesantrenIg, setPesantrenIg] = useState('aniq_mhmmd');

  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('smartsantri_pesantren_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.telepon) setPesantrenPhone(parsed.telepon);
        if (parsed.email) setPesantrenEmail(parsed.email);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  const getFormattedWaLink = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    return `https://wa.me/${clean}`;
  };

  const getFormattedIgLink = (ig: string) => {
    if (ig.startsWith('http://') || ig.startsWith('https://')) {
      return ig;
    }
    return `https://instagram.com/${ig.replace('@', '')}`;
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSending(true);
    const activeUser = localStorage.getItem('smartsantri_active_username') || 'Tamu';
    const activeRoleState = localStorage.getItem('smartsantri_active_role') || 'guest';
    const newFeedback = {
      sender_username: activeUser.split('@')[0],
      sender_email: activeUser.includes('@') ? activeUser : `${activeUser}@attaroqqy.com`,
      sender_role: activeRoleState,
      message: feedbackText.trim(),
      is_starred: false,
      created_at: new Date().toISOString()
    };

    try {
      await fetch('/api/db/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeedback)
      });

      const localFeedback = localStorage.getItem('smartsantri_local_feedback');
      const list = localFeedback ? JSON.parse(localFeedback) : [];
      list.unshift({ id: Math.random().toString(), ...newFeedback });
      localStorage.setItem('smartsantri_local_feedback', JSON.stringify(list));

      setFeedbackText('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (e) {
      console.error("Gagal mengirim masukan ke server:", e);
      const localFeedback = localStorage.getItem('smartsantri_local_feedback');
      const list = localFeedback ? JSON.parse(localFeedback) : [];
      list.unshift({ id: Math.random().toString(), ...newFeedback });
      localStorage.setItem('smartsantri_local_feedback', JSON.stringify(list));

      setFeedbackText('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 text-center cursor-default relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button X at top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 border border-slate-200">
            <HelpCircle className="h-6 w-6 text-slate-700" />
          </div>
          
          <div className="space-y-1.5 pt-1">
            <h3 className="font-sans text-lg font-bold text-slate-900 tracking-tight">
              Pusat Bantuan AttarOkey
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Pilih salah satu saluran layanan di bawah ini untuk terhubung langsung dengan admin kami.
            </p>
          </div>

          {/* ACTION ICONS ROW (Icons Only) */}
          <div className="flex items-center justify-center gap-4 my-2">
            {/* WhatsApp Icon Button */}
            <a
              href={getFormattedWaLink('083835106287')}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp: 083835106287"
              className="flex h-11 w-11 items-center justify-center bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-100 text-emerald-600 rounded-full transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
            </a>

            {/* Instagram Icon Button */}
            <a
              href={getFormattedIgLink(pesantrenIg)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Instagram: @${pesantrenIg}`}
              className="flex h-11 w-11 items-center justify-center bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 text-rose-600 rounded-full transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-rose-500/20 active:scale-95 cursor-pointer"
            >
              <Instagram className="h-5 w-5" />
            </a>

            {/* Email Icon Button */}
            <a
              href="mailto:aniq.munawar@gmail.com"
              title="Email: aniq.munawar@gmail.com"
              className="flex h-11 w-11 items-center justify-center bg-blue-50 hover:bg-blue-500 hover:text-white border border-blue-100 text-blue-600 rounded-full transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* DIRECT FEEDBACK MESSAGE BOX */}
          <div className="border-t border-slate-100 pt-3.5 text-left">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Kirim Pesan Langsung ke Superadmin
            </label>
            <div className="relative">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isSending || sendSuccess}
                rows={3}
                placeholder="Tulis masukan, laporan kendala teknis, atau pesan khusus di sini..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-60 transition-all font-sans leading-relaxed resize-none"
              />
              {sendSuccess && (
                <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center text-center p-2 animate-fade-in">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-800">Pesan Terkirim ke Superadmin</p>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || isSending || sendSuccess}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {isSending ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isSending ? 'Mengirim...' : 'Kirim Sekarang'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
