// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; 
import App from './App';
import './index.css';
// import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <App />
    {/* <AuthProvider> { }
      <App />
    </AuthProvider> { } */}
  </React.StrictMode>,
);
