export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleDesc: string;
  accessLevel: 'none' | 'read' | 'write';
}

export interface AccountRole {
  id: string;
  name: string;
  category: 'superadmin' | 'sekretaris' | 'bendahara' | 'pendidikan' | 'humasy' | 'keamanan';
  gender: 'putra' | 'putri' | 'all';
  desc: string;
  badge: string;
  badgeColor: string;
  permissions: { [key: string]: boolean };
}

// Dynamic builder to construct full 20 permissions dict per role (10 modules x 2 actions: view, write)
// Specific modules get view & write based on activeActions, all other modules get view only.
export const buildPermissions = (activeModules: string | string[], activeActions: string[]) => {
  const perms: { [key: string]: boolean } = {};
  const modules = [
    'sekretaris_putra', 'sekretaris_putri',
    'bendahara_putra', 'bendahara_putri',
    'keamanan_putra', 'keamanan_putri',
    'humasy_putra', 'humasy_putri',
    'pendidikan_putra', 'pendidikan_putri'
  ];
  const actions = ['view', 'write'];

  const activeList = typeof activeModules === 'string' ? [activeModules] : activeModules;

  modules.forEach(m => {
    actions.forEach(a => {
      const key = `${m}.${a}`;
      if (activeList.includes('superadmin')) {
        perms[key] = true;
      } else {
        // Automatically check corresponding module(s) by default
        let matched = activeList.includes(m);
        if (activeList.includes('bendahara_pusat') && (m === 'bendahara_putra' || m === 'bendahara_putri')) {
          matched = true;
        }
        if (activeList.includes('kepala_keamanan') && (m === 'keamanan_putra' || m === 'keamanan_putri')) {
          matched = true;
        }

        if (matched) {
          perms[key] = activeActions.includes(a);
        } else {
          // Other modules can only view, no write
          perms[key] = a === 'view';
        }
      }
    });
  });
  return perms;
};

// Default roles aligned with Spatie Laravel-Permission seeds
export const DEFAULT_ROLES: AccountRole[] = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    category: 'superadmin',
    gender: 'all',
    desc: 'Pemegang kendali penuh seluruh modul sistem.',
    badge: 'AKSES PENUH',
    badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200/50',
    permissions: buildPermissions('superadmin', [])
  },
  {
    id: 'sekretaris_putra',
    name: 'Sekretaris Putra',
    category: 'sekretaris',
    gender: 'putra',
    desc: 'Pengelola data induk santri & berkas administrasi asrama putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('sekretaris_putra', ['view', 'write'])
  },
  {
    id: 'sekretaris_putri',
    name: 'Sekretaris Putri',
    category: 'sekretaris',
    gender: 'putri',
    desc: 'Pengelola data induk santri & berkas administrasi asrama putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('sekretaris_putri', ['view', 'write'])
  },
  {
    id: 'bendahara_putra',
    name: 'Bendahara Putra',
    category: 'bendahara',
    gender: 'putra',
    desc: 'Kasir dan pengelola syahriah iuran santri putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('bendahara_putra', ['view', 'write'])
  },
  {
    id: 'bendahara_putri',
    name: 'Bendahara Putri',
    category: 'bendahara',
    gender: 'putri',
    desc: 'Kasir dan pengelola syahriah iuran santri putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('bendahara_putri', ['view', 'write'])
  },
  {
    id: 'kepala_keamanan',
    name: 'Kepala Keamanan',
    category: 'keamanan',
    gender: 'all',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri.',
    badge: 'KEAMANAN',
    badgeColor: 'bg-rose-50 text-rose-600 border border-rose-100/50',
    permissions: buildPermissions('kepala_keamanan', ['view', 'write'])
  },
  {
    id: 'keamanan_putra',
    name: 'Keamanan Putra',
    category: 'keamanan',
    gender: 'putra',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('keamanan_putra', ['view'])
  },
  {
    id: 'keamanan_putri',
    name: 'Keamanan Putri',
    category: 'keamanan',
    gender: 'putri',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('keamanan_putri', ['view'])
  },
  {
    id: 'humasy_putra',
    name: 'Humas/Kamar Putra',
    category: 'humasy',
    gender: 'putra',
    desc: 'Pengelola asrama, penempatan kamar, dan relasi wali santri putra.',
    badge: 'HUMAS',
    badgeColor: 'bg-teal-50 text-teal-600 border border-teal-100/50',
    permissions: buildPermissions('humasy_putra', ['view', 'write'])
  },
  {
    id: 'humasy_putri',
    name: 'Humas/Kamar Putri',
    category: 'humasy',
    gender: 'putri',
    desc: 'Pengelola asrama, penempatan kamar, dan relasi wali santri putri.',
    badge: 'HUMAS',
    badgeColor: 'bg-teal-50 text-teal-600 border border-teal-100/50',
    permissions: buildPermissions('humasy_putri', ['view', 'write'])
  },
  {
    id: 'pendidikan_putra',
    name: 'Pendidikan Putra',
    category: 'pendidikan',
    gender: 'putra',
    desc: 'Pengurus kurikulum, jadwal madrasah, dan rapor putra.',
    badge: 'PENDIDIKAN',
    badgeColor: 'bg-amber-50 text-amber-600 border border-amber-100/50',
    permissions: buildPermissions('pendidikan_putra', ['view', 'write'])
  },
  {
    id: 'pendidikan_putri',
    name: 'Pendidikan Putri',
    category: 'pendidikan',
    gender: 'putri',
    desc: 'Pengurus kurikulum, jadwal madrasah, dan rapor putri.',
    badge: 'PENDIDIKAN',
    badgeColor: 'bg-amber-50 text-amber-600 border border-amber-100/50',
    permissions: buildPermissions('pendidikan_putri', ['view', 'write'])
  }
];

