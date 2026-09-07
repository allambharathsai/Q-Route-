import React from 'react';
import { RouteOptimizationResult, EmissionsResult } from '../types';
import { Navigation, Clock, Truck, AlertTriangle, Fuel, Leaf, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface KPICardsProps {
  currentResult: RouteOptimizationResult | null;
  prevResult: RouteOptimizationResult | null;
  emissions: EmissionsResult | null;
}

export const KPICards: React.FC<KPICardsProps> = ({
  currentResult,
  prevResult,
  emissions
}) => {
  if (!currentResult) return null;

  const distDelta = prevResult
    ? currentResult.total_distance_km - prevResult.total_distance_km
    : null;

  const timeDelta = prevResult
    ? currentResult.total_duration_min - prevResult.total_duration_min
    : null;

  const lateDelta = prevResult
    ? currentResult.late_deliveries - prevResult.late_deliveries
    : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Distance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Total Distance</span>
          <Navigation className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-white">
            {currentResult.total_distance_km.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 font-mono">km</span>
        </div>
        {distDelta !== null && distDelta !== 0 && (
          <div className={`flex items-center text-[11px] font-medium mt-1 ${distDelta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {distDelta < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            <span>{Math.abs(distDelta).toFixed(1)} km vs prev</span>
          </div>
        )}
      </div>

      {/* 2. Travel Time */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Total Duration</span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-white">
            {currentResult.total_duration_min.toFixed(0)}
          </span>
          <span className="text-xs text-slate-400 font-mono">min</span>
        </div>
        {timeDelta !== null && timeDelta !== 0 && (
          <div className={`flex items-center text-[11px] font-medium mt-1 ${timeDelta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {timeDelta < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            <span>{Math.abs(timeDelta).toFixed(0)}m vs prev</span>
          </div>
        )}
      </div>

      {/* 3. Vehicles Deployed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Vehicles Used</span>
          <Truck className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-white">
            {currentResult.vehicles_used}
          </span>
          <span className="text-xs text-slate-400 font-mono">vans</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{currentResult.customers_served} of {currentResult.customers_total} served</span>
        </div>
      </div>

      {/* 4. Late Deliveries */}
      <div className={`border rounded-xl p-3.5 shadow-sm transition ${
        currentResult.late_deliveries === 0
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-rose-950/20 border-rose-800/40'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Late Deliveries</span>
          {currentResult.late_deliveries === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl lg:text-2xl font-bold font-mono ${
            currentResult.late_deliveries === 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {currentResult.late_deliveries}
          </span>
          <span className="text-xs text-slate-400 font-mono">stops</span>
        </div>
        <div className="text-[11px] mt-1">
          {currentResult.late_deliveries === 0 ? (
            <span className="text-emerald-400">100% Time Window Adherence</span>
          ) : (
            <span className="text-rose-400 font-medium">{currentResult.late_deliveries} TW breach</span>
          )}
        </div>
      </div>

      {/* 5. Estimated Fuel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium uppercase tracking-wider">Fuel Burn</span>
            <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">Est.</span>
          </div>
          <Fuel className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-white">
            {emissions?.fuel_consumed_L.toFixed(2) ?? '—'}
          </span>
          <span className="text-xs text-slate-400 font-mono">L</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">
          ₹{emissions?.cost_inr.toFixed(0) ?? '—'} INR fuel cost
        </div>
      </div>

      {/* 6. Estimated CO2 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium uppercase tracking-wider">CO₂ Output</span>
            <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">Est.</span>
          </div>
          <Leaf className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl lg:text-2xl font-bold font-mono text-emerald-300">
            {emissions?.co2_kg.toFixed(2) ?? '—'}
          </span>
          <span className="text-xs text-slate-400 font-mono">kg</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">
          IPCC standard (2.31 kg/L)
        </div>
      </div>
    </div>
  );
};
