import React, { useState, useEffect, useRef } from "react";

export function Navbar({
  activeTopTab,
  setActiveTopTab,
  searchTerm,
  setSearchTerm,
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAddProduct,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => setActiveTopTab("dashboard")}>
          <div className="brand-logo-icon">👑</div>
          <div className="brand-text">
            <span className="brand-title">BuyMore</span>
            <span className="brand-subtitle">HAUTE COUTURE</span>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <nav className="navbar-tabs">
          <button
            className={`nav-tab-btn ${activeTopTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTopTab("dashboard")}
          >
            <span>🛍️</span> Collections
          </button>
          <button
            className={`nav-tab-btn ${activeTopTab === "storefront" ? "active" : ""}`}
            onClick={() => setActiveTopTab("storefront")}
          >
            <span>✨</span> Runway
          </button>
          <button
            className={`nav-tab-btn ${activeTopTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTopTab("analytics")}
          >
            <span>📊</span> Intelligence
          </button>
        </nav>

        {/* Search Input Bar */}
        <div className="navbar-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search couture dresses, blazers, footwear..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="navbar-actions">
          {currentUser && (
            <button className="action-btn add-product-btn" onClick={onOpenAddProduct} title="Add New Item">
              <span>➕</span> <span className="btn-label">New Item</span>
            </button>
          )}

          <button className="action-btn wishlist-btn" onClick={onOpenWishlist} title="Saved Items">
            <span>❤️</span>
            {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
          </button>

          <button className="action-btn cart-btn" onClick={onOpenCart} title="Shopping Cart">
            <span>🛒</span>
            {cartCount > 0 && <span className="badge-count pulse">{cartCount}</span>}
          </button>

          {/* User Auth Info with Dropdown */}
          {currentUser ? (
            <div className="user-dropdown-container" ref={dropdownRef}>
              <div
                className={`user-profile-trigger ${isDropdownOpen ? "active" : ""}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                title="Account Menu"
              >
                <div className="avatar-badge">{currentUser.username.charAt(0).toUpperCase()}</div>
                <span className="username-display">{currentUser.username}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}>▼</span>
              </div>

              {isDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="avatar-badge large">{currentUser.username.charAt(0).toUpperCase()}</div>
                    <div className="dropdown-user-info">
                      <span className="dropdown-username">{currentUser.username}</span>
                      <span className="dropdown-user-status">Signed in</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-trigger-btn" onClick={onOpenAuth}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
