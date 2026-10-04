import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ColorProfileProvider } from './context/ColorProfileContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider><WishlistProvider><ColorProfileProvider><App /></ColorProfileProvider></WishlistProvider></CartProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
