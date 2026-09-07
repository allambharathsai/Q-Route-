import React from 'react';
import { VehicleRoute } from '../types';
import { formatMinutesToTime } from '../utils/distance';
import { Clock } from 'lucide-react';

interface GanttTimelineProps {
  routes: VehicleRoute[];
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({ routes }) => {
  // Timeline scale: from 0 min (08:00 AM) to 480 min (04:00 PM)
  const maxMinutes = 480;
  const timeMarkers = [0, 60, 120, 180, 240, 300, 360, 420, 480];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Fleet Shift Schedule & Delivery Window Timeline
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span className="text-slate-300">On Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
            <span className="text-slate-300">Late Arrival</span>
          </div>
        </div>
      </div>

      {/* Axis Labels */}
      <div className="relative w-full h-5 border-b border-slate-800 mb-2">
        {timeMarkers.map(m => {
          const pct = (m / maxMinutes) * 100;
          return (
            <div
              key={m}
              className="absolute text-[10px] font-mono text-slate-400 -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {formatMinutesToTime(m).replace(':00', '')}
            </div>
          );
        })}
      </div>

      {/* Vehicle Rows */}
      <div className="space-y-3">
        {routes.map(r => (
          <div key={r.vehicle_id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.vehicle_color }}></span>
                <span className="font-semibold text-slate-200">{r.vehicle_name}</span>
                <span className="text-[11px] text-slate-400">({r.customers_served} stops, {r.load_kg}/{r.capacity_kg}kg)</span>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {r.route_details.length > 0
                  ? `${formatMinutesToTime(r.route_details[0].arrival_min)} → ${formatMinutesToTime(
                      r.route_details[r.route_details.length - 1].depart_min
                    )}`
                  : 'Idle'}
              </span>
            </div>

            {/* Track container */}
            <div className="relative w-full h-7 bg-slate-950/80 rounded-md border border-slate-800/80 overflow-hidden">
              {/* Hour Grid Lines */}
              {timeMarkers.map(m => {
                const pct = (m / maxMinutes) * 100;
                return (
                  <div
                    key={m}
                    className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                    style={{ left: `${pct}%` }}
                  />
                );
              })}

              {/* Stop Blocks */}
              {r.route_details.map((stop, idx) => {
                const startPct = Math.max(0, Math.min(100, (stop.arrival_min / maxMinutes) * 100));
                const widthPct = Math.max(1.8, Math.min(100 - startPct, (stop.service_time_min / maxMinutes) * 100));
                const isLate = stop.is_late;

                return (
                  <div
                    key={stop.customer_id}
                    title={`${stop.customer_id}: ${stop.name}\nArrival: ${formatMinutesToTime(
                      stop.arrival_min
                    )}\nTime Window: ${formatMinutesToTime(stop.tw_start)} - ${formatMinutesToTime(
                      stop.tw_end
                    )}\nStatus: ${isLate ? 'LATE' : 'ON TIME'}`}
                    className={`absolute top-1 bottom-1 rounded flex items-center justify-center text-[9px] font-bold text-white shadow-sm cursor-pointer transition hover:opacity-90 hover:scale-105 ${
                      isLate ? 'bg-rose-600 border border-rose-400' : 'bg-emerald-600 border border-emerald-400'
                    }`}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
