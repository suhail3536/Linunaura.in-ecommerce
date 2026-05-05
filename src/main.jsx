// main.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AdminApp from './Admin.jsx';

const API_URL = "https://linunaura-in-ecommerce.onrender.com/api";

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [products, setProducts] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [favorites, setFavorites] = React.useState(() =>
    readStorage('linunaura_favorites', [])
  );

  React.useEffect(() => {
    loadProducts();
  }, []);

  React.useEffect(() => {
    localStorage.setItem(
      'linunaura_favorites',
      JSON.stringify(favorites)
    );
  }, [favorites]);

  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error('Failed to load');
      }

      const data = await response.json();
      setProducts(data);

    } catch (err) {
      console.error(err);
    }
  }

  function addToCart(product) {
    setCart((current) => {
      const found = current.find(
        (item) => item.id === product.id
      );

      if (found) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
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

          <div
            className="product-card"
            key={product.id}
          >
            <img
              src={product.image}
              alt={product.name}
            />

            <h3>{product.name}</h3>

            <p>{product.description}</p>

            <strong>
              {money(product.price)}
            </strong>

            <div style={{ marginTop: 10 }}>

              <button
                onClick={() => addToCart(product)}
              >
                Add To Cart
              </button>

              <button
                onClick={() =>
                  toggleFavorite(product.id)
                }
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

      <div className="cart-box">
        <h2>Cart ({cart.length})</h2>

        {cart.map((item) => (
          <div key={item.id}>
            {item.name} × {item.quantity}
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

createRoot(
  document.getElementById('root')
).render(
  <Router />
);