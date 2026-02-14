import axios from 'axios';

const API = axios.create({
  baseURL: 'https://pic2speak-backend.onrender.com/api/v1',
    // baseURL: 'http://localhost:8081/api/v1'

 
});

// Request Interceptor: Add token to headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;