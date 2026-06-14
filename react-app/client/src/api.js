import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Build a full URL for an uploaded image path stored in the DB.
export function imageUrl(image) {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  // New uploads are stored as "uploads/xxx" and served by the API server.
  if (image.startsWith('uploads/')) return `/${image}`;
  return `/${image}`;
}
