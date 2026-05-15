/**
 * API client with token persistence and automatic refresh support.
 *
 * Responsibilities:
 * - Persist access and refresh tokens
 * - Retry authenticated requests after a successful refresh
 * - Normalize error handling for API consumers
 */

import { getApiBaseUrl } from "../config/apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

/**
 * Decode a JWT payload for local inspection.
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

class ApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    
    // Restore persisted tokens during initialization.
    this.restoreTokens();
  }

  /**
   * Restore tokens from localStorage.
   */
  restoreTokens() {
    const refreshToken = localStorage.getItem('refresh_token');
    const accessToken = localStorage.getItem('access_token');

    if (refreshToken) {
      this.refreshToken = refreshToken;
    }

    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  /**
   * Set authentication tokens.
   */
  setTokens(access, refresh) {
    this.accessToken = access;
    this.refreshToken = refresh;

    // Persist tokens between page reloads.
    if (access) {
      localStorage.setItem('access_token', access);
    }
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }

    // Validate the presence of claims expected by the client.
    const accessPayload = access ? decodeJWT(access) : null;
    const refreshPayload = refresh ? decodeJWT(refresh) : null;

    if (accessPayload && (!accessPayload.user_id || !accessPayload.user_type)) {
      console.error('Access token is missing required claims.', accessPayload);
    }

    if (refresh && !refreshPayload) {
      console.error('Refresh token could not be decoded.');
    }
  }

  /**
   * Clear authentication tokens.
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    // Remove persisted authentication state.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Get the current access token.
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Resolve or reject requests that were queued during token refresh.
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  /**
   * Refresh the access token.
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.data.access) {
        this.accessToken = data.data.access;
        return data.data.access;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed.', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Make an authenticated request.
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const isFormDataBody = options.body instanceof FormData;

    // Apply a default JSON content type unless the body is multipart form data.
    const headers = {
      ...options.headers,
    };
    if (!isFormDataBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const method = (options.method || "GET").toUpperCase();

    // Public: no Bearer required. Note: only citizen *registration* (POST) is public;
    // GET /citizens/... requires JWT (IsAuthenticated on the backend).
    const isPublicEndpoint =
      !endpoint.includes("/reports") &&
      (endpoint.includes("/auth/login/citizen/") ||
        endpoint.includes("/auth/login/authority/") ||
        endpoint.includes("/auth/login/admin/") ||
        endpoint.includes("/auth/logout/") ||
        endpoint.includes("/auth/refresh/") ||
        (endpoint.includes("/citizens/") && method === "POST") ||
        endpoint.includes("/categories/") ||
        endpoint.includes("/subcategories/"));
    
    if (this.accessToken && !isPublicEndpoint) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (!isPublicEndpoint) {
      console.warn('Authenticated request issued without an access token.', endpoint);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Retry once after refreshing the token for authenticated requests.
      if (response.status === 401 && !isPublicEndpoint) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then(token => {
              headers['Authorization'] = `Bearer ${token}`;
              return fetch(url, { ...options, headers });
            })
            .then(response => response.json());
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.processQueue(null, newToken);

          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse.json();
        } catch (refreshError) {
          this.isRefreshing = false;
          this.processQueue(refreshError, null);
          
          console.error('Token refresh failed. Redirecting to login.');
          window.location.href = '/auth';
          throw refreshError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || data.detail || `HTTP ${response.status}: ${response.statusText}`);
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request failed.', error);
      throw error;
    }
  }

  /**
   * Convenience methods.
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export default ApiClient;
