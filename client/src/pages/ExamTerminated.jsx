import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';

const ExamTerminated = () => {
  const location = useLocation();
  const reason =
    location.state?.reason ||
    'A prohibited browser action or security policy violation was detected.';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden text-center">
        {/* Warning Top Banner */}
        <div className="bg-rose-600 p-8 text-white space-y-3">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Exam Terminated</h1>
          <p className="text-rose-100 text-xs sm:text-sm font-medium">
            Your exam attempt has been closed immediately.
          </p>
        </div>

        {/* Details Box */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Reason for Termination</span>
            </div>
            <p className="text-slate-900 font-semibold text-sm sm:text-base">{reason}</p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-500 text-center leading-relaxed">
            <p>
              Your violation and attempt have been logged in the system with timestamp and session
              identifiers.
            </p>
            <p className="font-semibold text-rose-600">
              No further attempts or answer modifications are permitted.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center justify-center space-x-2 w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTerminated;
