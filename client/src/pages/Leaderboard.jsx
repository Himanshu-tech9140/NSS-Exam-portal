import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { subscribeToExamLeaderboard } from '../services/leaderboardSocket';
import {
  Trophy,
  Medal,
  Award,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  Radio,
  User,
  CheckCircle2,
  Home,
} from 'lucide-react';

const Leaderboard = () => {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connected' | 'disconnected' | 'error' | 'connecting'
  const [lastUpdated, setLastUpdated] = useState(null);

  const pollingRef = useRef(null);

  const fetchLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const res = await api.get(`/exams/${examId}/leaderboard`);
      if (res.data.success) {
        setData(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isBackground) {
        setError(err.response?.data?.message || 'Failed to load leaderboard data.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard();

    // Subscribe to real-time Socket.IO room updates
    const unsubscribe = subscribeToExamLeaderboard(
      examId,
      // onUpdate callback: server notified score/rank change -> re-fetch authoritative data
      () => {
        fetchLeaderboard(true);
      },
      // onStatusChange callback
      (status) => {
        setSocketStatus(status);
      }
    );

    return () => {
      unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [examId]);

  // Fallback Polling (Requirement 19): only runs if Socket.IO is disconnected
  useEffect(() => {
    if (socketStatus === 'disconnected' || socketStatus === 'error') {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchLeaderboard(true);
        }, 12000); // 12 seconds
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading live leaderboard...</p>
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
          to="/student/dashboard"
          className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Link
              to="/student/dashboard"
              className="text-xs text-slate-400 hover:text-white flex items-center transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              Dashboard
            </Link>
            <span className="text-slate-600">•</span>
            {/* Live Socket Status Indicator */}
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold">
              {socketStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="text-emerald-400">Live (Connected)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-amber-400">Reconnecting (Fallback active)</span>
                </>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center space-x-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Recruitment Live Leaderboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {data.examTitle} • Deterministic Rank & Tie-Break Logic
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchLeaderboard(false)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Current Student's Rank Card (if evaluated) */}
      {data.myRank !== null && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-xl font-mono">
              #{data.myRank}
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-blue-200 block">
                Your Official Standing
              </span>
              <div className="text-lg font-bold">
                You are currently ranked #{data.myRank} out of {data.totalParticipants} candidate{data.totalParticipants === 1 ? '' : 's'}.
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-2xl font-extrabold font-mono">
              {data.myScore}{' '}
              <span className="text-xs font-normal text-blue-200">/ {data.myTotalPossible} Marks</span>
            </div>
            <p className="text-[11px] text-blue-200">
              {((data.myScore / data.myTotalPossible) * 100).toFixed(1)}% Score
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Total Evaluated Candidates:{' '}
            <span className="font-bold text-slate-800">{data.totalParticipants}</span>
          </div>
          <div>
            {lastUpdated && (
              <span>Last synced: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            )}
          </div>
        </div>

        {data.entries.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No finalized candidates yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Candidates will automatically appear here once their exams and AI subjective evaluations are finalized.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-right">Final Marks</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.entries.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;
                  const pct = ((entry.obtainedMarks / entry.totalMarks) * 100).toFixed(1);

                  return (
                    <tr
                      key={entry.rank}
                      className={`transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-blue-50/80 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-600">#{entry.rank}</span>
                        )}
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{entry.name}</span>
                          {entry.isCurrentUser && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                        {entry.rollNumber}
                      </td>

                      {/* Marks */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {entry.obtainedMarks}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ {entry.totalMarks}</span>
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tie Break Info Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">Official Tie-Breaking Protocol:</div>
        <div>
          Candidates are ranked primarily by total marks (MCQ + Subjective). In case of identical scores, the candidate with the earlier server-recorded finalized submission timestamp receives the higher rank.
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

