import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, LogIn, Flag, Shield, Info, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { fetchTableData, insertTableRow, updateTableRow } from '../lib/api';
import { fetchAndSyncPermissionsFromSupabase } from '../lib/permissions';
import { AppCredentials } from '../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'sekretaris_putra', label: 'Sekretaris Putra' },
  { value: 'sekretaris_putri', label: 'Sekretaris Putri' },
  { value: 'bendahara_putra', label: 'Bendahara Putra' },
  { value: 'bendahara_putri', label: 'Bendahara Putri' },
  { value: 'pendidikan_putra', label: 'Pendidikan Putra' },
  { value: 'pendidikan_putri', label: 'Pendidikan Putri' },
  { value: 'humas_putra', label: 'Humas Putra' },
  { value: 'humas_putri', label: 'Humas Putri' },
  { value: 'keamanan_putra', label: 'Keamanan Putra' },
  { value: 'keamanan_putri', label: 'Keamanan Putri' }
];

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('sekretaris_putra');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Forgot Password States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

  // Cancel Reset States
  const [showCancelResetModal, setShowCancelResetModal] = useState(false);
  const [pendingLoginUser, setPendingLoginUser] = useState<any>(null);

  // Default credentials
  const defaultUser = 'superadmin@attaroqqy.com';
  const defaultPass = '1234';

  const [dbCredentials, setDbCredentials] = useState<{ username: string; password: string }>({
    username: defaultUser,
    password: defaultPass,
  });

  const [allCredentials, setAllCredentials] = useState<any[]>([]);

  // Pre-fill fields if remember me was activated previously
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('smartsantri_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Load all credentials from Supabase (including registered users)
    const loadCredentials = async () => {
      try {
        const data = await fetchTableData<any>(
          'app_credentials',
          'smartsantri_app_credentials',
          [{ id: 'superadmin', username: defaultUser, role: 'superadmin', status: 'approved' }]
        );
        if (data && data.length > 0) {
          setAllCredentials(data);
          const superadminCreds = data.find(c => c.id === 'superadmin') || data[0];
          setDbCredentials({
            username: superadminCreds.username,
            password: ''
          });
        }
      } catch (err) {
        console.error("Gagal sinkronisasi kredensial superadmin dari database:", err);
      }
    };

    loadCredentials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    // Simulate small latency for premium feels
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedEmail, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMsg(result.error || 'Email atau Kata Sandi salah atau akun Anda tidak terdaftar.');
        setLoading(false);
        return;
      }

      const { user } = result;

      if (result.needsCancelReset) {
        setPendingLoginUser(user);
        setShowCancelResetModal(true);
        setLoading(false);
        return;
      }

      // Remember me logic
      if (rememberMe) {
        localStorage.setItem('smartsantri_remembered_email', email.trim());
      } else {
        localStorage.removeItem('smartsantri_remembered_email');
      }

      // Successful login state
      localStorage.setItem('smartsantri_is_logged_in', 'true');
      localStorage.setItem('smartsantri_active_role', user.role || 'superadmin');
      localStorage.setItem('smartsantri_active_username', user.username || '');
      
      localStorage.setItem('smartsantri_active_display_name', user.displayName || user.username || '');
      if (user.avatarUrl) {
        localStorage.setItem('smartsantri_profile_avatar', user.avatarUrl);
      } else {
        localStorage.removeItem('smartsantri_profile_avatar');
      }
      
      // Real-time synchronization of permissions directly from Supabase
      try {
        await fetchAndSyncPermissionsFromSupabase();
      } catch (e) {
        console.warn("Gagal mengambil hak akses dari Supabase saat login:", e);
      }
      
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung ke server autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelReset = async () => {
    if (!pendingLoginUser) return;
    setLoading(true);
    try {
      // 1. Update user status in Supabase back to 'approved'
      await updateTableRow<AppCredentials>(
        'app_credentials',
        'smartsantri_app_credentials',
        pendingLoginUser.id,
        { status: 'approved' }
      );

      // 2. Clear states and proceed with login
      setShowCancelResetModal(false);

      if (rememberMe) {
        localStorage.setItem('smartsantri_remembered_email', email.trim());
      } else {
        localStorage.removeItem('smartsantri_remembered_email');
      }

      localStorage.setItem('smartsantri_is_logged_in', 'true');
      localStorage.setItem('smartsantri_active_role', pendingLoginUser.role || 'superadmin');
      localStorage.setItem('smartsantri_active_username', pendingLoginUser.username || '');
      
      localStorage.setItem('smartsantri_active_display_name', pendingLoginUser.displayName || pendingLoginUser.username || '');
      if (pendingLoginUser.avatarUrl) {
        localStorage.setItem('smartsantri_profile_avatar', pendingLoginUser.avatarUrl);
      } else {
        localStorage.removeItem('smartsantri_profile_avatar');
      }
      
      try {
        await fetchAndSyncPermissionsFromSupabase();
      } catch (e) {
        console.warn("Gagal mengambil hak akses dari Supabase saat login:", e);
      }
      
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membatalkan permintaan reset dan masuk.');
      setShowCancelResetModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessMsg(null);
    setLoading(true);

    const emailLower = regEmail.trim().toLowerCase();

    // Check validation for @attaroqqy or @attaroqqy.com domain
    if (!emailLower.endsWith('@attaroqqy.com') && !emailLower.endsWith('@attaroqqy')) {
      setErrorMsg('Pendaftaran Gagal: Email harus menggunakan domain @attaroqqy atau @attaroqqy.com.');
      setLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Pendaftaran Gagal: Kata Sandi minimal harus terdiri dari 4 karakter.');
      setLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Pendaftaran Gagal: Konfirmasi Kata Sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      // Check duplicate
      const duplicate = allCredentials.some(c => c.username && c.username.toLowerCase() === emailLower);
      if (duplicate) {
        setErrorMsg('Pendaftaran Gagal: Email ini sudah pernah didaftarkan. Silakan hubungi Administrator.');
        setLoading(false);
        return;
      }

      const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const payload = {
        id: newId,
        username: emailLower,
        password: regPassword,
        role: regRole as any,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      await insertTableRow('app_credentials', 'smartsantri_app_credentials', payload);

      // Add to our list so they immediately can't register again and we have local list
      setAllCredentials(prev => [...prev, payload]);
      setRegSuccessMsg('Pendaftaran Berhasil! Akun Anda telah dicatat dan dalam status Menunggu Persetujuan (Pending) dari Superadmin. Silakan hubungi Superadmin untuk mengaktifkan akun Anda.');
      
      // Clear registration form
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegRole('sekretaris_putra');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSuccessMsg(null);
    setLoading(true);

    const emailLower = forgotEmail.trim().toLowerCase();

    if (!emailLower.endsWith('@attaroqqy.com') && !emailLower.endsWith('@attaroqqy')) {
      setErrorMsg('Permintaan Gagal: Email harus menggunakan domain @attaroqqy atau @attaroqqy.com.');
      setLoading(false);
      return;
    }

    try {
      const data = await fetchTableData<any>(
        'app_credentials',
        'smartsantri_app_credentials',
        [{ id: 'superadmin', username: defaultUser, password: defaultPass, role: 'superadmin', status: 'approved' }]
      );
      
      const matchedUser = data.find(c => c.username && c.username.toLowerCase() === emailLower);
      if (!matchedUser) {
        setErrorMsg('Permintaan Gagal: Akun dengan email tersebut tidak ditemukan.');
        setLoading(false);
        return;
      }

      if (matchedUser.role === 'superadmin') {
        setErrorMsg('Permintaan Gagal: Akun Superadmin tidak dapat direset menggunakan fitur ini.');
        setLoading(false);
        return;
      }

      await updateTableRow<AppCredentials>(
        'app_credentials',
        'smartsantri_app_credentials',
        matchedUser.id,
        { status: 'minta_reset' }
      );

      setAllCredentials(prev => prev.map(c => c.id === matchedUser.id ? { ...c, status: 'minta_reset' } : c));
      setForgotSuccessMsg('Permintaan Berhasil! Status akun Anda kini diubah menjadi "Minta Reset Sandi". Silakan hubungi Superadmin Anda untuk menyetel ulang kata sandi.');
      setForgotEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim permintaan reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans antialiased selection:bg-rose-100 selection:text-rose-950">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 grid grid-cols-1 md:grid-cols-2 min-h-[620px]">
        
        {/* Left Side: Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            {/* Branding Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Flag className="h-4.5 w-4.5 fill-white" />
              </div>
              <span className="font-display font-black text-rose-600 text-lg tracking-tight">
                AttarOkey <span className="text-slate-900">4.0</span>
              </span>
            </div>

            {isForgotPasswordMode ? (
              /* ================= FORGOT PASSWORD VIEW ================= */
              <div>
                <div className="space-y-2 mb-6">
                  <h1 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Lupa <span className="text-rose-600">Kata Sandi</span>
                  </h1>
                  <p className="text-sm font-semibold text-slate-400">
                    Masukkan email pengurus Anda untuk meminta pengaturan ulang kata sandi
                  </p>
                </div>

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2"
                  >
                    <Info className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {forgotSuccessMsg ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span>{forgotSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setForgotSuccessMsg(null);
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#A30022] hover:bg-[#85001B] text-white font-bold text-xs shadow transition-colors cursor-pointer w-fit self-end"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Kembali ke Login</span>
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Email Pengurus
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@attaroqqy.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-display text-sm font-extrabold shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <span>Minta Reset Sandi</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="mt-5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(false);
                          setErrorMsg(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Halaman Login</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : isRegisterMode ? (
              /* ================= REGISTER VIEW ================= */
              <div>
                {/* Title Headings */}
                <div className="space-y-2 mb-6">
                  <h1 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Daftar <span className="text-rose-600">Akun Pengurus</span>
                  </h1>
                  <p className="text-sm font-semibold text-slate-400">
                    Silakan lengkapi data pendaftaran Anda
                  </p>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2"
                  >
                    <Info className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Success Message */}
                {regSuccessMsg ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span>{regSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        setRegSuccessMsg(null);
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors cursor-pointer w-fit self-end"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Masuk Sekarang</span>
                    </button>
                  </motion.div>
                ) : (
                  /* Register Form */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Email field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Email Pendaftaran
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@attaroqqy.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-semibold"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        * Wajib menggunakan akhiran <code className="bg-slate-150 px-1 py-0.5 rounded text-rose-600 font-mono">@attaroqqy.com</code> atau <code className="bg-slate-150 px-1 py-0.5 rounded text-rose-600 font-mono">@attaroqqy</code>
                      </span>
                    </div>

                    {/* Account Type / Role Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Jenis Akun Pengurus
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-semibold text-slate-800"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Kata Sandi
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 4 karakter"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-bold tracking-widest"
                      />
                    </div>

                    {/* Confirm Password field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Konfirmasi Kata Sandi
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-bold tracking-widest"
                      />
                    </div>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display text-sm font-extrabold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Mendaftarkan...
                        </>
                      ) : (
                        <>
                          <span>Daftar Sekarang</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Back to Login Link */}
                {!regSuccessMsg && (
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Kembali ke Halaman Login</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ================= LOGIN VIEW ================= */
              <div>
                {/* Title Headings */}
                <div className="space-y-2 mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Selamat Datang di <span className="text-rose-600">AttarOkey 4.0</span>
                  </h1>
                  <p className="text-sm font-semibold text-slate-400">
                    Silakan masuk ke akun Anda
                  </p>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2"
                  >
                    <Info className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}



                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-semibold"
                    />
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 font-sans text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-300 font-bold tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/20 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        Ingat saya
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        setErrorMsg(null);
                        setForgotSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-display text-sm font-extrabold shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-4"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <span>Masuk</span>
                        <LogIn className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center text-xs font-semibold text-slate-500">
                    <span>Belum punya akun? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setErrorMsg(null);
                        setRegSuccessMsg(null);
                      }}
                      className="text-rose-600 font-extrabold hover:underline cursor-pointer transition-colors"
                    >
                      Daftar sekarang
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="pt-8 border-t border-slate-100 text-[10px] text-slate-400 font-semibold flex items-center justify-between mt-6">
            <span>© 2026 AttarOkey 4.0. Produk Indonesia Hebat.</span>
          </div>
        </div>

        {/* Right Side: Landscape Art Cover (Hidden on Mobile) */}
        <div className="hidden md:block relative bg-slate-900 overflow-hidden">
          {/* Overlay gradient to soften the contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent z-10" />
          <img
            src="/login_bg.jpeg"
            alt="Lansekap Pondok Pesantren"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover select-none scale-105 hover:scale-100 transition-transform duration-[4000ms]"
          />
          {/* Minimal Caption */}
          <div className="absolute bottom-6 right-6 left-6 text-right z-20 drop-shadow-md">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Sistem Manajemen Data Santri Terintegrasi
            </p>
            <p className="text-xs font-semibold text-white/95">
              Ponpes At-Taroqqy Sedan
            </p>
          </div>
        </div>

      </div>

      {showCancelResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col gap-4 text-center"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <Info className="h-7 w-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Batal Meminta Reset?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Akun Anda (<span className="text-slate-800 font-bold">{pendingLoginUser?.username}</span>) saat ini dalam status <span className="text-rose-600 font-extrabold">"Minta Reset Sandi"</span>. 
                Karena Anda sudah mengingat kata sandi lama dan berhasil login, apakah Anda ingin membatalkan permintaan reset tersebut dan masuk?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelResetModal(false);
                  setPendingLoginUser(null);
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelReset}
                className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-95"
              >
                Ya, Batalkan &amp; Masuk
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
