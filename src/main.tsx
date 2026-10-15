import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';

// the dark wall is the single theme now — forget the old wood/dark toggle data
document.documentElement.removeAttribute('data-theme');
localStorage.removeItem('caselearn:theme');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
