import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refresh() {
  if (!refreshToken) throw new Error('No refresh token');
  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const tokens = response.data as { accessToken: string; refreshToken: string };
  setTokens(tokens);
  return tokens.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => refreshQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      originalRequest._retry = true;
      try {
        await refresh();
        refreshQueue.forEach((resolve) => resolve());
        refreshQueue = [];
        return api(originalRequest);
      } catch (err) {
        clearTokens();
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
