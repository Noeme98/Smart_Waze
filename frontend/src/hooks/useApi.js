/**
 * Hook that exposes authenticated API helpers for React components.
 */

import { useAuth } from '../pages/AuthPages';
import { apiClient } from '../services/apiClient';
import { useEffect } from 'react';

export const useApi = () => {
  const { accessToken, isAuthenticated } = useAuth();

  // Keep the shared API client aligned with the current auth state.
  useEffect(() => {
    if (accessToken) {
      const refreshToken = localStorage.getItem('refresh_token');
      apiClient.setTokens(accessToken, refreshToken);
    }
  }, [accessToken]);

  return {
    get: async (endpoint, options = {}) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      return apiClient.get(endpoint, options);
    },

    post: async (endpoint, data, options = {}) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      return apiClient.post(endpoint, data, options);
    },

    put: async (endpoint, data, options = {}) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      return apiClient.put(endpoint, data, options);
    },

    patch: async (endpoint, data, options = {}) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      return apiClient.patch(endpoint, data, options);
    },

    delete: async (endpoint, options = {}) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      return apiClient.delete(endpoint, options);
    },

    isAuthenticated,
  };
};

export default useApi;
