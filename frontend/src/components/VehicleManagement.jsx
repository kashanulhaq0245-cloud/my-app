import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Search, 
  Trash2, 
  Calendar, 
  RotateCcw, 
  Clock, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';

export default function VehicleManagement({ role }) {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit: limit,
      };
      if (search) params.search = search;
      if (status) params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/vehicles', { params });
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch vehicle logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, status, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle log?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setLogs(logs.filter((log) => log.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete vehicle log');
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Vehicle Logs Database</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Query, filter, and audit all vehicle entry and exit history logs.</p>
      </div>

      {/* Search & Filters Bar */}
      <div className="glass p-6 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="search-input">Search License Plate</label>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="e.g. TX-XYZ1234"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="status-select">Status</label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Inside">Inside</option>
              <option value="Exited">Exited</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="start-date-input">Start Date</label>
            <div className="relative">
              <input
                id="start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="end-date-input">End Date</label>
            <div className="relative">
              <input
                id="end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              id="search-btn"
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button
              id="reset-btn"
              type="button"
              onClick={handleReset}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
              title="Reset Filters"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Table Content */}
      <div className="glass rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Plate Photo</th>
                <th className="p-4">License Plate</th>
                <th className="p-4">Entry Time</th>
                <th className="p-4">Exit Time</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                {role === 'admin' && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="w-16 h-10 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="p-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div></td>
                    {role === 'admin' && <td className="p-4"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={role === 'admin' ? 7 : 6} className="p-12 text-center text-slate-400">
                    No matching logs found in database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const entryTimeFormatted = log.entry_time 
                    ? new Date(log.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : '-';
                  const exitTimeFormatted = log.exit_time 
                    ? new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : '-';
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Photo crop */}
                      <td className="p-4">
                        <div className="w-16 h-10 bg-slate-900 border border-slate-200 dark:border-slate-850 rounded flex items-center justify-center overflow-hidden">
                          {log.photo_path ? (
                            <img 
                              src={`http://localhost:8000${log.photo_path}`} 
                              alt="License Plate Crop" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-600 dark:text-slate-500 font-bold">NO IMG</span>
                          )}
                        </div>
                      </td>

                      {/* Plate Text */}
                      <td className="p-4 font-mono font-bold tracking-wider text-slate-800 dark:text-white">
                        {log.vehicle_number}
                      </td>

                      {/* Entry Time */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {entryTimeFormatted}
                        </div>
                      </td>

                      {/* Exit Time */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {exitTimeFormatted}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {log.date}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'Inside' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Delete Action (Admin Only) */}
                      {role === 'admin' && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all"
                            title="Delete Log Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {logs.length} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-slate-700 dark:text-slate-300">
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={logs.length < limit}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
