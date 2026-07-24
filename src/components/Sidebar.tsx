import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  Check,
  X
} from 'lucide-react';
import { DEFAULT_ROLES } from '../lib/permissions';

interface SidebarProps {
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
      { id: 'overview', label: 'Overview' },
      { id: 'santri', label: 'Data Induk Santri' },
      { id: 'monitoring', label: 'Monitoring' }
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
      { id: 'kamar', label: 'Kelola Kamar' },
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
    id: 'feedback',
    label: 'Feedback & Masukan',
    desc: 'Kotak masuk masukan dari pengurus',
    icon: MessageCircle,
    color: 'text-purple-600',
    hoverBg: 'hover:bg-purple-50/70',
    activeColor: 'bg-purple-50/80 text-purple-700 border-purple-200',
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

export default function Sidebar({ activeModule, activeSubTab, onChangeModule, isSelectionMode = false, onLogout, onOpenHelp }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isPengaturanMode = activeModule === 'pengaturan';
  const showExpanded = isPengaturanMode ? true : isExpanded;
  const [openAccordion, setOpenAccordion] = useState<string | null>(activeModule);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [activeDropdownModuleId, setActiveDropdownModuleId] = useState<string | null>(null);
  const [hoveredSubmenuId, setHoveredSubmenuId] = useState<string | null>(null);
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
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-open accordion when activeModule changes externally
  useEffect(() => {
    if (activeModule) {
      setOpenAccordion(activeModule);
    }
  }, [activeModule]);

  // Click handler for menu items
  const handleMenuClick = (menuId: string, defaultSub?: string) => {
    if (isSelectionMode) return;
    if (!isExpanded) {
      // If collapsed, clicking directly selects the module and default submenu
      onChangeModule(menuId, defaultSub);
      setActiveDropdownModuleId(null);
      return;
    }

    if (openAccordion === menuId) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(menuId);
    }
    onChangeModule(menuId, defaultSub);
  };

