import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StudioErrorBoundary } from './studio/StudioErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StudioErrorBoundary>
    <App />
  </StudioErrorBoundary>
);
