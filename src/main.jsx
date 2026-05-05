import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import AdminApp from './Admin.jsx';
import App from './App.jsx';

function Router() {
  if (window.location.pathname === '/admin') {
    return <AdminApp />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(<Router />);