export async function fetchAndSyncPermissionsFromSupabase(): Promise<AccountRole[]> {
  try {
    const statusRes = await fetch("/api/supabase-status");
    if (!statusRes.ok) return DEFAULT_ROLES;
    
    let status;
    try {
      status = await statusRes.json();
    } catch (e) {
      console.warn("Gagal parse status JSON, kemungkinan server sedang restart:", e);
      return DEFAULT_ROLES;
    }
    
    if (!status.connected) return DEFAULT_ROLES;

    const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
      fetch("/api/db/roles"),
      fetch("/api/db/permissions"),
      fetch("/api/db/role_has_permissions")
    ]);

    if (!rolesRes.ok || !permsRes.ok || !rolePermsRes.ok) {
      return DEFAULT_ROLES;
    }

    let rolesData, permsData, rolePermsData;
    try {
      rolesData = await rolesRes.json();
      permsData = await permsRes.json();
      rolePermsData = await rolePermsRes.json();
    } catch (e) {
      console.warn("Gagal parse data JSON, kemungkinan server sedang restart:", e);
      return DEFAULT_ROLES;
    }

    if (!rolesData.success || !permsData.success || !rolePermsData.success) {
      return DEFAULT_ROLES;
    }

    const dbRoles = rolesData.data || [];
    const dbPerms = permsData.data || [];
    const dbRolePerms = rolePermsData.data || [];

    const updatedRoles: AccountRole[] = DEFAULT_ROLES.map(defaultRole => {
      // Find the corresponding role in database
      const matchedDbRole = dbRoles.find((r: any) => r.name === defaultRole.id);
      if (!matchedDbRole) return defaultRole;

      // Find all permissions assigned to this role in database
      const assignedPermIds = dbRolePerms
        .filter((rp: any) => String(rp.role_id) === String(matchedDbRole.id))
        .map((rp: any) => rp.permission_id);

      const permissionsMap: { [key: string]: boolean } = {};
      
      const modules = [
        'sekretaris_putra', 'sekretaris_putri',
        'bendahara_putra', 'bendahara_putri',
        'keamanan_putra', 'keamanan_putri',
        'humasy_putra', 'humasy_putri',
        'pendidikan_putra', 'pendidikan_putri'
      ];
      const actions = ['view', 'write'];
      modules.forEach(m => {
        actions.forEach(a => {
          permissionsMap[`${m}.${a}`] = defaultRole.id === 'superadmin';
        });
      });

      dbPerms.forEach((p: any) => {
        if (assignedPermIds.includes(p.id)) {
          permissionsMap[p.name] = true;
        }
      });

      return {
        ...defaultRole,
        permissions: permissionsMap
      };
    });

    localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(updatedRoles));
    return updatedRoles;
  } catch (error) {
    console.error("Gagal sinkronisasi hak akses dari Supabase:", error);
    return DEFAULT_ROLES;
  }
}

