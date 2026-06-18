import { useEffect, useState } from "react";
import { apiClient } from "app";

// Shared admin-session logic used by the calendar and event-manager pages:
// stores the token, restores/verifies it on load, and exposes the auth header
// for admin-only API calls.

const ADMIN_TOKEN_KEY = "hollywood_admin_token";

export interface AdminSession {
  /** Current admin token, or null when not signed in. */
  adminToken: string | null;
  /** Convenience flag: true when a token is held. */
  isAdmin: boolean;
  /** False until the stored token has been verified on mount. */
  authChecked: boolean;
  /** Attempt login with a password; resolves true on success. */
  login: (password: string) => Promise<boolean>;
  /** Clear the session locally and on the server. */
  logout: () => Promise<void>;
  /** RequestParams carrying the admin token header for protected calls. */
  authHeaders: () => { headers: { "X-Admin-Token": string } };
}

export function useAdminSession(): AdminSession {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Restore and verify any previously stored token on mount.
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!stored) {
      setAuthChecked(true);
      return;
    }
    apiClient.admin_verify({ token: stored })
      .then(res => res.json())
      .then(data => {
        if (data.valid) setAdminToken(stored);
        else localStorage.removeItem(ADMIN_TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(ADMIN_TOKEN_KEY))
      .finally(() => setAuthChecked(true));
  }, []);

  const login = async (password: string): Promise<boolean> => {
    const res = await apiClient.admin_login({ password });
    const data = await res.json();
    if (data.token) {
      setAdminToken(data.token);
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    if (adminToken) {
      try { await apiClient.admin_logout({ token: adminToken }); } catch { /* ignore */ }
    }
    setAdminToken(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  const authHeaders = () => ({ headers: { "X-Admin-Token": adminToken ?? "" } });

  return { adminToken, isAdmin: !!adminToken, authChecked, login, logout, authHeaders };
}
