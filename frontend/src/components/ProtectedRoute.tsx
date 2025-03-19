import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

function ProtectedRoute() {
  const location = useLocation();
  const isUserAuthenticated = isAuthenticated();

  if (!isUserAuthenticated) {
    // Redirect to home page but save the location they were trying to access
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Render child routes
  return <Outlet />;
}

export default ProtectedRoute; 