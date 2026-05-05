import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import App from './App.jsx';
import AdminApp from './Admin.jsx';

// Simple router (no react-router needed)
function Router() {
  const path = window.location.pathname;

  if (path === '/admin') {
    return <AdminApp />;
  }

  return <App />;
}

// Render app only once (IMPORTANT FIX)
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);