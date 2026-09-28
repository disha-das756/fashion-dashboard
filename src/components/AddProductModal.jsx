import React, { useState } from "react";

export function AddProductModal({ isOpen, onClose, onAddProduct, categories }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: "",
    category_id: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.name || !formData.price) {
      setError("Product name and price are required.");
      return;
    }

    setSubmitting(true);
    const result = await onAddProduct(formData);
    setSubmitting(false);

    if (result.success) {
      setFormData({ name: "", price: "", image: "", category_id: 1 });
      onClose();
    } else {
      setError(result.error || "Failed to create product.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card add-product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <h2>➕ Add New Item to Inventory</h2>
          <p>Register new designer clothing item into live store database</p>
        </div>

        {error && <div className="auth-alert error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label>Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Italian Leather Bomber Jacket"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="120.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value={1}>Men's Collection</option>
                <option value={2}>Women's Collection</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Adding..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
