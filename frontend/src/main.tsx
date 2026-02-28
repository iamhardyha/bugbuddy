import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { AntdProvider } from '@/components/common/AntdProvider';
import { ModalProvider } from '@/components/common/ModalProvider';
import App from './App';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AntdProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </AntdProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
