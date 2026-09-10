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
  const [isDragging, setIsDragging] = useState(false);

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

  // Helper: Read file as Data URL locally (for large files or when server upload limit is reached)
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Helper: Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper: Auto-detect media type from filename & mime
  const detectFileType = (fileName: string, mime: string): MediaType => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) {
      return 'video';
    }
    if (['pptx', 'ppt', 'pps', 'ppsx', 'keynote', 'odp'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'presentation';
    }
    if (['xlsx', 'xls', 'csv', 'xlsm', 'xlsb', 'ods', 'numbers', 'tsv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) {
      return 'spreadsheet';
    }
    if (['docx', 'doc', 'pages', 'odt', 'rtf'].includes(ext) || mime.includes('word')) {
      return 'word';
    }
    if (['pdf'].includes(ext) || mime.includes('pdf')) {
      return 'pdf';
    }
    if (['psd', 'psb', 'ai', 'eps', 'figma', 'fig', 'sketch', 'xd'].includes(ext) || mime.includes('photoshop') || mime.includes('illustrator')) {
      return 'psd';
    }
    if (mime.startsWith('image/')) {
      return fileName.toLowerCase().includes('poster') || ['svg'].includes(ext) ? 'poster' : 'photo';
    }
    return 'document';
  };

  const getThumbnailForType = (type: MediaType): string => {
    switch (type) {
      case 'video': return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80';
      case 'photo': return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
      case 'poster': return 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80';
      case 'pdf': return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';
      case 'presentation': return 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
      case 'spreadsheet': return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';
      case 'word': return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80';
      case 'psd': return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80';
      default: return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80';
    }
  };

  const processFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const detected = detectFileType(file.name, file.type);
      const formattedSize = formatBytes(file.size);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

      let finalFileUrl = '';
      let finalThumbUrl = getThumbnailForType(detected);

      // Upload file directly to server via multipart to keep JSON payloads small and prevent HTTP 413
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.uploadFile(formData);
        finalFileUrl = res.fileUrl;
        if (res.thumbnailUrl) finalThumbUrl = res.thumbnailUrl;
      } catch (uploadErr) {
        console.warn('Multipart upload failed, reading locally as data URL:', uploadErr);
        finalFileUrl = await readFileAsDataURL(file);
      }

      // If user uploaded a standard web image, use its own image as thumbnail
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (file.type.startsWith('image/') && !['psd', 'psb', 'ai'].includes(ext)) {
        finalThumbUrl = finalFileUrl;
      }

      setFormFileUrl(finalFileUrl);
      setFormFileSize(formattedSize);
      setFormType(detected);
      if (!formTitle) setFormTitle(nameWithoutExt);
      setFormThumbnailUrl(finalThumbUrl);

      // Intelligent preview snippet defaults
      if (detected === 'presentation' && !formPreviewContent) {
        setFormPreviewContent(`Slide 1: ${nameWithoutExt} - Executive Overview & Agenda\nSlide 2: Strategic Objectives & Deliverables\nSlide 3: Quarterly Progress & Milestone Updates\nSlide 4: Financial Allocation & Resource Matrix\nSlide 5: Key Takeaways & Action Items`);
      } else if (detected === 'spreadsheet' && !formPreviewContent) {
        setFormPreviewContent(`SHEET 1: General Summary\nColumns: ID | Item Name | Category | Units | Unit Cost | Total Revenue | Status\nSummary Status: Table indexed with formula calculations active (SUM, AVERAGE, VLOOKUP)`);
      } else if (detected === 'psd' && !formPreviewContent) {
        setFormPreviewContent(`Adobe Photoshop Design Document (.psd)\nColor Mode: RGB (8-bit) · 300 DPI High Resolution\nArtboards & Layers: Smart Objects, Vector Masks, Branding Icons, Typography Layout\nReady for export to PNG/SVG/PDF.`);
      }

      onNotify('File Attached', `${file.name} (${formattedSize}) detected as ${detected.toUpperCase()}`, 'success');
    } catch (err: any) {
      onNotify('Upload Error', err.message || 'Error processing file', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleReplaceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingMedia) return;

    setUploadingFile(true);
    try {
      const detected = detectFileType(file.name, file.type);
      const formattedSize = formatBytes(file.size);

      let finalFileUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.uploadFile(formData);
        finalFileUrl = res.fileUrl;
      } catch {
        finalFileUrl = await readFileAsDataURL(file);
      }

      await api.updateMedia(replacingMedia.id, {
        fileUrl: finalFileUrl,
        fileSize: formattedSize,
        type: detected
      });

      onNotify('Media Replaced', `Successfully replaced media file with ${file.name}`, 'success');
      setReplacingMedia(null);
      fetchMedia();
    } catch (err: any) {
      onNotify('Replace Failed', err.message || 'Failed to replace file', 'error');
    } finally {
      setUploadingFile(false);
    }
    e.target.value = '';
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
      let finalFileUrl = formFileUrl.trim();
      let finalThumbUrl = formThumbnailUrl.trim();

      // If the media file is a large base64 data URL, convert to Blob and upload via multipart
      if (finalFileUrl.startsWith('data:')) {
        try {
          const res = await fetch(finalFileUrl);
          const blob = await res.blob();
          const ext = formType === 'video' ? 'mp4' : formType === 'photo' ? 'jpg' : formType === 'presentation' ? 'pptx' : 'bin';
          const formData = new FormData();
          formData.append('file', blob, `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`);
          const upRes = await api.uploadFile(formData);
          if (upRes.fileUrl) {
            finalFileUrl = upRes.fileUrl;
            setFormFileUrl(finalFileUrl);
          }
        } catch (convErr) {
          console.warn('Could not multipart upload data URL, sending directly:', convErr);
        }
      }

      if (editingMedia) {
        await api.updateMedia(editingMedia.id, {
          title: formTitle,
          description: formDescription,
          type: formType,
          fileUrl: finalFileUrl,
          thumbnailUrl: finalThumbUrl,
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
          fileUrl: finalFileUrl,
          thumbnailUrl: finalThumbUrl,
          fileSize: formFileSize || '5 MB',
          duration: formDuration,
          previewContent: formPreviewContent
        });
        onNotify('Media Published', 'New media has been uploaded to the portal', 'success');
        setIsUploadOpen(false);
      }
      fetchMedia();
    } catch (err: any) {
      const msg = err.message || 'Operation failed';
      onNotify('Operation Failed', msg.includes('413') ? 'Payload too large. Please use a direct URL or re-attach the file.' : msg, 'error');
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
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                  className={`p-5 rounded-xl border-2 border-dashed transition-colors text-center ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]' 
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <FileUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Drag &amp; Drop or Select Local File
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Supports PPT / PPTX, Excel (XLSX, XLS, CSV), Photoshop (PSD, AI), Word (DOCX), PDF, Video &amp; Photos
                  </p>

                  <div className="mt-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors shadow-sm">
                      {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{uploadingFile ? 'Uploading to Server...' : 'Browse Local Files'}</span>
                      <input
                        type="file"
                        accept="*/*"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* One-click quick presets */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTitle('Cloud Architecture Demo 4K');
                        setFormDescription('High-definition cloud microservices and distributed scaling architectural walk-through.');
                        setFormType('video');
                        setFormFileUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                        setFormThumbnailUrl('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80');
                        setFormFileSize('15.8 MB');
                        setFormDuration('09:56');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      🎥 Sample Video
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTitle('Q4 Executive Investor Deck');
                        setFormDescription('Comprehensive corporate presentation covering fiscal milestones, deliverables, and roadmap.');
                        setFormType('presentation');
                        setFormFileUrl('https://view.officeapps.live.com/op/view.aspx?src=sample.pptx');
                        setFormThumbnailUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80');
                        setFormFileSize('8.4 MB');
                        setFormPreviewContent('Slide 1: Q4 Strategy & Vision\nSlide 2: Financial Performance & Market Growth\nSlide 3: Strategic Partnerships & Integrations\nSlide 4: Next Fiscal Year Milestones');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      📊 Sample PPT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTitle('Financial Valuation Model');
                        setFormDescription('Comprehensive Excel financial workbook with dynamic multi-scenario forecasts.');
                        setFormType('spreadsheet');
                        setFormFileUrl('https://example.com/data/model.xlsx');
                        setFormThumbnailUrl('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80');
                        setFormFileSize('3.2 MB');
                        setFormPreviewContent('SHEET 1: General Summary\nColumns: ID | Item Name | Category | Units | Unit Cost | Total Revenue | Status\nFormulas: SUM, AVERAGE, VLOOKUP, INDEX/MATCH');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      📈 Sample Excel
                    </button>
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
                    <option value="presentation">📊 PPT / PPTX Presentation</option>
                    <option value="spreadsheet">📈 Excel / Spreadsheet (XLSX, CSV)</option>
                    <option value="psd">🎨 Photoshop &amp; Design (PSD, AI)</option>
                    <option value="word">📝 Word / DOCX</option>
                    <option value="pdf">📄 PDF Document</option>
                    <option value="poster">🎨 Poster / Art</option>
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

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const fakeEvent = { target: { files: [file], value: '' } } as any;
                  handleReplaceFileUpload(fakeEvent);
                }
              }}
              className={`p-6 rounded-xl border-2 border-dashed transition-colors text-center ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40' 
                  : 'border-indigo-400/50 bg-indigo-50/50 dark:bg-indigo-950/20'
              }`}
            >
              <FileUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Select replacement file
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload new file (PPT, Excel, PSD, Word, PDF, Video, Photo)
              </p>

              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md transition-colors">
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Choose Replacement File</span>
                  <input
                    type="file"
                    accept="*/*"
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
