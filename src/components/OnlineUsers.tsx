import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { getSupabaseClient } from '../lib/api';

export interface OnlineUserInfo {
  username: string;
  displayName: string;
  role: string;
  avatar?: string;
  onlineAt?: string;
}

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let activeChannel: any = null;
    let supabaseClient: any = null;
    let heartbeatInterval: any = null;

    // Generate unique session ID for this browser instance/tab
    const tabSessionId = Math.random().toString(36).substring(2, 9);

    // Get current logged in user details from localStorage
    const currentUsername = localStorage.getItem('smartsantri_active_username') || 'pengguna';
    const currentDisplayName = localStorage.getItem('smartsantri_active_display_name') || 'Admin Utama';
    const currentRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
    const currentAvatar = localStorage.getItem('smartsantri_profile_avatar') || '';

    const currentUserObj: OnlineUserInfo = {
      username: currentUsername,
      displayName: currentDisplayName,
      role: currentRole,
      avatar: currentAvatar,
      onlineAt: new Date().toISOString()
    };

    // Default local user state
    setOnlineUsers([currentUserObj]);

    const syncPresenceState = (channel: any) => {
      if (!channel || !isMounted) return;
      const presenceState = channel.presenceState();
      const userMap = new Map<string, OnlineUserInfo>();

      // Always include current active user
      if (currentUsername) {
        userMap.set(currentUsername.toLowerCase(), currentUserObj);
      }

      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key] as any[];
        if (presences && presences.length > 0) {
          presences.forEach((p) => {
            const uname = (p.username || key.split('_')[0] || 'pengguna').toLowerCase();
            if (uname) {
              userMap.set(uname, {
                username: p.username || uname,
                displayName: p.displayName || p.username || uname,
                role: p.role || 'pengguna',
                avatar: p.avatar || '',
                onlineAt: p.onlineAt || new Date().toISOString()
              });
            }
          });
        }
      });

      const uniqueUserList = Array.from(userMap.values());
      if (uniqueUserList.length > 0) {
        setOnlineUsers(uniqueUserList);
      }
    };

    const initPresence = async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase || !isMounted) return;
        supabaseClient = supabase;

        // Unique session key per connected tab
        const sessionPresenceKey = `${currentUsername.toLowerCase()}_${tabSessionId}`;

        const channel = supabase.channel('online-presence-room', {
          config: {
            presence: {
              key: sessionPresenceKey,
            },
          },
        });

        activeChannel = channel;

        channel
          .on('presence', { event: 'sync' }, () => {
            syncPresenceState(channel);
          })
          .on('presence', { event: 'join' }, () => {
            syncPresenceState(channel);
          })
          .on('presence', { event: 'leave' }, () => {
            syncPresenceState(channel);
          });

        channel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            await channel.track(currentUserObj).catch(() => {});
            syncPresenceState(channel);

            // Heartbeat every 10 seconds to keep presence active across all connected laptops
            heartbeatInterval = setInterval(() => {
              if (isMounted && activeChannel) {
                activeChannel.track(currentUserObj).catch(() => {});
              }
            }, 10000);
          }
        });
      } catch (err) {
        console.warn('Failed to setup presence tracking:', err);
      }
    };

    initPresence();

    return () => {
      isMounted = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (supabaseClient && activeChannel) {
        supabaseClient.removeChannel(activeChannel);
      }
    };
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sekretaris':
      case 'sekretariat':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'bendahara':
      case 'keuangan':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pendidikan':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'humas':
      case 'humasy':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'keamanan':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const displayUsers = onlineUsers.slice(0, 3);
  const remainingCount = onlineUsers.length > 3 ? onlineUsers.length - 3 : 0;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Area: Stacked Compact Avatars */}
      <div className="inline-flex items-center h-7">
        <div className="inline-flex -space-x-2 items-center h-7 p-0.5">
          {displayUsers.map((usr, idx) => (
            <div
              key={`${usr.username}-${idx}`}
              className="relative group/avatar inline-flex items-center justify-center h-7 w-7 flex-shrink-0 cursor-pointer hover:!z-50 transition-all duration-200"
              style={{ zIndex: displayUsers.length - idx }}
            >
              <div
                className="relative h-7 w-7 rounded-full ring-2 ring-white shadow-sm transition-transform duration-200 group-hover/avatar:scale-125 group-hover/avatar:shadow-md bg-slate-100 flex-shrink-0 flex items-center justify-center"
                title={usr.displayName}
              >
                <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center shrink-0">
                  {usr.avatar ? (
                    <img
                      src={usr.avatar}
                      alt={usr.displayName}
                      className="h-full w-full object-cover block shrink-0"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 font-bold text-white text-[10px] leading-none shrink-0 select-none">
                      {getInitials(usr.displayName)}
                    </div>
                  )}
                </div>
                {/* Subtle green indicator dot */}
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white pointer-events-none" />
              </div>

              {/* Hover Profile Popover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-44 rounded-xl bg-white p-2.5 shadow-xl border border-slate-100 opacity-0 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:pointer-events-auto transition-all duration-200 z-50 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0 h-8 w-8 rounded-full ring-1 ring-slate-200 overflow-hidden flex items-center justify-center">
                    {usr.avatar ? (
                      <img src={usr.avatar} alt={usr.displayName} className="h-full w-full object-cover block shrink-0" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-[10px] leading-none shrink-0 select-none">
                        {getInitials(usr.displayName)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">{usr.displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">{usr.username}</p>
                    <div className="mt-1">
                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${getRoleBadgeColor(usr.role)} uppercase tracking-wider`}>
                        {usr.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="relative inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs shadow-sm ring-2 ring-white flex-shrink-0 transition-transform hover:scale-110 focus:outline-none z-0"
            >
              +{remainingCount}
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 to-teal-900 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide">{onlineUsers.length} Online</span>
            </div>
          </div>

          {/* List of Online Users */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {onlineUsers.map((usr, index) => (
              <div
                key={`${usr.username}-${index}`}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors rounded-xl"
              >
                {/* User Avatar */}
                <div className="relative flex-shrink-0">
                  {usr.avatar ? (
                    <img
                      src={usr.avatar}
                      alt={usr.displayName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 font-bold text-white text-sm shadow-sm">
                      {getInitials(usr.displayName)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {usr.displayName}
                    </p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeColor(usr.role)} uppercase tracking-wider`}>
                      {usr.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {usr.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
