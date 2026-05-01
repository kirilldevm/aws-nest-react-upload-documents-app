import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const normalizedApiBase =
  typeof rawApiBase === 'string' ? rawApiBase.trim().replace(/\/+$/, '') : '';

export const API_BASE_URL =
  normalizedApiBase ||
  (import.meta.env.PROD
    ? 'https://api.random-domain.win'
    : 'http://localhost:3000');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

