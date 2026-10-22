import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Self-hosted fonts (spec 002, FR-3). Only the subsets a page uses are downloaded.
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App.jsx'
import PlanProvider from './state/PlanProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PlanProvider>
        <App />
      </PlanProvider>
    </BrowserRouter>
  </StrictMode>,
)
