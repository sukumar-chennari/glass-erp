import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider }   from 'react-redux';
import { store }      from '@/store';
import { ToastProvider } from '@/components/ui/Toast';
import App            from './App';
import '@/styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found in index.html');

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </StrictMode>,
);
