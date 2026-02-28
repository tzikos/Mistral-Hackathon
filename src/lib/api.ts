// In dev, VITE_API_URL is empty → falls back to "/api" (Vite proxy handles it)
// In production (Vercel), set VITE_API_URL to your Render backend URL
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function apiUrl(path: string): string {
    return `${API_BASE}${path}`;
}
