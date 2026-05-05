import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import App from './App.jsx';
import AdminApp from './Admin.jsx';

function Router() {
  const path = window.location.pathname;

  if (path === '/admin') {
    return <AdminApp />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(<Router />);