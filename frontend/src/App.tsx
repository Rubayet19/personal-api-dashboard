import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import AuthPage from './pages/AuthPage'
import ApiKeysPage from './pages/ApiKeysPage'
import { ApiTestPage } from './pages/ApiTestPage'
import { RateLimitsPage } from './pages/RateLimitsPage'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          
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
      <Toaster />
    </>
  )
}

export default App
