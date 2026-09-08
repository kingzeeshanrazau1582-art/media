import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  KeyRound, 
  Ban, 
  CheckCircle2, 
  Trash2, 
  Shield, 
  RefreshCw, 
  X, 
  Check, 
  Calendar, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Loader2,
  Copy
} from 'lucide-react';
import { User, UserStatus, UserRole } from '../../types';
import { api } from '../../lib/api';
import { ConfirmModal } from '../ConfirmModal';

interface AdminUserManagerProps {
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const AdminUserManager: React.FC<AdminUserManagerProps> = ({ onNotify }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  // Modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');

  // Change password fields
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      onNotify('Error loading users', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const isBlocked = u.status === 'BLOCKED' || u.status === 'SUSPENDED';
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.status === 'ACTIVE') ||
      (statusFilter === 'BLOCKED' && isBlocked);

    const q = search.toLowerCase();
    const matchesSearch = 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      await api.updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        status: editStatus
      });
      onNotify('User Updated', `Account for ${editName} was updated`, 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      onNotify('Update Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user ID block/unblock
  const handleConfirmToggleBlock = async () => {
    if (!userToBlock) return;
    const isCurrentlyBlocked = userToBlock.status === 'BLOCKED' || userToBlock.status === 'SUSPENDED';

    try {
      const res = await api.toggleBlockUser(userToBlock.id);
      onNotify(
        isCurrentlyBlocked ? 'User ID Unblocked' : 'User ID Blocked',
        res.message || `${userToBlock.name} status updated`,
        'success'
      );
      setUserToBlock(null);
      fetchUsers();
    } catch (err: any) {
      onNotify('Action Failed', err.message, 'error');
    }
  };

  // Generate random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (newPassword.length < 6) {
      onNotify('Password Too Short', 'Password must be at least 6 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.resetUserPassword(resettingUser.id, newPassword);
      onNotify('Password Changed', res.message || `New password saved for ${resettingUser.name}`, 'success');
      setResettingUser(null);
      setNewPassword('');
    } catch (err: any) {
      onNotify('Password Change Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.deleteUser(userToDelete.id);
      onNotify('User Deleted', `${userToDelete.name} (ID: ${userToDelete.id}) was permanently removed`, 'success');
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      onNotify('Delete Failed', err.message, 'error');
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div id="admin-user-manager" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            User Accounts &amp; Access Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer accounts: change any user's password, block or unblock IDs, and delete users.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-user-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or email..."
            className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'ACTIVE', 'BLOCKED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'ALL' ? 'All Users' : status === 'ACTIVE' ? 'Active' : 'Blocked'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">User &amp; ID</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5">Last Login</th>
                <th className="px-6 py-3.5">Engagement</th>
                <th className="px-6 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading accounts...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isBlocked = user.status === 'BLOCKED' || user.status === 'SUSPENDED';
                  const isAdmin = user.role === 'ADMIN';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center uppercase border ${
                            isBlocked 
                              ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                              : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {user.name}
                              {isAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{user.email}</span>
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                ID: {user.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          !isBlocked
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {!isBlocked ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              ACTIVE
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 text-rose-500" />
                              BLOCKED
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          <span className="flex items-center gap-1" title="Comments">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            {user.commentsCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Likes">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {user.likesCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title="Dislikes">
                            <ThumbsDown className="w-3.5 h-3.5" />
                            {user.dislikesCount ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Block / Unblock ID Button */}
                          <button
                            id={`block-user-id-${user.id}`}
                            onClick={() => setUserToBlock(user)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                            title={isBlocked ? 'Unblock User ID' : 'Block User ID'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{isBlocked ? 'Unblock ID' : 'Block ID'}</span>
                          </button>

                          {/* Change Password Button */}
                          <button
                            id={`change-pwd-${user.id}`}
                            onClick={() => {
                              setResettingUser(user);
                              setNewPassword('');
                              setShowPassword(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition-colors cursor-pointer"
                            title="Change User Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Change Password</span>
                          </button>

                          {/* Edit Details */}
                          <button
                            id={`edit-user-${user.id}`}
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            id={`delete-user-${user.id}`}
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete User ID"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Edit Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
              ID: {editingUser.id}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL (Admin can change ANY user's password) */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setResettingUser(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  User: <span className="font-semibold text-slate-800 dark:text-slate-200">{resettingUser.name}</span>
                </p>
                <p className="text-[11px] font-mono text-indigo-500">
                  ID: {resettingUser.id} &bull; {resettingUser.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-generate password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                The new password will be encrypted using salted bcrypt hashing and applied immediately. The user can log in right away with this new password.
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newPassword}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM BLOCK / UNBLOCK USER ID MODAL */}
      <ConfirmModal
        isOpen={!!userToBlock}
        type={userToBlock?.status === 'BLOCKED' || userToBlock?.status === 'SUSPENDED' ? 'info' : 'danger'}
        title={
          userToBlock?.status === 'BLOCKED' || userToBlock?.status === 'SUSPENDED'
            ? 'Unblock User ID'
            : 'Block User ID'
        }
        message={
          userToBlock?.status === 'BLOCKED' || userToBlock?.status === 'SUSPENDED'
            ? `Are you sure you want to unblock ID "${userToBlock?.id}" (${userToBlock?.name})? They will immediately regain portal access.`
            : `Are you sure you want to block ID "${userToBlock?.id}" (${userToBlock?.name})? Their active sessions will be terminated and they will not be able to log in or post comments.`
        }
        confirmText={
          userToBlock?.status === 'BLOCKED' || userToBlock?.status === 'SUSPENDED'
            ? 'Unblock ID'
            : 'Block User ID Now'
        }
        onConfirm={handleConfirmToggleBlock}
        onCancel={() => setUserToBlock(null)}
      />

      {/* CONFIRM DELETE USER MODAL */}
      <ConfirmModal
        isOpen={!!userToDelete}
        type="danger"
        title={`Delete User ID: ${userToDelete?.id}`}
        message={`Permanently delete user "${userToDelete?.name}" (${userToDelete?.email})? All authored comments, reactions, and account data will be permanently purged from the system.`}
        confirmText="Permanently Delete User"
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
