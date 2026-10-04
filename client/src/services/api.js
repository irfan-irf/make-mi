import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => { unauthorizedHandler = handler; };
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) unauthorizedHandler?.();
    return Promise.reject(error);
  },
);

export const responseData = (response) => response.data?.data;
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.message || fallback;
export default api;
