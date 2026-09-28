import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  Package,
  Printer,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../api/axios';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('destination');
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data States
  const [destinationReports, setDestinationReports] = useState([]);
  const [truckUsageReports, setTruckUsageReports] = useState(null);
  const [waitingTimeReports, setWaitingTimeReports] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [destRes, truckRes, waitRes] = await Promise.all([
        api.get(`/reports/revenue?${params.toString()}`),
        api.get(`/reports/truck-usage?${params.toString()}`),
        api.get(`/reports/waiting-time?${params.toString()}`),
      ]);

      setDestinationReports(destRes.data.data || []);
      setTruckUsageReports(truckRes.data.data || null);
      setWaitingTimeReports(waitRes.data.data || null);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const totalRevenue = destinationReports.reduce((acc, d) => acc + (d.totalRevenue || 0), 0);
  const totalVolume = destinationReports.reduce((acc, d) => acc + (d.totalVolume || 0), 0);
  const totalConsignments = destinationReports.reduce(
    (acc, d) => acc + (d.consignmentCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Control Header & Date Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Logistics & Operations Management Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit fleet usage, cargo volumes, waiting times, and corridor revenues
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none text-xs"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Period Freight Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle="Realized cargo earnings"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Total Cargo Volume"
          value={`${totalVolume.toLocaleString('en-IN')} m³`}
          subtitle={`${totalConsignments} consignments booked`}
          icon={Package}
          color="indigo"
        />
        <MetricCard
          title="Avg Consignment Waiting"
          value={`${waitingTimeReports?.averageWaitingHours || 0} hrs`}
          subtitle={`Analyzed ${waitingTimeReports?.totalAnalyzed || 0} shipments`}
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Completed Trips Run"
          value={truckUsageReports?.totalTripsRun || 0}
          subtitle="Trips across network"
          icon={Truck}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('destination')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'destination'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Destination Performance (Revenue & Volume)
        </button>
        <button
          onClick={() => setActiveTab('trucks')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'trucks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Fleet Truck Usage & Idle Time
        </button>
        <button
          onClick={() => setActiveTab('waiting')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'waiting'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Consignment Waiting Time Log
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <LoadingSpinner message="Calculating analytics and aggregates..." />
      ) : (
        <>
          {/* TAB 1: Destination Performance */}
          {activeTab === 'destination' && (
            <div className="space-y-6">
              {/* Destination Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Revenue and Cargo Volume by Destination
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={destinationReports}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="city" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} tickLine={false} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalRevenue"
                        name="Revenue (₹)"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="totalVolume"
                        name="Volume (m³)"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Destination Summary Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Destination Corridor Summary
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Destination Hub</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3 text-right">Consignments</th>
                      <th className="px-4 py-3 text-right">Total Cargo Volume</th>
                      <th className="px-4 py-3 text-right">Total Realized Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {destinationReports.map((d) => (
                      <tr key={d.destinationId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {d.destinationName}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{d.city}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {d.consignmentCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                          {d.totalVolume} m³
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700">
                          ₹{Number(d.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Fleet Truck Usage & Idle Time */}
          {activeTab === 'trucks' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Vehicle Usage, Highway Hours & Idle Time Analysis
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Truck Number</th>
                      <th className="px-4 py-3 text-right">Capacity (m³)</th>
                      <th className="px-4 py-3 text-right">Trips Run</th>
                      <th className="px-4 py-3 text-right">Total Hours in Transit</th>
                      <th className="px-4 py-3 text-right">Avg Idle Time Before Trip</th>
                      <th className="px-4 py-3 text-right">Total Volume Hauled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {truckUsageReports?.truckUsage?.map((t) => (
                      <tr key={t.truckId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                          {t.truckNumber}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{t.capacity} m³</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{t.totalTrips}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {t.totalDurationHours} hrs
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-purple-700 font-bold">
                          {t.avgIdleHours} hrs
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700">
                          {t.totalVolumeCarried} m³
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Consignment Waiting Time Log */}
          {activeTab === 'waiting' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    Individual Consignment Waiting Time (Allocation Time - Received Time)
                  </span>
                  <span className="font-bold text-indigo-600">
                    Average: {waitingTimeReports?.averageWaitingHours || 0} hrs
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Consignment #</th>
                      <th className="px-4 py-3">Route Corridor</th>
                      <th className="px-4 py-3 text-right">Volume (m³)</th>
                      <th className="px-4 py-3">Received Timestamp</th>
                      <th className="px-4 py-3">Allocated Timestamp</th>
                      <th className="px-4 py-3 text-right">Waiting Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {waitingTimeReports?.consignments?.map((c) => (
                      <tr key={c.consignmentNumber} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                          {c.consignmentNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {c.source} → {c.destination}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{c.volume} m³</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(c.receivedAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {c.allocatedAt
                            ? new Date(c.allocatedAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Pending'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                          {c.waitingHours} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
