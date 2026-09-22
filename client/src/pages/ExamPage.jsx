import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { useExamAntiCheat } from '../hooks/useExamAntiCheat';

const ExamPage = () => {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');

  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savingStatus, setSavingStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  // Time remaining in seconds
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmittedAlert, setAutoSubmittedAlert] = useState(false);

  // Subjective debounce timer ref
  const debounceRef = useRef(null);

  // Fetch session and questions on mount
  const loadExamSession = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // If no sessionId in URL, check active exam first
      let currentSessionId = sessionIdParam;
      if (!currentSessionId) {
        const activeRes = await api.get('/exam/active');
        if (activeRes.data.success && activeRes.data.exam?.sessionId) {
          currentSessionId = activeRes.data.exam.sessionId;
        } else {
          // Attempt to start / resume
          const startRes = await api.post(`/exam/${examId}/start`);
          if (startRes.data.clientSessionToken) {
            sessionStorage.setItem('nss_exam_session_token', startRes.data.clientSessionToken);
          }
          currentSessionId = startRes.data.session?.sessionId || startRes.data.sessionId;
        }
      }

      if (!currentSessionId) {
        setError('No active exam session found. Please start from the instructions page.');
        setLoading(false);
        return;
      }

      const res = await api.get(`/exam/session/questions?sessionId=${currentSessionId}`);

      if (res.data.isTerminated || res.data.session?.status === 'TERMINATED') {
        navigate('/exam/terminated', {
          state: { reason: res.data.reason || res.data.session?.terminationReason },
        });
        return;
      }

      if (res.data.isExpired || res.data.session?.status === 'AUTO_SUBMITTED' || res.data.session?.status === 'COMPLETED') {
        navigate(`/exam/result?sessionId=${currentSessionId}`);
        return;
      }

      setExam(res.data.exam);
      setSession(res.data.session);
      setQuestions(res.data.questions || []);
      setAnswersMap(res.data.answersMap || {});

      // Calculate initial time left from server expiresAt
      const serverExpiresAt = new Date(res.data.session.expiresAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((serverExpiresAt - Date.now()) / 1000));
      setTimeLeft(diffSeconds);
    } catch (err) {
      if (err.response?.data?.isTerminated) {
        navigate('/exam/terminated', {
          state: { reason: err.response.data.message },
        });
        return;
      }
      setError(err.response?.data?.message || 'Failed to load exam session.');
    } finally {
      setLoading(false);
    }
  }, [examId, sessionIdParam, navigate]);

  useEffect(() => {
    loadExamSession();
  }, [loadExamSession]);

  // Central termination callback
  const handleTerminated = useCallback(
    (reason) => {
      try {
        sessionStorage.removeItem('nss_exam_session_token');
      } catch {}
      navigate('/exam/terminated', { state: { reason } });
    },
    [navigate]
  );

  // Anti-Cheat active while session is IN_PROGRESS
  const isAntiCheatActive = Boolean(
    session && session.status === 'IN_PROGRESS' && !submitting && !autoSubmittedAlert
  );

  useExamAntiCheat({
    sessionId: session?.sessionId,
    active: isAntiCheatActive,
    onTerminated: handleTerminated,
  });

  // Heartbeat keepalive every 10 seconds
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS' || submitting || autoSubmittedAlert) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.post('/exam/session/heartbeat', {
          sessionId: session.sessionId,
        });

        if (res.data.isTerminated) {
          navigate('/exam/terminated', {
            state: { reason: res.data.terminationReason },
          });
        } else if (res.data.isExpired) {
          handleAutoSubmit();
        }
      } catch (err) {
        if (err.response?.data?.isTerminated) {
          navigate('/exam/terminated', {
            state: { reason: err.response.data.message },
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [session, submitting, autoSubmittedAlert, navigate]);

  // Server-synced countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !session) return;

    const timer = setInterval(() => {
      const serverExpiresAt = new Date(session.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((serverExpiresAt - Date.now()) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, timeLeft]);

  // Auto-submit handler triggered when server-side expiresAt is reached
  const handleAutoSubmit = async () => {
    setAutoSubmittedAlert(true);
    try {
      await api.post('/exam/session/submit', { sessionId: session.sessionId });
    } catch {
      // Ignore if server already auto-submitted
    } finally {
      setTimeout(() => {
        navigate(`/exam/result?sessionId=${session.sessionId}`);
      }, 2500);
    }
  };

  // Save answer to backend
  const saveAnswerToBackend = async (questionId, answerValue) => {
    if (!session) return;
    setSavingStatus('saving');

    try {
      const res = await api.post('/exam/session/answer', {
        sessionId: session.sessionId,
        questionId,
        answer: answerValue,
      });

      if (res.data.isTerminated) {
        navigate('/exam/terminated', {
          state: { reason: res.data.reason || res.data.message },
        });
        return;
      }

      if (res.data.isExpired) {
        handleAutoSubmit();
        return;
      }

      setSavingStatus('saved');
    } catch (err) {
      if (err.response?.data?.isTerminated) {
        navigate('/exam/terminated', {
          state: { reason: err.response.data.message },
        });
        return;
      }
      if (err.response?.data?.isExpired) {
        handleAutoSubmit();
      } else {
        setSavingStatus('error');
      }
    }
  };

  // MCQ Selection handler
  const handleOptionSelect = (optionText) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updatedAnswers = {
      ...answersMap,
      [currentQ.questionId]: optionText,
    };
    setAnswersMap(updatedAnswers);
    saveAnswerToBackend(currentQ.questionId, optionText);
  };

  // Subjective Input handler with debounce
  const handleSubjectiveChange = (e) => {
    const text = e.target.value;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswersMap((prev) => ({
      ...prev,
      [currentQ.questionId]: text,
    }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAnswerToBackend(currentQ.questionId, text);
    }, 600);
  };

  // Manual Exam Submission
  const handleManualSubmit = async () => {
    if (!session) return;
    setSubmitting(true);

    try {
      const res = await api.post('/exam/session/submit', {
        sessionId: session.sessionId,
      });

      if (res.data.success) {
        try {
          sessionStorage.removeItem('nss_exam_session_token');
        } catch {}
        navigate(`/exam/result?sessionId=${session.sessionId}`);
      }
    } catch (err) {
      if (err.response?.data?.isTerminated) {
        navigate('/exam/terminated', {
          state: { reason: err.response.data.message },
        });
        return;
      }
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    if (secs === null || isNaN(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading test session questions...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Session Error</h2>
        <p className="text-xs sm:text-sm text-slate-600">{error}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answersMap[currentQ.questionId] || '' : '';
  const answeredCount = Object.keys(answersMap).filter((k) => (answersMap[k] || '').trim()).length;

  return (
    <div className="exam-secure-area relative min-h-screen py-4 sm:py-6 px-4 max-w-6xl mx-auto space-y-4">
      {/* Subtle Student-Specific Watermark Overlay (Requirement 19) */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-wrap items-center justify-around opacity-[0.035] p-6 gap-20 rotate-[-15deg] leading-tight"
        aria-hidden="true"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="text-center font-mono font-bold tracking-widest text-slate-900 text-xs sm:text-sm"
          >
            <div>{user?.name?.toUpperCase() || 'NSS CANDIDATE'}</div>
            <div>{user?.rollNumber?.toUpperCase() || 'ROLL NUMBER'}</div>
            <div>NSS-2026</div>
          </div>
        ))}
      </div>

      <div className="relative z-10 space-y-4">
        {/* Auto-submitted notification overlay */}
        {autoSubmittedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Time is over</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Time is over. Your exam has been submitted automatically. Redirecting to your results...
            </p>
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Candidate & Exam Info */}
        <div className="space-y-1">
          <div className="text-xs text-blue-400 font-semibold tracking-wide uppercase">
            {exam?.title || 'NSS Recruitment Test'}
          </div>
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <span className="font-bold text-slate-100">{user?.name}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-300">Roll: {user?.rollNumber}</span>
          </div>
        </div>

        {/* Server Countdown Timer */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm sm:text-base font-mono font-bold transition-colors ${
              timeLeft !== null && timeLeft < 300
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-emerald-400 border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </div>

      {/* Main Examination Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Current Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="inline-block ml-3 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                  {currentQ?.type} • {currentQ?.marks} Mark{currentQ?.marks > 1 ? 's' : ''}
                </span>
              </div>

              {/* Save Status Indicator */}
              <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                {savingStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span>Saving...</span>
                  </>
                )}
                {savingStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Saved</span>
                  </>
                )}
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              {currentQ?.question}
            </div>

            {/* Answer Input depending on type */}
            {currentQ?.type === 'MCQ' ? (
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((option, idx) => {
                  const isSelected = currentAnswer === option;
                  const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {optionLabel}
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Type your subjective answer below:
                </label>
                <textarea
                  rows={6}
                  value={currentAnswer}
                  onChange={handleSubjectiveChange}
                  placeholder="Write a clear, thoughtful response. Your answer is automatically saved..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-y leading-relaxed font-sans"
                ></textarea>
                <span className="text-[11px] text-slate-400">
                  Character count: {currentAnswer.length}
                </span>
              </div>
            )}

            {/* Navigation Stepper Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {currentIndex + 1} / {questions.length}
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Submit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Grid & Overview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-700">Question Palette</span>
              <span className="text-xs font-semibold text-emerald-600">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>

            {/* Grid of 20 question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const hasAnswer = Boolean((answersMap[q.questionId] || '').trim());
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-600 text-white shadow-sm'
                        : hasAnswer
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block"></span>
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                <span>Current Question</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Confirm Exam Submission</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Are you sure you want to submit your exam?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
                {questions.length - answeredCount > 0 && (
                  <span className="text-amber-600 block mt-1">
                    Warning: You have {questions.length - answeredCount} unanswered question(s).
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit Exam</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ExamPage;

