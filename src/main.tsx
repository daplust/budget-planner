import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🚀 Budget Planner starting...')

try {
  const root = document.getElementById('root')
  if (!root) {
    document.body.innerHTML = '<div style="padding: 20px; font-family: system-ui; color: red;">Error: Root element not found</div>'
    throw new Error('Root element not found')
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Failed to render app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: system-ui;">
      <h1 style="color: red;">Failed to load app</h1>
      <pre>${error}</pre>
    </div>
  `
}
