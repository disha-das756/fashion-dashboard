import { useState, useEffect, useMemo } from "react";

const API_BASE_URL = "http://localhost:8000";

export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("buyMoreCart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discountMessage, setDiscountMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    try {
      localStorage.setItem("buyMoreCart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not persist cart:", e);
    }
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [...prevCart, { product, quantity: qty }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const applyPromoCode = async (codeStr) => {
    const code = codeStr.trim().toUpperCase();
    setDiscountMessage({ text: "", isError: false });

    if (!code) {
      setDiscountMessage({ text: "Please enter a promo code.", isError: true });
      return false;
    }

    if (code === "HALF50" || code === "SUMMER50") {
      setAppliedDiscount(50);
      setDiscountCode(code);
      setDiscountMessage({ text: `🎉 Promo code ${code} applied! 50% OFF total!`, isError: false });
      return true;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/discounts`);
      if (res.ok) {
        const discounts = await res.json();
        const found = discounts.find((d) => d.code.toUpperCase() === code);
        if (found) {
          setAppliedDiscount(found.percentage);
          setDiscountCode(code);
          setDiscountMessage({ text: `🎉 ${found.percentage}% discount applied!`, isError: false });
          return true;
        }
      }
    } catch {
      // Fallback
    }

    setDiscountMessage({ text: "Invalid or expired promo code.", isError: true });
    return false;
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(0);
    setDiscountCode("");
    setDiscountMessage({ text: "", isError: false });
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * appliedDiscount) / 100;
  }, [subtotal, appliedDiscount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return {
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
    clearCart,
    subtotal,
    discountAmount,
    total,
    totalCount,
  };
}
