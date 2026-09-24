import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './dev/resetApp';
import './index.css'
import App from './App.jsx'
import { ModalProvider } from './providers/ModalProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
