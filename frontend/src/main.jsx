import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SocketContextProvider } from './context/SocketContext'

createRoot(document.getElementById('root')).render(
  <SocketContextProvider>
    <App />
  </SocketContextProvider>,
)
