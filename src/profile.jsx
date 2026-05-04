import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const defaultProfile = {
  username: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: ''
};

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function applyAppearance(theme, density) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.density = density;
  localStorage.setItem('linunaura_theme', theme);
  localStorage.setItem('linunaura_density', density);
}

function ProfileApp() {
  const [profile, setProfile] = useState(() => readStorage('linunaura_profile', defaultProfile));
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('linunaura_customer_logged_in') === 'true');
  const [login, setLogin] = useState({ username: profile.username || '', password: '' });
  const [theme, setTheme] = useState(() => localStorage.getItem('linunaura_theme') || 'light');
  const [density, setDensity] = useState(() => localStorage.getItem('linunaura_density') || 'comfortable');
  const [message, setMessage] = useState('');

  useEffect(() => {
    applyAppearance(theme, density);
  }, [theme, density]);

  useEffect(() => {
    localStorage.setItem('linunaura_profile', JSON.stringify(profile));
  }, [profile]);

  function loginCustomer(event) {
    event.preventDefault();
    const username = login.username.trim();
    const password = login.password.trim();
    if (!username || !password) {
      setMessage('Username and password are required to login.');
      return;
    }
    const nextProfile = { ...profile, username };
    setProfile(nextProfile);
    localStorage.setItem('linunaura_customer_username', username);
    localStorage.setItem('linunaura_customer_logged_in', 'true');
    setIsLoggedIn(true);
    setMessage('Login saved. You can update your details below.');
    setLogin({ username, password: '' });
  }

  function updateField(field, value) {
    setMessage('');
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function saveProfile(event) {
    event.preventDefault();
    localStorage.setItem('linunaura_profile', JSON.stringify(profile));
    setMessage('Customer details updated successfully.');
  }

  function logout() {
    localStorage.setItem('linunaura_customer_logged_in', 'false');
    setIsLoggedIn(false);
    setMessage('Logged out from this device.');
  }

  return (
    <div className="app-shell">
      <header className="profile-header">
        <a className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>
            <strong>Linunaura.in</strong>
            <small>Customer profile</small>
          </span>
        </a>
        <div className="profile-header-actions">
          <a href="/">Back to store</a>
          {isLoggedIn && <button onClick={logout}>Logout</button>}
        </div>
      </header>

      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">Customer account</p>
          <h1>Login, save your details, and customize Linunaura.in.</h1>
          <p>
            Login with username and password, then keep your email, phone number, delivery address, and display settings
            ready for a faster shopping experience on this device.
          </p>
        </section>

        <section className="profile-layout">
          {!isLoggedIn ? (
            <form className="account-card" onSubmit={loginCustomer}>
              <p className="eyebrow">Login</p>
              <h2>Customer login</h2>
              <label>
                Username
                <input
                  value={login.username}
                  onChange={(event) => setLogin((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={login.password}
                  onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </label>
              {message && <div className="notice">{message}</div>}
              <button>Login and continue</button>
            </form>
          ) : (
            <form className="account-card" onSubmit={saveProfile}>
              <p className="eyebrow">Saved details</p>
              <h2>Update profile</h2>
              <label>
                Username
                <input value={profile.username} onChange={(event) => updateField('username', event.target.value)} required />
              </label>
              <label>
                Full name
                <input value={profile.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Customer name" />
              </label>
              <div className="two-col">
                <label>
                  Email
                  <input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} required />
                </label>
                <label>
                  Phone
                  <input value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} required />
                </label>
              </div>
              <label>
                Delivery address
                <textarea value={profile.address} onChange={(event) => updateField('address', event.target.value)} placeholder="House, street, area" />
              </label>
              <div className="two-col">
                <label>
                  City
                  <input value={profile.city} onChange={(event) => updateField('city', event.target.value)} placeholder="City" />
                </label>
                <label>
                  Pincode
                  <input value={profile.pincode} onChange={(event) => updateField('pincode', event.target.value)} placeholder="Pincode" />
                </label>
              </div>
              {message && <div className="notice">{message}</div>}
              <button>Update details</button>
            </form>
          )}

          <section className="account-card settings-card">
            <p className="eyebrow">Customize website</p>
            <h2>Display settings</h2>
            <div className="setting-group">
              <span>Theme</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  onClick={() => setTheme('light')}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
            <div className="setting-group">
              <span>Product spacing</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={density === 'comfortable' ? 'active' : ''}
                  onClick={() => setDensity('comfortable')}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  className={density === 'compact' ? 'active' : ''}
                  onClick={() => setDensity('compact')}
                >
                  Compact
                </button>
              </div>
            </div>
            <div className="profile-summary">
              <strong>{isLoggedIn ? profile.username || profile.name || 'Customer' : 'Guest customer'}</strong>
              <span>{profile.name || 'No name saved'}</span>
              <span>{profile.email || 'No email saved'}</span>
              <span>{profile.phone || 'No phone saved'}</span>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<ProfileApp />);
