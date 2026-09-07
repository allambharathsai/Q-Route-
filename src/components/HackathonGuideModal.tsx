import React, { useState } from 'react';
import { X, HelpCircle, Award, CheckCircle2, FileText, ChevronRight, Mic } from 'lucide-react';

interface HackathonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonGuideModal: React.FC<HackathonGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pitch' | 'qa' | 'architecture'>('pitch');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">B.Tech Hackathon Presentation & Judges Guide</h3>
              <p className="text-xs text-slate-400">UC-038: Quantum-Hybrid Dynamic Last-Mile Delivery Optimizer (Q-Route)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pitch')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'pitch' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            5-Minute Pitch Script
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'qa' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Judges Technical Q&A
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'architecture' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Mathematical Architecture
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300 flex-1">
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl">
                <span className="font-bold text-indigo-300">Presentation Strategy: </span>
                Lead with the real-world logistics bottlenecks in Vijayawada (dense traffic on MG Road and Benz Circle), demonstrate the 3-level progression (Greedy $\to$ CVRPTW $\to$ Quantum Hybrid), show real-time dynamic rerouting, and emphasize scientific integrity.
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] font-bold mb-1">
                    <span>00:00 – 00:30 • INTRO & THE PROBLEM</span>
                    <span>30 SEC</span>
                  </div>
                  <p>
                    "Good morning respected judges. Last-mile logistics in Indian tier-2 cities like Vijayawada accounts for over 50% of total delivery costs due to dynamic congestion, strict customer time windows, and spontaneous rush orders. We present <strong>Q-Route</strong>, a quantum-hybrid delivery optimizer combining classical operations research with variational quantum computing."
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] font-bold mb-1">
                    <span>00:30 – 01:15 • CLASSICAL BASELINE VS OR-TOOLS</span>
                    <span>45 SEC</span>
                  </div>
                  <p>
                    "We start with our Level 1 Greedy Nearest Neighbor baseline. While fast, it produces sub-optimal crossed paths and results in 2 delivery window violations. We then apply our Level 2 CVRPTW solver utilizing Clarke-Wright savings and Guided Local Search. As shown on our live Vijayawada map, this untangles overlapping routes, slashes total fleet distance by over 19%, and achieves 100% time window adherence."
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] font-bold mb-1">
                    <span>01:15 – 02:30 • THE QUANTUM-HYBRID INNOVATION</span>
                    <span>75 SEC</span>
                  </div>
                  <p>
                    "The core innovation is our <strong>Quantum-Hybrid pipeline</strong>. Running 20 nodes on full quantum hardware would require 400 qubits, exceeding current NISQ limits. Instead, our system applies classical decomposition to isolate the 4 most critical high-priority nodes with tight time windows. We encode this as a 16-qubit Quadratic Unconstrained Binary Optimization (QUBO) Hamiltonian and simulate the Quantum Approximate Optimization Algorithm (QAOA) using parameterized $R_z, R_x$, and CNOT gates. Because quantum measurements are probabilistic, our classical repair harness validates and corrects constraint violations."
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] font-bold mb-1">
                    <span>02:30 – 03:45 • REAL-TIME DYNAMIC DISPATCH & TRAFFIC</span>
                    <span>75 SEC</span>
                  </div>
                  <p>
                    "Real logistics is never static. At 10:15 AM (minute 135), 5 new rush medical supplies arrive in Patamata. Our dynamic dispatcher preserves all completed deliveries, locates the active vehicle coordinates, and replans only the remaining stops in milliseconds. Furthermore, when our traffic engine simulates a monsoon road closure on MG Road, affected routes are dynamically deflected."
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] font-bold mb-1">
                    <span>03:45 – 05:00 • EMISSIONS & HONEST CONCLUSION</span>
                    <span>75 SEC</span>
                  </div>
                  <p>
                    "Using IPCC 2006 guidelines, we quantify fuel savings and direct CO₂ reductions. In conclusion: we do not claim quantum commercial advantage on classical simulators today. Instead, we have validated the end-to-end mathematical bridge—from QUBO formulation to variational circuit and classical repair—proving readiness for the coming era of fault-tolerant quantum processors. Thank you, and we welcome your questions."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white text-xs mb-1 text-indigo-300">
                  Q1: Does your system claim quantum advantage over classical algorithms today?
                </h5>
                <p className="text-slate-300">
                  <strong>Answer:</strong> "No, and we state this transparently in our documentation and UI. On a classical simulator, simulating $2^n$ quantum amplitudes is computationally heavier than classical heuristics. Our work proves the mathematical validity of the QUBO mapping, the convergence of variational angles $\gamma$ and $\beta$, and the hybrid validation harness so that when fault-tolerant QPUs mature, this exact pipeline runs natively."
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white text-xs mb-1 text-indigo-300">
                  Q2: How many qubits does your system use, and how does the encoding scale?
                </h5>
                <p className="text-slate-300">
                  <strong>Answer:</strong> "We use position-based binary variable encoding x_(p,c) = 1 if customer c is visited at sequence position p. For N customers, this requires N² qubits. For our 4-customer subproblem, 4 × 4 = 16 qubits. If scaled to 6 customers, it would require 36 qubits. This quadratic scaling is why our hybrid decomposition strategy is essential."
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white text-xs mb-1 text-indigo-300">
                  Q3: Why not run QAOA on the entire 20-customer delivery problem?
                </h5>
                <p className="text-slate-300">
                  <strong>Answer:</strong> "A full 20-customer routing problem under position encoding requires $20 \times 20 = 400$ qubits, which exceeds the memory capacity of classical simulators ($2^{400}$ statevector amplitudes). Modern quantum hardware (NISQ era) suffers from decoherence at large gate depths. Classical decomposition into hard subproblems is standard industrial best practice in quantum logistics."
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white text-xs mb-1 text-indigo-300">
                  Q4: What happens if QAOA measures an invalid route with duplicates or missing nodes?
                </h5>
                <p className="text-slate-300">
                  <strong>Answer:</strong> "Because QAOA is probabilistic, penalty weights might not eliminate every invalid bitstring. Our <strong>RouteValidator</strong> verifies duplicate, missing, and capacity violations. If violations occur, our <strong>RouteRepairer</strong> executes deterministic classical repair: duplicate stripping, cheapest insertion of missing stops, capacity shedding by lowest priority, and 2-opt distance refinement. We never hide quantum invalidities—we log them."
                </p>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold mb-1">// Objective Function (Cost Hamiltonian)</div>
                <div>{"H_C = Σ_c dist(depot, c) x_{0,c} + Σ_p Σ_{c1≠c2} dist(c1, c2) x_{p,c1} x_{p+1,c2} + Σ_c dist(c, depot) x_{n-1,c}"}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold mb-1">// Visit-Once & Position-Once Quadratic Penalties</div>
                <div>{"P_visit = λ_1 Σ_c (1 - Σ_p x_{p,c})^2"}</div>
                <div>{"P_pos   = λ_2 Σ_p (1 - Σ_c x_{p,c})^2"}</div>
                <div>Penalty constants: λ_1 = 10.0, λ_2 = 10.0, λ_cap = 8.0</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold mb-1">// QAOA Unitary Evolution</div>
                <div>{"|ψ(γ, β)⟩ = Π_{l=1}^p [ e^{-i β_l Σ X_j} · e^{-i γ_l H_C} ] |+⟩^⊗n"}</div>
                <div>{"Variational optimization: min_{γ, β} ⟨ψ(γ, β) | H_C | ψ(γ, β)⟩ using COBYLA"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs">
          <span className="text-slate-400">Team Q-Route • B.Tech Hackathon 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
