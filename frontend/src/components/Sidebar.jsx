import React from 'react';
import { 
  LayoutDashboard, 
  Cctv, 
  Car, 
  FileSpreadsheet, 
  Users, 
  LogOut, 
  Sun, 
  Moon, 
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setTab, 
  role, 
  username, 
  onLogout, 
  darkMode, 
  setDarkMode 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Cctv },
    { id: 'vehicles', label: 'Vehicle Logs', icon: Car },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
  ];

  // Only show User Management to Admin role
  if (role === 'admin') {
    menuItems.push({ id: 'users', label: 'User Settings', icon: Users });
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 z-20 text-slate-300">
      <div>
        {/* Brand/Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight text-sm uppercase tracking-wide">ANPR Smart Gate</h1>
            <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase">Gate Manager</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 mt-6 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white uppercase text-sm">
            {username ? username[0] : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate max-w-[130px]">{username}</div>
            <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              {role}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-8 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-l-4 border-emerald-500 text-white pl-3' 
                    : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs text-slate-400 font-medium">Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-300 hover:text-red-200 rounded-xl text-sm font-semibold transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
