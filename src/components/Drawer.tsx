import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Home, 
  FileText, 
  Wallet, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight, 
  BookOpenCheck,
  Settings, 
  LogOut,
  ChevronLeft,
  Shield,
  Building,
  Globe,
  Database,
  User,
  HelpCircle,
  Instagram,
  Mail,
  MessageCircle,
  Send,
  Check
} from 'lucide-react';
import { DEFAULT_ROLES } from '../lib/permissions';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  activeSubTab?: string;
  onChangeModule: (mod: string, subTab?: string) => void;
  isSelectionMode?: boolean;
  onLogout?: () => void;
  onOpenHelp?: () => void;
}

export interface MenuItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverBg: string;
  activeColor: string;
  submenus: { id: string; label: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    desc: 'Ringkasan & Informasi Umum', 
    icon: Home, 
    color: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50/70',
    activeColor: 'bg-blue-50/80 text-blue-700 border-blue-200',
    submenus: [
      { id: 'dashboard', label: 'Dashboard Utama' }
    ] 
  },
  { 
    id: 'sekretaris', 
    label: 'Sekretaris', 
    desc: 'Direktori & Data Santri', 
    icon: FileText, 
    color: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/70',
    activeColor: 'bg-emerald-50/80 text-emerald-700 border-emerald-200',
    submenus: [
      { id: 'santri', label: 'Data Induk Santri' }
    ] 
  },
  { 
    id: 'bendahara', 
    label: 'Bendahara', 
    desc: 'Syahriah & Arus Kas', 
    icon: Wallet, 
    color: 'text-amber-600',
    hoverBg: 'hover:bg-amber-50/70',
    activeColor: 'bg-amber-50/80 text-amber-700 border-amber-200',
    submenus: [] 
  },
  { 
    id: 'pendidikan', 
    label: 'Pendidikan', 
    desc: 'Jadwal Kelas & Kurikulum', 
    icon: BookOpen, 
    color: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50/70',
    activeColor: 'bg-indigo-50/80 text-indigo-700 border-indigo-200',
    submenus: [
      { id: 'lembaga', label: 'Aktivitas Akademik' },
      { id: 'akademik', label: 'Data Akademik' }
    ] 
  },
  { 
    id: 'humasy', 
    label: 'Humasy', 
    desc: 'Kelola Kamar Santri', 
    icon: Users, 
    color: 'text-purple-600',
    hoverBg: 'hover:bg-purple-50/70',
    activeColor: 'bg-purple-50/80 text-purple-700 border-purple-200',
    submenus: [
      { id: 'kamar', label: 'Kamar' },
      { id: 'datakamar', label: 'Data Kamar Santri' }
    ] 
  },
  { 
    id: 'keamanan', 
    label: 'Keamanan', 
    desc: 'Disiplin & Ketertiban', 
    icon: ShieldAlert, 
    color: 'text-rose-600',
    hoverBg: 'hover:bg-rose-50/70',
    activeColor: 'bg-rose-50/80 text-rose-700 border-rose-200',
    submenus: [
      { id: 'overview', label: 'Overview' },
      { id: 'catatan', label: 'Data Pelanggaran' },
      { id: 'riwayat', label: 'Log Kasus' },
      { id: 'bukuinduk', label: 'Buku Induk Sanksi' },
      { id: 'perizinan', label: 'Perizinan' }
    ] 
  },
];

const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: 'keamanan',
    label: 'Profil dan Akun',
    desc: 'Atur foto profil, nama pengguna & sandi',
    icon: User,
    color: 'text-rose-600',
    hoverBg: 'hover:bg-rose-50/70',
    activeColor: 'bg-rose-50/80 text-rose-700 border-rose-200',
    submenus: []
  },
  {
    id: 'profil',
    label: 'Profil Pesantren',
    desc: 'Informasi identitas pesantren',
    icon: Building,
    color: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50/70',
    activeColor: 'bg-blue-50/80 text-blue-700 border-blue-200',
    submenus: []
  },
  {
    id: 'akses',
    label: 'Panel Akses & Otoritas',
    desc: 'Pengaturan hak akses peran',
    icon: Shield,
    color: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/70',
    activeColor: 'bg-emerald-50/80 text-emerald-700 border-emerald-200',
    submenus: []
  },
  {
    id: 'kelola_akun',
    label: 'Kelola Akun Pengguna',
    desc: 'Persetujuan pendaftaran akun pengurus',
    icon: Users,
    color: 'text-rose-600',
    hoverBg: 'hover:bg-rose-50/70',
    activeColor: 'bg-rose-50/80 text-rose-700 border-rose-200',
    submenus: []
  },
  {
    id: 'database',
    label: 'Database & Backup',
    desc: 'Cadangan dan pengelolaan data',
    icon: Database,
    color: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50/70',
    activeColor: 'bg-indigo-50/80 text-indigo-700 border-indigo-200',
    submenus: []
  }
];

