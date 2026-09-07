import React, { useState } from 'react';
import { QuantumMetadata } from '../types';
import { Atom, Cpu, CheckCircle, Info, ShieldAlert, BarChart3, Layers, Sliders } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface QuantumInspectorProps {
  metadata?: QuantumMetadata;
}

export const QuantumInspector: React.FC<QuantumInspectorProps> = ({ metadata }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'circuit' | 'probabilities' | 'repair'>('overview');

  if (!metadata) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
        <Atom className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Run QAOA Optimization or Benchmark to view Quantum Circuit & QUBO diagnostics.</p>
      </div>
    );
  }

  const bitstringChartData = metadata.top_bitstrings.map((b, idx) => ({
    name: `#${idx + 1}: ...${b.bitstring.slice(-6)}`,
    fullBitstring: b.bitstring,
    probability: Number((b.probability * 100).toFixed(1)),
    energy: b.value
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Atom className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Quantum Component Inspector</h3>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                QAOA p={metadata.qaoa_depth}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              QUBO formulation with {metadata.n_qubits} Qubits & statevector variational circuit
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('circuit')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'circuit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Circuit
          </button>
          <button
            onClick={() => setActiveTab('probabilities')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'probabilities' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sampling
          </button>
          <button
            onClick={() => setActiveTab('repair')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'repair' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Repair Log
          </button>
        </div>
      </div>

      {/* Scientific Honesty Disclaimer */}
      <div className="px-5 py-2.5 bg-blue-950/30 border-b border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-300">Scientific Honesty Disclosure: </span>
          Simulated on classical CPU using statevector matrix multiplication. Demonstrates QUBO mapping, variational parameter convergence, and hybrid validation pipeline. No quantum commercial speedup claimed over OR-Tools today.
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium uppercase">Target Subproblem</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {metadata.subproblem_customers.length} Nodes
                </div>
                <div className="text-[10px] text-slate-400">
                  IDs: {metadata.subproblem_customers.join(', ')}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium uppercase">Hilbert Space</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  2^{metadata.n_qubits} States
                </div>
                <div className="text-[10px] text-slate-400">
                  {metadata.n_qubits} Qubits ({metadata.n_variables} vars)
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium uppercase">Circuit Depth & Shots</div>
                <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                  p={metadata.qaoa_depth} • {metadata.shots}
                </div>
                <div className="text-[10px] text-slate-400">
                  {metadata.n_evaluations} classical loop evals
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium uppercase">Validation & Repair</div>
                <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-1">
                  {metadata.repair_applied ? (
                    <span className="text-amber-400 text-sm font-semibold">Repaired Classically</span>
                  ) : (
                    <span className="text-emerald-400 text-sm font-semibold">100% Valid Bitstring</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  Obj Value: {metadata.best_objective}
                </div>
              </div>
            </div>

            {/* Variational Parameters */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Optimal Variational Angles (COBYLA Converged)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-indigo-400 font-semibold">Cost Angles γ (Gammas):</span>
                  <div className="mt-1 text-slate-200">
                    [{metadata.gammas.map(g => g.toFixed(4)).join(', ')}] rad
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-semibold">Mixer Angles β (Betas):</span>
                  <div className="mt-1 text-slate-200">
                    [{metadata.betas.map(b => b.toFixed(4)).join(', ')}] rad
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CIRCUIT DIAGRAM */}
        {activeTab === 'circuit' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-300">
              Parameterized QAOA Ansätz Architecture for <span className="font-mono text-cyan-400">{metadata.n_qubits} Qubits</span>:
            </div>
            
            {/* ASCII / Graphical Circuit Canvas */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              <div className="space-y-2 leading-relaxed whitespace-pre">
                <div className="text-slate-500 font-sans text-[11px] mb-2">// 1. Initial State Preparation: Equal Superposition |+⟩^⊗n via Hadamard Gates</div>
                <div className="text-indigo-300">q[0..{metadata.n_qubits-1}]: ──[ H ]──</div>
                
                <div className="text-slate-500 font-sans text-[11px] my-2">// 2. Cost Layer U(C, γ): Problem Hamiltonian H_C = Σ Q_ij Z_i Z_j</div>
                <div className="text-emerald-400">q[i]: ──────●──────[ Rz(2γ·Q_ii) ]──────●──────</div>
                <div className="text-emerald-400">q[j]: ─────(X)─────────────────────────(X)─────</div>

                <div className="text-slate-500 font-sans text-[11px] my-2">// 3. Transverse-Field Mixer Layer U(B, β): Non-commuting driver H_M = Σ X_i</div>
                <div className="text-cyan-400">q[0..{metadata.n_qubits-1}]: ──[ Rx(2β) ]──</div>

                <div className="text-slate-500 font-sans text-[11px] my-2">// 4. Measurement: Projective Z-basis collapse over {metadata.shots} shots</div>
                <div className="text-amber-400">q[0..{metadata.n_qubits-1}]: ──[ M ]──» Classical Bitstring Register</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
              <div className="bg-slate-800/40 p-2 rounded">Single-Qubit Gates: ~{metadata.n_qubits * (2 * metadata.qaoa_depth + 1)}</div>
              <div className="bg-slate-800/40 p-2 rounded">Two-Qubit CNOTs: ~{metadata.qaoa_depth * 24}</div>
              <div className="bg-slate-800/40 p-2 rounded">Variational Params: {metadata.qaoa_depth * 2} (2p)</div>
            </div>
          </div>
        )}

        {/* TAB 3: PROBABILITIES */}
        {activeTab === 'probabilities' && (
          <div>
            <div className="text-xs text-slate-300 mb-3 flex items-center justify-between">
              <span>Top Measured Quantum Bitstrings ({metadata.shots} projective shots):</span>
              <span className="text-[11px] font-mono text-slate-400">Lower Energy = Better Routing</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bitstringChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                    {bitstringChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-3">
              {metadata.top_bitstrings.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/50 px-3 py-1.5 rounded text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className="text-slate-300">{b.bitstring}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">E = {b.value}</span>
                    <span className="font-bold text-white">{(b.probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REPAIR LOG */}
        {activeTab === 'repair' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Raw Quantum Bitstring Decoded:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {metadata.original_valid ? 'Valid Permutation' : 'Constraint Conflicts Found'}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Classical Repair & Validation Pipeline:
              </div>
              {metadata.repair_operations.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {metadata.repair_operations.map((op, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-mono">[{idx + 1}]</span>
                      <span>{op}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-300 py-1">
                  No repair operations needed! QAOA ground-state measurement directly produced a feasible Hamiltonian permutation.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              * The hybrid paradigm uses classical post-processing as a safety harness to guarantee 100% constraint satisfaction for physical delivery logistics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
