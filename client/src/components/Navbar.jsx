import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, GraduationCap, Home } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-white text-lg tracking-wider">NSS</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block text-white">
              Recruitment Portal
            </span>
            <span className="text-xs text-blue-400 font-medium tracking-wide">
              Online Test Portal
            </span>
          </div>
        </Link>

        {/* Navigation Links & User Bar */}
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="hidden sm:flex items-center space-x-1.5 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-3">
              {/* Role badge and info */}
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
                {role === 'admin' ? (
                  <Shield className="w-4 h-4 text-emerald-400" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                )}
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-200">
                    {role === 'admin' ? user.username : user.name}
                  </div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    {role === 'admin' ? 'Administrator' : `Roll: ${user.rollNumber}`}
                  </div>
                </div>
              </div>

              {/* Dashboard Link based on role */}
              <Link
                to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 hidden md:block"
              >
                Dashboard
              </Link>

              {role === 'admin' && (
                <Link
                  to="/admin/exams"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors hidden md:block"
                >
                  Exams
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
              >
                Student Sign In
              </Link>
              <Link
                to="/admin/login"
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
              >
                Admin Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

