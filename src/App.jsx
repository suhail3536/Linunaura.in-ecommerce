import React, { useEffect, useState } from 'react';

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

export default function App() {

  const [products, setProducts] = useState([]);

  const [cart, setCart] = useState([]);

  const [favorites, setFavorites] = useState(() =>
    readStorage('linunaura_favorites', [])
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'linunaura_favorites',
      JSON.stringify(favorites)
    );
  }, [favorites]);

  async function loadProducts() {

    try {

      const response = await fetch(
        `${API_URL}/products`
      );

      if (!response.ok) {
        throw new Error('Failed to load products');
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
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1
        }
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

      <header
        style={{
          padding: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ddd'
        }}
      >

        <h1>Linunaura.in</h1>

        <a href="/admin">
          Admin Panel
        </a>

      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          padding: 20
        }}
      >

        {products.map((product) => (

          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: 15
            }}
          >

            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: 250,
                objectFit: 'cover',
                borderRadius: 10
              }}
            />

            <h3>{product.name}</h3>

            <p>{product.description}</p>

            <strong>
              {money(product.price)}
            </strong>

            <div
              style={{
                marginTop: 15
              }}
            >

              <button
                onClick={() =>
                  addToCart(product)
                }
              >
                Add To Cart
              </button>

              <button
                onClick={() =>
                  toggleFavorite(product.id)
                }
                style={{
                  marginLeft: 10
                }}
              >

                {favorites.includes(product.id)
                  ? '❤️ Saved'
                  : '🤍 Save'}

              </button>

            </div>

          </div>
        ))}

      </div>

      <div
        style={{
          padding: 20,
          borderTop: '1px solid #ddd'
        }}
      >

        <h2>
          Cart ({cart.length})
        </h2>

        {cart.length === 0 && (
          <p>No products added</p>
        )}

        {cart.map((item) => (

          <div key={item.id}>

            {item.name} × {item.quantity}

          </div>
        ))}

      </div>

    </div>
  );
}