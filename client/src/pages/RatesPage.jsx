import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RatesPage() {
  const { isManager } = useAuth();
  const [rates, setRates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    ratePerCubicMeter: '',
    estimatedTransitHours: '24',
    description: 'Standard Freight Tariff',
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
      if (res.data.data?.length > 0 && !formData.destination) {
        setFormData((prev) => ({ ...prev, destination: res.data.data[0]._id }));
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
      destination: branches[0]?._id || '',
      ratePerCubicMeter: '',
      estimatedTransitHours: '24',
      description: 'Standard Freight Tariff',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (rate) => {
    setEditingRate(rate);
    setFormData({
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
    setSubmitting(true);

    try {
      const payload = {
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

  if (loading) {
    return <LoadingSpinner message="Querying destination freight tariffs from database..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Destination Freight Tariffs & Rate Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transport charges (Volume × Rate) are dynamically calculated strictly from database rates
          </p>
        </div>

        {isManager && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Set Destination Rate
          </button>
        )}
      </div>

      {/* Tariffs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Destination Hub</th>
                <th className="px-4 py-3">City & Code</th>
                <th className="px-4 py-3 text-right">Tariff Rate (₹ per m³)</th>
                <th className="px-4 py-3 text-right">Estimated Transit</th>
                <th className="px-4 py-3">Corridor Description</th>
                {isManager && <th className="px-4 py-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rates.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {r.destination?.name || 'Destination Terminal'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-800">{r.destination?.city}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                      ({r.destination?.code})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-extrabold text-indigo-700 text-sm">
                    ₹{r.ratePerCubicMeter} / m³
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                    {r.estimatedTransitHours || 24} hrs
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{r.description || 'Standard Tariff'}</td>
                  {isManager && (
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => openEditModal(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-medium cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Rate
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingRate ? 'Modify Freight Tariff Rate' : 'Configure New Destination Rate'}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Terminal *
                </label>
                <select
                  disabled={!!editingRate}
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60"
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
                    Rate per m³ (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    placeholder="e.g. 50"
                    value={formData.ratePerCubicMeter}
                    onChange={(e) =>
                      setFormData({ ...formData, ratePerCubicMeter: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transit Duration (Hrs)
                  </label>
                  <input
                    type="number"
                    min="1"
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
                  Tariff Notes / Description
                </label>
                <input
                  type="text"
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
                  {submitting ? 'Saving Tariff...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
