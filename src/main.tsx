import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The admin dashboard lives at /admin and is loaded only when visited
const Admin = lazy(() => import('./Admin.tsx'))
const isAdminPage = window.location.pathname.replace(/\/+$/, '') === '/admin'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPage ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
