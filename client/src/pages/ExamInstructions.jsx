import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get('/exam/active');
        if (res.data.success && res.data.exam) {
          setExam(res.data.exam);
          // If student was terminated, redirect to terminated page
          if (res.data.exam.sessionStatus === 'TERMINATED') {
            navigate('/exam/terminated', {
              state: { reason: res.data.exam.terminationReason },
            });
            return;
          }
          // If student already completed, redirect to result
          if (
            res.data.exam.sessionStatus === 'COMPLETED' ||
            res.data.exam.sessionStatus === 'AUTO_SUBMITTED'
          ) {
            navigate(`/exam/result?sessionId=${res.data.exam.sessionId}`);
            return;
          }
        } else {
          setError('No active exam currently available.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch exam instructions.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [navigate]);

  const handleStartExam = async () => {
    if (!exam) return;
    setStarting(true);
    setError('');

    try {
      // Strict requirement: Request browser fullscreen before starting exam
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (fsErr) {
          setError(
            'Fullscreen mode is strictly required to begin the examination. Please allow fullscreen access and retry.'
          );
          setStarting(false);
          return;
        }
      }

      const targetExamId = examId || exam.id;
      const res = await api.post(`/exam/${targetExamId}/start`);

      if (res.data.success) {
        if (res.data.clientSessionToken) {
          sessionStorage.setItem('nss_exam_session_token', res.data.clientSessionToken);
        }
        const sessionId = res.data.session?.sessionId || res.data.sessionId;
        navigate(`/exam/${targetExamId}?sessionId=${sessionId}`);
      }
    } catch (err) {
      if (err.response?.data?.isTerminated) {
        navigate('/exam/terminated', {
          state: { reason: err.response.data.message },
        });
        return;
      }
      const msg = err.response?.data?.message || 'Could not start exam. Please try again.';
      setError(msg);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading exam guidelines...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/student/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Student Dashboard</span>
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Instruction Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 text-white">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
            <span>Online Screening</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {exam?.title || 'NSS Recruitment Online Test 2026'}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Please carefully read all guidelines before launching your test session.
          </p>
        </div>

        {/* Structure Badges */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60 text-center py-4 px-2">
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-600">15</div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">MCQs</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-600">5</div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Subjective</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
              {exam?.duration || 20} min
            </div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">Duration</div>
          </div>
        </div>

        {/* Instructions Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Exam Structure & Guidelines</span>
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Total Questions:</strong> The test consists of exactly <strong>20 questions</strong> (15 multiple-choice questions + 5 short subjective questions).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Server Timer:</strong> You have <strong>{exam?.duration || 20} minutes</strong>. The server is the absolute source of truth for time.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Automatic Progress Saving:</strong> Every answer you select or write is automatically saved to the server. If you refresh your browser, your assigned questions and answers will be restored.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Time Expiry:</strong> When time runs out, the test will submit automatically and compute your MCQ score.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Manual Submission:</strong> Click "Submit Exam" once you are satisfied with your answers. You cannot change answers after submitting.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm space-y-2">
            <div className="font-bold flex items-center space-x-1.5 text-rose-900">
              <ShieldCheck className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Strict Anti-Cheating Policy (Zero Tolerance):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-rose-700 pl-1">
              <li>Fullscreen mode is mandatory and verified throughout the exam.</li>
              <li>Exiting fullscreen, switching tabs, or minimizing the window will <strong>instantly terminate</strong> your test.</li>
              <li>Copy, paste, cut, right-click, devtools shortcuts, and print screen are prohibited and will trigger immediate termination.</li>
              <li>There are <strong>NO warnings</strong>. Terminated exams cannot be resumed or restarted.</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs sm:text-sm space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Important Notice:</span>
            </div>
            <p className="leading-relaxed">
              Once you click <strong>"Start Exam"</strong>, your browser will switch to fullscreen and the timer will begin immediately on the server.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleStartExam}
              disabled={starting || !exam}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer text-sm sm:text-base"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing Your Exam Questions...</span>
                </>
              ) : (
                <>
                  <span>
                    {exam?.sessionStatus === 'IN_PROGRESS' ? 'Resume Exam Session' : 'I Am Ready — Start Exam'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructions;

