import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registrar Service Worker (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('Service Worker registrado'))
    .catch((err) => console.error('Error SW:', err));
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);