export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';

export type MediaType = 
  | 'video'
  | 'photo'
  | 'poster'
  | 'pdf'
  | 'presentation'
  | 'spreadsheet'
  | 'word'
  | 'psd'
  | 'document';

export type ReactionType = 'LIKE' | 'DISLIKE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  commentsCount?: number;
  likesCount?: number;
  dislikesCount?: number;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  fileUrl: string;
  thumbnailUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  fileSize?: string;
  duration?: string;
  pageCount?: number;
  slideCount?: number;
  previewContent?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  commentCount: number;
  userReaction?: ReactionType | null;
}

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mediaId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  mediaTitle?: string;
  mediaType?: MediaType;
}

export interface LoginActivityRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  userEmail?: string;
  loginTime: string;
  logoutTime: string | null;
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
}

export type LoginLog = LoginActivityRecord;

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalVideos: number;
  totalPhotos: number;
  totalPosters: number;
  totalPDFs: number;
  totalPPTX: number;
  totalWordDocs: number;
  totalOtherDocs: number;
  totalComments: number;
  totalLikes: number;
  totalDislikes: number;
}

export interface AdminSettingsData {
  id: string;
  adminUsername: string;
  adminEmail: string;
  portalName: string;
  maxUploadSizeMb: number;
  allowRegistration: boolean;
  updatedAt: string;
}

export interface CategoryInfo {
  id: string;
  type: MediaType | 'all';
  label: string;
  icon: string;
  color: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
