import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Monitor, 
  Trash2, 
  Ban, 
  Copy, 
  Check, 
  Shield, 
  AlertOctagon, 
  Activity, 
  KeyRound,
  Filter,
  UserX
} from 'lucide-react';
import { LoginActivityRecord } from '../../types';
import { api } from '../../lib/api';
import { ConfirmModal } from '../ConfirmModal';

interface AdminLoginActivityProps {
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

type StatusFilter = 'ALL' | 'SUCCESS' | 'BLOCKED' | 'FAILED';

export const AdminLoginActivity: React.FC<AdminLoginActivityProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<LoginActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{ id: string; name: string; isBlocked: boolean } | null>(null);
  const [logToDelete, setLogToDelete] = useState<LoginActivityRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminLogs();
      const list = res.logs || res.activities || [];
      setLogs(list);
    } catch (err: any) {
      onNotify('Error loading security logs', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const copyToClipboard = (text: string, label = 'User ID') => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    onNotify('Copied', `${label} (${text}) copied to clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleBlock = async () => {
    if (!userToBlock) return;
    setActionLoading(true);
    try {
      const res = await api.toggleBlockUser(userToBlock.id);
      onNotify(
        res.status === 'BLOCKED' ? 'User Blocked' : 'User Unblocked',
        `User ${userToBlock.name} status changed to ${res.status}`,
        'success'
      );
      setUserToBlock(null);
      await fetchLogs();
    } catch (err: any) {
      onNotify('Action Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    setActionLoading(true);
    try {
      await api.deleteAdminLog(logToDelete.id);
      onNotify('Record Removed', 'Audit record was deleted', 'success');
      setLogToDelete(null);
      await fetchLogs();
    } catch (err: any) {
      onNotify('Delete Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllLogs = async () => {
    setActionLoading(true);
    try {
      await api.clearAdminLogs();
      onNotify('Audit Logs Cleared', 'All security activity logs have been reset', 'success');
      setIsClearModalOpen(false);
      await fetchLogs();
    } catch (err: any) {
      onNotify('Clear Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const email = (l.email || l.userEmail || '').toLowerCase();
    const name = (l.userName || '').toLowerCase();
    const ip = (l.ipAddress || '').toLowerCase();
    const id = (l.userId || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = 
      name.includes(q) || 
      email.includes(q) || 
      ip.includes(q) ||
      id.includes(q);

    const matchesStatus = 
      statusFilter === 'ALL' || 
      l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  // Metrics
  const totalCount = logs.length;
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const blockedCount = logs.filter(l => l.status === 'BLOCKED').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;
  const activeSessionsCount = logs.filter(l => l.status === 'SUCCESS' && !l.logoutTime).length;

  return (
    <div id="admin-login-activity" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              User Login Activity &amp; Access Control
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Live Auditing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit records of user sessions, failed authentication, and blocked ID attempts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {logs.length > 0 && (
            <button
              id="clear-logs-btn"
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Audit Log</span>
            </button>
          )}

          <button
            id="refresh-logs-btn"
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Audits</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded auth events</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeSessionsCount}</p>
            {activeSessionsCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently signed in</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Blocked / Denied</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{blockedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rejected unauthorized attempts</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Failed Attempts</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{failedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Invalid credentials</p>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-logs-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name, email, ID, or IP..."
            className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('SUCCESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'SUCCESS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Successful ({successCount})
          </button>
          <button
            onClick={() => setStatusFilter('BLOCKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'BLOCKED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Blocked / Denied ({blockedCount})
          </button>
          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'FAILED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Failed ({failedCount})
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">User Identity &amp; ID</th>
                <th className="px-4 py-3.5">Auth Result</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Session Timeline</th>
                <th className="px-4 py-3.5">Host / Device</th>
                <th className="px-5 py-3.5 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading security logs and access states...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">No security logs match your search.</p>
                    <p className="text-[11px] mt-1">Try clearing filters or performing a user login to generate new logs.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isBlocked = log.status === 'BLOCKED';
                  const isFailed = log.status === 'FAILED';
                  const isLiveSession = isSuccess && !log.logoutTime;
                  const displayEmail = log.email || log.userEmail || 'No email specified';
                  const userIsCurrentlyBlocked = log.userStatus === 'BLOCKED' || log.userStatus === 'SUSPENDED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Identity & ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                            isBlocked
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                              : isSuccess
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          }`}>
                            {log.userName ? log.userName.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-slate-900 dark:text-white">{log.userName}</p>
                              {log.userRole === 'ADMIN' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{displayEmail}</p>
                            
                            {/* User ID with Copy Button */}
                            {log.userId && log.userId !== 'unregistered' && log.userId !== 'unauthorized' && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400">ID: {log.userId}</span>
                                <button
                                  onClick={() => copyToClipboard(log.userId, 'User ID')}
                                  title="Copy User ID"
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5"
                                >
                                  {copiedId === log.userId ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Auth Result */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : isBlocked
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                          {isBlocked && <Ban className="w-3 h-3" />}
                          {isFailed && <XCircle className="w-3 h-3" />}
                          {isBlocked ? 'BLOCKED / DENIED' : log.status}
                        </span>
                      </td>

                      {/* Account State */}
                      <td className="px-4 py-3.5">
                        {log.userId === 'unregistered' || log.userId === 'unauthorized' ? (
                          <span className="text-[11px] text-slate-400 italic">Unregistered Attempt</span>
                        ) : userIsCurrentlyBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <Ban className="w-2.5 h-2.5" />
                            BLOCKED ID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Session Timeline */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>In: {formatDate(log.loginTime)}</span>
                          </div>
                          
                          {isLiveSession ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>Active Now</span>
                            </div>
                          ) : log.logoutTime ? (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Out: {formatDate(log.logoutTime)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              {isBlocked ? 'Session Terminated / Denied' : 'Session Ended'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Host & Device */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1 font-mono">
                          <Monitor className="w-3 h-3 text-slate-400" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        {log.userAgent && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]" title={log.userAgent}>
                            {log.userAgent.includes('Mozilla') ? 'Web Browser' : log.userAgent}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Block / Unblock Button */}
                          {log.canBlock && log.userId && log.userId !== 'unregistered' && log.userId !== 'unauthorized' && (
                            <button
                              onClick={() => setUserToBlock({
                                id: log.userId,
                                name: log.userName,
                                isBlocked: userIsCurrentlyBlocked
                              })}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                userIsCurrentlyBlocked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
                              }`}
                              title={userIsCurrentlyBlocked ? 'Unblock this user ID' : 'Block this user ID immediately'}
                            >
                              {userIsCurrentlyBlocked ? (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Unblock ID</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>Block ID</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete individual record */}
                          <button
                            onClick={() => setLogToDelete(log)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete this audit record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear All Logs Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear Security & Login Activity?"
        message="Are you sure you want to permanently clear all authentication and session records? This action cannot be undone."
        confirmText="Clear All Records"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
        onConfirm={handleClearAllLogs}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Block / Unblock Modal */}
      <ConfirmModal
        isOpen={Boolean(userToBlock)}
        title={userToBlock?.isBlocked ? `Unblock User ${userToBlock?.name}?` : `Block User ${userToBlock?.name}?`}
        message={
          userToBlock?.isBlocked
            ? `Are you sure you want to restore access for "${userToBlock?.name}"? They will be able to log in and access portal media immediately.`
            : `Are you sure you want to block "${userToBlock?.name}" (ID: ${userToBlock?.id})? Their active sessions will be terminated and all subsequent login attempts will be strictly rejected.`
        }
        confirmText={userToBlock?.isBlocked ? 'Restore Access' : 'Block ID Immediately'}
        cancelText="Cancel"
        type={userToBlock?.isBlocked ? 'info' : 'danger'}
        loading={actionLoading}
        onConfirm={handleToggleBlock}
        onCancel={() => setUserToBlock(null)}
      />

      {/* Delete Single Log Modal */}
      <ConfirmModal
        isOpen={Boolean(logToDelete)}
        title="Delete Audit Record?"
        message="Are you sure you want to remove this specific login event from the security audit trail?"
        confirmText="Delete Record"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDeleteLog}
        onCancel={() => setLogToDelete(null)}
      />
    </div>
  );
};
