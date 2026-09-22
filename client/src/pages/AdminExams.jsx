import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Trophy,
} from 'lucide-react';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 20,
    totalMarks: 20,
    isActive: true,
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const openCreateModal = () => {
    setEditingExam(null);
    setFormData({
      title: '',
      description: '',
      duration: 20,
      totalMarks: 20,
      isActive: true,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      isActive: exam.isActive,
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setError('');

    try {
      if (editingExam) {
        await api.put(`/admin/exams/${editingExam._id}`, formData);
      } else {
        await api.post('/admin/exams', formData);
      }
      setShowCreateModal(false);
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its questions?`)) {
      return;
    }
    try {
      await api.delete(`/admin/exams/${id}`);
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exam.');
    }
  };

  const handleToggleActive = async (exam) => {
    try {
      await api.put(`/admin/exams/${exam._id}`, { isActive: !exam.isActive });
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Exam Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create recruitment tests, configure durations, and manage question sets
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Exam Title</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Questions Pool</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading exams...</span>
                  </td>
                </tr>
              ) : exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{exam.title}</div>
                      {exam.description && (
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                          {exam.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-slate-700">
                      {exam.duration} mins
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs">
                          {exam.totalQuestions} Total
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {exam.mcqCount} MCQs • {exam.subjectiveCount} Subjective
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleActive(exam)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          exam.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {exam.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/exams/${exam._id}/leaderboard`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="View Official Leaderboard"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Leaderboard</span>
                      </Link>
                      <Link
                        to={`/admin/exams/${exam._id}/questions`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Questions ({exam.totalQuestions})</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => openEditModal(exam)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Exam"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam._id, exam.title)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No exams created yet. Click "Create New Exam" above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingExam ? 'Edit Exam' : 'Create New Exam'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. NSS Recruitment Screening Test 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of test syllabus or instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Activate Exam (make visible to candidates on dashboard)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  {modalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingExam ? 'Save Changes' : 'Create Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExams;

