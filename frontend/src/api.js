import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // ✅ Replace this with your actual Vercel backend URL
    return 'https://invtech-backend.vercel.app/api';
  }
  return 'http://localhost:5000/api';
};

const API = axios.create({ baseURL: getBaseURL() });

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