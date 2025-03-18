import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/api-keys" element={<DashboardPage />} />
        <Route path="/dashboard/rate-limits" element={<DashboardPage />} />
        <Route path="/dashboard/request-builder" element={<DashboardPage />} />
        <Route path="/login" element={<div>Login Page (Coming Soon)</div>} />
        <Route path="/signup" element={<div>Signup Page (Coming Soon)</div>} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  )
}

export default App
