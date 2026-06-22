import axios from 'axios';

const API = axios.create({ baseURL: process.env.NODE_ENV === 'production'
  ? 'https://invtech-back.onrender.com/api'
  : 'http://localhost:5000/api'
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem('token');
   console.log('[Interceptor] Token being sent:', token ? 'Yes' : 'No');
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
export const getForecast = (ticker, days = 30, scenario = 'neutral') => 
  API.get(`/predictive/forecast/${ticker}?days=${days}&scenario=${scenario}`);
export const getSentiment = (country = 'us') => API.get(`/predictive/sentiment?country=${country}`);
export const getRiskProfile = () => API.get('/predictive/risk-profile');
export const getPortfolio = () => API.get('/portfolio');

export { API as api };