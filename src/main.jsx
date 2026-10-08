import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './dev/resetApp';
import './index.css'
import App from './App.jsx'
import { ModalProvider } from './providers/ModalProvider.jsx';
import { BrowserRouter } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrameComponent.jsx';
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PhoneFrame>
      <BrowserRouter>
        <ModalProvider>
          <App />
        </ModalProvider>
      </BrowserRouter>
    </PhoneFrame>
  </StrictMode>,
)
