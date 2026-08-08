import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://192.168.1.164:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- token storage helpers (kept here so both the client and the slice agree on keys) ---
const ID_TOKEN_KEY = "idToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenStorage = {
  getIdToken: () => localStorage.getItem(ID_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (idToken: string, refreshToken: string) => {
    localStorage.setItem(ID_TOKEN_KEY, idToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Attach idToken to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getIdToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Shape returned by the refresh endpoint (Firebase's secure-token REST API uses
// snake_case, not the idToken/refreshToken casing used elsewhere in this app).
interface RefreshResponse {
  id_token: string;
  refresh_token: string;
  access_token?: string;
  expires_in?: string;
  token_type?: string;
  user_id?: string;
  project_id?: string;
}

// Handle 401s by attempting a refresh once, then retrying the original request.
// Queues concurrent 401s so we don't fire /auth/refresh multiple times in parallel.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.location.assign("/login");
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Wait for the in-flight refresh to finish, then retry with the new token
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<RefreshResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newIdToken = data.id_token;
      const newRefreshToken = data.refresh_token ?? refreshToken;

      if (!newIdToken) {
        throw new Error("Refresh response did not include an id_token");
      }

      tokenStorage.setTokens(newIdToken, newRefreshToken);
      resolveQueue(newIdToken);

      originalRequest.headers.set("Authorization", `Bearer ${newIdToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolveQueue(null);
      tokenStorage.clear();
      window.location.assign("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
