// ---------------------------------------------------------------------
// Sahir API client
// ---------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

// Types
export type ProductionListItem = {
  id: number;
  title: string;
  type: 'Movie' | 'TVShow';
  releaseYear: number;
  posterUrl?: string | null;
  averageScore: number;
  ratingCount: number;
  categoryName?: string | null;
};

export type ProductionDetail = ProductionListItem & {
  originalTitle?: string | null;
  endYear?: number | null;
  durationMin?: number | null;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  synopsis?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  director?: string | null;
  country?: string | null;
  language?: string | null;
  categoryId?: number | null;
  genres: string[];
};

export type CategoryNode = {
  id: number; name: string; slug: string;
  parentId: number | null; description?: string | null;
  children: CategoryNode[];
};

export type CategoryFlat = {
  id: number; name: string; slug: string;
  parentId: number | null; description?: string | null;
};

export type ProductionUpsert = {
  title: string;
  originalTitle?: string | null;
  type: 'Movie' | 'TVShow';
  releaseYear: number;
  endYear?: number | null;
  durationMin?: number | null;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  synopsis?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  director?: string | null;
  country?: string | null;
  language?: string | null;
  categoryId?: number | null;
  genreIds?: number[];
};

export type Comment = {
  id: number; userId: number; username: string; avatarUrl?: string | null;
  productionId: number; parentCommentId: number | null;
  body: string; isSpoiler: boolean;
  likeCount: number; createdAt: string;
};

export type Watchlist = {
  id: number; name: string; description?: string | null;
  isPublic: boolean; createdAt: string; itemCount: number;
};

export type WatchHistoryItem = {
  production: ProductionListItem;
  watchedAt: string;
};

export type WatchlistDetail = {
  id: number; name: string; description?: string | null;
  isPublic: boolean; createdAt: string;
  items: ProductionListItem[];
};

