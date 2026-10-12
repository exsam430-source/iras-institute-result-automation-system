import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
              style: {
                background: '#F0FDF4',
                color: '#065F46',
                border: '1px solid #BBF7D0',
              },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
);