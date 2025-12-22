import axios from 'axios';
import { API_URL } from '../config';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session support if mixed
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors (token expiration)
    if (error.response?.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Optional: Redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
