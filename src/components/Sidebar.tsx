import React from 'react';
import { AlgorithmType, TrafficLevel, RoadClosure } from '../types';
import { Play, Atom, Zap, AlertTriangle, PlusCircle, Clock, Sliders, ShieldAlert, Cpu } from 'lucide-react';

interface SidebarProps {
  algorithm: AlgorithmType;
  setAlgorithm: (algo: AlgorithmType) => void;
  trafficLevel: TrafficLevel;
  setTrafficLevel: (level: TrafficLevel) => void;
  roadClosures: RoadClosure[];
  onToggleRoadClosure: (id: string) => void;
  qaoaDepth: number;
  setQaoaDepth: (depth: number) => void;
  qaoaShots: number;
  setQaoaShots: (shots: number) => void;
  onRunOptimization: () => void;
  onAddDynamicBatch1: () => void;
  onAddDynamicBatch2: () => void;
  hasAddedBatch1: boolean;
  hasAddedBatch2: boolean;
  isOptimizing: boolean;
  simMinute: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  algorithm,
  setAlgorithm,
  trafficLevel,
  setTrafficLevel,
  roadClosures,
  onToggleRoadClosure,
  qaoaDepth,
  setQaoaDepth,
  qaoaShots,
  setQaoaShots,
  onRunOptimization,
  onAddDynamicBatch1,
  onAddDynamicBatch2,
  hasAddedBatch1,
  hasAddedBatch2,
  isOptimizing,
  simMinute
}) => {
  return (
    <aside className="w-full lg:w-80 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 space-y-5 shrink-0 overflow-y-auto max-h-screen">
      {/* 1. Primary Action */}
      <div>
        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isOptimizing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Optimizing Routes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>RUN OPTIMIZATION</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Algorithm Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          Routing Algorithm
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setAlgorithm('nn')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              algorithm === 'nn'
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold">Nearest Neighbor</div>
            <div className="text-[10px] text-slate-400">Level 1 Baseline</div>
          </button>

          <button
            onClick={() => setAlgorithm('cvrptw')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              algorithm === 'cvrptw'
                ? 'bg-emerald-600/20 border-emerald-500 text-white'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold">OR-Tools CVRPTW</div>
            <div className="text-[10px] text-slate-400">Level 2 Metaheuristic</div>
          </button>

          <button
            onClick={() => setAlgorithm('qaoa')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              algorithm === 'qaoa'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1">
              <span>QAOA Hybrid</span>
              <span className="text-[9px] px-1 bg-indigo-500/30 text-indigo-300 rounded">16Q</span>
            </div>
            <div className="text-[10px] text-slate-400">QUBO + Qiskit Ansätz</div>
          </button>

          <button
            onClick={() => setAlgorithm('all')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              algorithm === 'all'
                ? 'bg-cyan-600/20 border-cyan-500 text-white'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1">
              <span>Benchmark All</span>
              <span className="text-[9px] px-1 bg-cyan-500/30 text-cyan-300 rounded">Report</span>
            </div>
            <div className="text-[10px] text-slate-400">Compare 3 Engines</div>
          </button>
        </div>
      </div>

      {/* 3. Real-Time Traffic Simulator */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Traffic Congestion Level</span>
          <span className="font-mono text-cyan-400 text-[11px] font-semibold">
            {trafficLevel === 'LOW' && '0.85x (-15%)'}
            {trafficLevel === 'NORMAL' && '1.00x (Normal)'}
            {trafficLevel === 'HIGH' && '1.40x (+40%)'}
            {trafficLevel === 'SEVERE' && '1.90x (+90%)'}
          </span>
        </label>
        <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
          {(['LOW', 'NORMAL', 'HIGH', 'SEVERE'] as TrafficLevel[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => setTrafficLevel(lvl)}
              className={`py-1.5 rounded-lg border text-center transition cursor-pointer ${
                trafficLevel === lvl
                  ? lvl === 'SEVERE'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold'
                    : 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                  : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Road Closure Simulator */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Simulate Road Blockage
        </label>
        <div className="space-y-1.5">
          {roadClosures.map(closure => (
            <div
              key={closure.id}
              onClick={() => onToggleRoadClosure(closure.id)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                closure.active
                  ? 'bg-rose-950/40 border-rose-600/80 text-rose-200'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-200">{closure.fromName} ↔ {closure.toName}</div>
                <div className="text-[10px] text-slate-400">{closure.description}</div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  closure.active ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {closure.active ? 'Blocked' : 'Open'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quantum QAOA Circuit Settings */}
      <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Atom className="w-3.5 h-3.5" />
            QAOA Circuit Hyperparameters
          </label>
          <span className="text-[10px] font-mono text-slate-400">16 Qubits</span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Ansätz Depth (p layers):</span>
            <span className="font-mono text-white font-bold">{qaoaDepth}</span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={qaoaDepth}
            onChange={e => setQaoaDepth(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Measurement Shots:</span>
            <span className="font-mono text-white font-bold">{qaoaShots}</span>
          </div>
          <input
            type="range"
            min="256"
            max="2048"
            step="256"
            value={qaoaShots}
            onChange={e => setQaoaShots(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* 6. Dynamic Order Injection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Dynamic Order Dispatch
        </label>
        <div className="space-y-1.5">
          <button
            onClick={onAddDynamicBatch1}
            disabled={hasAddedBatch1}
            className={`w-full p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
              hasAddedBatch1
                ? 'bg-slate-800/20 border-slate-800/40 text-slate-500 opacity-60 cursor-not-allowed'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <div>
              <div className="font-bold">+5 Rush Orders (t=135m)</div>
              <div className="text-[10px] text-slate-400">Patamata & Labbipet rush parcels</div>
            </div>
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
          </button>

          <button
            onClick={onAddDynamicBatch2}
            disabled={!hasAddedBatch1 || hasAddedBatch2}
            className={`w-full p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
              hasAddedBatch2 || !hasAddedBatch1
                ? 'bg-slate-800/20 border-slate-800/40 text-slate-500 opacity-60 cursor-not-allowed'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <div>
              <div className="font-bold">+3 Late Orders (t=210m)</div>
              <div className="text-[10px] text-slate-400">Suryaraopet & MG Road dental/bakes</div>
            </div>
            <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
};
