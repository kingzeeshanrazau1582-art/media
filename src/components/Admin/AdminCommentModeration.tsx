import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Trash2, RefreshCw, Calendar, User, Film, ExternalLink } from 'lucide-react';
import { CommentItem } from '../../types';
import { api } from '../../lib/api';
import { ConfirmModal } from '../ConfirmModal';

interface AdminCommentModerationProps {
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const AdminCommentModeration: React.FC<AdminCommentModerationProps> = ({ onNotify }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentItem | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminComments();
      setComments(res.comments);
    } catch (err: any) {
      onNotify('Error loading comments', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await api.deleteComment(commentToDelete.id);
      onNotify('Comment Removed', 'Inappropriate comment purged', 'success');
      setCommentToDelete(null);
      fetchComments();
    } catch (err: any) {
      onNotify('Delete Failed', err.message, 'error');
    }
  };

  const filteredComments = comments.filter(c => {
    const q = search.toLowerCase();
    return (
      c.text.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      c.userEmail.toLowerCase().includes(q) ||
      (c.mediaTitle && c.mediaTitle.toLowerCase().includes(q))
    );
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div id="admin-comment-moderation" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Comment Moderation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit user discussion, search remarks, and remove inappropriate content.
          </p>
        </div>

        <button
          onClick={fetchComments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-comment-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments by text, author, or asset..."
            className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Comments List / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Author</th>
                <th className="px-6 py-3.5">Comment Content</th>
                <th className="px-6 py-3.5">Target Asset</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading comments...
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No comments found matching filter.
                  </td>
                </tr>
              ) : (
                filteredComments.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center uppercase">
                          {c.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{c.userName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 max-w-sm">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        {c.text}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        <Film className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate max-w-[140px]">{c.mediaTitle}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        id={`admin-delete-comment-${c.id}`}
                        onClick={() => setCommentToDelete(c)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 ml-auto font-medium cursor-pointer"
                        title="Delete inappropriate comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE COMMENT MODAL */}
      <ConfirmModal
        isOpen={!!commentToDelete}
        type="danger"
        title="Delete Comment"
        message={`Purge comment by "${commentToDelete?.userName}" ("${commentToDelete?.text}")? This action cannot be reversed.`}
        confirmText="Purge Comment"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};
