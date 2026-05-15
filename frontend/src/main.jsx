import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './pages/AuthPages'
import { PreferencesProvider } from './context/PreferencesContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PreferencesProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PreferencesProvider>
  </StrictMode>,
)
