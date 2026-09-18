import axios from "axios";

const TOKEN_KEY = "ai_bos_token";
const LOGIN_PATH = "/login";

let isRedirectingToLogin = false;

const clearAuthenticationSession = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage access errors.
  }
};

const redirectToLogin = () => {
  if (
    typeof window === "undefined" ||
    isRedirectingToLogin ||
    window.location.pathname === LOGIN_PATH
  ) {
    return;
  }

  isRedirectingToLogin = true;

  const currentPath =
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const loginUrl =
    currentPath && currentPath !== LOGIN_PATH
      ? `${LOGIN_PATH}?returnTo=${encodeURIComponent(currentPath)}`
      : LOGIN_PATH;

  window.location.replace(loginUrl);
};

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    let token = null;

    try {
      token = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
      }
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // A 401 means the current authentication is no longer accepted.
    if (status === 401) {
      clearAuthenticationSession();
      redirectToLogin();
    }

    // 403 means the user is authenticated but is not allowed
    // to perform the requested action. Do not log the user out.
    if (status === 403) {
      error.isForbidden = true;
    }

    return Promise.reject(error);
  }
);

export default api;
