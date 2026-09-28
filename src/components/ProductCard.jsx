import React from "react";

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  onDeleteProduct,
}) {
  return (
    <div className="product-card">
      <div className="product-card-image-wrap">
        <img
          src={product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
        />
        <div className="product-card-overlay">
          <button
            className="card-quickview-btn"
            onClick={() => onQuickView(product)}
          >
            👁️ Quick View
          </button>
        </div>
        {onDeleteProduct && (
          <button
            className="delete-card-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProduct(product.id);
            }}
            title="Delete Item"
          >
            🗑️
          </button>
        )}
        <button
          className={`wishlist-heart-btn ${isWishlisted ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>
        <span className="product-category-tag">
          {product.category_id === 1 ? "Men" : "Women"}
        </span>
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <div className="product-card-footer">
          <div className="product-price-tag">
            <span className="currency">$</span>
            <span className="amount">{product.price}</span>
          </div>
          <button
            className="add-to-cart-btn"
            onClick={() => onAddToCart(product)}
          >
            <span>+ Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
