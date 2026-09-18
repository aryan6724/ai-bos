import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/authService";

import socket from "../socket/socket";

const AuthContext = createContext(null);

const TOKEN_KEY = "ai_bos_token";

const getStoredToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const storeToken = (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Authentication token was not provided.");
  }

  sessionStorage.setItem(TOKEN_KEY, token);
};

const clearStoredToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() => getStoredToken());

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ======================================================
  // Check Existing Authentication
  // ======================================================

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const data = await getCurrentUser();

        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        clearStoredToken();

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ======================================================
  // Socket Authentication
  // ======================================================

  useEffect(() => {
    if (!user?.id || !token) {
      if (socket.connected) {
        socket.disconnect();
      }

      return;
    }

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect");
    };
  }, [user, token]);

  // ======================================================
  // Register
  // ======================================================

  const register = async (formData) => {
    const data = await registerUser(formData);

    storeToken(data.token);

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // ======================================================
  // Login
  // ======================================================

  const login = async (formData) => {
    const data = await loginUser(formData);

    storeToken(data.token);

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // ======================================================
  // Logout
  // ======================================================

  const logout = () => {
    clearStoredToken();

    setToken(null);
    setUser(null);

    if (socket.connected) {
      socket.disconnect();
    }

    socket.auth = {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isCheckingAuth,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
