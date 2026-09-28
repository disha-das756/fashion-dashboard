import React from "react";

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart, isWishlisted, onToggleWishlist, onDeleteProduct }) {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="product-detail-grid">
          <div className="detail-image-wrap">
            <img
              src={product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"}
              alt={product.name}
            />
            <span className="detail-category-badge">
              {product.category_id === 1 ? "Men's Fashion" : "Women's Fashion"}
            </span>
          </div>

          <div className="detail-info-wrap">
            <h2 className="detail-title">{product.name}</h2>
            <div className="detail-price">${product.price.toFixed(2)}</div>
            <p className="detail-description">
              Elevate your wardrobe with this authentic haute couture designer piece. Crafted with premium materials, precision tailoring, and modern contemporary fit.
            </p>

            <div className="detail-features">
              <div className="feature-item">📦 Free Standard Shipping ($50+)</div>
              <div className="feature-item">🔄 30-Day Easy Returns</div>
              <div className="feature-item">🔥 Eligible for 50% OFF promo (HALF50)</div>
            </div>

            <div className="detail-actions">
              <button
                className="detail-add-cart-btn"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
              >
                🛒 Add to Shopping Cart
              </button>
              <button
                className={`detail-wishlist-btn ${isWishlisted ? "active" : ""}`}
                onClick={() => onToggleWishlist(product.id)}
              >
                {isWishlisted ? "❤️ Saved" : "🤍 Save to Wishlist"}
              </button>
              {onDeleteProduct && (
                <button
                  className="detail-delete-btn"
                  onClick={() => {
                    onDeleteProduct(product.id);
                  }}
                  title="Delete product"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
