import React, { useState } from 'react';
import { Play, Square, AlertCircle, ScanLine, Clock, Cpu } from 'lucide-react';

export default function LiveMonitoring({ liveScans, onForceTrigger }) {
  const [streaming, setStreaming] = useState(true);
  const token = localStorage.getItem('token');
  const streamUrl = `http://localhost:8000/api/stream/live?token=${token}&t=${Date.now()}`;

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Live Monitoring Feed</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Connect CCTV stream and execute real-time license plate extraction.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStreaming(!streaming)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              streaming 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {streaming ? (
              <>
                <Square className="w-4 h-4" /> Stop Stream
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Connect Stream
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Window */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center group">
            {streaming ? (
              <>
                {/* Live stream tag */}
                <img
                  src={streamUrl}
                  alt="CCTV Live Camera Feed"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fail fallback
                    e.target.style.display = 'none';
                    document.getElementById('stream-error').style.display = 'flex';
                  }}
                />
                
                {/* HUD Camera Scanning Line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.8)] scan-line pointer-events-none" />

                {/* Camera HUD Indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-semibold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>REC - CAMERA_01</span>
                </div>

                {/* AI Status HUD */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-semibold text-white">
                  <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>YOLOv8 + EasyOCR active</span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <Square className="w-12 h-12 mx-auto text-slate-600" />
                <p className="font-semibold text-sm">CCTV Stream Offline</p>
                <p className="text-xs text-slate-500">Click "Connect Stream" to load feed.</p>
              </div>
            )}

            {/* Error Overlay */}
            <div
              id="stream-error"
              className="absolute inset-0 bg-slate-950/90 text-center flex-col items-center justify-center p-6 gap-3 hidden"
            >
              <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
              <h3 className="font-bold text-white text-base">CCTV Feed Connection Failed</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Could not connect to camera source. Ensure the FastAPI backend is running and the source configured is correct.
              </p>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Vehicles passing through the lane boundary line will trigger license plate analysis. If the vehicle is already inside, the system records it as an <strong>Exit</strong>; otherwise, it registers an <strong>Entry</strong>.
            </span>
          </div>
        </div>

        {/* Real-time Detection Scans Side Panel */}
        <div className="glass p-6 rounded-2xl flex flex-col h-[470px]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ScanLine className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Live Scans</h3>
            <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
              Session
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {liveScans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-2">
                <ScanLine className="w-10 h-10 text-slate-300 dark:text-slate-700 animate-pulse" />
                <p className="font-medium text-xs">Waiting for detections...</p>
                <p className="text-[10px] text-slate-500">Pass a vehicle through the gate camera to see OCR outputs.</p>
              </div>
            ) : (
              liveScans.map((scan, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-3 hover:border-emerald-500/30 transition-all animate-fadeIn"
                >
                  {/* Cropped Plate Image */}
                  <div className="w-16 h-10 rounded bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {scan.photo_path ? (
                      <img 
                        src={`http://localhost:8000${scan.photo_path}`} 
                        alt="Cropped License Plate"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-[9px] text-slate-500 font-bold uppercase">OCR</span>
                    )}
                  </div>

                  {/* Scan Info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-bold text-xs tracking-wider text-slate-800 dark:text-white truncate">
                      {scan.vehicle_number}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(scan.entry_time || scan.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  {/* Badge Entry/Exit */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scan.status === 'Inside'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                  }`}>
                    {scan.status === 'Inside' ? 'Entry' : 'Exit'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
