import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Shield,
  LogOut,
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch overview metrics
      const dashRes = await api.get('/admin/dashboard');
      if (dashRes.data.success) {
        setMetrics(dashRes.data.data);
      }

      // Fetch students list
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedBranch) queryParams.append('branch', selectedBranch);

      const studentsRes = await api.get(`/admin/students?${queryParams.toString()}`);
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.students);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedBranch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-medium text-indigo-300">
            <Shield className="w-3.5 h-3.5" />
            <span>NSS Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Signed in as <span className="text-white font-semibold font-mono">{user?.username}</span> (System Administrator)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
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

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      {/* Metric & Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {metrics?.metrics?.totalStudents ?? students.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Candidates
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {metrics?.metrics?.branchesCount ?? 'Active'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Branches
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Exam System
              </div>
              <div className="text-[10px] text-slate-500">
                15 MCQ + 5 Sub
              </div>
            </div>
          </div>
          <Link
            to="/admin/exams"
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Exams
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200/80 bg-purple-50/20 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                AI Evaluations
              </div>
              <div className="text-[10px] text-slate-500">
                Subjective Marks
              </div>
            </div>
          </div>
          <Link
            to="/admin/evaluations"
            className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Review
          </Link>
        </div>
      </div>

      {/* Candidate List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registered Candidates</h2>
            <p className="text-xs text-slate-500">
              Manage and review students registered for recruitment screening
            </p>
          </div>

          {/* Search & Filter */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or roll no..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTimeout(fetchAdminData, 0);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {student.rollNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{student.branch}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        Year {student.year}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(student.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    {loading ? 'Loading candidates...' : 'No candidate records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

