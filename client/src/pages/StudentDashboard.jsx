import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  GraduationCap,
  LogOut,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Play,
  RotateCcw,
  Award,
  Trophy,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, examRes] = await Promise.all([
        api.get('/student/dashboard'),
        api.get('/exam/active'),
      ]);

      if (dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }
      if (examRes.data.success) {
        setActiveExam(examRes.data.exam);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-medium text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Candidate Portal Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {dashboardData?.student?.name || user?.name}!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Your profile is verified for the National Service Scheme recruitment screening.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-white/10"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Exam Card */}
      {activeExam ? (
        <div className="bg-white rounded-2xl border-2 border-blue-600/30 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
                <span>Available Online Exam</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeExam.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {activeExam.description || 'Complete the 20-question screening test to qualify for NSS membership.'}
              </p>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-auto">
              {activeExam.sessionStatus === 'NOT_STARTED' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Ready to Start
                </span>
              )}
              {activeExam.sessionStatus === 'IN_PROGRESS' && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                  <span>In Progress</span>
                </span>
              )}
              {(activeExam.sessionStatus === 'COMPLETED' || activeExam.sessionStatus === 'AUTO_SUBMITTED') && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submitted</span>
                </span>
              )}
              {activeExam.sessionStatus === 'TERMINATED' && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <span>Terminated</span>
                </span>
              )}
            </div>
          </div>

          {/* Exam Details Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Total Questions</span>
              <span className="font-bold text-slate-800 text-sm">20 Questions</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Structure</span>
              <span className="font-bold text-slate-800 text-sm">15 MCQs + 5 Subjective</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Duration</span>
              <span className="font-bold text-slate-800 text-sm">{activeExam.duration} Minutes</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Total Marks</span>
              <span className="font-bold text-slate-800 text-sm">{activeExam.totalMarks} Marks</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {activeExam.sessionStatus === 'NOT_STARTED' && 'Review exam instructions before starting.'}
              {activeExam.sessionStatus === 'IN_PROGRESS' && 'You have an active session! Click below to resume.'}
              {(activeExam.sessionStatus === 'COMPLETED' || activeExam.sessionStatus === 'AUTO_SUBMITTED') &&
                'Your exam has been submitted. You can view your result.'}
              {activeExam.sessionStatus === 'TERMINATED' &&
                'Your exam attempt was terminated due to a security violation.'}
            </div>

            {activeExam.sessionStatus === 'NOT_STARTED' && (
              <Link
                to={`/exam/instructions`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs sm:text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Read Instructions & Start</span>
              </Link>
            )}

            {activeExam.sessionStatus === 'IN_PROGRESS' && (
              <Link
                to={`/exam/${activeExam.id}?sessionId=${activeExam.sessionId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-indigo-500/20 text-xs sm:text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resume Active Exam</span>
              </Link>
            )}

            {(activeExam.sessionStatus === 'COMPLETED' || activeExam.sessionStatus === 'AUTO_SUBMITTED') && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to={`/leaderboard/${activeExam.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-amber-500/20 text-xs sm:text-sm cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Live Leaderboard</span>
                </Link>
                <Link
                  to={`/exam/result?sessionId=${activeExam.sessionId}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs sm:text-sm cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>View Result</span>
                </Link>
              </div>
            )}

            {activeExam.sessionStatus === 'TERMINATED' && (
              <Link
                to="/exam/terminated"
                state={{ reason: activeExam.terminationReason }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-rose-500/20 text-xs sm:text-sm cursor-pointer"
              >
                <span>View Termination Notice</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-xs sm:text-sm">
          No recruitment exam is currently scheduled. Check back shortly.
        </div>
      )}

      {/* Profile & Status Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Candidate Profile Details */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Candidate Profile</h2>
              <span className="text-xs text-slate-500">Official Student Record</span>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Roll Number</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {dashboardData?.student?.rollNumber || user?.rollNumber}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Full Name</span>
              <span className="font-medium text-slate-800">
                {dashboardData?.student?.name || user?.name}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Branch</span>
              <span className="font-medium text-slate-800 flex items-center space-x-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{dashboardData?.student?.branch || user?.branch || 'N/A'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Academic Year</span>
              <span className="font-medium text-slate-800 flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Year {dashboardData?.student?.year || user?.year || 1}</span>
              </span>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Verification</span>
              <span className="inline-flex items-center space-x-1 mt-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{dashboardData?.applicationStatus || 'Active & Authenticated'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Recruitment Examination Instructions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Screening Instructions</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                20 Questions Total
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The online evaluation consists of 15 aptitude and community awareness MCQs and 5 short problem-solving subjective scenarios.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                <li>Server timer starts automatically when you begin the test.</li>
                <li>Each question response is automatically synced to the server.</li>
                <li>You can navigate back and forth between questions using the Question Palette.</li>
                <li>Browser refresh preserves your assigned questions and answers.</li>
              </ul>
            </div>
          </div>

          {/* Session Security Card */}
          <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 text-xs text-blue-900 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Secure Test Environment</span>
              <p className="text-blue-800/90 leading-relaxed">
                Your session is locked to your authenticated student profile. Official MCQ score computation and timer enforcement take place securely on the backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
