import React from 'react';
import { X, Printer, Truck, Calendar, MapPin, CheckCircle, Navigation, Send } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function DispatchDocumentModal({
  dispatch,
  onClose,
  onDepart,
  onDeliver,
  isManager,
}) {
  if (!dispatch) return null;

  const handlePrint = () => {
    window.print();
  };

  const dispatchDate = dispatch.dispatchTime
    ? new Date(dispatch.dispatchTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const truckCapacity = dispatch.truck?.capacity || 0;
  const totalVolume = dispatch.totalVolume || 0;
  const utilization = truckCapacity > 0 ? ((totalVolume / truckCapacity) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden printable-card">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-wide">
              Official Fleet Dispatch Manifest
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {dispatch.status === 'PREPARED' && (
              <button
                onClick={() => onDepart && onDepart(dispatch._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Dispatch & Mark Departed
              </button>
            )}
            {dispatch.status === 'IN_TRANSIT' && (
              <button
                onClick={() => onDeliver && onDeliver(dispatch._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Delivered at Destination
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Manifest
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 space-y-6">
          {/* Header & Meta */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                TRANSPORT COMPANY COMPUTERIZATION (TCC)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                TRUCK DISPATCH DOCUMENT & HIGHWAY CARGO MANIFEST
              </p>
              <p className="text-xs text-slate-500">
                Origin Hub: <span className="font-semibold text-slate-700">{dispatch.sourceBranch?.name}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dispatch Order No.
              </span>
              <p className="text-lg font-mono font-bold text-indigo-700">
                {dispatch.dispatchNumber}
              </p>
              <div className="mt-1">
                <StatusBadge status={dispatch.status} />
              </div>
            </div>
          </div>

          {/* Allocation & Truck Info Cards */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Assigned Truck:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {dispatch.truck?.truckNumber}
              </p>
              <span className="text-slate-500 text-[11px]">
                Capacity: {truckCapacity} m³
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Destination Terminal:</span>
              <p className="font-bold text-indigo-700 text-sm mt-0.5">
                {dispatch.destinationBranch?.city}
              </p>
              <span className="text-slate-500 text-[11px]">
                {dispatch.destinationBranch?.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Assigned Driver:</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {dispatch.driverName || dispatch.truck?.driverName || 'Designated Driver'}
              </p>
              <span className="text-slate-500 text-[11px]">
                {dispatch.driverPhone || dispatch.truck?.driverPhone || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Cargo Load:</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">
                {totalVolume} m³ ({utilization}% util)
              </p>
              <span className="text-slate-500 text-[11px]">{dispatchDate}</span>
            </div>
          </div>

          {/* Manifest Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Consignment Manifest Breakdown ({dispatch.consignments?.length || 0} Shipments)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Consignment #</th>
                    <th className="px-3 py-2.5 text-right">Volume (m³)</th>
                    <th className="px-3 py-2.5">Sender & Address</th>
                    <th className="px-3 py-2.5">Receiver & Address</th>
                    <th className="px-3 py-2.5">Destination</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {dispatch.consignments?.map((c) => (
                    <tr key={c._id || c.consignmentNumber} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 font-mono font-bold text-indigo-600">
                        {c.consignmentNumber}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">
                        {c.volume} m³
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{c.sender?.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {c.sender?.address}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{c.receiver?.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {c.receiver?.address}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {dispatch.destinationBranch?.city || 'N/A'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={c.status || 'ALLOCATED'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td className="px-3 py-2.5 text-slate-700">Total Cargo Manifested:</td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-700 font-extrabold text-sm">
                      {totalVolume} m³
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 text-slate-500 text-right">
                      Truck Capacity Limit: {truckCapacity} m³ | Remaining Margin: {(truckCapacity - totalVolume).toFixed(2)} m³
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Verification Stamps */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-xs">
            <div className="text-center">
              <div className="h-12 border-b border-slate-300"></div>
              <p className="mt-2 font-semibold text-slate-700">Dispatch Supervisor</p>
              <p className="text-[11px] text-slate-400">Hub Operations</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-slate-300"></div>
              <p className="mt-2 font-semibold text-slate-700">Driver Signature</p>
              <p className="text-[11px] text-slate-400">Cargo Handover Acknowledged</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-slate-300"></div>
              <p className="mt-2 font-semibold text-slate-700">Receiving Officer</p>
              <p className="text-[11px] text-slate-400">Destination Hub Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
