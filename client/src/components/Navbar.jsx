import React, { useState } from 'react';
import { RefreshCw, Play, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, onAllocationTriggered }) {
  const { user, isManager } = useAuth();
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleRunAllocation = async () => {
    if (running) return;
    setRunning(true);
    setFeedback(null);
    try {
      const res = await api.post('/allocation/run');
      setFeedback({
        type: 'success',
        message: res.data.message || 'Auto-allocation engine finished',
      });
      if (onAllocationTriggered) {
        onAllocationTriggered(res.data);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error executing allocation',
      });
    } finally {
      setRunning(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 no-print">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">{title}</h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Database Connected
        </div>
      </div>

      <div className="flex items-center gap-3">
        {feedback && (
          <div
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {feedback.message}
          </div>
        )}

        {isManager && (
          <button
            onClick={handleRunAllocation}
            disabled={running}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Evaluate 500m³ cargo queues and allocate earliest available truck"
          >
            <Zap className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running Allocation Engine...' : 'Run Auto-Allocation'}
          </button>
        )}

        <div className="text-right text-xs">
          <span className="text-slate-400 block">Hub Branch</span>
          <span className="font-semibold text-slate-800">
            {user?.branch?.name || 'Central Head Office'}
          </span>
        </div>
      </div>
    </header>
  );
}
