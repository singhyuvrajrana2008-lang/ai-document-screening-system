const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const AUTH_EMAIL_SUFFIX = String(import.meta.env.VITE_SUPABASE_AUTH_EMAIL_SUFFIX || '@verifai.local');

export interface ApiErrorShape {
  code?: string;
  message?: string;
}

export interface ScreeningListItem {
  screening_id: string;
  document_type: string;
  risk_level: 'low' | 'medium' | 'high';
  status: string;
  action?: string;
  created_at: string;
}

export interface DashboardStats {
  documents_screened: number;
  low_risk: number;
  medium_risk: number;
  high_risk: number;
  tampering_flags: number;
}

function getToken(): string | null {
  return localStorage.getItem('verifai_access_token');
}

function setSession(accessToken: string, refreshToken?: string) {
  localStorage.setItem('verifai_access_token', accessToken);
  if (refreshToken) localStorage.setItem('verifai_refresh_token', refreshToken);
}

export function clearSession() {
  localStorage.removeItem('verifai_access_token');
  localStorage.removeItem('verifai_refresh_token');
}

function authEmail(officerId: string) {
  const value = officerId.trim();
  return value.includes('@') ? value : `${value}${AUTH_EMAIL_SUFFIX}`;
}

export async function signInOfficer(officerId: string, password: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: authEmail(officerId), password }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.msg || 'Invalid officer credentials.');
  }

  setSession(payload.access_token, payload.refresh_token);
  return payload;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const error = payload?.error as ApiErrorShape | undefined;
    if (response.status === 401) clearSession();
    throw new Error(error?.message || `API request failed (${response.status})`);
  }

  return payload?.data as T;
}

export function getScreenings(params: { page?: number; limit?: number; risk?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.risk) query.set('risk', params.risk);
  if (params.status) query.set('status', params.status);
  const suffix = query.toString() ? `?${query}` : '';
  return request<{ items: ScreeningListItem[]; page: number; limit: number; total: number }>(`/screenings${suffix}`);
}

export function getDashboardStats() {
  return request<DashboardStats>('/dashboard/stats');
}

export function getScreening(screeningId: string) {
  return request<Record<string, unknown>>(`/screenings/${encodeURIComponent(screeningId)}`);
}

export function createScreening(formData: FormData) {
  return request<{ screening_id: string; status: string; document_id: string }>('/screenings', {
    method: 'POST',
    body: formData,
  });
}

export function runScreening(screeningId: string) {
  return request<{ screening_id: string; status: string }>(`/screenings/${encodeURIComponent(screeningId)}/run`, {
    method: 'POST',
  });
}

export function submitOfficerAction(screeningId: string, action: 'approved' | 'manual_review' | 'rejected' | 'escalated') {
  return request<{ screening_id: string; action: string; status: string }>(`/screenings/${encodeURIComponent(screeningId)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}
