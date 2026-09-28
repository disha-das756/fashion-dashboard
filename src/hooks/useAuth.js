import { useState } from "react";

const API_BASE_URL = "http://localhost:8000";

const parseErrorMessage = (detail, defaultMsg = "Authentication failed.") => {
  if (!detail) return defaultMsg;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((err) => (typeof err === "object" ? err.msg || JSON.stringify(err) : String(err)))
      .join(", ");
  }
  if (typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }
  return String(detail);
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("buyMoreUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLoginApi = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const userData = { username, token: data.access_token };
        setCurrentUser(userData);
        localStorage.setItem("buyMoreUser", JSON.stringify(userData));
        setAuthSuccess("Successfully authenticated!");
        return true;
      } else {
        const data = await res.json();
        setAuthError(parseErrorMessage(data.detail, "Authentication failed."));
        return false;
      }
    } catch (err) {
      setAuthError("Could not connect to authentication server.");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e?.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsAuthLoading(true);

    if (authMode === "register") {
      if (!authForm.username || !authForm.email || !authForm.password) {
        setAuthError("All fields are required.");
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authForm),
        });

        if (res.ok) {
          setAuthSuccess("Account created! Logging you in...");
          return await handleLoginApi(authForm.username, authForm.password);
        } else {
          const data = await res.json();
          setAuthError(parseErrorMessage(data.detail, "Registration failed."));
          setIsAuthLoading(false);
          return false;
        }
      } catch (err) {
        setAuthError("Could not connect to authentication server.");
        setIsAuthLoading(false);
        return false;
      }
    } else {
      if (!authForm.username || !authForm.password) {
        setAuthError("Username and password are required.");
        setIsAuthLoading(false);
        return false;
      }
      return await handleLoginApi(authForm.username, authForm.password);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("buyMoreUser");
  };

  return {
    currentUser,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    authError,
    authSuccess,
    isAuthLoading,
    handleAuthSubmit,
    handleLogout,
  };
}
