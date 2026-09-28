import React, { useState } from "react";

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQty,
  appliedDiscount,
  discountCode,
  discountMessage,
  onApplyPromo,
  subtotal,
  discountAmount,
  total,
  onCheckout,
}) {
  const [promoInput, setPromoInput] = useState("");

  if (!isOpen) return null;

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    onApplyPromo(promoInput);
  };

  return (
    <div className="cart-drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <h2>
            <span>🛒 Your Shopping Cart</span>
            <span className="cart-item-count">({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          </h2>
          <button className="cart-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Cart Item List */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛍️</div>
              <h3>Your cart is empty</h3>
              <p>Explore our latest collection and add your favorite items!</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="cart-item-row">
                  <img
                    src={product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"}
                    alt={product.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{product.name}</h4>
                    <div className="cart-item-price">${product.price}</div>
                    <div className="cart-qty-controls">
                      <button onClick={() => onUpdateQty(product.id, -1)} className="qty-btn">
                        -
                      </button>
                      <span className="qty-val">{quantity}</span>
                      <button onClick={() => onUpdateQty(product.id, 1)} className="qty-btn">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <div className="cart-item-subtotal">${(product.price * quantity).toFixed(2)}</div>
                    <button
                      className="cart-remove-btn"
                      onClick={() => onRemoveItem(product.id)}
                      title="Remove Item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Promo Code Form */}
            <form onSubmit={handlePromoSubmit} className="promo-code-form">
              <div className="promo-input-group">
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. HALF50)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" className="apply-promo-btn">
                  Apply
                </button>
              </div>
              {discountMessage.text && (
                <div className={`promo-feedback ${discountMessage.isError ? "error" : "success"}`}>
                  {discountMessage.text}
                </div>
              )}
            </form>

            {/* Calculations Breakdown */}
            <div className="cart-breakdown">
              <div className="breakdown-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="breakdown-row discount-row">
                  <span>Discount ({appliedDiscount}% OFF)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="breakdown-row total-row">
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button className="checkout-btn" onClick={onCheckout}>
              🔒 Proceed to Secure Checkout (${total.toFixed(2)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
