import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import {NextUIProvider} from "@nextui-org/react";
import './index.css'
import { LoadingContextProvider } from './context/LoadingContext.jsx';

createRoot(document.getElementById('root')).render(
  <NextUIProvider>
    <LoadingContextProvider>
  <>
    <App/>
  </>
  </LoadingContextProvider>
  </NextUIProvider>,
)
