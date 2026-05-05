/// src/Admin.jsx

import React, { useEffect, useState } from 'react';

const API_URL = "https://linunaura-in-ecommerce.onrender.com/api";

const emptyProduct = {
  name: '',
  category: 'Bedsheet Set',
  price: '',
  mrp: '',
  stock: '',
  color: '',
  size: 'Queen',
  material: 'Cotton',
  image: '',
  description: '',
  badge: '',
  rating: 4.7,
  featured: false
};

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function AdminApp() {

  const [products, setProducts] = useState([]);

  const [token, setToken] = useState(
    localStorage.getItem('linunaura_token') || ''
  );

  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(emptyProduct);

  async function loadProducts() {
    try {

      const response = await fetch(
        `${API_URL}/products`
      );

      const data = await response.json();

      setProducts(data);

    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function login(event) {

    event.preventDefault();

    try {

      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            password
          })
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || 'Login failed'
        );
      }

      localStorage.setItem(
        'linunaura_token',
        payload.token
      );

      setToken(payload.token);

      setPassword('');

      setMessage('Login successful');

    } catch (err) {

      setMessage(err.message);
    }
  }

  function logout() {

    localStorage.removeItem(
      'linunaura_token'
    );

    setToken('');
  }

  function updateField(field, value) {

    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function startEdit(product) {

    setEditing(product.id);

    setForm({
      ...product
    });
  }

  function startNew() {

    setEditing(null);

    setForm(emptyProduct);
  }

  async function saveProduct(event) {

    event.preventDefault();

    const payload = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp || form.price),
      stock: Number(form.stock),
      rating: Number(form.rating || 4.7),
      featured: Boolean(form.featured)
    };

    const url = editing
      ? `${API_URL}/products/${editing}`
      : `${API_URL}/products`;

    const method = editing
      ? 'PUT'
      : 'POST';

    try {

      const response = await fetch(url, {

        method,

        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token
        },

        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Save failed'
        );
      }

      setMessage(
        editing
          ? 'Product updated'
          : 'Product added'
      );

      startNew();

      loadProducts();

    } catch (err) {

      setMessage(err.message);
    }
  }

  async function deleteProduct(product) {

    const confirmed = window.confirm(
      `Delete ${product.name}?`
    );

    if (!confirmed) return;

    try {

      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: 'DELETE',

          headers: {
            'X-Admin-Token': token
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Delete failed'
        );
      }

      setMessage('Product deleted');

      loadProducts();

    } catch (err) {

      setMessage(err.message);
    }
  }

  if (!token) {

    return (
      <div className="app-shell">

        <div style={{ padding: 40 }}>

          <h1>Admin Login</h1>

          <form onSubmit={login}>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button type="submit">
              Login
            </button>

          </form>

          {message && (
            <p>{message}</p>
          )}

        </div>
      </div>
    );
  }

  return (

    <div className="app-shell">

      <div style={{ padding: 20 }}>

        <h1>Admin Panel</h1>

        <button onClick={logout}>
          Logout
        </button>

        <hr />

        <form onSubmit={saveProduct}>

          <input
            placeholder="Product Name"
            value={form.name}
            onChange={(e) =>
              updateField(
                'name',
                e.target.value
              )
            }
          />

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              updateField(
                'category',
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              updateField(
                'price',
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="MRP"
            value={form.mrp}
            onChange={(e) =>
              updateField(
                'mrp',
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) =>
              updateField(
                'stock',
                e.target.value
              )
            }
          />

          <input
            placeholder="Color"
            value={form.color}
            onChange={(e) =>
              updateField(
                'color',
                e.target.value
              )
            }
          />

          <input
            placeholder="Size"
            value={form.size}
            onChange={(e) =>
              updateField(
                'size',
                e.target.value
              )
            }
          />

          <input
            placeholder="Material"
            value={form.material}
            onChange={(e) =>
              updateField(
                'material',
                e.target.value
              )
            }
          />

          <input
            placeholder="Image URL"
            value={form.image}
            onChange={(e) =>
              updateField(
                'image',
                e.target.value
              )
            }
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              updateField(
                'description',
                e.target.value
              )
            }
          />

          <button type="submit">

            {editing
              ? 'Update Product'
              : 'Add Product'}

          </button>

        </form>

        <hr />

        <h2>All Products</h2>

        {products.map((product) => (

          <div
            key={product.id}
            style={{
              border: '1px solid #ccc',
              padding: 10,
              marginBottom: 10
            }}
          >

            <img
              src={product.image}
              alt={product.name}
              width="100"
            />

            <h3>{product.name}</h3>

            <p>
              {money(product.price)}
            </p>

            <button
              onClick={() =>
                startEdit(product)
              }
            >
              Edit
            </button>

            <button
              onClick={() =>
                deleteProduct(product)
              }
              style={{
                marginLeft: 10
              }}
            >
              Delete
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}