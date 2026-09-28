import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const routeTitles = {
  '/': 'Fleet Operations Command Center',
  '/consignments': 'Consignments & Cargo Bookings',
  '/trucks': 'Fleet Trucks & Availability',
  '/dispatch': 'Dispatch Manifests & Automatic Allocation Engine',
  '/branches': 'Branch Offices & Logistics Network Hubs',
  '/rates': 'Destination Freight Tariffs & Rates',
  '/reports': 'Logistics Performance & Management Reports',
  '/users': 'User Accounts & Access Control',
};

export default function MainLayout() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Transport Company Computerization';
  const [allocationEvent, setAllocationEvent] = useState(null);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} onAllocationTriggered={(data) => setAllocationEvent(data)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet context={{ allocationEvent }} />
        </main>
      </div>
    </div>
  );
}
