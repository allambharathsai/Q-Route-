import React, { useState } from 'react';
import { VehicleRoute } from '../types';
import { formatMinutesToTime } from '../utils/distance';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RouteTableProps {
  routes: VehicleRoute[];
}

export const RouteTable: React.FC<RouteTableProps> = ({ routes }) => {
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set([routes[0]?.vehicle_id || '']));

  const toggleExpand = (vehicleId: string) => {
    const next = new Set(expandedVehicles);
    if (next.has(vehicleId)) {
      next.delete(vehicleId);
    } else {
      next.add(vehicleId);
    }
    setExpandedVehicles(next);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Fleet Dispatch & Route Sequence Manifest
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          {routes.reduce((sum, r) => sum + r.customers_served, 0)} Total Stops Assigned
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {routes.map(route => {
          const isExpanded = expandedVehicles.has(route.vehicle_id);
          const loadPct = Math.round((route.load_kg / route.capacity_kg) * 100);

          return (
            <div key={route.vehicle_id} className="transition">
              {/* Vehicle Row Header */}
              <div
                onClick={() => toggleExpand(route.vehicle_id)}
                className="px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: route.vehicle_color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{route.vehicle_name}</span>
                      <span className="text-xs text-slate-400 font-mono">({route.vehicle_id})</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Depot → {route.route.join(' → ')} → Depot
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {/* Load Bar */}
                  <div className="w-28 hidden sm:block">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Payload</span>
                      <span>{route.load_kg}/{route.capacity_kg}kg ({loadPct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${loadPct > 90 ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, loadPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400">Dist:</span>{' '}
                    <span className="font-bold text-white">{route.distance_km} km</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400">Time:</span>{' '}
                    <span className="font-bold text-white">{route.duration_min} min</span>
                  </div>

                  <div>
                    {route.late_deliveries === 0 ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> On Schedule
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> {route.late_deliveries} Delayed
                      </span>
                    )}
                  </div>

                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Per-Stop Details */}
              {isExpanded && (
                <div className="bg-slate-950/60 px-4 py-3 border-t border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-2">Seq</th>
                          <th className="py-2 px-2">Customer ID</th>
                          <th className="py-2 px-2">Client Name</th>
                          <th className="py-2 px-2">Zone</th>
                          <th className="py-2 px-2">Demand</th>
                          <th className="py-2 px-2">Arrival ETA</th>
                          <th className="py-2 px-2">Time Window</th>
                          <th className="py-2 px-2">Leg Dist</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {route.route_details.map((stop, idx) => (
                          <tr key={stop.customer_id} className="hover:bg-slate-800/20">
                            <td className="py-2 px-2 font-mono font-bold text-slate-300">#{idx + 1}</td>
                            <td className="py-2 px-2 font-mono text-indigo-300">{stop.customer_id}</td>
                            <td className="py-2 px-2 font-medium text-white">{stop.name}</td>
                            <td className="py-2 px-2 text-slate-400">{stop.zone}</td>
                            <td className="py-2 px-2 font-mono text-slate-300">{stop.demand_kg} kg</td>
                            <td className="py-2 px-2 font-mono text-white">{formatMinutesToTime(stop.arrival_min)}</td>
                            <td className="py-2 px-2 font-mono text-slate-400">
                              {formatMinutesToTime(stop.tw_start)} – {formatMinutesToTime(stop.tw_end)}
                            </td>
                            <td className="py-2 px-2 font-mono text-slate-300">{stop.distance_from_prev_km} km</td>
                            <td className="py-2 px-2">
                              {stop.is_late ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                                  LATE
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                                  ON TIME
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
