// Centralised API configuration.
// All service files and baseApi resolve these values from here.

export const API_BASE_URL   = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const API_TIMEOUT_MS = 30_000;

// Header name the backend expects for the bearer token
export const AUTH_HEADER     = 'Authorization';
export const TOKEN_STORAGE_KEY = 'glass_erp_token';
