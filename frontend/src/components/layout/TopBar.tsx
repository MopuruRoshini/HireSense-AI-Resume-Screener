import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  Plus,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { NotificationItem } from '../../types';
import { Button } from '../ui/Button';

interface TopBarProps {
  isSidebarCollapsed: boolean;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isSidebarCollapsed,
  onOpenCommandPalette,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.getNotifications();
        if (res.success && res.data) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n: NotificationItem) => !n.read).length);
        }
      } catch {
        // Handled silently
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6 bg-[#090D0B]/85 backdrop-blur-xl border-b border-emerald-500/12 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Search Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner w-64 md:w-80"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">Search jobs, candidates, skills...</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>

        {/* Organization Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold truncate max-w-[150px]">
            {user?.organization?.name || 'TechVentures Enterprise'}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Live AI Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Gemini 1.5 Flash Online</span>
        </div>

        {/* Quick Action Button */}
        <Button
          variant="emerald"
          size="sm"
          onClick={() => navigate('/screening')}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Screen Resumes
        </Button>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#090D0B] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl border border-emerald-500/20 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100 font-heading">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto mt-2 space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    All caught up! No recent notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        n.read
                          ? 'bg-slate-900/30 border-slate-800/40 text-slate-400'
                          : 'bg-emerald-950/20 border-emerald-500/20 text-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-slate-100">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

