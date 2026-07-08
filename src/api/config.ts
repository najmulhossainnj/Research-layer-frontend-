/**
 * Centralized API configuration
 * All API URLs should use these constants instead of hardcoding
 */

// Default backend URL - change this when deploying to production
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://hedge-fund-backend-core.onrender.com/api/v1';

// Export for use in SSE/EventSource connections
export const API_WS_URL = (import.meta as any).env?.VITE_API_WS_URL ?? 'wss://hedge-fund-backend-core.onrender.com/api/v1';
