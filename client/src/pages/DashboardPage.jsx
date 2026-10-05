import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Truck,
  Package,
  DollarSign,
  Clock,
  Send,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/axios';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { allocationEvent } = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [pendingCargo, setPendingCargo] = useState([]);
  const [recentConsignments, setRecentConsignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [allocMsg, setAllocMsg] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revRes, pendingRes, consRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/revenue'),
        api.get('/allocation/pending'),
        api.get('/consignments?limit=6'),
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revRes.data.data || []);
      setPendingCargo(pendingRes.data.data?.pendingGroups || []);
      setRecentConsignments(consRes.data.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [allocationEvent]);

  const handleRunAllocation = async () => {
    setAllocating(true);
    setAllocMsg(null);
    try {
      const res = await api.post('/allocation/run');
      setAllocMsg({
        type: 'success',
        text: res.data.message,
      });
      fetchDashboardData();
    } catch (err) {
      setAllocMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to run allocation engine',
      });
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating real-time fleet analytics from database..." />;
  }

  // Format fleet status chart data
  const truckStatusChartData = [
    { name: 'Available', value: stats?.trucks?.available || 0, color: '#10b981' },
    { name: 'Loading', value: stats?.trucks?.loading || 0, color: '#f59e0b' },
    { name: 'On Trip', value: stats?.trucks?.onTrip || 0, color: '#3b82f6' },
    { name: 'Idle', value: stats?.trucks?.idle || 0, color: '#64748b' },
    { name: 'Maintenance', value: stats?.trucks?.maintenance || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Real-time Allocation Notice Banner */}
      {allocMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            allocMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{allocMsg.text}</span>
          </div>
          <button
            onClick={() => setAllocMsg(null)}
            className="text-xs uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Operations KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Fleet Trucks"
          value={stats?.trucks?.total || 0}
          subtitle={`${stats?.trucks?.available || 0} Available for Dispatch`}
          icon={Truck}
          color="indigo"
        />
        <MetricCard
          title="Trucks on Trip"
          value={stats?.trucks?.onTrip || 0}
          subtitle={`${stats?.trucks?.loading || 0} currently loading`}
          icon={Send}
          color="blue"
        />
        <MetricCard
          title="Pending Cargo"
          value={`${stats?.consignments?.pendingVolume || 0} m³`}
          subtitle={`${stats?.consignments?.pendingCount || 0} consignments waiting`}
          icon={Package}
          color="amber"
        />
        <MetricCard
          title="Total Freight Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Realized cargo tariffs"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Avg Consignment Wait"
          value={`${stats?.avgWaitingTimeHours || 0} hrs`}
          subtitle={`Fleet Avg Idle: ${stats?.avgIdleTimeHours || 0} hrs`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Automatic Truck Allocation Status Bar & Pending Queues */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 m-0">
                Pending Cargo & 500 m³ Auto-Allocation Monitor
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automatic truck allocation triggers as soon as pending volume for any destination reaches 500 m³.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAllocation}
              disabled={allocating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${allocating ? 'animate-spin' : ''}`} />
              {allocating ? 'Evaluating Allocation...' : 'Evaluate & Allocate Now'}
            </button>
            <Link
              to="/dispatch"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Dispatch Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Destination Queues Progress Bars */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingCargo.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs italic">
              All cargo queues are currently cleared or dispatched.
            </div>
          ) : (
            pendingCargo.map((grp) => {
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
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                        Route
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {grp.sourceBranch?.city || 'Origin'} → {grp.destinationBranch?.city || 'Dest'}
                      </h4>
                    </div>
                    {isReady ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Ready for Truck
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {grp.consignmentCount} item(s)
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">
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

                  <div className="mt-3 text-[11px] text-slate-500 flex justify-between items-center">
                    <span>
                      {isReady
                        ? 'Threshold satisfied! Awaiting dispatch order.'
                        : `Need ${(500 - grp.totalVolume).toFixed(2)} m³ more cargo`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Destination Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">
                Revenue & Volume by Destination
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed from database consignments
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Live Tariff Aggregates
            </span>
          </div>

          <div className="h-64 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="city" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'totalRevenue'
                        ? `₹${Number(val).toLocaleString('en-IN')}`
                        : `${val} m³`,
                      name === 'totalRevenue' ? 'Revenue' : 'Volume',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="totalRevenue"
                    name="totalRevenue"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No revenue records available
              </div>
            )}
          </div>
        </div>

        {/* Fleet Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 m-0">Current Fleet Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Active vehicles across hubs</p>

          <div className="h-56 w-full mt-2">
            {truckStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={truckStatusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {truckStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No active fleet records
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Consignments Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">Recent Consignments Booked</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database records and auto-computed rates
            </p>
          </div>
          <Link
            to="/consignments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Shipments
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Consignment #</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Receiver</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3 text-right">Volume (m³)</th>
                <th className="px-4 py-3 text-right">Charge (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recentConsignments.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                    {c.consignmentNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.sender?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.receiver?.name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {c.destinationBranch?.city || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{c.volume} m³</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                    ₹{Number(c.charge).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
