import React, { useState, useEffect } from 'react';
import { Menu, ShieldAlert, Sun, Moon, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { AdminMediaManager } from './AdminMediaManager';
import { AdminUserManager } from './AdminUserManager';
import { AdminCommentModeration } from './AdminCommentModeration';
import { AdminLoginActivity } from './AdminLoginActivity';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminStats } from '../../types';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitAdmin,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.getAdminStats();
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div id="admin-dashboard-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'overview') fetchStats();
        }}
        onExitAdmin={onExitAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100/50 dark:bg-slate-900/40 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              id="admin-mobile-menu-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden sm:inline">
                Admin Control Room
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick exit to User Portal */}
            <button
              id="admin-top-return-portal"
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">User Portal</span>
            </button>

            {/* Sun / Night Mode Toggle */}
            <button
              id="admin-theme-toggle"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold"
              title={theme === 'dark' ? 'Switch to Sun Mode (Light)' : 'Switch to Night Mode (Dark)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Sun Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Night Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverview
              stats={stats}
              loading={loadingStats}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'media' && (
            <AdminMediaManager
              onNotify={onNotify}
            />
          )}

          {activeTab === 'users' && (
            <AdminUserManager
              onNotify={onNotify}
            />
          )}

          {activeTab === 'comments' && (
            <AdminCommentModeration
              onNotify={onNotify}
            />
          )}

          {activeTab === 'activity' && (
            <AdminLoginActivity
              onNotify={onNotify}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsView
              onNotify={onNotify}
            />
          )}
        </main>
      </div>
    </div>
  );
};
