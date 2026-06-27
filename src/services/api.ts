import axios, { type AxiosError } from "axios";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  baseURL: "https://fms-backend-fudc.onrender.com/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { Authorization: `Bearer ${refreshToken}` } },
          );
          const newToken = data.data.access_token;
          localStorage.setItem("access_token", newToken);
          if (original) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          }
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
