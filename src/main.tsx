import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts served from this site, not from Google (no visitor data sent to a third party, 2026-11-02).
// Only the weights the page uses. Special Elite is a local, re-centred file: see src/index.css.
import '@fontsource/alegreya-sans/400.css'
import '@fontsource/alegreya-sans/400-italic.css'
import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import '@fontsource/cormorant-garamond/600.css'
import './index.css'
import App from './App.tsx'

// One shared cache for every query the page makes (see hooks/usePeopleAlive.ts).
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
