import React from 'react';
import { 
  Bar, 
  Doughnut 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { 
  Car, 
  ArrowUpRight, 
  LogIn, 
  LogOut, 
  Eye, 
  MapPin, 
  Clock 
} from 'lucide-react';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard({ stats, loading, setTab }) {
  if (loading || !stats) {
    return (
      <div className="flex flex-col gap-6 p-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Calculate chart data from recent activity or seed variables
  // Standard entry times distribution for demonstration
  const hourlyData = {
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    datasets: [
      {
        label: 'Entries',
        data: [12, 19, 15, 22, 28, 14, 8],
        backgroundColor: 'rgba(34, 197, 94, 0.75)', // emerald
        borderRadius: 6,
      },
      {
        label: 'Exits',
        data: [5, 11, 18, 14, 25, 22, 15],
        backgroundColor: 'rgba(59, 130, 246, 0.75)', // blue
        borderRadius: 6,
      }
    ],
  };

  const distributionData = {
    labels: ['Inside (Active)', 'Exited'],
    datasets: [
      {
        data: [stats.active_vehicles, Math.max(0, stats.total_vehicles - stats.active_vehicles)],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(244, 63, 94, 0.8)'
        ],
        borderWidth: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'gray'
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'gray' } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: 'gray' } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'gray'
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time gate traffic, system health, and analytics.</p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total logs */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Vehicles Logged</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{stats.total_vehicles}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active inside */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between shadow-sm border-l-4 border-l-emerald-500">
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Vehicles Inside</span>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active_vehicles}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Today Entries */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Today's Entries</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{stats.today_entries}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
            <LogIn className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Today Exits */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Today's Exits</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{stats.today_exits}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <LogOut className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">Traffic Volume Pattern (Hourly)</h4>
          <div className="h-72">
            <Bar data={hourlyData} options={chartOptions} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">Vehicle Distribution</h4>
          <div className="h-72 relative flex items-center justify-center">
            <Doughnut data={distributionData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="glass rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-white text-base">Recent Gate Activity</h4>
          <button 
            onClick={() => setTab('vehicles')} 
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
          >
            View All Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">License Plate</th>
                <th className="p-4">Entry Time</th>
                <th className="p-4">Exit Time</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Camera Feed ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {stats.recent_activity.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No recent activity.
                  </td>
                </tr>
              ) : (
                stats.recent_activity.map((log) => {
                  const entryTimeFormatted = log.entry_time 
                    ? new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : '-';
                  const exitTimeFormatted = log.exit_time 
                    ? new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : '-';
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold tracking-wider text-slate-800 dark:text-white">
                        {log.vehicle_number}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {entryTimeFormatted}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {exitTimeFormatted}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {log.date}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'Inside' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Gate 1 - Entry
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
