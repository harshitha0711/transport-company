import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConsignmentBillModal from '../components/ConsignmentBillModal';

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [allocationNotice, setAllocationNotice] = useState(null);

  // New Consignment Form State
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderGst: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverGst: '',
    sourceBranch: '',
    destinationBranch: '',
    volume: '',
    description: 'Commercial Cargo Goods',
    paymentStatus: 'PAID',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Rate preview calculation
  const [matchedRate, setMatchedRate] = useState(null);

  const fetchConsignments = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedDestination) queryParams.append('destinationBranch', selectedDestination);

      const res = await api.get(`/consignments?${queryParams.toString()}`);
      setConsignments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load consignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [branchesRes, ratesRes] = await Promise.all([
        api.get('/branches'),
        api.get('/rates'),
      ]);
      setBranches(branchesRes.data.data || []);
      setRates(ratesRes.data.data || []);

      // Default source branch to first branch (e.g. Mumbai HQ)
      if (branchesRes.data.data?.length > 0 && !formData.sourceBranch) {
        setFormData((prev) => ({
          ...prev,
          sourceBranch: branchesRes.data.data[0]._id,
        }));
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchConsignments();
  }, [search, selectedStatus, selectedDestination]);

  // When origin or destination branch changes, find corridor-specific rate from database
  useEffect(() => {
    if (formData.sourceBranch && formData.destinationBranch) {
      const srcId = formData.sourceBranch;
      const destId = formData.destinationBranch;

      // 1. Look for exact Origin -> Destination corridor match
      const corridorRate = rates.find(
        (r) =>
          (r.origin?._id === srcId || r.origin === srcId) &&
          (r.destination?._id === destId || r.destination === destId)
      );

      // 2. Fallback to destination-level rate if corridor not specifically configured
      const fallbackRate = rates.find(
        (r) => r.destination?._id === destId || r.destination === destId
      );

      setMatchedRate(corridorRate || fallbackRate || null);
    } else {
      setMatchedRate(null);
    }
  }, [formData.sourceBranch, formData.destinationBranch, rates]);

  const estimatedCharge =
    matchedRate && formData.volume && Number(formData.volume) > 0
      ? (Number(formData.volume) * matchedRate.ratePerCubicMeter).toFixed(2)
      : null;

  const handleCreateConsignment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.sourceBranch === formData.destinationBranch) {
      setFormError('Source and Destination branch cannot be the same location');
      return;
    }

    if (!matchedRate) {
      setFormError('No transport tariff rate found in database for the selected destination');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sender: {
          name: formData.senderName,
          phone: formData.senderPhone,
          address: formData.senderAddress,
          gstNumber: formData.senderGst,
        },
        receiver: {
          name: formData.receiverName,
          phone: formData.receiverPhone,
          address: formData.receiverAddress,
          gstNumber: formData.receiverGst,
        },
        sourceBranch: formData.sourceBranch,
        destinationBranch: formData.destinationBranch,
        volume: Number(formData.volume),
        description: formData.description,
        paymentStatus: formData.paymentStatus,
      };

      const res = await api.post('/consignments', payload);
      const createdConsignment = res.data.data;

      // Close modal and open bill view
      setShowAddModal(false);
      setActiveBill(createdConsignment);

      // Check if automatic truck allocation was triggered!
      if (res.data.allocationTriggered) {
        setAllocationNotice({
          type: 'success',
          text: 'Cargo queue reached >= 500 m³! Automatic truck allocation triggered immediately!',
        });
      }

      // Reset form
      setFormData((prev) => ({
        ...prev,
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        senderGst: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        receiverGst: '',
        volume: '',
      }));

      fetchConsignments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to book consignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Allocation Notice Alert */}
      {allocationNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600 animate-bounce" />
            <span>{allocationNotice.text}</span>
          </div>
          <button
            onClick={() => setAllocationNotice(null)}
            className="text-xs uppercase text-amber-700 hover:text-amber-900 cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">Consignments & Cargo Manifest</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Book consignments with database tariffs, print invoices, and monitor truck queues
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Book New Consignment
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Consignment #, Sender, or Receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="WAITING_FOR_TRUCK">Waiting for Truck</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div>
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Destinations</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.city} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading consignments from database..." />
        ) : consignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No consignments match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Consignment #</th>
                  <th className="px-4 py-3">Sender & Receiver</th>
                  <th className="px-4 py-3">Route Corridor</th>
                  <th className="px-4 py-3 text-right">Volume (m³)</th>
                  <th className="px-4 py-3 text-right">Tariff (₹/m³)</th>
                  <th className="px-4 py-3 text-right">Total Charge (₹)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {consignments.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-600 block">
                        {c.consignmentNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.receivedAt ? new Date(c.receivedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{c.sender?.name}</div>
                      <div className="text-[11px] text-slate-500">To: {c.receiver?.name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {c.sourceBranch?.city || 'Origin'} → {c.destinationBranch?.city || 'Dest'}
                      </div>
                      {c.assignedTruck && (
                        <div className="text-[10px] text-indigo-600 font-mono">
                          Truck: {c.assignedTruck?.truckNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      {c.volume} m³
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                      ₹{c.ratePerCubicMeter}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-extrabold text-indigo-700">
                      ₹{Number(c.charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setActiveBill(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                        title="View Consignment Bill / Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book New Consignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Book New Consignment</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConsignment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Source & Destination Branches */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin Branch *
                  </label>
                  <select
                    required
                    value={formData.sourceBranch}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceBranch: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Branch *
                  </label>
                  <select
                    required
                    value={formData.destinationBranch}
                    onChange={(e) =>
                      setFormData({ ...formData, destinationBranch: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">Select Destination Hub</option>
                    {branches
                      .filter((b) => b._id !== formData.sourceBranch)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Sender Details */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Sender (Consignor) Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Sender Name *"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Sender Phone Number *"
                    value={formData.senderPhone}
                    onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Sender Full Address *"
                    value={formData.senderAddress}
                    onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="GST Number (Optional)"
                    value={formData.senderGst}
                    onChange={(e) => setFormData({ ...formData, senderGst: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Receiver Details */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Receiver (Consignee) Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Receiver Name *"
                    value={formData.receiverName}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Receiver Phone Number *"
                    value={formData.receiverPhone}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Receiver Full Address *"
                    value={formData.receiverAddress}
                    onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="GST Number (Optional)"
                    value={formData.receiverGst}
                    onChange={(e) => setFormData({ ...formData, receiverGst: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Cargo Particulars & Live Rate Calculation */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume in m³ *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 80"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="PAID">PAID</option>
                    <option value="TO_PAY">TO PAY</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Live Tariff Preview Card */}
              {matchedRate && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800">
                        {matchedRate.origin?.city || 'Origin'} → {matchedRate.destination?.city || 'Destination'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[10px] border border-amber-200">
                        ⏱ {matchedRate.estimatedTransitHours || 24} hrs transit
                      </span>
                    </div>
                    <span className="font-bold text-indigo-700 text-sm">
                      ₹{matchedRate.ratePerCubicMeter} / m³
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                      ({matchedRate.description || 'Database Tariff'})
                    </span>
                  </div>
                  {estimatedCharge && (
                    <div className="text-right">
                      <span className="text-slate-500 block">Calculated Charge:</span>
                      <span className="text-base font-extrabold text-indigo-950 font-mono">
                        ₹{Number(estimatedCharge).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                  {submitting ? 'Booking Consignment...' : 'Book & Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consignment Bill Modal */}
      {activeBill && (
        <ConsignmentBillModal
          consignment={activeBill}
          onClose={() => setActiveBill(null)}
        />
      )}
    </div>
  );
}
