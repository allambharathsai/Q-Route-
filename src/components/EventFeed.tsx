import React from 'react';
import { DispatchEvent } from '../types';
import { Activity, Bell, AlertCircle, PlusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface EventFeedProps {
  events: DispatchEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const getIcon = (type: DispatchEvent['type']) => {
    switch (type) {
      case 'DYNAMIC_ORDER':
        return <PlusCircle className="w-4 h-4 text-amber-400" />;
      case 'ROAD_CLOSURE':
      case 'TRAFFIC_CHANGE':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'OPTIMIZATION':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'DELIVERY_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[320px]">
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Dispatch & Telemetry Event Stream
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {events.length} Telemetry Events
        </span>
      </div>

      <div className="p-3 overflow-y-auto space-y-2 flex-1 font-sans text-xs divide-y divide-slate-800/40">
        {events.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No telemetry events recorded yet.</div>
        ) : (
          events.map(event => (
            <div key={event.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{getIcon(event.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200 truncate">{event.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {event.timestamp}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{event.description}</p>

                {(event.delta_distance_km !== undefined || event.delta_time_min !== undefined) && (
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px]">
                    {event.delta_distance_km !== undefined && (
                      <span className={event.delta_distance_km > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        Δ Dist: {event.delta_distance_km > 0 ? `+${event.delta_distance_km}` : event.delta_distance_km} km
                      </span>
                    )}
                    {event.delta_time_min !== undefined && (
                      <span className={event.delta_time_min > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        Δ Time: {event.delta_time_min > 0 ? `+${event.delta_time_min}` : event.delta_time_min} min
                      </span>
                    )}
                    {event.affected_vehicles && event.affected_vehicles.length > 0 && (
                      <span className="text-slate-400">
                        Affected: {event.affected_vehicles.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
