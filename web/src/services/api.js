import axios from "axios";
import { API_KEY, API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
});

// Add an interceptor to handle authorization header if needed
// This keeps our API service decoupled from the store, but we might
// need a way to inject the token or read it from localStorage/state.
api.interceptors.request.use((config) => {
  // We'll handle tokens via AuthService or directly here if we want global coverage
  return config;
});

export default api;
