import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Función inteligente para detectar la IP del backend según el entorno
export const getInitialBaseURL = () => {
  // 1. Si está definido en variables de entorno fijas (y no es localhost en un dispositivo móvil nativo)
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL;

  // 2. En entorno Web: usamos el mismo hostname que cargó la página
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:8000/api`;
    }
    return envUrl || "http://localhost:8000/api";
  }

  // 3. En entorno Móvil Nativo (Expo Go en celular real o emulador):
  // Obtenemos la IP de la máquina de desarrollo a través de hostUri de Expo
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
      return `http://${hostIp}:8000/api`;
    }
  }

  // 4. Emulador de Android
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api";
  }

  // 5. Fallback por defecto
  return "http://localhost:8000/api";
};

let currentBaseURL = getInitialBaseURL();
let currentUserId = null;
let currentAuthToken = null;

const api = axios.create({
  baseURL: currentBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const setApiBaseURL = (newUrl) => {
  if (!newUrl) return;
  const formatted = newUrl.endsWith("/api") ? newUrl : `${newUrl.replace(/\/+$/, "")}/api`;
  currentBaseURL = formatted;
  api.defaults.baseURL = formatted;
};

export const getApiBaseURL = () => currentBaseURL;

export const setApiUserId = (userId) => {
  currentUserId = userId ? String(userId) : null;
};

export const getApiUserId = () => currentUserId;

export const setAuthToken = (token) => {
  currentAuthToken = token ? String(token) : null;
};

export const getAuthToken = () => currentAuthToken;

// Interceptor para inyectar token JWT y x-user-id en cada request
api.interceptors.request.use((config) => {
  if (currentAuthToken) {
    config.headers["Authorization"] = `Bearer ${currentAuthToken}`;
  }
  if (currentUserId) {
    config.headers["x-user-id"] = currentUserId;
  }
  return config;
});

export default api;
