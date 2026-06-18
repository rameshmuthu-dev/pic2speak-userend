import axios from 'axios';
import { logout } from '../redux/slices/authSlice'; 

const isProduction = process.env.NODE_ENV === 'production' || import.meta.env?.MODE === 'production';

const API = axios.create({
  baseURL: isProduction 
    ? 'https://pic2speak-backend.onrender.com/api/v1' 
    : 'http://localhost:8081/api/v1'
});

API.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response || error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        
        const { store } = await import('../redux/store');
        store.dispatch(logout());
        
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default API;