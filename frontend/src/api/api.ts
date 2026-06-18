import axios from 'axios';

// Create configured Axios instance
const API = axios.create({
  baseURL: '/api', // Relative path pointing directly to Express endpoints on same origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Request Interceptor to dynamically attach the JWT token on every protected API call
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