// ---------- token helpers ----------
const TOKEN_KEY = 'sahir_token';
const USER_KEY  = 'sahir_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setAuth(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getUser():
  { userId: number; username: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------- core fetch ----------
async function http<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {})
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}

    // Token geçersiz veya hesap kaybolmuş → temiz çıkış + login'e yönlendir
    if (res.status === 401 && typeof window !== 'undefined') {
      clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        alert(msg);
        window.location.href = '/login';
      }
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- API ----------
export const api = {
  // Auth
  register: (b: { username: string; email: string; password: string }) =>
    http<{ token: string; userId: number; username: string; role: string }>(
      '/api/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login: (b: { email: string; password: string }) =>
    http<{ token: string; userId: number; username: string; role: string }>(
      '/api/auth/login', { method: 'POST', body: JSON.stringify(b) }),

  // Productions
  productions: (params: {
    q?: string; type?: string; categoryId?: number; year?: number;
    sort?: string; page?: number; pageSize?: number;
  } = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
    });
    return http<{ total: number; page: number; pageSize: number; items: ProductionListItem[] }>(
      `/api/productions?${sp.toString()}`);
  },
  production: (id: number) => http<ProductionDetail>(`/api/productions/${id}`),

  // Categories
  categoryTree: () => http<CategoryNode[]>('/api/categories/tree'),
  categoriesFlat: () => http<CategoryFlat[]>('/api/categories'),
  genres:         () => http<{ id: number; name: string }[]>('/api/genres'),

  // Editor — Productions CRUD
  createProduction: (b: ProductionUpsert) =>
    http<{ id: number }>('/api/productions',
      { method: 'POST', body: JSON.stringify(b) }),
  updateProduction: (id: number, b: ProductionUpsert) =>
    http(`/api/productions/${id}`,
      { method: 'PUT', body: JSON.stringify(b) }),
  deleteProduction: (id: number) =>
    http(`/api/productions/${id}`, { method: 'DELETE' }),

  // Görsel yükleme (multipart)
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Ratings
  rate:        (productionId: number, score: number) =>
    http('/api/ratings', { method: 'POST', body: JSON.stringify({ productionId, score }) }),
  myRating:    (productionId: number) =>
    http<{ score: number | null }>(`/api/ratings/me/${productionId}`),

  // Comments
  comments:    (productionId: number) => http<Comment[]>(`/api/comments/${productionId}`),
  addComment:  (productionId: number, body: string, isSpoiler = false,
                parentCommentId: number | null = null) =>
    http<Comment>('/api/comments',
      { method: 'POST',
        body: JSON.stringify({ productionId, body, isSpoiler, parentCommentId }) }),
  likeComment: (id: number) =>
    http<{ id: number; likeCount: number }>(`/api/comments/${id}/like`, { method: 'POST' }),
  deleteComment: (id: number) =>
    http(`/api/comments/${id}`, { method: 'DELETE' }),

  // Watchlists
  myWatchlists:  () => http<Watchlist[]>('/api/watchlists'),
  watchlist:     (id: number) => http<WatchlistDetail>(`/api/watchlists/${id}`),
  createWatchlist: (b: { name: string; description?: string; isPublic?: boolean }) =>
    http<Watchlist>('/api/watchlists', { method: 'POST', body: JSON.stringify(b) }),
  addToWatchlist: (watchlistId: number, productionId: number) =>
    http('/api/watchlists/items',
      { method: 'POST', body: JSON.stringify({ watchlistId, productionId }) }),
  removeFromWatchlist: (watchlistId: number, productionId: number) =>
    http(`/api/watchlists/${watchlistId}/items/${productionId}`, { method: 'DELETE' }),
  deleteWatchlist: (id: number) =>
    http(`/api/watchlists/${id}`, { method: 'DELETE' }),
  markWatched:    (productionId: number) =>
    http(`/api/watchlists/history/${productionId}`, { method: 'POST' }),
  watchHistory:   () =>
    http<WatchHistoryItem[]>('/api/watchlists/history'),
  removeFromHistory: (productionId: number) =>
    http(`/api/watchlists/history/${productionId}`, { method: 'DELETE' }),

  // Recommendations
  recommendations: (take = 12) =>
    http<ProductionListItem[]>(`/api/recommendations?take=${take}`),
  aiRecommendations: (prefs: AIPreferences | null, take = 12) =>
    http<AIRecommendationResult>(`/api/recommendations/ai?take=${take}`, {
      method: 'POST',
      body: JSON.stringify(prefs ?? {})
    }),

  // Admin
  adminUsers:      (q?: string) => {
    const sp = q ? `?q=${encodeURIComponent(q)}` : '';
    return http<AdminUser[]>(`/api/admin/users${sp}`);
  },
  adminChangeRole: (userId: number, role: 'User' | 'Editor' | 'Admin') =>
    http(`/api/admin/users/${userId}/role`,
      { method: 'PUT', body: JSON.stringify({ role }) }),
  adminDeleteUser: (userId: number) =>
    http(`/api/admin/users/${userId}`, { method: 'DELETE' }),
  adminStats:      () => http<AdminStats>('/api/admin/stats'),

  adminComments: (params: {
    q?: string; userId?: number; productionId?: number;
    page?: number; pageSize?: number;
  } = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
    });
    return http<{
      total: number; page: number; pageSize: number;
      items: AdminComment[];
    }>(`/api/admin/comments?${sp.toString()}`);
  },
  adminDeleteComment: (id: number) =>
    http(`/api/admin/comments/${id}`, { method: 'DELETE' })
};

// Admin types
export type AdminUser = {
  id: number; username: string; email: string;
  role: 'User' | 'Editor' | 'Admin';
  avatarUrl?: string | null; createdAt: string;
  ratingCount: number; commentCount: number; watchlistCount: number;
};

export type AdminStats = {
  totalUsers: number; totalAdmins: number; totalEditors: number;
  totalProductions: number; totalRatings: number;
  totalComments: number; totalWatchlists: number;
};

export type AIPreferences = {
  genres?: string[];
  mood?:   string;
  era?:    string;
};

export type AIRecommendationResult = {
  items: ProductionListItem[];
  reason?: string | null;
  coldStart: boolean;
  requiresPreferences?: boolean;
  message?: string;
};

export type AdminComment = {
  id: number;
  userId: number; username: string;
  productionId: number; productionTitle: string;
  body: string; isSpoiler: boolean;
  likeCount: number;
  createdAt: string;
};
