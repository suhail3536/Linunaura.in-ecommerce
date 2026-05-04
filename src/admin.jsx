import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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

function AdminApp() {
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('linunaura_token') || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  async function loadProducts() {
    const response = await fetch(`${API_URL}/products`);
    setProducts(await response.json());
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function login(event) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Login failed');
      localStorage.setItem('linunaura_token', payload.token);
      setToken(payload.token);
      setPassword('');
    } catch (err) {
      setMessage(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('linunaura_token');
    setToken('');
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({ ...product });
    setMessage('');
  }

  function startNew() {
    setEditing(null);
    setForm(emptyProduct);
    setMessage('');
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
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
    const url = editing ? `${API_URL}/products/${editing}` : `${API_URL}/products`;
    const method = editing ? 'PUT' : 'POST';

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
      if (!response.ok) throw new Error(result.error || 'Unable to save product');
      const successMessage = editing ? 'Product updated.' : 'Product added.';
      startNew();
      setMessage(successMessage);
      await loadProducts();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': token }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete product');
      setMessage('Product deleted.');
      await loadProducts();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!token) {
    return (
      <div className="app-shell">
        <AdminHeader />
        <main className="admin-login">
          <form onSubmit={login}>
            <p className="eyebrow">Separate admin webpage</p>
            <h1>Manage Linunaura.in products</h1>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Default: linunaura123"
                required
              />
            </label>
            {message && <div className="notice error">{message}</div>}
            <button>Sign in</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AdminHeader logout={logout} />
      <main className="admin-workspace">
        <section className="admin-table">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin panel</p>
              <h1>Products and prices</h1>
            </div>
            <button onClick={startNew}>New item</button>
          </div>
          {message && <div className="notice">{message}</div>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <img src={product.image} alt="" />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{money(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <div className="action-row">
                        <button onClick={() => startEdit(product)}>Edit</button>
                        <button className="danger" onClick={() => deleteProduct(product)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ProductForm
          form={form}
          editing={editing}
          updateField={updateField}
          saveProduct={saveProduct}
          cancel={startNew}
        />
      </main>
    </div>
  );
}

function AdminHeader({ logout }) {
  return (
    <header className="admin-header">
      <a className="brand" href="/">
        <span className="brand-mark">L</span>
        <span>
          <strong>Linunaura.in</strong>
          <small>Admin panel</small>
        </span>
      </a>
      <div className="admin-header-actions">
        <a href="/">View website</a>
        {logout && <button onClick={logout}>Logout</button>}
      </div>
    </header>
  );
}

function ProductForm({ form, editing, updateField, saveProduct, cancel }) {
  return (
    <form className="product-form" onSubmit={saveProduct}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">{editing ? 'Update item' : 'Add item'}</p>
          <h2>{editing ? 'Edit bedsheet' : 'New bedsheet'}</h2>
        </div>
      </div>

      <label>
        Product name
        <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
      </label>
      <div className="two-col">
        <label>
          Category
          <input value={form.category} onChange={(event) => updateField('category', event.target.value)} required />
        </label>
        <label>
          Badge
          <input value={form.badge} onChange={(event) => updateField('badge', event.target.value)} />
        </label>
      </div>
      <div className="two-col">
        <label>
          Price
          <input type="number" min="0" value={form.price} onChange={(event) => updateField('price', event.target.value)} required />
        </label>
        <label>
          MRP
          <input type="number" min="0" value={form.mrp} onChange={(event) => updateField('mrp', event.target.value)} />
        </label>
      </div>
      <div className="two-col">
        <label>
          Stock
          <input type="number" min="0" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} required />
        </label>
        <label>
          Size
          <select value={form.size} onChange={(event) => updateField('size', event.target.value)}>
            <option>Single</option>
            <option>Double</option>
            <option>Queen</option>
            <option>King</option>
            <option>Super King</option>
          </select>
        </label>
      </div>
      <div className="two-col">
        <label>
          Material
          <input value={form.material} onChange={(event) => updateField('material', event.target.value)} required />
        </label>
        <label>
          Color
          <input value={form.color} onChange={(event) => updateField('color', event.target.value)} required />
        </label>
      </div>
      <label>
        Image URL
        <input value={form.image} onChange={(event) => updateField('image', event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} required />
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(event) => updateField('featured', event.target.checked)}
        />
        Feature on homepage
      </label>
      <div className="form-actions">
        <button type="submit">{editing ? 'Update item' : 'Add item'}</button>
        <button type="button" onClick={cancel} className="secondary">
          Clear
        </button>
      </div>
    </form>
  );
}

createRoot(document.getElementById('root')).render(<AdminApp />);
