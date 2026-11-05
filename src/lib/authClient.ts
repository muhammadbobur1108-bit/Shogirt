import { AppUser } from '../types';

const TOKEN_KEY = 'chust_erp_auth_token';
const USER_KEY = 'chust_erp_session_user';
const REMEMBERED_KEY = 'chust_erp_remembered_user';

export function getStoredAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string, rememberMe = false): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Token storage error:', e);
  }
}

export function clearStoredAuthToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBERED_KEY);
  } catch (e) {
    console.warn('Token removal error:', e);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user?: AppUser;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AppUser;
  token?: string;
  error?: string;
}

export async function checkCurrentSession(): Promise<AuthMeResponse> {
  try {
    const headers = getAuthHeaders();
    const resp = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Sends HttpOnly cookie automatically
      headers,
    });

    if (!resp.ok) {
      return { authenticated: false };
    }

    const data = await resp.json();
    return data;
  } catch (err: any) {
    console.warn('Session check failed:', err);
    return { authenticated: false, error: err.message };
  }
}

export async function loginUser(
  username: string, 
  pinOrPass: string, 
  rememberMe = false
): Promise<LoginResponse> {
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // Receives HttpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password: pinOrPass,
        rememberMe,
      }),
    });

    const data = await resp.json();
    if (data.success && data.token) {
      setStoredAuthToken(data.token, rememberMe);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'Serverga ulanishda xatolik yuz berdi: ' + err.message,
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const headers = getAuthHeaders();
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers,
    });
  } catch (err) {
    console.warn('Logout API error:', err);
  } finally {
    clearStoredAuthToken();
  }
}
