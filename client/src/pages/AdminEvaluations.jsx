import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Sparkles,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  Edit3,
  RotateCcw,
  User,
  BookOpen,
} from 'lucide-react';

const AdminEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Override Modal state
  const [selectedEval, setSelectedEval] = useState(null);
  const [overrideMarks, setOverrideMarks] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter
        ? `/admin/evaluations?status=${statusFilter}`
        : '/admin/evaluations';
      const res = await api.get(url);
      if (res.data.success) {
        setEvaluations(res.data.evaluations);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load evaluations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [statusFilter]);

  const handleRetry = async (evalId) => {
    setActionLoadingId(evalId);
    try {
      const res = await api.post(`/admin/evaluations/${evalId}/retry`);
      if (res.data.success) {
        setEvaluations((prev) =>
          prev.map((e) => (e._id === evalId ? res.data.evaluation : e))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry evaluation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openOverrideModal = (evaluation) => {
    setSelectedEval(evaluation);
    const initialMarks =
      evaluation.status === 'OVERRIDDEN' && evaluation.overrideMarks !== undefined
        ? evaluation.overrideMarks
        : evaluation.aiMarks || 0;
    setOverrideMarks(initialMarks);
    setOverrideReason(evaluation.overrideReason || '');
    setOverrideError('');
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (overrideMarks === '' || isNaN(Number(overrideMarks))) {
      setOverrideError('Please enter valid marks.');
      return;
    }
    const marksNum = Number(overrideMarks);
    if (marksNum < 0 || marksNum > selectedEval.maxMarks) {
      setOverrideError(`Marks must be between 0 and ${selectedEval.maxMarks}.`);
      return;
    }
    if (!overrideReason.trim()) {
      setOverrideError('Please provide a reason for the override.');
      return;
    }

    setOverrideSubmitting(true);
    setOverrideError('');
    try {
      const res = await api.patch(`/admin/evaluations/${selectedEval._id}/override`, {
        overrideMarks: marksNum,
        overrideReason: overrideReason.trim(),
      });
      if (res.data.success) {
        setEvaluations((prev) =>
          prev.map((e) => (e._id === selectedEval._id ? res.data.evaluation : e))
        );
        setSelectedEval(null);
      }
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to override evaluation.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>AI Subjective Answer Evaluations</span>
          </h1>
          <p className="text-xs text-slate-500">
            Review student answers, AI-evaluated marks, retry failed requests, or apply manual overrides.
          </p>
        </div>

        <button
          onClick={fetchEvaluations}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium text-slate-600">
        {[
          { label: 'All Evaluations', value: '' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Overridden', value: 'OVERRIDDEN' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Failed', value: 'FAILED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-purple-600 text-white font-semibold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Evaluations List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading subjective evaluations...</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-600 text-sm font-semibold">No evaluations found.</p>
          <p className="text-slate-400 text-xs">
            Evaluations are automatically triggered once students submit their exam attempts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => {
            const effectiveMarks =
              ev.status === 'OVERRIDDEN' && ev.overrideMarks !== undefined
                ? ev.overrideMarks
                : ev.aiMarks || 0;

            return (
              <div
                key={ev._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header: Candidate & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      {ev.studentId?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{ev.studentId?.name || 'Student'}</span>
                      <span className="text-slate-400 font-mono ml-2">({ev.studentId?.rollNumber || 'N/A'})</span>
                      <span className="text-slate-400 ml-2">• Session: {ev.sessionId}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        ev.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ev.status === 'OVERRIDDEN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : ev.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ev.status}
                    </span>

                    <div className="bg-slate-100 font-mono font-bold text-slate-800 text-xs px-2.5 py-0.5 rounded-lg">
                      {effectiveMarks} / {ev.maxMarks} Marks
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1">
                  <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Question</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">
                    {ev.questionId?.question || 'Subjective Question'}
                  </p>
                </div>

                {/* Candidate's Submitted Answer */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Candidate Submitted Answer
                  </span>
                  <p className="text-xs text-slate-800 italic whitespace-pre-wrap">
                    {ev.studentAnswer || <span className="text-slate-400">Blank / No answer provided</span>}
                  </p>
                </div>

                {/* AI / Evaluator Reason */}
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3.5 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">
                    {ev.status === 'OVERRIDDEN' ? 'Manual Override Details' : 'AI Evaluator Feedback'}
                  </span>
                  <p className="text-slate-700">{ev.aiReason || 'No feedback recorded.'}</p>

                  {ev.status === 'OVERRIDDEN' && (
                    <div className="mt-2 pt-2 border-t border-purple-100 text-[11px] text-purple-900">
                      <span className="font-semibold">Override Reason:</span> {ev.overrideReason}
                    </div>
                  )}

                  {ev.errorMessage && (
                    <p className="text-rose-600 font-medium mt-1">Error: {ev.errorMessage}</p>
                  )}
                </div>

                {/* Actions: Retry (if FAILED) & Override */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  {ev.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(ev._id)}
                      disabled={actionLoadingId === ev._id}
                      className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${actionLoadingId === ev._id ? 'animate-spin' : ''}`} />
                      <span>Retry AI</span>
                    </button>
                  )}

                  <button
                    onClick={() => openOverrideModal(ev)}
                    className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{ev.status === 'OVERRIDDEN' ? 'Edit Override' : 'Override Marks'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Override Modal */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Manual Marks Override</span>
            </h2>
            <p className="text-xs text-slate-500">
              Admin marks override takes absolute priority over the AI evaluation. Total candidate scores will be updated immediately.
            </p>

            {overrideError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Marks Awarded (Max: {selectedEval.maxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedEval.maxMarks}
                  step="0.5"
                  value={overrideMarks}
                  onChange={(e) => setOverrideMarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Override Justification / Reason
                </label>
                <textarea
                  rows="3"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why marks are being modified..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEval(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  {overrideSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvaluations;

