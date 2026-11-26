import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startSmooth } from './smooth.js';
import './styles.css';

startSmooth();
createRoot(document.getElementById('root')).render(<App />);
