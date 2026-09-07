import React from 'react';
import { Atom, Clock, HelpCircle, Package, RefreshCw, ShieldCheck, Truck, Database } from 'lucide-react';
import { formatMinutesToTime } from '../utils/distance';

interface HeaderProps {
  currentMinute: number;
  totalCustomers: number;
  vehicleCount: number;
  onReset: () => void;
  onOpenPitchGuide: () => void;
  onOpenDataModal: () => void;
  activeAlgo: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMinute,
  totalCustomers,
  vehicleCount,
  onReset,
  onOpenPitchGuide,
  onOpenDataModal,
  activeAlgo
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Atom className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight font-sans text-white">
                Q-ROUTE
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-mono">
                UC-038
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Vijayawada Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quantum-Hybrid Dynamic Last-Mile Delivery Optimizer
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sim Time:</span>
            <span className="font-bold text-white">{formatMinutesToTime(currentMinute)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-white">{totalCustomers}</span> Orders
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{vehicleCount}</span> Fleet Vans
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>System Active</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDataModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Inspect Dataset & CSVs"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Data Explorer</span>
          </button>

          <button
            onClick={onOpenPitchGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer"
            title="5-Min Hackathon Pitch & Judges Q&A"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pitch Guide & Q&A</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
            title="Reset Simulation to 08:00 AM"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
