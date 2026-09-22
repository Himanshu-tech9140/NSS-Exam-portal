import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamInstructions from './pages/ExamInstructions';
import ExamPage from './pages/ExamPage';
import ExamResult from './pages/ExamResult';
import ExamTerminated from './pages/ExamTerminated';
import AdminExams from './pages/AdminExams';
import AdminQuestions from './pages/AdminQuestions';
import AdminEvaluations from './pages/AdminEvaluations';
import Leaderboard from './pages/Leaderboard';
import AdminLeaderboard from './pages/AdminLeaderboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<StudentLogin />} />
              <Route path="/register" element={<StudentRegister />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/instructions"
                element={
                  <ProtectedRoute allowedRole="student">
                    <ExamInstructions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/instructions"
                element={
                  <ProtectedRoute allowedRole="student">
                    <ExamInstructions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId"
                element={
                  <ProtectedRoute allowedRole="student">
                    <ExamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/result"
                element={
                  <ProtectedRoute allowedRole="student">
                    <ExamResult />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/terminated"
                element={
                  <ProtectedRoute allowedRole="student">
                    <ExamTerminated />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminExams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams/:examId/questions"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/evaluations"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminEvaluations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard/:examId"
                element={
                  <ProtectedRoute allowedRole="student">
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams/:examId/leaderboard"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminLeaderboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>National Service Scheme (NSS) • Recruitment Online Test Portal</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
