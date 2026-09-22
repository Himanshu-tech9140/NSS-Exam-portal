import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Verifying session credentials...</p>
      </div>
    );
  }

  // Not logged in -> redirect to relevant login page
  if (!isAuthenticated || !user) {
    const redirectPath = allowedRole === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Logged in but unauthorized role
  if (allowedRole && role !== allowedRole) {
    const fallbackPath = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;

