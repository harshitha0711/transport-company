import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Filter,
  CheckCircle,
  Wrench,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TrucksPage() {
  const { isManager } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Add Truck Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    truckNumber: '',
    capacity: '500',
    currentBranch: '',
    driverName: '',
    driverPhone: '',
    status: 'AVAILABLE',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Truck Details Modal
  const [selectedTruck, setSelectedTruck] = useState(null);

  const fetchTrucks = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedBranch) params.append('branch', selectedBranch);

      const res = await api.get(`/trucks?${params.toString()}`);
      setTrucks(res.data.data || []);
    } catch (err) {
      console.error('Failed to load fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || []);
      if (res.data.data?.length > 0 && !formData.currentBranch) {
        setFormData((prev) => ({ ...prev, currentBranch: res.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [selectedStatus, selectedBranch]);

  const handleCreateTruck = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/trucks', {
        ...formData,
        capacity: Number(formData.capacity),
      });
      setShowAddModal(false);
      setFormData({
        truckNumber: '',
        capacity: '500',
        currentBranch: branches[0]?._id || '',
        driverName: '',
        driverPhone: '',
        status: 'AVAILABLE',
        notes: '',
      });
      fetchTrucks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add truck to fleet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (truckId, newStatus) => {
    try {
      await api.patch(`/trucks/${truckId}/status`, { status: newStatus });
      fetchTrucks();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    }
  };

  const openTruckDetails = async (truckId) => {
    try {
      const res = await api.get(`/trucks/${truckId}`);
      setSelectedTruck(res.data.data);
    } catch (err) {
      console.error('Error fetching truck details:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">Fleet Vehicles & Allocation State</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor truck capacities, availability timestamps, and active highway transit
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Fleet Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="LOADING">LOADING</option>
          <option value="ON_TRIP">ON_TRIP</option>
          <option value="IDLE">IDLE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Current Locations</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.city})
            </option>
          ))}
        </select>
      </div>

      {/* Fleet Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Scanning vehicle records and telematics..." />
      ) : trucks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No trucks found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trucks.map((truck) => (
            <div
              key={truck._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      FLEET TRUCK NO.
                    </span>
                    <h3 className="font-mono font-bold text-base text-slate-900 mt-0.5">
                      {truck.truckNumber}
                    </h3>
                  </div>
                  <StatusBadge status={truck.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Capacity:</span>
                    <span className="font-bold text-indigo-700 text-sm font-mono">
                      {truck.capacity} m³
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Current Hub:</span>
                    <span className="font-semibold text-slate-800">
                      {truck.currentBranch?.city || 'HQ'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Driver:</span>
                    <span className="font-medium text-slate-800">
                      {truck.driverName} {truck.driverPhone ? `(${truck.driverPhone})` : ''}
                    </span>
                  </div>
                  {truck.destination && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination:</span>
                      <span className="font-semibold text-indigo-600">
                        {truck.destination?.city}
                      </span>
                    </div>
                  )}
                  {truck.lastAvailableAt && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Available Since:</span>
                      <span className="text-slate-600">
                        {new Date(truck.lastAvailableAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openTruckDetails(truck._id)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  View Trip Log
                </button>

                {isManager && (
                  <select
                    value={truck.status}
                    onChange={(e) => handleQuickStatusChange(truck._id, e.target.value)}
                    className="text-[11px] font-medium py-1 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <option value="AVAILABLE">Set AVAILABLE</option>
                    <option value="IDLE">Set IDLE</option>
                    <option value="MAINTENANCE">Set MAINTENANCE</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Truck Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Add Vehicle to Fleet</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTruck} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-04-XY-9999"
                  value={formData.truckNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, truckNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (m³) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    placeholder="e.g. 500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="IDLE">IDLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Branch Location *
                </label>
                <select
                  required
                  value={formData.currentBranch}
                  onChange={(e) => setFormData({ ...formData, currentBranch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    placeholder="Driver Name"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Truck Details & Trip Log Modal */}
      {selectedTruck && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold font-mono">
                  {selectedTruck.truckNumber} - Detailed Telematics
                </h3>
              </div>
              <button
                onClick={() => setSelectedTruck(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Fleet Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedTruck.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block">Capacity:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">
                    {selectedTruck.capacity} m³
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Depot:</span>
                  <span className="font-bold text-indigo-700 text-sm mt-0.5 block">
                    {selectedTruck.currentBranch?.city}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Trip History & Usage Logs ({selectedTruck.trips?.length || 0} Trips)
                </h4>

                {selectedTruck.trips?.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic border border-slate-100 rounded-xl">
                    No completed trips recorded yet for this vehicle.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Departure</th>
                          <th className="px-3 py-2">Route Corridor</th>
                          <th className="px-3 py-2 text-right">Cargo (m³)</th>
                          <th className="px-3 py-2 text-right">Transit Duration</th>
                          <th className="px-3 py-2 text-right">Idle Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {selectedTruck.trips?.map((t) => (
                          <tr key={t._id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600">
                              {new Date(t.departureTime).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {t.source?.city || 'Origin'} → {t.destination?.city || 'Dest'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                              {t.totalCargoVolume} m³
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                              {t.durationHours && t.durationHours > 0
                                ? `${t.durationHours} hrs`
                                : t.status === 'IN_PROGRESS'
                                ? 'In Transit'
                                : 'Standard Corridor'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-purple-700">
                              {t.idleHours !== undefined
                                ? `${t.idleHours} hrs`
                                : `${Number(((t.idleTimeBeforeTripMinutes || 0) / 60).toFixed(1))} hrs`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTruck(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
