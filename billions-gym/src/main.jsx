import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  // Tạm tắt StrictMode để tránh gọi API 2 lần trong dev mode
  // <StrictMode>
  <App />
  // </StrictMode>,
)