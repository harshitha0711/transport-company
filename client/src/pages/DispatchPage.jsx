import React, { useState, useEffect } from 'react';
import {
  Send,
  Zap,
  Truck,
  CheckCircle,
  FileText,
  Clock,
  Printer,
  AlertTriangle,
  Play,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import DispatchDocumentModal from '../components/DispatchDocumentModal';

export default function DispatchPage() {
  const { isManager } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [pendingSummary, setPendingSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-allocation action state
  const [allocating, setAllocating] = useState(false);
  const [allocFeedback, setAllocFeedback] = useState(null);

  // Selected manifest for document modal
  const [activeDispatch, setActiveDispatch] = useState(null);

  const fetchDispatchData = async () => {
    try {
      const [dispRes, pendingRes] = await Promise.all([
        api.get('/dispatch'),
        api.get('/allocation/pending'),
      ]);
      setDispatches(dispRes.data.data || []);
      setPendingSummary(pendingRes.data.data || null);
    } catch (err) {
      console.error('Failed to load dispatch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const handleRunAllocation = async () => {
    setAllocating(true);
    setAllocFeedback(null);

    try {
      const res = await api.post('/allocation/run');
      setAllocFeedback({
        type: 'success',
        text: res.data.message || 'Auto allocation engine executed successfully!',
        data: res.data.data,
      });
      fetchDispatchData();
    } catch (err) {
      setAllocFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error executing allocation engine',
      });
    } finally {
      setAllocating(false);
    }
  };

  const handleDepartTruck = async (dispatchId) => {
    try {
      await api.post(`/dispatch/${dispatchId}/depart`);
      fetchDispatchData();
      if (activeDispatch && activeDispatch._id === dispatchId) {
        const updated = await api.get(`/dispatch/${dispatchId}`);
        setActiveDispatch(updated.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record truck departure');
    }
  };

  const handleDeliverTruck = async (dispatchId) => {
    try {
      await api.post(`/dispatch/${dispatchId}/deliver`);
      fetchDispatchData();
      if (activeDispatch && activeDispatch._id === dispatchId) {
        const updated = await api.get(`/dispatch/${dispatchId}`);
        setActiveDispatch(updated.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete delivery');
    }
  };

  const viewManifest = async (dispatchId) => {
    try {
      const res = await api.get(`/dispatch/${dispatchId}`);
      setActiveDispatch(res.data.data);
    } catch (err) {
      console.error('Error fetching manifest document:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dispatch orders and cargo queue status..." />;
  }

  const pendingGroups = pendingSummary?.pendingGroups || [];

  return (
    <div className="space-y-6">
      {/* Allocation Banner Feedback */}
      {allocFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            allocFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{allocFeedback.text}</span>
          </div>
          <button
            onClick={() => setAllocFeedback(null)}
            className="text-xs uppercase text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Banner & Auto Allocation Engine Trigger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 m-0">
              Automatic Truck Allocation Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            The core backend algorithm monitors pending cargo volume. Once a destination reaches{' '}
            <span className="font-bold text-slate-700">500 m³</span>, it selects the earliest available truck,
            packs consignments up to truck capacity, creates a dispatch manifest, and sets truck status to LOADING.
          </p>
        </div>

        {isManager && (
          <button
            onClick={handleRunAllocation}
            disabled={allocating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Zap className={`w-4 h-4 ${allocating ? 'animate-spin' : ''}`} />
            {allocating ? 'Executing Algorithm...' : 'Run Auto-Allocation Engine'}
          </button>
        )}
      </div>

      {/* Destination Queues Towards 500 m³ Threshold */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">Pending Queues by Destination</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current pending volume awaiting truck allocation
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {pendingSummary?.availableTrucksCount || 0} Trucks Available in Fleet
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingGroups.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs italic">
              No cargo currently awaiting truck allocation.
            </div>
          ) : (
            pendingGroups.map((grp) => {
              const isReady = grp.totalVolume >= 500;
              const rawPct = (grp.totalVolume / 500) * 100;
              const displayPct = isReady
                ? '100%'
                : rawPct % 1 === 0
                ? `${rawPct}%`
                : `${rawPct.toFixed(1)}%`;
              const barWidth = Math.min(100, rawPct);

              return (
                <div
                  key={grp.key}
                  className={`p-4 rounded-xl border transition-all ${
                    isReady
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Route
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {grp.sourceBranch?.city || 'Origin'} → {grp.destinationBranch?.city}
                      </h4>
                    </div>
                    {isReady ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase animate-pulse">
                        ≥ 500 m³ Reached
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {grp.consignmentCount} shipments
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-800">
                        {grp.totalVolume} m³ / 500 m³
                      </span>
                      <span className="font-bold text-indigo-600">{displayPct}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReady ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500">
                    {isReady
                      ? 'Eligible for auto-allocation! Next available truck will be assigned.'
                      : `Deficit: ${(500 - grp.totalVolume).toFixed(2)} m³ to trigger automatic dispatch.`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dispatch Manifests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">
              Fleet Dispatch Orders & Manifests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active road manifests, truck loadings, and transit state
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            {dispatches.length} Manifest Orders
          </span>
        </div>

        {dispatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No dispatch orders created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Dispatch #</th>
                  <th className="px-4 py-3">Allocated Truck</th>
                  <th className="px-4 py-3">Route Corridor</th>
                  <th className="px-4 py-3 text-right">Cargo Volume</th>
                  <th className="px-4 py-3">Driver Info</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {dispatches.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-600 block">
                        {d.dispatchNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {d.dispatchTime
                          ? new Date(d.dispatchTime).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">
                        {d.truck?.truckNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cap: {d.truck?.capacity} m³
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {d.sourceBranch?.city} → {d.destinationBranch?.city}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">
                      {d.totalVolume} m³ ({d.consignments?.length || 0} shipments)
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">
                        {d.driverName || d.truck?.driverName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.driverPhone || d.truck?.driverPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => viewManifest(d._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Manifest Doc
                        </button>

                        {d.status === 'PREPARED' && (
                          <button
                            onClick={() => handleDepartTruck(d._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Mark Truck as Departed on Highway Trip"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Depart
                          </button>
                        )}

                        {d.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleDeliverTruck(d._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Mark Truck as Arrived and Cargo Delivered"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Deliver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Dispatch Document Modal */}
      {activeDispatch && (
        <DispatchDocumentModal
          dispatch={activeDispatch}
          onClose={() => setActiveDispatch(null)}
          onDepart={handleDepartTruck}
          onDeliver={handleDeliverTruck}
          isManager={isManager}
        />
      )}
    </div>
  );
}
