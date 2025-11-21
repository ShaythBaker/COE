// src/helpers/api_helper.jsx
import axios from "axios";

// Base URL for your backend
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:3025";

const axiosApi = axios.create({
  baseURL: API_URL,
});

// Attach token from localStorage.authUser on every request
axiosApi.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const authUser = JSON.parse(raw);

        // We gave the backend response multiple token fields earlier
        const token =
          authUser.token ||
          authUser.accessToken ||
          authUser.TOKEN ||
          (authUser.user &&
            (authUser.user.token ||
             authUser.user.accessToken ||
             authUser.user.TOKEN));

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore JSON parse errors, send request without auth
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Keep simple response interceptor
axiosApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Helpers
export async function get(url, config = {}) {
  const response = await axiosApi.get(url, config);
  return response.data;
}

export async function post(url, data, config = {}) {
  const response = await axiosApi.post(url, data, config);
  return response.data;
}

export async function put(url, data, config = {}) {
  const response = await axiosApi.put(url, data, config);
  return response.data;
}

export async function del(url, config = {}) {
  const response = await axiosApi.delete(url, config);
  return response.data;
}
