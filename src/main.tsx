import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

console.log('Main.tsx is being executed');

// Error handling for development
if (import.meta.env.DEV) {
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Window Error:', { msg, url, lineNo, columnNo, error });
    return false;
  };
  
  window.onunhandledrejection = function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
  };
}

// Create root element if it doesn't exist
const rootElement = document.getElementById('root');
if (!rootElement) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <App />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  </React.StrictMode>,
)

console.log('Root component rendered');