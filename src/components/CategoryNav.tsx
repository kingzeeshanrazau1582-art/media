import React from 'react';
import { 
  Film, 
  Image as ImageIcon, 
  Palette, 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  Files, 
  Layers,
  Sparkles
} from 'lucide-react';
import { MediaType } from '../types';

export interface CategoryOption {
  id: string;
  type: MediaType | 'all';
  label: string;
  icon: React.ElementType;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'cat-all', type: 'all', label: 'All Media', icon: Layers },
  { id: 'cat-video', type: 'video', label: 'Videos', icon: Film },
  { id: 'cat-photo', type: 'photo', label: 'Photos', icon: ImageIcon },
  { id: 'cat-presentation', type: 'presentation', label: 'PPT / PPTX', icon: Presentation },
  { id: 'cat-spreadsheet', type: 'spreadsheet', label: 'Excel / CSV', icon: FileSpreadsheet },
  { id: 'cat-psd', type: 'psd', label: 'PSD / Design', icon: Sparkles },
  { id: 'cat-word', type: 'word', label: 'Word Docs', icon: FileText },
  { id: 'cat-pdf', type: 'pdf', label: 'PDFs', icon: FileText },
  { id: 'cat-poster', type: 'poster', label: 'Posters', icon: Palette },
  { id: 'cat-document', type: 'document', label: 'Other Files', icon: Files },
];

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  counts?: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  counts = {}
}) => {
  return (
    <div id="category-navigation" className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.type;
          const count = counts[cat.type] ?? (cat.type === 'all' ? undefined : 0);

          return (
            <button
              key={cat.id}
              id={`filter-${cat.type}`}
              onClick={() => onSelectCategory(cat.type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{cat.label}</span>
              {count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-indigo-700/80 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
