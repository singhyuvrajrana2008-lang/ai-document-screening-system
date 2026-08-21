const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

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
