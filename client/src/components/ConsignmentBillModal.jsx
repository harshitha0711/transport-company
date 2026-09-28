import React from 'react';
import { X, Printer, Package, Truck, Calendar, MapPin, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ConsignmentBillModal({ consignment, onClose }) {
  if (!consignment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = consignment.receivedAt
    ? new Date(consignment.receivedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden printable-card">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-wide">Consignment Freight Bill</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold tracking-wide text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Bill
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Content */}
        <div className="p-8 space-y-6">
          {/* Company Banner */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  TCC
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                  TRANSPORT COMPANY COMPUTERIZATION
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                National Freight & Logistics Network • ISO 9001:2015 Certified
              </p>
              <p className="text-xs text-slate-500">
                Origin Branch: {consignment.sourceBranch?.name || 'Head Office Mumbai'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consignment Note (CN)
              </span>
              <p className="text-lg font-mono font-bold text-indigo-600">
                {consignment.consignmentNumber}
              </p>
              <div className="mt-1">
                <StatusBadge status={consignment.status} />
              </div>
            </div>
          </div>

          {/* Consignment Overview Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Booking Date & Time:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Payment Mode:</span>
              <p className="font-semibold text-emerald-700 mt-0.5 uppercase">
                {consignment.paymentStatus || 'PAID'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Route Corridor:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {consignment.sourceBranch?.city || 'Mumbai'} → {consignment.destinationBranch?.city || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Assigned Fleet Truck:</span>
              <p className="font-semibold text-indigo-700 mt-0.5">
                {consignment.assignedTruck?.truckNumber || 'Pending Allocation'}
              </p>
            </div>
          </div>

          {/* Sender & Receiver Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Consignor (Sender)
              </span>
              <h3 className="font-bold text-slate-900 text-sm">{consignment.sender?.name}</h3>
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                {consignment.sender?.address}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-medium text-slate-700">Phone:</span> {consignment.sender?.phone}
              </p>
              {consignment.sender?.gstNumber && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">GST:</span> {consignment.sender?.gstNumber}
                </p>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Consignee (Receiver)
              </span>
              <h3 className="font-bold text-slate-900 text-sm">{consignment.receiver?.name}</h3>
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                {consignment.receiver?.address}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-medium text-slate-700">Phone:</span> {consignment.receiver?.phone}
              </p>
              {consignment.receiver?.gstNumber && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">GST:</span> {consignment.receiver?.gstNumber}
                </p>
              )}
            </div>
          </div>

          {/* Pricing & Computation Breakdown (From DB) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
              Cargo Particulars & Transport Charge Computation
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Cargo Description</th>
                  <th className="px-4 py-2.5 text-right">Volume (m³)</th>
                  <th className="px-4 py-2.5 text-right">Destination Tariff Rate (₹/m³)</th>
                  <th className="px-4 py-2.5 text-right">Charge (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="px-4 py-3 font-medium">
                    {consignment.description || 'General Commercial Goods'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {consignment.volume} m³
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ₹{consignment.ratePerCubicMeter} / m³
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-sm">
                    ₹{Number(consignment.charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-indigo-50/50 border-t border-indigo-100">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700">
                    Total Transport Freight Amount:
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-indigo-900 text-base">
                    ₹{Number(consignment.charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Waiting & Tracking Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-4">
            <div>
              <p className="italic">
                Formula: Charge = Cargo Volume ({consignment.volume} m³) × Destination Rate (₹{consignment.ratePerCubicMeter})
              </p>
              {consignment.waitingTimeHours !== undefined && (
                <p className="mt-1 text-slate-600 font-medium">
                  Recorded Waiting Time: {consignment.waitingTimeHours} hrs ({consignment.waitingTimeMinutes || 0} mins)
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="w-32 border-b border-slate-400 mb-1 inline-block"></div>
              <p className="font-semibold text-slate-700">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
