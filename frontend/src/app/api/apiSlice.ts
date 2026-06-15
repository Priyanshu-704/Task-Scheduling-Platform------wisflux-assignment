import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../store/slices/authSlice';
import axios from 'axios';
import type { AxiosError } from 'axios';

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/v1',
});

const axiosBaseQuery = (): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> => async (args, api) => {
  const requestConfig = typeof args === 'string' ? { url: args } : args;
  const { url, method = 'GET', body, params, headers } = requestConfig;

  try {
    const state = api.getState() as any;
    const token = state.auth?.token;
    const workspaceId = state.workspace?.activeWorkspaceId;

    const requestHeaders: Record<string, string> = {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        requestHeaders[key] = value;
      }
    } else if (headers && typeof headers === 'object') {
      Object.assign(requestHeaders, headers);
    }

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (workspaceId) {
      requestHeaders['x-workspace-id'] = workspaceId;
    }

    const response = await axiosInstance({
      url,
      method,
      data: body,
      params,
      headers: requestHeaders,
    });

    // Unwrap response envelope from NestJS TransformInterceptor
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      return { data: responseData.data };
    }
    return { data: responseData };
  } catch (axiosError) {
    const err = axiosError as AxiosError;
    return {
      error: {
        status: err.response?.status || 500,
        data: err.response?.data || { message: err.message },
      } as FetchBaseQueryError,
    };
  }
};

const baseQuery = axiosBaseQuery();

// Mutex lock equivalent for refreshing token
let refreshPromise: Promise<string | null> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      if (!refreshPromise) {
        const refreshQuery = async (): Promise<string | null> => {
          try {
            const refreshResult = await baseQuery(
              {
                url: '/auth/refresh',
                method: 'POST',
                body: { refreshToken },
              },
              api,
              extraOptions
            );

            if (refreshResult.data) {
              const data = refreshResult.data as { accessToken: string; refreshToken: string; user?: any };
              const user = data.user || (api.getState() as any).auth?.user;
              
              api.dispatch(
                setCredentials({
                  token: data.accessToken,
                  user,
                })
              );
              
              localStorage.setItem('refresh_token', data.refreshToken);
              return data.accessToken;
            }
            return null;
          } catch {
            return null;
          } finally {
            refreshPromise = null;
          }
        };

        refreshPromise = refreshQuery();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Retry initial query with the fresh token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, force logout
        api.dispatch(logout());
        localStorage.removeItem('refresh_token');
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'Project', 'Task', 'Comment', 'Notification', 'User', 'Session', 'Dashboard', 'AuditLog'],
  endpoints: () => ({}),
});
