import React, { useState, useEffect } from 'react';
import { 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Share2, 
  Download, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Edit2,
  Trash2,
  Check,
  Calendar,
  User as UserIcon,
  ShieldAlert,
  FileText,
  Presentation,
  FileSpreadsheet,
  Layers,
  Table,
  Maximize2
} from 'lucide-react';
import { MediaItem, CommentItem, ReactionType, User } from '../types';
import { api } from '../lib/api';

interface MediaViewerModalProps {
  media: MediaItem | null;
  onClose: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  onPromptLogin: () => void;
  onMediaUpdated?: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  media,
  onClose,
  currentUser,
  isAdmin,
  onPromptLogin,
  onMediaUpdated
}) => {
  if (!media) return null;

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Reactions state
  const [likes, setLikes] = useState(media.likes);
  const [dislikes, setDislikes] = useState(media.dislikes);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(media.userReaction ?? null);

  // Presentation slide state (for PPT/PPTX)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Parse sample presentation slides from previewContent
  const presentationSlides = React.useMemo(() => {
    if (media.type === 'presentation' && media.previewContent) {
      return media.previewContent.split('\n').filter(Boolean);
    }
    return [
      'Slide 1: Executive Overview & Project Goals',
      'Slide 2: Strategic Milestones & Operational Timeline',
      'Slide 3: User Engagement Analytics & Key KPIs',
      'Slide 4: Technical Architecture & Global CDN Delivery',
      'Slide 5: Conclusions & Next Steps'
    ];
  }, [media]);

  // Fetch comments & fresh reaction data on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingComments(true);
    api.getMediaById(media.id)
      .then(res => {
        if (isMounted) {
          setComments(res.comments || []);
          setLikes(res.media.likes);
          setDislikes(res.media.dislikes);
          setUserReaction(res.media.userReaction ?? null);
        }
      })
      .catch(err => console.error('Failed to load media details:', err))
      .finally(() => {
        if (isMounted) setLoadingComments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [media.id]);

  // Handle reaction
  const handleReact = async (type: ReactionType) => {
    if (!currentUser) {
      onPromptLogin();
      return;
    }

    try {
      const res = await api.react(media.id, type);
      setLikes(res.likes);
      setDislikes(res.dislikes);
      setUserReaction(res.userReaction);
      onMediaUpdated?.();
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onPromptLogin();
      return;
    }
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(media.id, newCommentText);
      setComments([res.comment, ...comments]);
      setNewCommentText('');
      onMediaUpdated?.();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Edit comment
  const handleSaveEditComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      const res = await api.updateComment(commentId, editingText);
      setComments(comments.map(c => (c.id === commentId ? res.comment : c)));
      setEditingCommentId(null);
      setEditingText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      onMediaUpdated?.();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

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
    <div
      id="media-viewer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="media-viewer-container"
        className="w-full max-w-5xl h-[94vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top bar header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {media.type}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {media.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="download-media-link"
              href={media.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download or Open File"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              id="close-viewer-button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle: Split Layout (Media Content & Comments Sidebar) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Main Media Player / Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-white">
            <div className="flex-1 flex items-center justify-center p-4 min-h-[300px] lg:min-h-[440px]">
              
              {/* 🎥 Video Player */}
              {media.type === 'video' && (
                <div className="w-full max-w-4xl rounded-xl overflow-hidden bg-black shadow-2xl">
                  <video
                    id="media-video-player"
                    src={media.fileUrl}
                    poster={media.thumbnailUrl}
                    controls
                    playsInline
                    className="w-full max-h-[60vh] object-contain mx-auto"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              )}

              {/* 🖼️ Photo & 🎨 Poster Viewer */}
              {(media.type === 'photo' || media.type === 'poster') && (
                <div className="relative max-h-[60vh] flex items-center justify-center">
                  <img
                    id="media-image-viewer"
                    src={media.fileUrl || media.thumbnailUrl}
                    alt={media.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>
              )}

              {/* 📄 PDF Reader */}
              {media.type === 'pdf' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-semibold">Document Reader &middot; PDF Online Preview</span>
                    </div>
                    {media.pageCount && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {media.pageCount} Pages
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800/80 font-sans text-sm text-slate-300 leading-relaxed max-h-[38vh] overflow-y-auto whitespace-pre-wrap">
                    {media.previewContent || 'This PDF document is ready for interactive reading and indexing.'}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <a
                      href={media.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Full PDF
                    </a>
                  </div>
                </div>
              )}

              {/* 📊 PPT/PPTX Slide Deck Viewer */}
              {media.type === 'presentation' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                  {/* Presentation Slide Stage */}
                  <div className="p-8 min-h-[320px] flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                      <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
                        <Presentation className="w-4 h-4" /> Slide Deck Presentation
                      </span>
                      <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                        Slide {currentSlide + 1} of {presentationSlides.length}
                      </span>
                    </div>

                    <div className="my-auto py-6">
                      <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {presentationSlides[currentSlide]}
                      </h4>
                      <p className="mt-3 text-sm text-slate-400">
                        Quarterly executive review and roadmap alignment. Click Next or Previous to cycle through the slide deck.
                      </p>
                    </div>

                    {/* Slide Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <button
                        id="ppt-prev-slide"
                        onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                        disabled={currentSlide === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev Slide
                      </button>

                      {/* Slide Indicator Dots */}
                      <div className="flex items-center gap-1.5">
                        {presentationSlides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              currentSlide === i ? 'w-6 bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            aria-label={`Jump to slide ${i + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        id="ppt-next-slide"
                        onClick={() => setCurrentSlide(prev => Math.min(presentationSlides.length - 1, prev + 1))}
                        disabled={currentSlide === presentationSlides.length - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                      >
                        Next Slide <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 📈 Excel / Spreadsheet (XLSX, CSV) Interactive Grid Viewer */}
              {media.type === 'spreadsheet' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold">Excel &amp; Data Sheet Viewer &middot; XLSX / CSV</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {media.fileSize && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {media.fileSize}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
                        Workbook Ready
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-[38vh]">
                    {media.previewContent ? (
                      <div className="space-y-1 font-mono text-xs text-slate-200">
                        {media.previewContent.split('\n').map((row, rIdx) => {
                          const cols = row.includes('|') ? row.split('|') : row.split('\t');
                          return (
                            <div 
                              key={rIdx} 
                              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                                rIdx === 0 
                                  ? 'bg-emerald-950/40 text-emerald-300 font-semibold border-b border-emerald-800/40' 
                                  : 'hover:bg-slate-900/60 border-b border-slate-900/50'
                              }`}
                            >
                              <span className="w-6 text-[10px] text-slate-500 shrink-0 select-none">
                                {rIdx + 1}
                              </span>
                              {cols.map((col, cIdx) => (
                                <span key={cIdx} className="flex-1 truncate px-2 py-0.5">
                                  {col.trim()}
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <Table className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                        <p className="font-semibold text-slate-300">Spreadsheet Workbook Data</p>
                        <p className="text-[11px] text-slate-500 mt-1">Multi-sheet dataset with formulas and calculated columns.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Compatible with Microsoft Excel, Google Sheets &amp; Apple Numbers.
                    </p>
                    <a
                      href={media.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Spreadsheet
                    </a>
                  </div>
                </div>
              )}

              {/* 🎨 Photoshop & Design Asset (PSD, AI) High-Res Viewer */}
              {media.type === 'psd' && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-sky-400" />
                      <span className="text-sm font-semibold">Adobe Photoshop Asset &middot; PSD / Design</span>
                    </div>
                    {media.fileSize && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {media.fileSize}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-[38vh] overflow-y-auto">
                    {media.thumbnailUrl && (
                      <div className="w-full md:w-1/2 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                        <img 
                          src={media.thumbnailUrl} 
                          alt={media.title}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform" 
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2 text-xs text-slate-300 w-full">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                          PSD Document
                        </span>
                        <span className="text-[11px] text-slate-400">Layered Graphic Source</span>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {media.previewContent || 'Adobe Photoshop Document with smart objects, vector masks, and RGB/CMYK profiles.'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Open with Adobe Photoshop, Illustrator, or Affinity Photo.
                    </p>
                    <a
                      href={media.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PSD File
                    </a>
                  </div>
                </div>
              )}

              {/* 📝 Word / DOCX and 📁 Other Documents Reader */}
              {(media.type === 'word' || media.type === 'document') && (
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-semibold">Document Content Reader &middot; {media.type.toUpperCase()}</span>
                    </div>
                    {media.fileSize && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {media.fileSize}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-serif text-sm text-slate-200 leading-relaxed max-h-[38vh] overflow-y-auto whitespace-pre-wrap">
                    {media.previewContent || 'Official enterprise document format. Contents verified and accessible.'}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <a
                      href={media.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Document
                    </a>
                  </div>
                </div>
              )}

            </div>

            {/* Media Information & Reaction Bar */}
            <div className="p-5 border-t border-slate-800/80 bg-slate-900/90 text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{media.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> {media.uploadedByName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(media.createdAt)}
                  </span>
                </div>
              </div>

              {/* Reaction Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="modal-like-btn"
                  onClick={() => handleReact('LIKE')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    userReaction === 'LIKE'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${userReaction === 'LIKE' ? 'fill-white' : ''}`} />
                  <span>{likes}</span>
                </button>

                <button
                  id="modal-dislike-btn"
                  onClick={() => handleReact('DISLIKE')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    userReaction === 'DISLIKE'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${userReaction === 'DISLIKE' ? 'fill-white' : ''}`} />
                  <span>{dislikes}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Comments System */}
          <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Comments Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Comments ({comments.length})</span>
              </div>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading discussion...</div>
              ) : comments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                comments.map(c => {
                  const isAuthor = currentUser?.id === c.userId;
                  const canDelete = isAuthor || isAdmin;
                  const isEditing = editingCommentId === c.id;

                  return (
                    <div
                      key={c.id}
                      id={`comment-${c.id}`}
                      className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                            {c.userName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{c.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-2 py-1 text-[11px] rounded text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditComment(c.id)}
                              className="px-2.5 py-1 text-[11px] bg-indigo-600 text-white rounded font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                          {c.text}
                        </p>
                      )}

                      {/* Edit / Delete actions */}
                      {!isEditing && canDelete && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {isAuthor && (
                            <button
                              id={`edit-comment-${c.id}`}
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditingText(c.text);
                              }}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}
                          <button
                            id={`delete-comment-${c.id}`}
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment Box */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {currentUser ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    id="new-comment-input"
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submittingComment}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    id="post-comment-button"
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                    title="Post comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Sign in to like, dislike, or join the discussion.
                  </p>
                  <button
                    id="comments-signin-prompt"
                    onClick={onPromptLogin}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
