import React from 'react';
import { 
  Users, 
  Activity, 
  Film, 
  Image as ImageIcon, 
  Palette, 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Upload,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { AdminStats } from '../../types';

interface AdminOverviewProps {
  stats: AdminStats | null;
  loading: boolean;
  onNavigateTab: (tab: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  loading,
  onNavigateTab
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  // The 11 requested statistics
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
    { label: 'Online Users', value: stats.onlineUsers, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { label: 'Total Videos', value: stats.totalVideos, icon: Film, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50' },
    { label: 'Total Photos', value: stats.totalPhotos, icon: ImageIcon, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50' },
    { label: 'Total Posters', value: stats.totalPosters, icon: Palette, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { label: 'Total PDFs', value: stats.totalPDFs, icon: FileText, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50' },
    { label: 'Total PPT/PPTX', value: stats.totalPPTX, icon: Presentation, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50' },
    { label: 'Total Word Docs', value: stats.totalWordDocs, icon: FileSpreadsheet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
    { label: 'Total Comments', value: stats.totalComments, icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
    { label: 'Total Likes', value: stats.totalLikes, icon: ThumbsUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { label: 'Total Dislikes', value: stats.totalDislikes, icon: ThumbsDown, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50' },
  ];

  return (
    <div id="admin-overview-section" className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Statistics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry and portal asset distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="quick-upload-media-btn"
            onClick={() => onNavigateTab('media')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Media</span>
          </button>
          <button
            id="quick-view-users-btn"
            onClick={() => onNavigateTab('users')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </button>
        </div>
      </div>

      {/* Grid of 11 Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {card.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Health & Architecture Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Vercel Serverless & Edge Ready</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured with PostgreSQL Prisma schema, modular REST API handlers, and password hashing security.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('activity')}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          View Audit Log &rarr;
        </button>
      </div>
    </div>
  );
};
