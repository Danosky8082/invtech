import axios from 'axios';

// Replace with your actual backend URL from step 2
const BACKEND_URL = 'https://invtech-backend-abc123.vercel.app/api';

const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? BACKEND_URL : 'http://localhost:5000/api'
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem('token');
  if (token) req.headers['x-auth-token'] = token;
  return req;
});

export const signup = (userData) => API.post('/auth/signup', userData);
export const login = (userData) => API.post('/auth/login', userData);
export const getExchangeRate = () => API.get('/market/exchange-rate');
export const getNews = (country = 'us') => API.get(`/market/news?country=${country}`);
export const detectCountry = () => API.get('/market/detect-country');
export const getAssets = () => API.get('/simulation/assets');
export const simulateInvestment = (data) => API.post('/simulation/simulate', data);
export const getHistory = () => API.get('/simulation/history');

export { API as api };