export default function Drawer({ 
  isOpen, 
  onClose, 
  activeModule, 
  activeSubTab, 
  onChangeModule, 
  isSelectionMode = false,
  onLogout,
  onOpenHelp
}: DrawerProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(activeModule);
  const isPengaturanMode = activeModule === 'pengaturan';
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('smartsantri_active_display_name') || 'Admin Utama');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('smartsantri_profile_avatar') || '');
  const [currentUsername, setCurrentUsername] = useState(() => localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com');

  useEffect(() => {
    const handleUpdate = () => {
      setDisplayName(localStorage.getItem('smartsantri_active_display_name') || 'Admin Utama');
      setAvatar(localStorage.getItem('smartsantri_profile_avatar') || '');
      setCurrentUsername(localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com');
    };
    window.addEventListener('smartsantri_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smartsantri_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
  const rolesPermissionsStr = localStorage.getItem('smartsantri_roles_permissions');

  const permissions = (() => {
    if (activeRole === 'superadmin') return null;
    let currentRoleObj;
    if (rolesPermissionsStr) {
      try {
        const rolesList = JSON.parse(rolesPermissionsStr);
        if (Array.isArray(rolesList)) {
          currentRoleObj = rolesList.find((r: any) => r.id === activeRole);
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback to DEFAULT_ROLES if not found in custom role permissions list
    if (!currentRoleObj) {
      currentRoleObj = DEFAULT_ROLES.find((r: any) => r.id === activeRole);
    }
    return currentRoleObj ? currentRoleObj.permissions || {} : {};
  })();

  const getFilteredMenuItems = () => {
    if (activeRole === 'superadmin') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => {
      if (item.id === 'home') return true;
      if (!permissions) return false;

      if (item.id === 'sekretaris') {
        return !!permissions['sekretaris_putra.view'] || 
               !!permissions['sekretaris_putra.write'] || 
               !!permissions['sekretaris_putri.view'] || 
               !!permissions['sekretaris_putri.write'];
      }
      if (item.id === 'bendahara') {
        return !!permissions['bendahara_putra.view'] || 
               !!permissions['bendahara_putra.write'] || 
               !!permissions['bendahara_putri.view'] || 
               !!permissions['bendahara_putri.write'];
      }
      if (item.id === 'pendidikan') {
        return !!permissions['pendidikan_putra.view'] || 
               !!permissions['pendidikan_putra.write'] || 
               !!permissions['pendidikan_putri.view'] || 
               !!permissions['pendidikan_putri.write'];
      }
      if (item.id === 'humasy') {
        return !!permissions['humasy_putra.view'] || 
               !!permissions['humasy_putra.write'] || 
               !!permissions['humasy_putri.view'] || 
               !!permissions['humasy_putri.write'];
      }
      if (item.id === 'keamanan') {
        return !!permissions['keamanan_putra.view'] || 
               !!permissions['keamanan_putra.write'] || 
               !!permissions['keamanan_putri.view'] || 
               !!permissions['keamanan_putri.write'];
      }
      return false;
    });
  };
  const footerRef = useRef<HTMLDivElement>(null);

  // Sync active accordion when activeModule changes externally
  useEffect(() => {
    if (activeModule) {
      setOpenAccordion(activeModule);
    }
  }, [activeModule]);

  // Lock body scroll when mobile fullscreen sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside to close profile popup on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setIsProfilePopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuId: string, defaultSub?: string) => {
    if (isSelectionMode) return;
    if (openAccordion === menuId) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(menuId);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            id="mobile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Sliding Sidebar Drawer from Left */}
          <motion.aside
            id="mobile-sliding-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 bottom-0 left-0 z-50 flex h-full w-[70%] max-w-[320px] flex-col bg-white overflow-hidden shadow-2xl rounded-r-2xl border-r border-slate-100"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 shrink-0">
              {isPengaturanMode ? (
                <button
                  onClick={() => {
                    onChangeModule('home');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Kembali ke Beranda"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Pengaturan</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <BookOpenCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span>AttarOkey 4.0</span>
                </div>
              )}

              {/* Close full screen menu */}
              <button
                id="btn-close-drawer"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 active:scale-95 cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              <nav className="space-y-1">
                {(isPengaturanMode 
                  ? (activeRole === 'superadmin' 
                      ? SETTINGS_MENU_ITEMS 
                      : SETTINGS_MENU_ITEMS.filter(item => item.id === 'keamanan' || item.id === 'database'))
                  : getFilteredMenuItems()
                ).map((item) => {
                  const IconComponent = item.icon;
                  const isModuleActive = isPengaturanMode ? (activeSubTab === item.id) : (activeModule === item.id);
                  const isAccordionOpen = openAccordion === item.id;

                  return (
                    <div key={item.id} className="relative">
                      {/* Main Menu Button */}
                      <button
                        type="button"
                        disabled={isSelectionMode && !isModuleActive}
                        onClick={() => {
                          if (isPengaturanMode) {
                            onChangeModule('pengaturan', item.id);
                            onClose();
                          } else if (item.submenus.length === 0) {
                            onChangeModule(item.id, undefined);
                            onClose();
                          } else {
                            handleMenuClick(item.id, item.submenus[0]?.id);
                          }
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 outline-none border ${
                          isSelectionMode
                            ? isModuleActive 
                              ? `${item.activeColor} font-bold shadow-xs cursor-default` 
                              : 'opacity-40 cursor-not-allowed border-transparent'
                            : isModuleActive 
                              ? `${item.activeColor} font-bold shadow-xs cursor-pointer` 
                              : `text-slate-600 ${item.hoverBg} hover:text-slate-900 border-transparent cursor-pointer`
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isModuleActive 
                            ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-xs' 
                            : `${item.color} bg-slate-50/80`
                        }`}>
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>

                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <span className="font-display text-xs font-bold text-slate-800 tracking-tight leading-normal">
                              {item.label}
                            </span>
                          </div>
                          
                          {item.submenus.length > 0 && (
                            <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-250 ${
                              isAccordionOpen ? 'rotate-180 text-slate-600' : ''
                            }`} />
                          )}
                        </div>
                      </button>

                      {/* Submenu Accordion */}
                      <AnimatePresence initial={false}>
                        {isAccordionOpen && item.submenus.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pl-5 pr-2 py-1.5 space-y-1.5 border-l-2 border-slate-100 ml-7 my-1.5">
                              {item.submenus.map((sub) => {
                                const isSubActive = isModuleActive && activeSubTab === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    disabled={isSelectionMode && !isSubActive}
                                    onClick={() => {
                                      if (isSelectionMode && !isSubActive) return;
                                      onChangeModule(item.id, sub.id);
                                      onClose(); // Close full screen drawer on select
                                    }}
                                    className={`flex items-center justify-between w-full text-left py-2 px-4 rounded-xl font-display text-xs font-bold tracking-tight transition-all duration-150 border ${
                                      isSelectionMode
                                        ? isSubActive
                                          ? 'bg-emerald-50 border-emerald-100 text-emerald-850 cursor-default'
                                          : 'text-slate-300 border-transparent cursor-not-allowed'
                                        : isSubActive
                                          ? 'bg-emerald-50 border-emerald-100 text-emerald-850 cursor-pointer shadow-xs'
                                          : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800 cursor-pointer'
                                    }`}
                                  >
                                    <span>{sub.label}</span>
                                    <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${
                                      isSubActive ? 'text-emerald-700 translate-x-0.5' : 'text-slate-300'
                                    }`} />
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Profile Footer (Premium styled adaptive view) */}
            <div 
              className="border-t border-slate-100 p-4 shrink-0 relative bg-slate-50/50" 
              ref={footerRef}
            >
              <AnimatePresence>
                {isProfilePopupOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-4 right-4 mb-3 bg-white rounded-2xl shadow-xl z-50 p-3 font-sans border-0 outline-none ring-0"
                  >
                    <div className="px-3 py-2 border-b border-slate-50 mb-2 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-inner">
                        {avatar ? (
                          <img src={avatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          displayName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-extrabold text-slate-800 truncate">{displayName}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{currentUsername}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfilePopupOpen(false);
                          onClose();
                          onChangeModule('pengaturan', 'keamanan');
                        }}
                        className="flex w-full items-center gap-2.5 py-2 px-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors font-display text-xs font-bold outline-none focus:outline-none"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Pengaturan</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProfilePopupOpen(false);
                          onClose();
                          if (onOpenHelp) onOpenHelp();
                        }}
                        className="flex w-full items-center gap-2.5 py-2 px-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors font-display text-xs font-bold outline-none focus:outline-none"
                      >
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        <span>Pusat Bantuan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfilePopupOpen(false);
                          onClose();
                          localStorage.removeItem('smartsantri_is_logged_in');
                          localStorage.removeItem('smartsantri_active_role');
                          localStorage.removeItem('smartsantri_active_username');
                          localStorage.removeItem('smartsantri_active_display_name');
                          localStorage.removeItem('smartsantri_profile_avatar');
                          if (onLogout) {
                            onLogout();
                          } else {
                            window.location.reload();
                          }
                        }}
                        className="flex w-full items-center gap-2.5 py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-colors font-display text-xs font-extrabold outline-none focus:outline-none"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
 
              {/* Mobile Profile Trigger (Matches sidebar style - no outline/border) */}
              <div 
                onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-100/60 transition-all cursor-pointer select-none outline-none focus:outline-none active:outline-none focus:ring-0 active:ring-0"
              >
                <div className="flex items-center gap-3 min-w-0 outline-none focus:outline-none active:outline-none">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 font-display text-xs font-bold text-white shadow-sm overflow-hidden outline-none focus:outline-none active:outline-none">
                    {avatar ? (
                      <img src={avatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      displayName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{currentUsername}</p>
                  </div>
                </div>

                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                  isProfilePopupOpen ? 'rotate-180 text-slate-600' : ''
                }`} />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
