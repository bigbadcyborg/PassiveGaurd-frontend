import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Redirect to login, considering PUBLIC_URL for GitHub Pages
      const loginPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/login` : '/login';
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  }
);

export const scansAPI = {
  list: () => api.get('/scans'),
  get: (scanId) => api.get(`/scans/${scanId}`),
  create: (data) => api.post('/scans', data),
  delete: (scanId) => api.delete(`/scans/${scanId}`),
  getFindings: (scanId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    return api.get(`/scans/${scanId}/findings?${params.toString()}`);
  },
  exportScan: (scanId, format = 'pdf') => {
    return api.get(`/scans/${scanId}/export?format=${format}`, {
      responseType: 'blob',
    });
  },
};

export const findingsAPI = {
  updateStatus: (findingId, status) => 
    api.patch(`/findings/${findingId}/status`, { status }),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export const utilsAPI = {
  ls: (path) => api.get(`/utils/ls?path=${encodeURIComponent(path || '')}`),
};

export default api;

