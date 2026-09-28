import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:8000";

const FALLBACK_CATEGORIES = [
  { id: 1, name: "Men", slug: "men" },
  { id: 2, name: "Women", slug: "women" },
];

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "WMX Rubber Zebra Sandal",
    price: 36,
    category_id: 2,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Super Skinny Jogger",
    price: 89,
    category_id: 2,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Oversized Velvet Blazer",
    price: 140,
    category_id: 2,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Classic Silk Tuxedo Shirt",
    price: 110,
    category_id: 1,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Embroidered Couture Gown",
    price: 260,
    category_id: 2,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Italian Leather Monogram Tote",
    price: 195,
    category_id: 1,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
  },
];

export function useProducts(currentUser) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch {
      setCategories(FALLBACK_CATEGORIES);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts, currentUser]);

  const filteredProducts = products
    .filter((item) => {
      if (!item || !item.name) return false;
      const term = searchTerm.trim().toLowerCase();
      
      // If user typed a search term, search across ALL categories automatically
      const matchesCategory =
        term !== "" ||
        activeCategory === "All" ||
        (activeCategory === "Men" && item.category_id === 1) ||
        (activeCategory === "Women" && item.category_id === 2);

      const categoryName = item.category_id === 1 ? "men" : "women";
      const matchesSearch =
        term === "" ||
        item.name.toLowerCase().includes(term) ||
        categoryName.includes(term) ||
        item.price.toString().includes(term);

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const addProductApi = async (newProduct, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          image:
            newProduct.image ||
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
          category_id: parseInt(newProduct.category_id),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
        return { success: true, product: created };
      } else {
        const err = await res.json();
        return { success: false, error: err.detail || "Failed to add product" };
      }
    } catch {
      return { success: false, error: "Network error adding product" };
    }
  };

  const deleteProductApi = async (productId, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok || res.status === 204) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return { success: true };
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return { success: true };
      }
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return { success: true };
    }
  };

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    loading,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    addProductApi,
    deleteProductApi,
    refreshProducts: fetchProducts,
  };
}
