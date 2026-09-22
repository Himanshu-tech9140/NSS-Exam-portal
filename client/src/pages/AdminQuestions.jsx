import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileQuestion,
  Layers,
} from 'lucide-react';

const AdminQuestions = () => {
  const { examId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalType, setModalType] = useState('MCQ'); // 'MCQ' | 'SUBJECTIVE'

  // Form State
  const [formData, setFormData] = useState({
    type: 'MCQ',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    expectedAnswer: '',
    importantPoints: '',
    marks: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const [qRes, examsRes] = await Promise.all([
        api.get(`/admin/questions/${examId}`),
        api.get('/admin/exams'),
      ]);

      if (qRes.data.success) {
        setQuestions(qRes.data.questions);
      }
      if (examsRes.data.success) {
        const found = examsRes.data.exams.find((e) => e._id === examId);
        if (found) setExam(found);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const openAddModal = (type) => {
    setEditingQuestion(null);
    setModalType(type);
    setFormData({
      type,
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      expectedAnswer: '',
      importantPoints: '',
      marks: 1,
    });
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setModalType(q.type);
    setFormData({
      type: q.type,
      question: q.question,
      optionA: q.options?.[0] || '',
      optionB: q.options?.[1] || '',
      optionC: q.options?.[2] || '',
      optionD: q.options?.[3] || '',
      correctAnswer: q.correctAnswer || '',
      expectedAnswer: q.expectedAnswer || '',
      importantPoints: Array.isArray(q.importantPoints) ? q.importantPoints.join(', ') : '',
      marks: q.marks || 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        examId,
        type: modalType,
        question: formData.question.trim(),
        marks: Number(formData.marks) || 1,
      };

      if (modalType === 'MCQ') {
        const options = [
          formData.optionA.trim(),
          formData.optionB.trim(),
          formData.optionC.trim(),
          formData.optionD.trim(),
        ].filter(Boolean);

        if (options.length < 2) {
          setError('Please provide at least 2 options for an MCQ question.');
          setSubmitting(false);
          return;
        }

        if (!formData.correctAnswer.trim()) {
          setError('Please select or specify the correct answer option.');
          setSubmitting(false);
          return;
        }

        payload.options = options;
        payload.correctAnswer = formData.correctAnswer.trim();
      } else {
        payload.expectedAnswer = formData.expectedAnswer.trim();
        payload.importantPoints = formData.importantPoints
          ? formData.importantPoints.split(',').map((p) => p.trim()).filter(Boolean)
          : [];
      }

      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion._id}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }

      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const mcqs = questions.filter((q) => q.type === 'MCQ');
  const subjectives = questions.filter((q) => q.type === 'SUBJECTIVE');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/exams"
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to All Exams</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {exam?.title || 'Exam Questions Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pool Status: {mcqs.length} MCQs (Goal: 15+) • {subjectives.length} Subjective (Goal: 5+)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => openAddModal('MCQ')}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add MCQ</span>
          </button>
          <button
            onClick={() => openAddModal('SUBJECTIVE')}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subjective</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Questions Lists */}
      <div className="space-y-6">
        {/* MCQs Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Multiple Choice Questions ({mcqs.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Random 15 sampled for candidate sessions</span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
              <span>Loading questions...</span>
            </div>
          ) : mcqs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {mcqs.map((q, idx) => (
                <div key={q._id} className="py-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">
                      {q.question}
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                      {q.options?.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${
                            opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
                              ? 'border-emerald-300 bg-emerald-50/70 text-emerald-800 font-semibold'
                              : 'border-slate-200 bg-slate-50/50 text-slate-600'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                          {opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase() && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-start">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit Question"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No MCQ questions added yet. Click "Add MCQ" above.
            </div>
          )}
        </div>

        {/* Subjective Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Subjective Questions ({subjectives.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Random 5 sampled for candidate sessions</span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-slate-400">Loading...</div>
          ) : subjectives.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {subjectives.map((q, idx) => (
                <div key={q._id} className="py-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">
                      {q.question}
                    </div>

                    {q.expectedAnswer && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-800">Expected Response:</strong> {q.expectedAnswer}
                      </div>
                    )}

                    {q.importantPoints?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="text-slate-400 mr-1 font-semibold">Key Points:</span>
                        {q.importantPoints.map((point, pIdx) => (
                          <span
                            key={pIdx}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-start">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit Question"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No subjective questions added yet. Click "Add Subjective" above.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingQuestion ? 'Edit Question' : `Add New ${modalType} Question`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter clear question statement..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MCQ Fields */}
              {modalType === 'MCQ' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Option A</label>
                      <input
                        type="text"
                        required
                        value={formData.optionA}
                        onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                        placeholder="Option A text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Option B</label>
                      <input
                        type="text"
                        required
                        value={formData.optionB}
                        onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                        placeholder="Option B text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Option C</label>
                      <input
                        type="text"
                        required
                        value={formData.optionC}
                        onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                        placeholder="Option C text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Option D</label>
                      <input
                        type="text"
                        required
                        value={formData.optionD}
                        onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                        placeholder="Option D text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correct Option Selector
                    </label>
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                    >
                      <option value="">-- Select Correct Option --</option>
                      {formData.optionA && <option value={formData.optionA}>Option A: {formData.optionA}</option>}
                      {formData.optionB && <option value={formData.optionB}>Option B: {formData.optionB}</option>}
                      {formData.optionC && <option value={formData.optionC}>Option C: {formData.optionC}</option>}
                      {formData.optionD && <option value={formData.optionD}>Option D: {formData.optionD}</option>}
                    </select>
                  </div>
                </div>
              ) : (
                /* Subjective Fields */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expected Answer Summary
                    </label>
                    <textarea
                      rows={2}
                      value={formData.expectedAnswer}
                      onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })}
                      placeholder="Outline what a successful answer should convey..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Important Points / Keywords (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.importantPoints}
                      onChange={(e) => setFormData({ ...formData, importantPoints: e.target.value })}
                      placeholder="e.g. Selfless service, Empathy, Leadership"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marks</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingQuestion ? 'Save Changes' : 'Add Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;