  // Close profile popup and narrow module dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setIsProfilePopupOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdownModuleId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.aside
      id="desktop-sidebar"
      initial={{ width: 256 }}
      animate={{ width: showExpanded ? 256 : 64 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      className={`hidden md:flex flex-col h-[calc(100vh-2rem)] ml-4 my-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-4 shrink-0 overflow-visible z-[45] font-sans select-none ${isPengaturanMode ? 'cursor-default' : 'cursor-ew-resize'}`}
      onClick={() => !isPengaturanMode && setIsExpanded(!isExpanded)}
    >
      {/* Header Logo */}
      <div 
        className="flex h-16 items-center px-4 border-b border-slate-100 shrink-0 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {isPengaturanMode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeModule('home');
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 hover:text-rose-600 transition-all cursor-pointer active:scale-95 group"
                title="Keluar dari Pengaturan (Kembali ke Beranda)"
              >
                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <AnimatePresence>
                {showExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col min-w-0"
                  >
                    <span className="font-display text-xs font-black tracking-tight text-slate-900 uppercase whitespace-nowrap">
                       Pengaturan
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] relative overflow-hidden group">
              <BookOpenCheck className="h-4.5 w-4.5 relative z-10" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            
            <AnimatePresence>
              {showExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="font-display text-sm font-extrabold tracking-tight text-emerald-950 truncate whitespace-nowrap">
                    AttarOkey 4.0
                  </span>
                  <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase truncate leading-none mt-0.5 whitespace-nowrap">
                    Pesantren Digital
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className={`flex-1 px-2 py-2 space-y-1 scrollbar-none relative ${showExpanded ? 'overflow-y-auto' : 'overflow-visible'}`} ref={navRef}>
        <nav className="space-y-0.5">
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
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => {
                  if (isSelectionMode) return;
                  if (!showExpanded) {
                    setHoveredMenuId(item.id);
                    setActiveDropdownModuleId(item.id);
                    if (item.submenus.length > 0) {
                      setHoveredSubmenuId(item.submenus[0].id);
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (!showExpanded) {
                    setHoveredMenuId(null);
                    setActiveDropdownModuleId(null);
                    setHoveredSubmenuId(null);
                  }
                }}
              >
                {/* Main Menu Button */}
                <button
                  type="button"
                  disabled={isSelectionMode}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelectionMode) return;
                    if (isPengaturanMode) {
                      onChangeModule('pengaturan', item.id);
                    } else {
                      handleMenuClick(item.id, item.submenus[0]?.id);
                    }
                  }}
                  className={`flex w-full items-center gap-3 pl-2 pr-2 py-2 rounded-xl text-left transition-colors duration-150 outline-none ${
                    isSelectionMode
                      ? isModuleActive 
                        ? `${item.activeColor} border font-bold shadow-xs cursor-default` 
                        : 'opacity-40 cursor-not-allowed border border-transparent'
                      : isModuleActive 
                        ? `${item.activeColor} border font-bold shadow-xs cursor-pointer` 
                        : `text-slate-600 ${item.hoverBg} hover:text-slate-900 border border-transparent cursor-pointer`
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isModuleActive 
                      ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-xs' 
                      : `${item.color} bg-slate-50/80`
                  }`}>
                    <IconComponent className="h-4.5 w-4.5" />
                  </div>

                  <AnimatePresence>
                    {showExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ 
                          opacity: { duration: 0.08 },
                          x: { duration: 0.12 }
                        }}
                        className="flex-1 min-w-0 flex items-center justify-between"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-display text-xs font-bold text-slate-800 tracking-tight leading-normal whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                        
                        {item.submenus.length > 0 && (
                          <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isAccordionOpen ? 'rotate-180 text-slate-600' : ''
                          }`} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Submenu Accordion (Expanded mode) */}
                {showExpanded && item.submenus.length > 0 && (
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out cursor-default"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      maxHeight: isAccordionOpen ? `${item.submenus.length * 36 + 8}px` : '0px',
                      opacity: isAccordionOpen ? 1 : 0
                    }}
                  >
                    <div className="pl-4 pr-2 py-1 space-y-1 border-l border-slate-100 ml-6 my-1">
                      {item.submenus.map((sub) => {
                        const isSubActive = isModuleActive && activeSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            disabled={isSelectionMode}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelectionMode) return;
                              onChangeModule(item.id, sub.id);
                            }}
                            className={`block w-full text-left py-1.5 px-3.5 rounded-lg font-display text-[11px] font-bold tracking-tight transition-all duration-150 truncate ${
                              isSelectionMode
                                ? isSubActive
                                  ? 'bg-emerald-50/80 text-emerald-800 cursor-default'
                                  : 'text-slate-300 cursor-not-allowed'
                                : isSubActive
                                  ? 'bg-emerald-50/80 text-emerald-800 cursor-pointer'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dropdown Menu (Collapsed mode on hover) */}
                <AnimatePresence>
                  {activeDropdownModuleId === item.id && !showExpanded && item.submenus.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 8, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute left-[52px] top-0 w-52 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)] z-50 p-2.5 font-sans outline-none border-0 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Transparent bridge to prevent closing when moving cursor */}
                      <div className="absolute top-0 bottom-0 -left-4 w-4 bg-transparent cursor-default" />

                      {/* Dropdown Arrow */}
                      <div className="absolute left-0 top-4 -translate-x-1 h-2.5 w-2.5 rotate-45 bg-white border-0 shadow-[-1px_1px_1px_rgba(0,0,0,0.01)]" />
                      
                      <div className="relative">
                        {/* Header with Title */}
                        <div className="px-3 py-2 border-b border-slate-100 mb-2 bg-slate-50/50 rounded-lg">
                          <p className="font-display text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                        </div>

                        {/* Submenu Items */}
                        <div 
                          className="space-y-1"
                          onMouseLeave={() => {
                            if (item.submenus.length > 0) {
                              setHoveredSubmenuId(item.submenus[0].id);
                            }
                          }}
                        >
                          {item.submenus.map((sub) => {
                            const isSubActive = isModuleActive && activeSubTab === sub.id;
                            const isSubHovered = hoveredSubmenuId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onMouseEnter={() => setHoveredSubmenuId(sub.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onChangeModule(item.id, sub.id);
                                  setActiveDropdownModuleId(null);
                                }}
                                className={`block w-full text-left py-2 px-3 rounded-lg font-display text-[11px] font-bold tracking-tight cursor-pointer transition-all duration-150 border border-transparent ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-emerald-800 shadow-xs border-emerald-100/30 font-extrabold'
                                    : isSubHovered
                                      ? 'bg-slate-50 text-slate-900 font-bold'
                                      : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer */}
      <div 
        className="p-2 border-t border-slate-100 shrink-0 relative cursor-default" 
        ref={footerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {isPengaturanMode ? (
          <div className="flex flex-col gap-1">
            {/* Pusat Bantuan */}
            {activeRole !== 'superadmin' && activeRole !== 'superadmid' && (
              <button
                type="button"
                onClick={() => onOpenHelp && onOpenHelp()}
                className="flex w-full items-center gap-3 pl-2 pr-2 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent cursor-pointer font-bold transition-all duration-150 outline-none"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-600 bg-blue-50/80">
                  <HelpCircle className="h-4.5 w-4.5" />
                </div>
                <span className="font-display text-xs text-slate-800 tracking-tight whitespace-nowrap">
                  Pusat Bantuan
                </span>
              </button>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
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
              className="flex w-full items-center gap-3 pl-2 pr-2 py-2 rounded-xl text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 border border-transparent cursor-pointer font-bold transition-all duration-150 outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-600 bg-rose-50/80">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <span className="font-display text-xs tracking-tight whitespace-nowrap">
                Keluar Sistem
              </span>
            </button>
          </div>
        ) : (
          <>
            {/* Profile Menu Popup */}
            <AnimatePresence>
              {isProfilePopupOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute bottom-full left-2 right-2 mb-2 bg-white rounded-xl shadow-2xl z-50 p-2.5 font-sans ${!isExpanded ? 'w-48 left-14' : ''}`}
                >
                  {!isExpanded && (
                    <div className="absolute left-0 bottom-4 -translate-x-1 h-2 w-2 rotate-45 bg-white md:block hidden" />
                  )}
                  <div className="px-3.5 py-2 border-b border-slate-50 mb-1.5 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-inner">
                      {avatar ? (
                        <img src={avatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        displayName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate">{currentUsername}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        onChangeModule('pengaturan', 'keamanan');
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors font-display text-xs font-semibold outline-none focus:outline-none"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Pengaturan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        if (onOpenHelp) onOpenHelp();
                      }}
                      className="flex w-full items-center gap-2 py-1.5 px-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors font-display text-xs font-semibold outline-none focus:outline-none"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span>Pusat Bantuan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopupOpen(false);
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
                      className="flex w-full items-center gap-2 py-1.5 px-3 rounded-lg text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-colors font-display text-xs font-bold"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unified Profile Row with Adaptive Collapse Button */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-1.5">
                <div 
                  onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
                  className="flex items-center gap-3 pl-2 pr-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none flex-1 min-w-0 outline-none focus:outline-none active:outline-none focus:ring-0 active:ring-0"
                >
                  {/* Avatar frame */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 font-display text-xs font-bold text-white shadow-xs hover:scale-105 transition-all outline-none focus:outline-none active:outline-none border border-slate-200/50" title={displayName}>
                    {avatar ? (
                      <img src={avatar} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      displayName.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ 
                          opacity: { duration: 0.08 },
                          x: { duration: 0.12 }
                        }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-xs font-bold text-slate-800 truncate whitespace-nowrap">{displayName}</p>
                        <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5 whitespace-nowrap">{currentUsername}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Collapse Button - only visible next to profile when expanded */}
                {isExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-700 hover:border-emerald-200 shadow-xs hover:bg-emerald-50/50 active:scale-95 transition-all cursor-pointer"
                    title="Ciutkan Sidebar"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {/* Collapse Button - positioned perfectly below avatar when collapsed */}
              {!isExpanded && (
                <div className="flex justify-center w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-700 hover:border-emerald-200 shadow-xs hover:bg-emerald-50/50 active:scale-95 transition-all cursor-pointer"
                    title="Kembangkan Sidebar"
                  >
                    <ChevronLeft className="h-4.5 w-4.5 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
}
