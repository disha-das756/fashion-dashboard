import React from "react";

export function AuthModal({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authError,
  authSuccess,
  isLoading,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="auth-header">
          <h2>{authMode === "login" ? "Welcome Back 👋" : "Create Account 🚀"}</h2>
          <p>{authMode === "login" ? "Sign in to access your wishlist and orders" : "Join BuyMore Haute Couture today"}</p>
        </div>

        <div className="auth-tabs-toggle">
          <button
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            className={`auth-tab ${authMode === "register" ? "active" : ""}`}
            onClick={() => setAuthMode("register")}
          >
            Register
          </button>
        </div>

        {authError && (
          <div className="auth-alert error">
            ⚠️ {typeof authError === "string" ? authError : JSON.stringify(authError)}
          </div>
        )}
        {authSuccess && <div className="auth-alert success">✅ {authSuccess}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              placeholder="e.g. fashionista"
              value={authForm.username}
              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
            />
          </div>

          {authMode === "register" && (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Register Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
