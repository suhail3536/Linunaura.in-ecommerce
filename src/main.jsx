// main.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AdminApp from './Admin';

const API_URL = "https://linunaura-in-ecommerce.onrender.com/api";

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState(() =>
    readStorage('linunaura_favorites', [])
  );

  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      setProducts(await response.json());
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);

      if (found) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function toggleFavorite(productId) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <h1>Linunaura.in</h1>

        <a href="/admin">
          Admin Panel
        </a>
      </header>

      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <img src={product.image} alt={product.name} />

            <h3>{product.name}</h3>

            <p>{product.description}</p>

            <strong>{money(product.price)}</strong>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => addToCart(product)}>
                Add To Cart
              </button>

              <button
                onClick={() => toggleFavorite(product.id)}
                style={{ marginLeft: 10 }}
              >
                {favorites.includes(product.id)
                  ? '❤️ Saved'
                  : '🤍 Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Router() {
  if (window.location.pathname === '/admin') {
    return <AdminApp />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <Router />
);