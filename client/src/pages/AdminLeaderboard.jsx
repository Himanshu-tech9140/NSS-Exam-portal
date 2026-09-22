import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { subscribeToExamLeaderboard } from '../services/leaderboardSocket';
import {
  Trophy,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

const AdminLeaderboard = () => {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);

  const pollingRef = useRef(null);

  const fetchAdminLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/leaderboard/admin`);
      if (res.data.success) {
        setData(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isBackground) {
        setError(err.response?.data?.message || 'Failed to load admin leaderboard.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminLeaderboard();

    const unsubscribe = subscribeToExamLeaderboard(
      examId,
      () => fetchAdminLeaderboard(true),
      (status) => setSocketStatus(status)
    );

    return () => {
      unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [examId]);

  useEffect(() => {
    if (socketStatus === 'disconnected' || socketStatus === 'error') {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchAdminLeaderboard(true);
        }, 12000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [socketStatus]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading administrative ranking data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Leaderboard Error</h2>
        <p className="text-xs sm:text-sm text-slate-600">{error || 'Unable to retrieve leaderboard.'}</p>
        <Link
          to="/admin/exams"
          className="inline-block bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Back to Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/admin/exams"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Back to Exam Management
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-purple-600" />
              <span>Official Admin Leaderboard</span>
            </h1>
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold ml-2">
              {socketStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700">Live Socket</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700">Polling</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {data.examTitle} • Showing finalized, non-terminated candidates with complete evaluation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/evaluations"
            className="flex items-center space-x-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Evaluations</span>
          </Link>
          <button
            onClick={() => fetchAdminLeaderboard(false)}
            className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{data.totalParticipants}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Finalized Candidates</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{data.totalMarks}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Maximum Marks</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {data.entries[0]?.totalMarks !== undefined ? `${data.entries[0].totalMarks} / ${data.totalMarks}` : 'N/A'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Top Score</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Official Candidate Rankings</span>
          {lastUpdated && <span>Last Synced: {lastUpdated.toLocaleTimeString()}</span>}
        </div>

        {data.entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No candidates finalized yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Branch & Year</th>
                  <th className="py-3 px-4 text-center">MCQ (15)</th>
                  <th className="py-3 px-4 text-center">Sub (25)</th>
                  <th className="py-3 px-4 text-right">Total Marks</th>
                  <th className="py-3 px-4">Finalized Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {entry.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                      {entry.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {entry.branch} (Yr {entry.year})
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-blue-700 font-semibold">
                      {entry.mcqMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-purple-700 font-semibold">
                      {entry.subjectiveMarks}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {entry.totalMarks} / {entry.maxMarks}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                      {entry.finalizedAt
                        ? new Date(entry.finalizedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderboard;

