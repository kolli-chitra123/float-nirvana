// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/api/health',
  
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    ADMIN_LOGIN: '/api/auth/admin/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh'
  },
  
  // Sessions
  SESSIONS: '/api/sessions',
  
  // Bookings
  BOOKINGS: '/api/bookings',
  
  // Admin routes
  ADMIN: {
    BOOKINGS: '/api/admin/bookings',
    USERS: '/api/admin/users',
    ROOMS: '/api/admin/rooms',
    SERVICES: '/api/admin/services',
    BUNDLES: '/api/admin/bundles',
    FEEDBACK: '/api/admin/feedback',
    NOTIFICATIONS: '/api/admin/notifications',
    ANALYTICS: '/api/admin/analytics'
  },
  
  // Admin actions
  ADMIN_ACTIONS: {
    ASSIGN_ROOM: (bookingId: string) => `/api/admin/bookings/${bookingId}/assign-room`,
    UPDATE_BOOKING_STATUS: (bookingId: string) => `/api/admin/bookings/${bookingId}/status`,
    UPDATE_USER_STATUS: (userId: string) => `/api/admin/users/${userId}/status`
  },
  
  // General
  NOTIFICATIONS: '/api/notifications'
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// API utility functions
export const api = {
  // GET request
  get: async (endpoint: string, params?: Record<string, any>) => {
    const url = new URL(API_BASE_URL + endpoint);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // POST request
  post: async (endpoint: string, data?: any) => {
    const response = await fetch(API_BASE_URL + endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // PUT request
  put: async (endpoint: string, data?: any) => {
    const response = await fetch(API_BASE_URL + endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // DELETE request
  delete: async (endpoint: string) => {
    const response = await fetch(API_BASE_URL + endpoint, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Health check function
export const checkServerHealth = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.HEALTH);
    console.log('✅ Backend server is healthy:', response);
    return response;
  } catch (error) {
    console.error('❌ Backend server health check failed:', error);
    throw error;
  }
};

// Export API base URL for other uses
export { API_BASE_URL };

export default api;
