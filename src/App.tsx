import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  const [error, setError] = useState<Error | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log('🎨 App component mounted')
    try {
      // Give Firebase and other services a moment to initialize
      setTimeout(() => {
        setIsReady(true)
        console.log('✅ App ready')
      }, 100)
    } catch (err) {
      console.error('❌ App initialization error:', err)
      setError(err as Error)
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <pre className="text-sm whitespace-pre-wrap break-words">{error.message}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-lg font-medium">Loading Budget Planner...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  return <Dashboard />
}

export default App

