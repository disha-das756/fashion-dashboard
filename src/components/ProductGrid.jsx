import React from "react";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  loading,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  onClearSearch,
  onDeleteProduct,
}) {
  return (
    <section className="product-grid-section">
      {/* Category Pills & Sort Bar */}
      <div className="product-grid-header">
        <div className="category-pills">
          {["All", "Women", "Men"].map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "All" ? "✨ All Collections" : cat === "Women" ? "👗 Women's" : "👔 Men's"}
            </button>
          ))}
        </div>

        <div className="sort-bar">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-dropdown"
          >
            <option value="default">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="product-card-skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-products-state">
          <div className="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your category filter or search terms.</p>
          <button
            className="reset-filter-btn"
            onClick={() => {
              setActiveCategory("All");
              if (onClearSearch) onClearSearch();
            }}
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              onDeleteProduct={onDeleteProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
}
