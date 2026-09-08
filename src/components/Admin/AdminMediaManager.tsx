import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Plus, 
  X, 
  FileUp, 
  RefreshCw, 
  Check, 
  Calendar, 
  ExternalLink,
  Layers,
  FileText,
  Presentation,
  Film,
  Image as ImageIcon,
  Palette,
  FileSpreadsheet,
  Files,
  Loader2
} from 'lucide-react';
import { MediaItem, MediaType } from '../../types';
import { api } from '../../lib/api';
import { CATEGORIES } from '../CategoryNav';
import { ConfirmModal } from '../ConfirmModal';

interface AdminMediaManagerProps {
  onNotify: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const AdminMediaManager: React.FC<AdminMediaManagerProps> = ({ onNotify }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [replacingMedia, setReplacingMedia] = useState<MediaItem | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);

  // Upload / Edit form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<MediaType>('video');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formPreviewContent, setFormPreviewContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await api.getMedia({ category: selectedCategory, search: searchQuery });
      setMediaList(res.media);
    } catch (err: any) {
      onNotify('Error loading media', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [selectedCategory, searchQuery]);

  // Handle local file selection and upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadFile(formData);
      setFormFileUrl(res.fileUrl);
      setFormFileSize(res.fileSize);
      if (res.detectedType) {
        setFormType(res.detectedType);
      }
      if (!formTitle) {
        // Strip extension for clean title default
        const nameWithoutExt = res.fileName.replace(/\.[^/.]+$/, '');
        setFormTitle(nameWithoutExt);
      }
      if (!formThumbnailUrl && res.thumbnailUrl) {
        setFormThumbnailUrl(res.thumbnailUrl);
      }
      onNotify('File attached', `${res.fileName} (${res.fileSize}) ready`, 'success');
    } catch (err: any) {
      onNotify('Upload error', err.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Replace media file
  const handleReplaceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingMedia) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadFile(formData);
      await api.updateMedia(replacingMedia.id, {
        fileUrl: res.fileUrl,
        fileSize: res.fileSize,
        type: res.detectedType || replacingMedia.type
      });
      onNotify('Media Replaced', `Successfully replaced media file with ${res.fileName}`, 'success');
      setReplacingMedia(null);
      fetchMedia();
    } catch (err: any) {
      onNotify('Replace Failed', err.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormType('video');
    setFormFileUrl('');
    setFormThumbnailUrl('');
    setFormFileSize('');
    setFormDuration('');
    setFormPreviewContent('');
    setIsUploadOpen(true);
  };

  const openEditModal = (media: MediaItem) => {
    setEditingMedia(media);
    setFormTitle(media.title);
    setFormDescription(media.description);
    setFormType(media.type);
    setFormFileUrl(media.fileUrl);
    setFormThumbnailUrl(media.thumbnailUrl);
    setFormFileSize(media.fileSize || '');
    setFormDuration(media.duration || '');
    setFormPreviewContent(media.previewContent || '');
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formFileUrl.trim()) {
      onNotify('Validation Error', 'Title and media file are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMedia) {
        await api.updateMedia(editingMedia.id, {
          title: formTitle,
          description: formDescription,
          type: formType,
          fileUrl: formFileUrl,
          thumbnailUrl: formThumbnailUrl,
          fileSize: formFileSize,
          duration: formDuration,
          previewContent: formPreviewContent
        });
        onNotify('Media Updated', 'Changes saved successfully', 'success');
        setEditingMedia(null);
      } else {
        await api.createMedia({
          title: formTitle,
          description: formDescription,
          type: formType,
          fileUrl: formFileUrl,
          thumbnailUrl: formThumbnailUrl,
          fileSize: formFileSize || '5 MB',
          duration: formDuration,
          previewContent: formPreviewContent
        });
        onNotify('Media Published', 'New media has been uploaded to the portal', 'success');
        setIsUploadOpen(false);
      }
      fetchMedia();
    } catch (err: any) {
      onNotify('Operation Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;

    try {
      await api.deleteMedia(mediaToDelete.id);
      onNotify('Media Deleted', `"${mediaToDelete.title}" was permanently removed`, 'success');
      setMediaToDelete(null);
      fetchMedia();
    } catch (err: any) {
      onNotify('Delete Failed', err.message, 'error');
    }
  };

  return (
    <div id="admin-media-manager" className="space-y-6">
      {/* Header with Search and New Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Media Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full administrative control: upload, edit, replace, and moderate all portal assets.
          </p>
        </div>

        <button
          id="admin-new-upload-btn"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Media Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-media-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media by title or author..."
            className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Table / History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload History &amp; Assets ({mediaList.length})
          </h3>
          <button
            onClick={fetchMedia}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Asset</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Size / Specs</th>
                <th className="px-6 py-3.5">Reactions</th>
                <th className="px-6 py-3.5">Uploaded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading media records...
                  </td>
                </tr>
              ) : mediaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No media items found matching criteria.
                  </td>
                </tr>
              ) : (
                mediaList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-12 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {item.fileSize || 'N/A'} {item.duration ? `• ${item.duration}` : ''}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{item.likes}</span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">-{item.dislikes}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Replace media file */}
                        <button
                          id={`replace-media-${item.id}`}
                          onClick={() => setReplacingMedia(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Replace File"
                        >
                          <FileUp className="w-4 h-4" />
                        </button>
                        {/* Edit metadata */}
                        <button
                          id={`edit-media-${item.id}`}
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Information"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          id={`delete-media-${item.id}`}
                          onClick={() => setMediaToDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MEDIA MODAL */}
      {(isUploadOpen || editingMedia) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadOpen(false);
                setEditingMedia(null);
              }}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingMedia ? 'Edit Media Information' : 'Upload New Media Item'}
            </h3>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              {/* File Attachment / Drag Drop (For Create mode) */}
              {!editingMedia && (
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <FileUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Upload from device (Video, Photo, PDF, PPTX, Word)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cloud &amp; Vercel ready: Automatically formatted and tagged.
                  </p>

                  <div className="mt-3">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors">
                      {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Select Local File</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Media Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Annual Architecture Whitepaper 2025"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief synopsis or overview for viewers..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MediaType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="video">🎥 Video</option>
                    <option value="photo">🖼️ Photo</option>
                    <option value="poster">🎨 Poster</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="presentation">📊 PPT / PPTX</option>
                    <option value="word">📝 Word / DOCX</option>
                    <option value="document">📁 Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    File Size / Duration
                  </label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="e.g. 14.5 MB or 08:30"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* File URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direct File URL or Data Stream *
                </label>
                <input
                  type="text"
                  required
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  placeholder="https://... or auto-populated from upload"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white truncate"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or auto generated"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Preview Content (for PDFs, PPTX slides, Word text) */}
              {(formType === 'pdf' || formType === 'presentation' || formType === 'word' || formType === 'document') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interactive Online Preview Text / Slides
                  </label>
                  <textarea
                    rows={3}
                    value={formPreviewContent}
                    onChange={(e) => setFormPreviewContent(e.target.value)}
                    placeholder="For PPTX: enter slide titles separated by line breaks. For PDF/Word: enter preview text."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setEditingMedia(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingMedia ? 'Save Changes' : 'Publish Media'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPLACE MEDIA FILE MODAL */}
      {replacingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setReplacingMedia(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Replace Media Asset
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Replace the underlying file for &ldquo;{replacingMedia.title}&rdquo; while preserving comments and reactions.
            </p>

            <div className="p-6 rounded-xl border-2 border-dashed border-indigo-400/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-center">
              <FileUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Select replacement file
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload new binary (Video, Photo, PDF, PPTX, or Document)
              </p>

              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md transition-colors">
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Choose Replacement File</span>
                  <input
                    type="file"
                    onChange={handleReplaceFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MEDIA MODAL */}
      <ConfirmModal
        isOpen={!!mediaToDelete}
        type="danger"
        title="Delete Media File"
        message={`Are you sure you want to permanently delete "${mediaToDelete?.title}"? All user comments, likes, and dislikes for this media will also be removed.`}
        confirmText="Permanently Delete Media"
        onConfirm={handleConfirmDelete}
        onCancel={() => setMediaToDelete(null)}
      />
    </div>
  );
};
