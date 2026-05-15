/**
 * Legacy API service built on top of `apiClient`.
 *
 * Prefer `useApi` for new React code. This module remains in place for
 * existing consumers that still depend on the older service surface.
 */

import { apiClient } from './apiClient';

export const categoryAPI = {
  getAll: async () => {
    const data = await apiClient.get('/categories/');
    return data.results || data;
  },

  getById: async (id) => {
    const data = await apiClient.get(`/categories/${id}/`);
    return data;
  },

  getSubcategories: async (categoryId) => {
    const data = await apiClient.get(`/categories/${categoryId}/subcategories/`);
    return data;
  },
};

export const subCategoryAPI = {
  getAll: async () => {
    const data = await apiClient.get('/subcategories/');
    return data.results || data;
  },

  getByCategory: async (categoryId) => {
    const data = await apiClient.get(`/subcategories/?category=${categoryId}`);
    return data.results || data;
  },

  getById: async (id) => {
    const data = await apiClient.get(`/subcategories/${id}/`);
    return data;
  },
};

/** System admin only (JWT user_type admin) */
export const authorityAPI = {
  list: async () => {
    const data = await apiClient.get('/authorities/');
    return Array.isArray(data) ? data : data.results || [];
  },
  create: async (payload) => apiClient.post('/authorities/', payload),
  patch: async (id, payload) => apiClient.patch(`/authorities/${id}/`, payload),
  delete: async (id) => apiClient.delete(`/authorities/${id}/`),
};

/** System admin only for list/update/delete */
export const citizenAPI = {
  list: async () => {
    const data = await apiClient.get('/citizens/');
    return Array.isArray(data) ? data : data.results || [];
  },
};

export const reportAPI = {
  create: async (reportData) => {
    const data = await apiClient.post('/reports/', reportData);
    return data;
  },

  getAll: async () => {
    const data = await apiClient.get('/reports/');
    return data;
  },

  getAuthorityReports: async () => {
    const data = await apiClient.get('/reports/');
    return data;
  },

  getById: async (id) => {
    const data = await apiClient.get(`/reports/${id}/`);
    return data;
  },

  update: async (id, reportData) => {
    const data = await apiClient.put(`/reports/${id}/`, reportData);
    return data;
  },

  delete: async (id) => {
    const data = await apiClient.delete(`/reports/${id}/`);
    return data;
  },

  updateStatus: async (reportId, statusId) => {
    const { data } = await apiClient.patch(`/reports/${reportId}/status/`, { status_id: statusId });
    return data;
  },

  /** System admin only — pass null or "" to clear override (subcategory default applies). */
  assignAuthority: async (reportId, authorityId) => {
    const body =
      authorityId === "" || authorityId === undefined || authorityId === null
        ? { authority_id: null }
        : { authority_id: Number(authorityId) };
    return apiClient.patch(`/reports/${reportId}/assign-authority/`, body);
  },

  getStats: async () => {
    const { data } = await apiClient.get("/reports/stats/");
    return data;
  },

  getAdminOverview: async () => {
    const data = await apiClient.get("/reports/admin-overview/");
    return data;
  },
};
