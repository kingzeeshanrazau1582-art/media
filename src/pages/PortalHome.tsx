import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  Layers, 
  Film, 
  Image as ImageIcon, 
  Palette, 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  Files,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { MediaItem, MediaType, ReactionType } from '../types';
import { api } from '../lib/api';
import { CategoryNav } from '../components/CategoryNav';
import { MediaCard } from '../components/MediaCard';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { useAuth } from '../context/AuthContext';

interface PortalHomeProps {
  onPromptLogin: () => void;
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({
  onPromptLogin,
  onNotify
}) => {
  const { user, isAdmin } = useAuth();

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'title'>('newest');

  // Active viewer modal item
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  // Category counts
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.getMedia({
        category: selectedCategory,
        search: searchQuery
      });
      setMediaList(res.media);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Failed to load media:', err);
      onNotify('Fetch Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [selectedCategory, searchQuery]);

  // Handle reaction on a card
  const handleReact = async (mediaId: string, type: ReactionType) => {
    try {
      const res = await api.react(mediaId, type);
      setMediaList(prev =>
        prev.map(m => {
          if (m.id === mediaId) {
            return {
              ...m,
              likes: res.likes,
              dislikes: res.dislikes,
              userReaction: res.userReaction
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      onNotify('Reaction Error', err.message, 'error');
    }
  };

  // Sort logic
  const sortedMedia = [...mediaList].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.likes - b.dislikes) - (a.likes - a.dislikes);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div id="portal-home-root" className="min-h-[calc(100vh-64px)] pb-16">
      {/* Category Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            counts={counts}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="portal-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, photos, PDFs, slide decks, and documents..."
              className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector & Result Count */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white">{sortedMedia.length}</strong> items
            </span>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="portal-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-9 h-9 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading media library...</p>
          </div>
        ) : sortedMedia.length === 0 ? (
          <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Media Found</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No assets matched "${searchQuery}". Try another keyword or change category filter.`
                : 'There are currently no items published in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div
            id="media-card-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {sortedMedia.map(media => (
              <MediaCard
                key={media.id}
                media={media}
                onOpenViewer={(item) => setActiveMedia(item)}
                onReact={handleReact}
                onOpenComments={(item) => setActiveMedia(item)}
                isLoggedIn={!!user}
                onPromptLogin={onPromptLogin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {activeMedia && (
        <MediaViewerModal
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
          currentUser={user}
          isAdmin={isAdmin}
          onPromptLogin={onPromptLogin}
          onMediaUpdated={loadMedia}
        />
      )}
    </div>
  );
};
