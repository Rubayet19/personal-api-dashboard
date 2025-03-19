import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ApiKeysPage from './pages/ApiKeysPage'
import { ApiTestPage } from './pages/ApiTestPage'
import { RateLimitsPage } from './pages/RateLimitsPage'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'
import { KeyUpdateProvider } from './contexts/KeyUpdateContext'

function App() {
  return (
    <>
      <KeyUpdateProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/api-keys" element={<ApiKeysPage />} />
              <Route path="/dashboard/rate-limits" element={<RateLimitsPage />} />
              <Route path="/dashboard/request-builder" element={<ApiTestPage />} />
            </Route>
            
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </Router>
      </KeyUpdateProvider>
      <Toaster />
    </>
  )
}

export default App
