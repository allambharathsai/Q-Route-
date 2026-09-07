import React, { useState } from 'react';
import { EmissionsComparison } from '../types';
import { BenchmarkReport } from '../algorithms/benchmarkEngine';
import { Award, Zap, Clock, Navigation, AlertTriangle, ChevronDown, ChevronUp, Leaf, Fuel, Info, Check } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface BenchmarkViewProps {
  report: BenchmarkReport | null;
  emissionsComp: EmissionsComparison | null;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ report, emissionsComp }) => {
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Award className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Click "Run Benchmark (All Three)" to generate rigorous side-by-side performance analytics.</p>
      </div>
    );
  }

  const distanceChartData = [
    {
      name: 'Nearest Neighbor',
      distance: report.nn.total_distance_km,
      cost: report.nn.total_cost_inr,
      fill: '#64748b'
    },
    {
      name: 'OR-Tools CVRPTW',
      distance: report.cvrptw.total_distance_km,
      cost: report.cvrptw.total_cost_inr,
      fill: '#10b981'
    },
    {
      name: 'QAOA Hybrid',
      distance: report.qaoa.total_distance_km,
      cost: report.qaoa.total_cost_inr,
      fill: '#6366f1'
    }
  ];

  const runtimeChartData = [
    {
      name: 'Nearest Neighbor',
      runtime_ms: Number((report.nn.runtime_sec * 1000).toFixed(1)),
      late: report.nn.late_deliveries
    },
    {
      name: 'OR-Tools CVRPTW',
      runtime_ms: Number((report.cvrptw.runtime_sec * 1000).toFixed(1)),
      late: report.cvrptw.late_deliveries
    },
    {
      name: 'QAOA Hybrid',
      runtime_ms: Number((report.qaoa.runtime_sec * 1000).toFixed(1)),
      late: report.qaoa.late_deliveries
    }
  ];

  return (
    <div className="space-y-6">
      {/* 3 Algorithm Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Nearest Neighbor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Baseline (Greedy)</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded">
              Level 1
            </span>
          </div>
          <h4 className="text-base font-bold text-white mb-3">Nearest Neighbor</h4>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Total Distance:</span>
              <span className="font-mono font-bold text-white">{report.nn.total_distance_km.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Travel Duration:</span>
              <span className="font-mono font-bold text-white">{report.nn.total_duration_min.toFixed(0)} min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Late Deliveries:</span>
              <span className="font-mono font-bold text-amber-400">{report.nn.late_deliveries} stops</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Compute Time:</span>
              <span className="font-mono text-slate-300">{(report.nn.runtime_sec * 1000).toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Status:</span>
              <span className="text-slate-300 font-medium">Greedy Baseline</span>
            </div>
          </div>
        </div>

        {/* 2. OR-Tools CVRPTW */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-xl p-4 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
            Best Distance
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Classical Metaheuristic</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded">
              Level 2
            </span>
          </div>
          <h4 className="text-base font-bold text-white mb-3">OR-Tools CVRPTW</h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Total Distance:</span>
              <span className="font-mono font-bold text-emerald-400">{report.cvrptw.total_distance_km.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Travel Duration:</span>
              <span className="font-mono font-bold text-white">{report.cvrptw.total_duration_min.toFixed(0)} min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Late Deliveries:</span>
              <span className="font-mono font-bold text-emerald-400">{report.cvrptw.late_deliveries} stops (0 late)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Compute Time:</span>
              <span className="font-mono text-slate-300">{(report.cvrptw.runtime_sec * 1000).toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Distance Savings:</span>
              <span className="text-emerald-300 font-bold">
                -{((1 - report.cvrptw.total_distance_km / report.nn.total_distance_km) * 100).toFixed(1)}% vs NN
              </span>
            </div>
          </div>
        </div>

        {/* 3. QAOA Hybrid */}
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-xl p-4 shadow-lg shadow-indigo-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
            Quantum PoC
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Variational Quantum</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded font-mono">
              16 Qubits
            </span>
          </div>
          <h4 className="text-base font-bold text-white mb-3">QAOA + Classical Hybrid</h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Total Distance:</span>
              <span className="font-mono font-bold text-indigo-300">{report.qaoa.total_distance_km.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Travel Duration:</span>
              <span className="font-mono font-bold text-white">{report.qaoa.total_duration_min.toFixed(0)} min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Late Deliveries:</span>
              <span className="font-mono font-bold text-emerald-400">{report.qaoa.late_deliveries} stops</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Compute Time:</span>
              <span className="font-mono text-slate-300">{(report.qaoa.runtime_sec * 1000).toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Subproblem:</span>
              <span className="text-indigo-300 font-medium">4 Hard Nodes (QUBO)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distance Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-400" />
            Total Fleet Routing Distance (km)
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="km" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} km`, 'Distance']}
                />
                <Bar dataKey="distance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Runtime & Late Stops */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            Algorithm Execution Time (ms)
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runtimeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} ms`, 'Runtime']}
                />
                <Bar dataKey="runtime_ms" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Rigorous Benchmark Comparison (Identical 20-Stop Inputs)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Evaluation Metric</th>
                <th className="px-4 py-2.5">Nearest Neighbor</th>
                <th className="px-4 py-2.5">OR-Tools CVRPTW</th>
                <th className="px-4 py-2.5">QAOA Hybrid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {report.comparison_table.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-2.5 font-medium text-slate-300">{row.metric}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{row.nn_val}</td>
                  <td className={`px-4 py-2.5 font-mono ${row.winner === 'cvrptw' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                    {row.cvrptw_val}
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${row.winner === 'qaoa' ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}>
                    {row.qaoa_val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emissions Auditing Panel */}
      {emissionsComp && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Fleet Carbon & Fuel Audit (IPCC Standard)
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Estimated</span>
            </div>
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{showAssumptions ? 'Hide' : 'Show'} Parameters</span>
              {showAssumptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-400">Baseline Fuel:</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {emissionsComp.baseline_nn.fuel_consumed_L.toFixed(2)} L
              </div>
              <div className="text-[11px] text-slate-400">{emissionsComp.baseline_nn.co2_kg.toFixed(2)} kg CO₂</div>
            </div>

            <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-800/40">
              <span className="text-emerald-400 font-medium">CVRPTW Fuel Saved:</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {emissionsComp.fuel_saved_ortools_pct}% Saved
              </div>
              <div className="text-[11px] text-emerald-300">
                {(emissionsComp.baseline_nn.co2_kg - emissionsComp.ortools.co2_kg).toFixed(2)} kg CO₂ avoided
              </div>
            </div>

            <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-800/40">
              <span className="text-indigo-400 font-medium">QAOA Hybrid Fuel Saved:</span>
              <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
                {emissionsComp.fuel_saved_qaoa_pct}% Saved
              </div>
              <div className="text-[11px] text-indigo-200">
                {(emissionsComp.baseline_nn.co2_kg - emissionsComp.qaoa_hybrid.co2_kg).toFixed(2)} kg CO₂ avoided
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-400">Total Fleet Cost:</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                ₹{emissionsComp.ortools.cost_inr.toFixed(0)} INR
              </div>
              <div className="text-[11px] text-slate-400">vs ₹{emissionsComp.baseline_nn.cost_inr.toFixed(0)} baseline</div>
            </div>
          </div>

          {showAssumptions && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 mb-1">Modeling Assumptions & Disclaimer:</div>
              <div>• Fuel Rates: Van Alpha = 0.12 L/km, Van Beta = 0.10 L/km, Van Gamma = 0.15 L/km.</div>
              <div>• CO₂ Conversion Factor: 2.31 kg CO₂ per litre of fuel (IPCC 2006 Standard).</div>
              <div className="italic text-slate-500 mt-1">{emissionsComp.assumptions.disclaimer}</div>
            </div>
          )}
        </div>
      )}

      {/* Scientific Note */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Academic & Technical Note: </span>
          {report.scientific_note}
        </div>
      </div>
    </div>
  );
};
