export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

export function getCurrentGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem('efcpa_google_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setGoogleUser(user: GoogleUser | null) {
  try {
    if (user) {
      localStorage.setItem('efcpa_google_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('efcpa_google_user');
    }
  } catch {}
}
