import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const configAPI = {
  getConfig: (id) => api.get(`/api/config/${id}`),
  saveConfig: (formData) => api.post('/api/config/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const imagesAPI = {
  getImages: () => api.get('/api/images'),
  uploadImages: (formData) => api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (name) => api.delete(`/api/delete/${name}`),
  reorderImages: (order) => api.post('/api/reorder', order),
};

export const resultAPI = {
  setResult: (result, platformId) => api.post('/api/set_result', { 
    result, 
    platform_id: platformId 
  }),
  getResult: (id) => api.get(`/api/results/${id}`),
  getResultWithTimers: (id) => api.get(`/api/results/${id}/full`),
  saveResult: (data) => api.post('/api/result_save', data),
  saveTimers: (data) => api.post('/api/save_timers', data),
  getTimers: (resultId) => api.get(`/api/timers/${resultId}`),
};

export default api;