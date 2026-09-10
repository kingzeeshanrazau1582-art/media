import React from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Eye, 
  Calendar, 
  User as UserIcon,
  Play,
  FileText,
  Presentation,
  Image as ImageIcon,
  Palette,
  FileSpreadsheet,
  Files
} from 'lucide-react';
import { MediaItem, MediaType, ReactionType } from '../types';

interface MediaCardProps {
  media: MediaItem;
  onOpenViewer: (media: MediaItem) => void;
  onReact: (mediaId: string, type: ReactionType) => void;
  onOpenComments: (media: MediaItem) => void;
  isLoggedIn: boolean;
  onPromptLogin: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onOpenViewer,
  onReact,
  onOpenComments,
  isLoggedIn,
  onPromptLogin
}) => {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onPromptLogin();
      return;
    }
    onReact(media.id, 'LIKE');
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onPromptLogin();
      return;
    }
    onReact(media.id, 'DISLIKE');
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenComments(media);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const getCategoryBadge = (type: MediaType) => {
    switch (type) {
      case 'video':
        return { label: 'Video', icon: Play, bg: 'bg-rose-500/90 text-white' };
      case 'photo':
        return { label: 'Photo', icon: ImageIcon, bg: 'bg-emerald-500/90 text-white' };
      case 'poster':
        return { label: 'Poster', icon: Palette, bg: 'bg-amber-500/90 text-white' };
      case 'pdf':
        return { label: 'PDF', icon: FileText, bg: 'bg-red-500/90 text-white' };
      case 'presentation':
        return { label: 'PPTX', icon: Presentation, bg: 'bg-orange-500/90 text-white' };
      case 'spreadsheet':
        return { label: 'Excel', icon: FileSpreadsheet, bg: 'bg-emerald-600/90 text-white' };
      case 'psd':
        return { label: 'PSD', icon: Palette, bg: 'bg-indigo-600/90 text-white' };
      case 'word':
        return { label: 'Word', icon: FileText, bg: 'bg-blue-500/90 text-white' };
      default:
        return { label: 'Doc', icon: Files, bg: 'bg-purple-500/90 text-white' };
    }
  };

  const badge = getCategoryBadge(media.type);
  const BadgeIcon = badge.icon;
  const isLiked = media.userReaction === 'LIKE';
  const isDisliked = media.userReaction === 'DISLIKE';

  return (
    <div
      id={`media-card-${media.id}`}
      onClick={() => onOpenViewer(media)}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={media.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
          alt={media.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Category Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${badge.bg}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            {badge.label}
          </span>
        </div>

        {/* Media Metadata Pill (Duration or File Size) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {media.duration && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/75 text-white backdrop-blur-sm shadow-sm">
              {media.duration}
            </span>
          )}
          {media.fileSize && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/75 text-white backdrop-blur-sm shadow-sm">
              {media.fileSize}
            </span>
          )}
        </div>

        {/* Overlay Hover Play / View Icon */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {media.title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {media.description || 'No description provided.'}
          </p>
        </div>

        {/* Metadata info */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 truncate max-w-[140px]">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{media.uploadedByName}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(media.createdAt)}
          </span>
        </div>

        {/* Action Buttons: Like, Dislike, Comment, View */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
          {/* Reaction Group */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              id={`like-button-${media.id}`}
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isLiked
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Like"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
              <span>{media.likes}</span>
            </button>

            {/* Dislike */}
            <button
              id={`dislike-button-${media.id}`}
              type="button"
              onClick={handleDislike}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDisliked
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dislike"
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
              <span>{media.dislikes}</span>
            </button>

            {/* Comment */}
            <button
              id={`comment-button-${media.id}`}
              type="button"
              onClick={handleCommentClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{media.commentCount}</span>
            </button>
          </div>

          {/* View / Open Button */}
          <button
            id={`view-button-${media.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenViewer(media);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <span>Open</span>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
