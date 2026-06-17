import React, { useState, useEffect } from 'react';
import api from './api';

// Components
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LiveMonitoring from './components/LiveMonitoring';
import VehicleManagement from './components/VehicleManagement';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';

import { 
  BellRing, 
  X, 
  LogIn, 
  LogOut 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [liveScans, setLiveScans] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Default dark mode for premium look

  // Check login state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (token && role && username) {
      setUser({ username, role });
    }
    setLoading(false);
  }, []);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, currentTab]); // Refetch when changing tab or login

  // Dark Mode class toggler
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // WebSocket Connection for Real-Time Event Pushing
  useEffect(() => {
    if (!user) return;

    let ws = null;
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:8000/api/ws/traffic');

      ws.onopen = () => {
        console.log('Successfully connected to ANPR Event WebSocket!');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.event === 'detection') {
            const { vehicle, action, stats: updatedStats } = payload;
            
            // 1. Prepend to live scans history list
            setLiveScans((prev) => [vehicle, ...prev.slice(0, 14)]);
            
            // 2. Refresh dashboard stats (either set directly if sent or trigger refetch)
            if (updatedStats) {
              setStats((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  ...updatedStats,
                  recent_activity: [vehicle, ...prev.recent_activity.slice(0, 9)]
                };
              });
            } else {
              fetchStats();
            }

            // 3. Trigger premium audio ping (optional, browser rules apply)
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(action === 'entry' ? 880 : 660, audioCtx.currentTime); // high note for entry, lower for exit
              gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.1);
            } catch (soundErr) {
              // Ignore audio block issues
            }

            // 4. Create Toast Notification
            const id = Date.now();
            const message = action === 'entry' 
              ? `Vehicle ${vehicle.vehicle_number} has entered the gate.` 
              : `Vehicle ${vehicle.vehicle_number} has exited the gate.`;
              
            const newToast = { id, message, action, vehicle_number: vehicle.vehicle_number };
            setToasts((prev) => [...prev, newToast]);

            // Auto dismiss toast after 6 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 6000);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket encountered an error', err);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-semibold text-sm">Loading ANPR system...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-950 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        role={user.role} 
        username={user.username} 
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100/50 dark:bg-dark-900/40 relative">
        {currentTab === 'dashboard' && <Dashboard stats={stats} loading={!stats} setTab={setTab} />}
        {currentTab === 'live' && <LiveMonitoring liveScans={liveScans} />}
        {currentTab === 'vehicles' && <VehicleManagement role={user.role} />}
        {currentTab === 'reports' && <Reports />}
        {currentTab === 'users' && user.role === 'admin' && <UserManagement />}
      </main>

      {/* Real-time Toast Notification Stack Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-slideIn"
          >
            <div className={`p-2 rounded-lg ${
              toast.action === 'entry' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              {toast.action === 'entry' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                <span>ANPR Detection Event</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                Plate: {toast.vehicle_number}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
