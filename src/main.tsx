import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root element
const rootElement = document.getElementById('root');

// Create a root if it doesn't exist
const root = createRoot(rootElement || document.createElement('div'));

// Render the app
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
