// API version used by the backend.
// VITE_API_BASE_URL must include the full base (e.g. https://api.example.com/api/v1).
export const API_VERSION = 'v1';

// Re-export connection constants consumed across the app.
export { API_BASE_URL, API_TIMEOUT_MS, TOKEN_STORAGE_KEY } from '@/services/api/config';
