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
  const [token, setToken] = useState(localStorage.getItem('linunaura_token') || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  async function loadProducts() {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function login(e) {
    e.preventDefault();

    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    localStorage.setItem('linunaura_token', data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.removeItem('linunaura_token');
    setToken('');
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function startEdit(p) {
    setEditing(p.id);
    setForm(p);
  }

  function startNew() {
    setEditing(null);
    setForm(emptyProduct);
  }

  async function saveProduct(e) {
    e.preventDefault();

    const url = editing
      ? `${API_URL}/products/${editing}`
      : `${API_URL}/products`;

    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        rating: Number(form.rating || 4.7)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Saved successfully");
    startNew();
    loadProducts();
  }

  async function deleteProduct(id) {
    await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Token': token
      }
    });

    loadProducts();
  }

  if (!token) {
    return (
      <div>
        <h2>Admin Login</h2>

        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button>Login</button>
        </form>

        <p>{message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <button onClick={logout}>Logout</button>

      <form onSubmit={saveProduct}>
        <input placeholder="Name" value={form.name}
          onChange={(e) => updateField('name', e.target.value)} />

        <input placeholder="Price" value={form.price}
          onChange={(e) => updateField('price', e.target.value)} />

        <button>{editing ? "Update" : "Add"}</button>
      </form>

      <hr />

      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <button onClick={() => startEdit(p)}>Edit</button>
          <button onClick={() => deleteProduct(p.id)}>Delete</button>
        </div>
      ))}

      <p>{message}</p>
    </div>
  );
}