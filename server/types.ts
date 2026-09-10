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
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Media {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  fileUrl: string;
  thumbnailUrl: string;
  uploadedBy: string; // userId
  uploadedByName: string;
  fileSize?: string;
  duration?: string;
  slideCount?: number;
  pageCount?: number;
  previewContent?: string; // sample text / slide list for rich online viewer
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mediaId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  userId: string;
  mediaId: string;
  type: ReactionType;
  createdAt: string;
}

export interface LoginActivity {
  id: string;
  userId: string;
  userName: string;
  email: string;
  loginTime: string;
  logoutTime: string | null;
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminSettings {
  id: string;
  adminUsername: string;
  adminEmail: string;
  portalName: string;
  maxUploadSizeMb: number;
  allowRegistration: boolean;
  updatedAt: string;
}

export interface DashboardStats {
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
