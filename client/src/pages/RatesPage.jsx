import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Clock, CheckCircle, AlertCircle, ArrowRight, Filter } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RatesPage() {
  const { isManager } = useAuth();
  const [rates, setRates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDestination, setFilterDestination] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    ratePerCubicMeter: '',
    estimatedTransitHours: '24',
    description: 'Corridor Freight Tariff',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRates = async () => {
    try {
      const res = await api.get('/rates');
      setRates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || []);
      if (res.data.data?.length > 1 && !formData.origin && !formData.destination) {
        setFormData((prev) => ({
          ...prev,
          origin: res.data.data[0]._id,
          destination: res.data.data[1]._id,
        }));
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchBranches();
  }, []);

  const openAddModal = () => {
    setEditingRate(null);
    setFormData({
      origin: branches[0]?._id || '',
      destination: branches[1]?._id || branches[0]?._id || '',
      ratePerCubicMeter: '',
      estimatedTransitHours: '24',
      description: 'Highway Freight Corridor Tariff',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (rate) => {
    setEditingRate(rate);
    setFormData({
      origin: rate.origin?._id || rate.origin || '',
      destination: rate.destination?._id || rate.destination,
      ratePerCubicMeter: rate.ratePerCubicMeter.toString(),
      estimatedTransitHours: (rate.estimatedTransitHours || 24).toString(),
      description: rate.description || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.origin && formData.origin === formData.destination) {
      setFormError('Origin and Destination branch cannot be the same location');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        origin: formData.origin || null,
        destination: formData.destination,
        ratePerCubicMeter: Number(formData.ratePerCubicMeter),
        estimatedTransitHours: Number(formData.estimatedTransitHours),
        description: formData.description,
      };

      if (editingRate) {
        await api.put(`/rates/${editingRate._id}`, payload);
      } else {
        await api.post('/rates', payload);
      }

      setShowModal(false);
      fetchRates();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save freight tariff');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRates = rates.filter((r) => {
    const origId = typeof r.origin === 'object' && r.origin?._id ? r.origin._id : r.origin || '';
    const destId = typeof r.destination === 'object' && r.destination?._id ? r.destination._id : r.destination || '';
    if (filterOrigin && origId !== filterOrigin) return false;
    if (filterDestination && destId !== filterDestination) return false;
    return true;
  });

  if (loading) {
    return <LoadingSpinner message="Querying route corridor tariffs from database..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Route Corridor Freight Tariffs & Transit Times
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tariff rates (₹/m³) and highway transit durations are configured specifically per Origin → Destination corridor
          </p>
        </div>

        {isManager && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Set Corridor Rate
          </button>
        )}
      </div>

      {/* Corridor Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filter Corridors:</span>
        </div>

        <select
          value={filterOrigin}
          onChange={(e) => setFilterOrigin(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Origins</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              Origin: {b.city} ({b.code})
            </option>
          ))}
        </select>

        <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />

        <select
          value={filterDestination}
          onChange={(e) => setFilterDestination(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Destinations</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              Destination: {b.city} ({b.code})
            </option>
          ))}
        </select>

        {(filterOrigin || filterDestination) && (
          <button
            onClick={() => {
              setFilterOrigin('');
              setFilterDestination('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Tariffs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Route Corridor</th>
                <th className="px-4 py-3">Origin Hub</th>
                <th className="px-4 py-3">Destination Hub</th>
                <th className="px-4 py-3 text-right">Tariff Rate (₹/m³)</th>
                <th className="px-4 py-3 text-right">Estimated Transit</th>
                <th className="px-4 py-3">Highway Description</th>
                {isManager && <th className="px-4 py-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No freight corridors found matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => {
                  const originBranch =
                    typeof r.origin === 'object' && r.origin?.city
                      ? r.origin
                      : branches.find((b) => b._id === (r.origin?._id || r.origin));

                  const destinationBranch =
                    typeof r.destination === 'object' && r.destination?.city
                      ? r.destination
                      : branches.find((b) => b._id === (r.destination?._id || r.destination));

                  const origCity = originBranch?.city || 'Origin';
                  const origName = originBranch?.name || 'Origin Hub';
                  const origCode = originBranch?.code ? `(${originBranch.code})` : '';

                  const destCity = destinationBranch?.city || 'Destination';
                  const destName = destinationBranch?.name || destCity;
                  const destCode = destinationBranch?.code ? `(${destinationBranch.code})` : '';

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <span className="text-indigo-700 font-bold">{origCity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-indigo-700 font-bold">{destCity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{origName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{origCode}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{destName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{destCode}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-indigo-700 text-sm">
                        ₹{r.ratePerCubicMeter} / m³
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {r.estimatedTransitHours || 24} hrs
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                        {r.description || 'Standard Corridor Tariff'}
                      </td>
                      {isManager && (
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => openEditModal(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-medium cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingRate ? 'Modify Route Corridor Tariff' : 'Configure New Route Corridor Rate'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Origin & Destination Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin Hub *
                  </label>
                  <select
                    disabled={!!editingRate}
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60"
                  >
                    <option value="">All Origins (Generic)</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.city} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Hub *
                  </label>
                  <select
                    disabled={!!editingRate}
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60"
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.city} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tariff Rate per m³ (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    placeholder="e.g. 28"
                    value={formData.ratePerCubicMeter}
                    onChange={(e) =>
                      setFormData({ ...formData, ratePerCubicMeter: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transit Duration (Hours) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 7"
                    value={formData.estimatedTransitHours}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedTransitHours: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corridor Description / Route Highway Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru-Chennai Expressway Rapid Corridor (~350 km)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Corridor...' : 'Save Corridor Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
