// src/helpers/api_helper.jsx
import axios from "axios";

// Base URL for your backend
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:3025";

const axiosApi = axios.create({
  baseURL: API_URL,
});

// Helper: clear local storage when token is invalid/expired
const handleInvalidToken = () => {
  try {
    // If you only want to clear auth data, you can do:
    // localStorage.removeItem("authUser");
    // localStorage.removeItem("token");
    // localStorage.removeItem("accessToken");

    // As you requested: clear all localStorage to force re-login
    localStorage.clear();
  } catch (e) {
    console.error("Error clearing localStorage on invalid token:", e);
  }
};

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

// Response interceptor: watch for TOKEN_INVALID_OR_EXPIRED
axiosApi.interceptors.response.use(
  (response) => {
    const data = response && response.data ? response.data : null;

    if (
      data &&
      data.success === false &&
      data.code === "TOKEN_INVALID_OR_EXPIRED"
    ) {
      handleInvalidToken();
      // we still return the response so existing code can read data.success if needed
    }

    return response;
  },
  (error) => {
    const data = error?.response?.data;

    if (
      data &&
      data.success === false &&
      data.code === "TOKEN_INVALID_OR_EXPIRED"
    ) {
      handleInvalidToken();
    }

    return Promise.reject(error);
  }
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
