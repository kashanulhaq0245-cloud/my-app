import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Clock, 
  History,
  Download,
  AlertCircle
} from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Generate date ranges based on selection
  const getDateParams = () => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (reportType === 'daily') {
      start = end;
    } else if (reportType === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      start = lastWeek.toISOString().split('T')[0];
    } else if (reportType === 'monthly') {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      start = lastMonth.toISOString().split('T')[0];
    } else {
      start = startDate;
      end = endDate;
    }
    return { start, end };
  };

  const handleExport = (format) => {
    const { start, end } = getDateParams();
    const token = localStorage.getItem('token');
    
    // Construct download link
    let url = `http://localhost:8000/api/reports/export?format=${format}&token=${token}`;
    if (start) url += `&start_date=${start}`;
    if (end) url += `&end_date=${end}`;
    
    // Open in new window/trigger download
    window.open(url, '_blank');
  };

  const { start: displayStart, end: displayEnd } = getDateParams();

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reports & Export</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Download aggregated vehicle entry/exit histories and logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Controls Card */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Generate Vehicle History Report</h3>
          
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Select Report Range</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'daily', label: 'Daily Report' },
                { id: 'weekly', label: 'Weekly Report' },
                { id: 'monthly', label: 'Monthly Report' },
                { id: 'custom', label: 'Custom Range' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setReportType(item.id)}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center ${
                    reportType === item.id
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {reportType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="start-date">Start Date</label>
                <div className="relative">
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="end-date">End Date</label>
                <div className="relative">
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Summary Preview Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-white block mb-0.5">Report Metadata Summary</span>
              <span>Scope: {reportType.toUpperCase()} | Range: {displayStart || 'Beginning'} to {displayEnd || 'Today'}</span>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
            <button
              onClick={() => handleExport('excel')}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
            >
              <FileSpreadsheet className="w-5 h-5" /> Export as Excel (.xlsx)
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="w-5 h-5" /> Export as PDF (.pdf)
            </button>
          </div>
        </div>

        {/* Info Sidebar Panel */}
        <div className="glass p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <History className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">History Audit</h3>
          </div>

          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
            <p>
              This module generates official vehicle entry/exit summaries suitable for corporate gate audits, security reviews, or parking metrics reports.
            </p>
            <div className="flex items-start gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Excel Sheets</strong> contain hyperlinked direct routes to saved license plate snapshot photos for audit reviews.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <Download className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                Exporting reports does not wipe database logs. Logs can be cleaned via the <strong>Vehicle Logs</strong> view.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
