export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const fetchWithCredentials = async (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};