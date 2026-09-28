import React, { useState, useEffect } from "react";
import "./App.css";

import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useCart } from "./hooks/useCart";

import { Navbar } from "./components/Navbar";
import { ProductGrid } from "./components/ProductGrid";
import { CartDrawer } from "./components/CartDrawer";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ChatbotWidget } from "./components/ChatbotWidget";
import { AuthModal } from "./components/AuthModal";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { AddProductModal } from "./components/AddProductModal";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const {
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
  } = useAuth();

  const {
    products,
    allProducts,
    loading,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    addProductApi,
    deleteProductApi,
  } = useProducts(currentUser);

  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    appliedDiscount,
    discountCode,
    discountMessage,
    applyPromoCode,
    subtotal,
    discountAmount,
    total,
    totalCount,
    clearCart,
  } = useCart();

  // App Navigation & Modals State
  const [activeTopTab, setActiveTopTab] = useState("dashboard"); // 'dashboard' | 'storefront' | 'analytics'
  const [wishlist, setWishlist] = useState([1, 2]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [orderStats, setOrderStats] = useState({ total_orders: 109, last_7_days: 48, revenue: 4500 });
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchOrderStats();
  }, []);

  useEffect(() => {
    if (currentUser && isAuthOpen) {
      setIsAuthOpen(false);
    }
  }, [currentUser, isAuthOpen]);

  const fetchOrderStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/stats`);
      if (res.ok) {
        const data = await res.json();
        setOrderStats(data);
      }
    } catch {
      // Fallback stats
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showNotification(exists ? "Removed from Wishlist" : "❤️ Added to Wishlist!");
      return updated;
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteProductApi(productId, currentUser?.token);
      showNotification("🗑️ Item deleted successfully!");
      if (quickViewProduct?.id === productId) {
        setQuickViewProduct(null);
      }
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    showNotification(`🛒 ${product.name} added to cart!`);
  };

  const handleCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      showNotification("Please sign in to complete your checkout.");
      return;
    }
    showNotification(`🎉 Order placed successfully! Total: $${total.toFixed(2)}`);
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <span>{notification}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTopTab={activeTopTab}
        setActiveTopTab={setActiveTopTab}
        searchTerm={searchTerm}
        setSearchTerm={(term) => {
          setSearchTerm(term);
          if (term.trim() !== "" && activeTopTab !== "dashboard") {
            setActiveTopTab("dashboard");
          }
        }}
        cartCount={totalCount}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setActiveTopTab("dashboard")}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          handleLogout();
          showNotification("Successfully logged out.");
        }}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content-wrap">
        {activeTopTab === "analytics" ? (
          <AnalyticsDashboard orderStats={orderStats} products={allProducts} />
        ) : (
          <>
            {/* Storefront Hero Banner */}
            <div className="hero-banner">
              <div className="hero-content">
                <span className="hero-tag">NEW SEASON 2026</span>
                <h1 className="hero-title">Collections</h1>
                <p className="hero-description">
                  Discover luxury designer wear, premium silk blazers, and high-fashion essentials. Enjoy <strong>50% OFF</strong> with promo code <code>HALF50</code>.
                </p>
                <div className="hero-badges">
                  <span className="badge-item">🚀 2-Day Express Delivery</span>
                  <span className="badge-item">💎 Authenticity Guaranteed</span>
                  <span className="badge-item">🔒 Secure Checkout</span>
                </div>
              </div>
            </div>

            {/* Product Catalog Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              onClearSearch={() => setSearchTerm("")}
              onDeleteProduct={handleDeleteProduct}
            />
          </>
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        onUpdateQty={updateQuantity}
        appliedDiscount={appliedDiscount}
        discountCode={discountCode}
        discountMessage={discountMessage}
        onApplyPromo={applyPromoCode}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        onCheckout={handleCheckout}
      />

      {/* AI Support RAG Chatbot */}
      <ChatbotWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authError={authError}
        authSuccess={authSuccess}
        isLoading={isAuthLoading}
        onSubmit={async (e) => {
          const success = await handleAuthSubmit(e);
          if (success) {
            setIsAuthOpen(false);
            showNotification(`Welcome back!`);
          }
        }}
      />

      {/* Quick View Product Detail Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onToggleWishlist={toggleWishlist}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Add New Product Inventory Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={(newProd) => addProductApi(newProd, currentUser?.token)}
      />
    </div>
  );
}

export default App;