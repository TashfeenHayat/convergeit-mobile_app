import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getApiBaseUrl } from '@/api/config';
import { pathFromConfig } from '@/api/http/http-path';
import {
  isPublicAuthRoute,
  isWidgetVisitorRoute,
} from '@/api/http/public-routes';
import {
  queueRequestUntilRefreshed,
  waitForSessionRefresh,
} from '@/api/session/refresh-access-token';
import { clearTokens, getAccessToken } from '@/api/storage/token-storage';
import { logApiError } from '@/lib/api/errors';

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const apiBaseUrl = getApiBaseUrl();

if (__DEV__) {
  console.log(`[API] baseURL = ${apiBaseUrl}`);
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  if (isPublicAuthRoute(config)) {
    // Never attach a stale Bearer on login / public auth routes.
    delete config.headers.Authorization;
    if (isWidgetVisitorRoute(config)) {
      delete config.headers.Authorization;
    }
    if (__DEV__) {
      const method = (config.method ?? 'get').toUpperCase();
      const url = `${config.baseURL ?? apiBaseUrl}${config.url ?? ''}`;
      console.log(`[API →] ${method} ${url}`);
      if (config.data != null) {
        console.log('[API →] body:', config.data);
      }
    }
    return config;
  }

  await waitForSessionRefresh();

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    const method = (config.method ?? 'get').toUpperCase();
    const url = `${config.baseURL ?? apiBaseUrl}${config.url ?? ''}`;
    console.log(`[API →] ${method} ${url}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const method = (response.config.method ?? 'get').toUpperCase();
      const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
      console.log(`[API OK] ${method} ${url} → ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const status = error.response?.status;
    const path = originalRequest ? pathFromConfig(originalRequest) : '';

    if (__DEV__) {
      logApiError(path || 'request', error);
    }

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicAuthRoute(originalRequest)
    ) {
      return Promise.reject(error);
    }

    if (path.endsWith('/auth/refresh')) {
      await clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await queueRequestUntilRefreshed();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch {
      await clearTokens();
      return Promise.reject(error);
    }
  },
);
