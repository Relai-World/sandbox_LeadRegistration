// API Configuration - Use relative path for Vite proxy
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API Endpoints
export const API_ENDPOINTS = {
  // User endpoints
  LOGIN: `${API_BASE_URL}/api/user/login`,

  // Project endpoints
  SHORTFORM: `${API_BASE_URL}/api/unverified/shortform`,
  VERIFY_PROJECT: (reraNumber: string) => `${API_BASE_URL}/api/unverified/verifyProject/${reraNumber}?action=verify`,
  DRAFTS_BY_EMAIL: (email: string) => `${API_BASE_URL}/api/unverified/DraftData/${email}`,

  // Test endpoint
  TEST: `${API_BASE_URL}/api/test`,
} as const;

// API Helper functions
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(endpoint, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};