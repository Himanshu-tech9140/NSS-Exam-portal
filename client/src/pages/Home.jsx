import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Shield, CheckCircle, ArrowRight, UserPlus, Clock } from 'lucide-react';

const Home = () => {
  const { user, role } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-14">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold tracking-wide uppercase">
          <span>National Service Scheme</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          <span>Recruitment Portal 2026</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Welcome to the <span className="text-blue-600">NSS Test Portal</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          Candidate registration, identity verification, online evaluation, and live leaderboards.
          Sign in using your college Roll Number or Admin credentials to proceed.
        </p>

        {user && (
          <div className="pt-2">
            <Link
              to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <span>Go to Your {role === 'admin' ? 'Admin' : 'Student'} Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Access Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Student Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Student Portal</h2>
              <p className="text-sm text-slate-500 mt-1">
                For applicants participating in the recruitment screening. Log in with your Roll Number and password.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Verify application credentials & eligibility</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>View recruitment stage updates and instructions</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Attempt online test with anti-cheating & real-time monitoring</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 space-y-3">
            <Link
              to="/login"
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <span>Student Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Candidate</span>
            </Link>
          </div>
        </div>

        {/* Admin Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Admin Command Center</h2>
              <p className="text-sm text-slate-500 mt-1">
                For NSS coordinators, faculty in-charges, and system administrators.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Monitor registered candidates across branches</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Review candidate batch metrics & distributions</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Manage testing cohorts and authentication status</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              to="/admin/login"
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <span>Admin Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Portal Status:</span> Online test engine, AI evaluation, and live leaderboards are active.
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          JWT + bcrypt + Mongoose
        </div>
      </div>
    </div>
  );
};

export default Home;

