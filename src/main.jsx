// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Import Google OAuth
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { store } from '../src/redux/Store.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Neengal sonnapadi direct-aga Client ID-ai ingae koduthuvidalam */}
    <GoogleOAuthProvider clientId="802387886166-fj4aavdn6eudlet60i2411nna4isgu89.apps.googleusercontent.com">
      <Provider store={store}>
        <Router>
          <App />
        </Router>
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          theme="colored"
        />
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);