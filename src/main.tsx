import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.setTimeout(() => {
  const loader = document.getElementById('boot-loader');
  if (!loader) return;
  loader.style.opacity = '0';
  window.setTimeout(() => loader.remove(), 260);
}, 700);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Unable to register the offline service worker.', error);
    });
  });
}
