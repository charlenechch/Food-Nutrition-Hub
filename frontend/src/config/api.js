const isDevelopment = import.meta.env.MODE === 'development';

export const API_URL = isDevelopment 
  ? "http://localhost:5000/api"
  : "https://food-nutrition-hub-production.up.railway.app/api";

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