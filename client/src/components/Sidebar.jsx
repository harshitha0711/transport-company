import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Send,
  Building2,
  DollarSign,
  BarChart3,
  Users,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';

export default function Sidebar() {
  const { user, logout, isManager, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Consignments', path: '/consignments', icon: Package },
    { name: 'Fleet Trucks', path: '/trucks', icon: Truck },
    { name: 'Dispatch & Allocation', path: '/dispatch', icon: Send },
    { name: 'Branch Hubs', path: '/branches', icon: Building2 },
    { name: 'Freight Rates', path: '/rates', icon: DollarSign },
  ];

  const managerItems = [
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'User Management', path: '/users', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 no-print select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20">
          TCC
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-wide block">TCC FREIGHT</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
            FLEET DISPATCH SYSTEM
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}

        {isManager && (
          <>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 mb-2">
              Management & Controls
            </div>
            {managerItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User Profile Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={user?.role || 'STAFF'} className="py-0 px-1.5 text-[10px]" />
              <span className="text-[10px] text-slate-400 truncate">
                {user?.branch?.city || 'HQ'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-slate-800 hover:border-rose-500/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
