// src/config/csrf.js
export async function getCsrfToken() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken;
  } catch (err) {
    console.error('Failed to get CSRF token:', err);
    return null;
  }
}
