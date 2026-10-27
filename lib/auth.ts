export type UserRole = 'admin';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin';
  department: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
  displayName: string;
  email?: string;
}

export const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  password: 'admin123',
  displayName: 'Administrator',
  email: 'brainiacscampus@gmail.com',
};

const ADMIN_CREDS_KEY = 'brainiacs_admin_creds_v1';
const AUTH_STORAGE_KEY = 'brainiacs_current_user_v1';

/**
 * Get current admin credentials from localStorage or fallback to default
 */
export function getAdminCredentials(): AdminCredentials {
  if (typeof window === 'undefined') return DEFAULT_ADMIN;
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    if (!raw) return DEFAULT_ADMIN;
    const parsed = JSON.parse(raw);
    if (parsed.username && parsed.password) {
      return {
        username: parsed.username.trim(),
        password: parsed.password.trim(),
        displayName: parsed.displayName || 'Administrator',
        email: parsed.email || DEFAULT_ADMIN.email,
      };
    }
  } catch (e) {
    console.error('Failed to read admin credentials from localStorage:', e);
  }
  return DEFAULT_ADMIN;
}

/**
 * Update admin username & password
 */
export function updateAdminCredentials(
  newUsername: string,
  newPassword: string,
  newDisplayName?: string,
  newEmail?: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser' };

  const u = newUsername.trim();
  const p = newPassword.trim();

  if (!u) {
    return { success: false, error: 'Username cannot be empty.' };
  }
  if (!p || p.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters long.' };
  }

  const current = getAdminCredentials();
  const updated: AdminCredentials = {
    username: u,
    password: p,
    displayName: (newDisplayName && newDisplayName.trim()) || current.displayName || 'Administrator',
    email: (newEmail && newEmail.trim()) || current.email || DEFAULT_ADMIN.email,
  };

  try {
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(updated));
    // Also update current session if active
    const currentUser = getStoredUser();
    if (currentUser) {
      setStoredUser({
        ...currentUser,
        username: updated.username,
        displayName: updated.displayName,
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to save new credentials to storage.' };
  }
}

/**
 * Reset admin password using verification code
 */
export function resetAdminPassword(newPassword: string): { success: boolean; error?: string } {
  const creds = getAdminCredentials();
  return updateAdminCredentials(creds.username, newPassword, creds.displayName, creds.email);
}

/**
 * Authenticate against admin credentials
 */
export function authenticate(
  usernameInput: string,
  passwordInput: string
): { user: AuthUser | null; error?: string } {
  const creds = getAdminCredentials();

  const inputU = usernameInput.trim();
  const inputP = passwordInput.trim();

  if (inputU.toLowerCase() === creds.username.toLowerCase() && inputP === creds.password) {
    const user: AuthUser = {
      id: 'admin-1',
      username: creds.username,
      displayName: creds.displayName,
      role: 'admin',
      department: 'Administration',
    };
    setStoredUser(user);
    return { user, error: undefined };
  }

  return { user: null, error: 'Invalid username or password.' };
}

/**
 * Session storage helpers
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role === 'admin') {
      return parsed as AuthUser;
    }
  } catch (e) {
    console.error('Failed to read session user:', e);
  }
  return null;
}

export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to persist session user:', e);
  }
}

export function clearStoredUser(): void {
  setStoredUser(null);
}
