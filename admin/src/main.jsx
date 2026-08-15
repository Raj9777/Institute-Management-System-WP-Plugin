import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Guard against WordPress svg-painter.js TypeError
if (typeof window !== 'undefined') {
  window.wp = window.wp || {};
  if (!window.wp.svgPainter) {
    window.wp.svgPainter = { init: function() {}, paint: function() {}, setColors: function() {} };
  }
}

function initApp() {
  const container = document.getElementById('ims-root');
  if (!container) return false;
  if (container.dataset.imsMounted) return true;

  container.dataset.imsMounted = 'true';
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Failed to mount IMS React App:', err);
    container.innerHTML = `<div style="padding: 2rem; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 1rem;">
      <h3 style="margin-top:0;">Failed to Load IMS Application</h3>
      <p style="margin-bottom:0;">${err.message || 'An unexpected error occurred during initialization.'}</p>
    </div>`;
  }
  return true;
}

function startMount() {
  if (!initApp()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (initApp() || attempts > 50) {
        clearInterval(interval);
      }
    }, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMount);
} else {
  startMount();
}
