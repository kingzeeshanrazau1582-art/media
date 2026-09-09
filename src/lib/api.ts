import { 
  User, 
  MediaItem, 
  CommentItem, 
  ReactionType, 
  AdminStats, 
  LoginActivityRecord, 
  AdminSettingsData 
} from '../types';

const TOKEN_KEY = 'mediaportal_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || (
        res.status === 404 ? `Requested resource not found (${endpoint})` :
        res.status === 401 ? 'Unauthorized: Please log in again.' :
        res.status === 403 ? (data.error || 'Access forbidden: You do not have permission.') :
        res.status === 500 ? (data.error || 'Internal server error. Please try again later.') :
        `HTTP Error (${res.status})`
      );
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      throw new Error('Network connection error. Could not connect to the backend server.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string; confirmPassword: string }) =>
    request<{ message: string; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    request<{ message: string; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  adminLogin: (data: { username: string; password: string }) =>
    request<{ message: string; user: User; token: string }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST'
    }),

  getMe: () =>
    request<{ user: User }>('/api/auth/me'),

  // Media
  getMedia: (params?: { category?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return request<{ media: MediaItem[]; counts?: Record<string, number> }>(`/api/media${qs ? `?${qs}` : ''}`);
  },

  getMediaById: (id: string) =>
    request<{ media: MediaItem; comments: CommentItem[] }>(`/api/media/${id}`),

  createMedia: (mediaData: Partial<MediaItem>) =>
    request<{ message: string; media: MediaItem }>('/api/media', {
      method: 'POST',
      body: JSON.stringify(mediaData)
    }),

  updateMedia: (id: string, updates: Partial<MediaItem>) =>
    request<{ message: string; media: MediaItem }>(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteMedia: (id: string) =>
    request<{ message: string }>(`/api/media/${id}`, {
      method: 'DELETE'
    }),

  uploadFile: (formData: FormData) =>
    request<{
      message: string;
      fileUrl: string;
      fileName: string;
      fileSize: string;
      detectedType: any;
      thumbnailUrl: string;
    }>('/api/upload', {
      method: 'POST',
      body: formData
    }),

  // Reactions
  react: (mediaId: string, type: ReactionType) =>
    request<{ likes: number; dislikes: number; userReaction: ReactionType | null }>(
      `/api/media/${mediaId}/react`,
      {
        method: 'POST',
        body: JSON.stringify({ type })
      }
    ),

  // Comments
  addComment: (mediaId: string, text: string) =>
    request<{ message: string; comment: CommentItem }>(`/api/media/${mediaId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  updateComment: (commentId: string, text: string) =>
    request<{ message: string; comment: CommentItem }>(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ text })
    }),

  deleteComment: (commentId: string) =>
    request<{ message: string }>(`/api/comments/${commentId}`, {
      method: 'DELETE'
    }),

  // Admin
  getStats: () =>
    request<{ stats: AdminStats }>('/api/admin/stats'),

  getAdminStats: () =>
    request<{ stats: AdminStats }>('/api/admin/stats'),

  getUsers: () =>
    request<{ users: User[] }>('/api/admin/users'),

  updateUser: (id: string, updates: Partial<User>) =>
    request<{ message: string; user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  resetUserPassword: (id: string, newPassword: string) =>
    request<{ message: string }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  toggleBlockUser: (id: string) =>
    request<{ message: string; user: User; status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' }>(`/api/admin/users/${id}/toggle-block`, {
      method: 'POST'
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE'
    }),

  getAdminComments: () =>
    request<{ comments: CommentItem[] }>('/api/admin/comments'),

  getLoginActivity: () =>
    request<{ activities: LoginActivityRecord[]; logs?: LoginActivityRecord[] }>('/api/admin/login-activity'),

  getAdminLogs: () =>
    request<{ logs: LoginActivityRecord[]; activities?: LoginActivityRecord[] }>('/api/admin/login-activity'),

  getAdminSettings: () =>
    request<{ settings: AdminSettingsData }>('/api/admin/settings'),

  updateAdminSettings: (data: {
    currentPassword: string;
    username?: string;
    email?: string;
    adminUsername?: string;
    adminEmail?: string;
    newPassword?: string;
    portalName?: string;
    maxUploadSize?: string;
    maxUploadSizeMb?: number;
  }) =>
    request<{ message: string; settings: AdminSettingsData }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        adminUsername: data.adminUsername || data.username,
        adminEmail: data.adminEmail || data.email
      })
    })
};
