import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  AlertCircle,
  Award,
  Sparkles,
  BookOpen,
  MessageSquare,
  Trophy,
} from 'lucide-react';

const ExamResult = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError('');

        let currentSessionId = sessionId;
        if (!currentSessionId) {
          // Check active exam session
          const activeRes = await api.get('/exam/active');
          if (activeRes.data.success && activeRes.data.exam?.sessionId) {
            currentSessionId = activeRes.data.exam.sessionId;
          }
        }

        if (!currentSessionId) {
          setError('No completed exam session found.');
          setLoading(false);
          return;
        }

        const res = await api.get(`/exam/session/result?sessionId=${currentSessionId}`);
        if (res.data.success) {
          setResult(res.data.result);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve exam results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Finalizing and evaluating your exam submission...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Result Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-600">{error || 'No result record available.'}</p>
        <Link
          to="/student/dashboard"
          className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Result Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-8 text-white text-center space-y-2">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Exam Submitted Successfully!
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-md mx-auto">
            {result.examTitle || 'NSS Recruitment Online Test'}
          </p>
        </div>

        {/* Candidate & Scores Breakdown */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Candidate Info */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase font-bold text-slate-400">Candidate Name</span>
              <div className="font-bold text-slate-900 text-base">{result.studentName}</div>
            </div>
            <div className="space-y-0.5 sm:text-right">
              <span className="text-[11px] uppercase font-bold text-slate-400">Roll Number</span>
              <div className="font-mono font-bold text-slate-900 text-base">{result.rollNumber}</div>
            </div>
          </div>

          {/* Scores Overview: 3 Cards (MCQ, Subjective, Total) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* MCQ Score Box */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-xs font-bold uppercase tracking-wider">MCQ Score</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono">
                {result.mcqScore}{' '}
                <span className="text-xs font-normal text-blue-600">/ {result.mcqTotalPossible}</span>
              </div>
              <p className="text-[11px] text-blue-700">15 Objective Questions</p>
            </div>

            {/* Subjective Score Box */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-xs font-bold uppercase tracking-wider">Subjective Score</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-900 font-mono">
                {result.subjectiveScore}{' '}
                <span className="text-xs font-normal text-purple-600">/ {result.subjectiveTotalPossible}</span>
              </div>
              <p className="text-[11px] text-purple-700">5 Evaluated Questions</p>
            </div>

            {/* Total Combined Score */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-bold uppercase tracking-wider">Total Score</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono">
                {result.totalScore}{' '}
                <span className="text-xs font-normal text-emerald-600">/ {result.totalPossible}</span>
              </div>
              <p className="text-[11px] text-emerald-700">Final Candidate Mark</p>
            </div>
          </div>

          {/* Subjective Questions AI Feedback Section */}
          {result.subjectiveBreakdown && result.subjectiveBreakdown.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Subjective Answers & AI Feedback</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Status: {result.evaluationStatus?.replace('_', ' ') || 'EVALUATED'}
                </span>
              </div>

              <div className="space-y-3">
                {result.subjectiveBreakdown.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900">
                        <span className="text-purple-600 font-bold mr-1">Q{idx + 1}.</span>
                        {item.question}
                      </div>
                      <div className="shrink-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 text-xs">
                        {item.marks} / {item.maxMarks} Marks
                      </div>
                    </div>

                    {/* Student Submitted Answer */}
                    <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Your Submitted Answer
                      </span>
                      <p className="italic text-xs whitespace-pre-wrap">
                        {item.studentAnswer || <span className="text-slate-400">No answer submitted</span>}
                      </p>
                    </div>

                    {/* AI Feedback / Reason */}
                    {item.reason && (
                      <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3 text-purple-950 flex items-start space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-purple-700 block mb-0.5">
                            Evaluator Feedback
                          </span>
                          <p className="text-xs text-purple-900">{item.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Timestamp details */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Status: <span className="font-semibold text-slate-700 capitalize">{result.status?.replace('_', ' ')}</span>
            </div>
            <div>
              Submission Time: <span className="font-mono font-semibold text-slate-700">{result.submissionTime}</span>
            </div>
          </div>

          {/* Action buttons: View Leaderboard & Return Dashboard */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {result.examId && (
              <Link
                to={`/leaderboard/${result.examId}`}
                className="flex-1 flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors text-xs sm:text-sm shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>View Live Leaderboard</span>
              </Link>
            )}
            <Link
              to="/student/dashboard"
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-xs sm:text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
