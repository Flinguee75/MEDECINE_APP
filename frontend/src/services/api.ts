import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important pour les cookies de session
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
