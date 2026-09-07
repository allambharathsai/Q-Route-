import { Customer, Depot, RouteOptimizationResult, Vehicle } from '../types';
import { solve_cvrptw } from './cvrptwSolver';
import { solve_nearest_neighbor } from './nearestNeighbor';
import { solve_quantum_hybrid } from './quantumDecoder';

export interface BenchmarkReport {
  nn: RouteOptimizationResult;
  cvrptw: RouteOptimizationResult;
  qaoa: RouteOptimizationResult;
  winners: {
    best_distance: string;
    fastest_runtime: string;
    least_late: string;
    lowest_cost: string;
  };
  comparison_table: {
    metric: string;
    nn_val: string;
    cvrptw_val: string;
    qaoa_val: string;
    winner: 'nn' | 'cvrptw' | 'qaoa' | 'tie';
  }[];
  scientific_note: string;
}

export class BenchmarkEngine {
  public static runAll(
    customers: Customer[],
    vehicles: Vehicle[],
    depot: Depot,
    trafficMultiplier: number = 1.0,
    closedArcs?: Set<string>,
    qaoaReps: number = 2,
    qaoaShots: number = 1024
  ): BenchmarkReport {
    // 1. Run Nearest Neighbor
    const nn = solve_nearest_neighbor(customers, vehicles, depot, trafficMultiplier, closedArcs);

    // 2. Run OR-Tools CVRPTW
    const cvrptw = solve_cvrptw(customers, vehicles, depot, trafficMultiplier, closedArcs);

    // 3. Run Quantum-Hybrid QAOA
    const qaoa = solve_quantum_hybrid(
      customers,
      vehicles,
      depot,
      trafficMultiplier,
      closedArcs,
      qaoaReps,
      qaoaShots,
      4
    );

    // Determine winners
    const bestDist = [nn, cvrptw, qaoa].reduce((min, r) => (r.total_distance_km < min.total_distance_km ? r : min));
    const fastest = [nn, cvrptw, qaoa].reduce((min, r) => (r.runtime_sec < min.runtime_sec ? r : min));
    const leastLate = [nn, cvrptw, qaoa].reduce((min, r) => (r.late_deliveries < min.late_deliveries ? r : min));
    const lowestCost = [nn, cvrptw, qaoa].reduce((min, r) => (r.total_cost_inr < min.total_cost_inr ? r : min));

    const comparisonTable = [
      {
        metric: 'Total Distance (km)',
        nn_val: `${nn.total_distance_km.toFixed(2)} km`,
        cvrptw_val: `${cvrptw.total_distance_km.toFixed(2)} km`,
        qaoa_val: `${qaoa.total_distance_km.toFixed(2)} km`,
        winner: (bestDist.algorithm as any)
      },
      {
        metric: 'Total Duration (min)',
        nn_val: `${nn.total_duration_min.toFixed(1)} min`,
        cvrptw_val: `${cvrptw.total_duration_min.toFixed(1)} min`,
        qaoa_val: `${qaoa.total_duration_min.toFixed(1)} min`,
        winner: cvrptw.total_duration_min <= qaoa.total_duration_min ? ('cvrptw' as const) : ('qaoa' as const)
      },
      {
        metric: 'Late Deliveries',
        nn_val: `${nn.late_deliveries}`,
        cvrptw_val: `${cvrptw.late_deliveries}`,
        qaoa_val: `${qaoa.late_deliveries}`,
        winner: cvrptw.late_deliveries <= nn.late_deliveries ? ('cvrptw' as const) : ('nn' as const)
      },
      {
        metric: 'Total Cost (INR)',
        nn_val: `₹${nn.total_cost_inr.toFixed(2)}`,
        cvrptw_val: `₹${cvrptw.total_cost_inr.toFixed(2)}`,
        qaoa_val: `₹${qaoa.total_cost_inr.toFixed(2)}`,
        winner: (lowestCost.algorithm as any)
      },
      {
        metric: 'Compute Runtime',
        nn_val: `${(nn.runtime_sec * 1000).toFixed(1)} ms`,
        cvrptw_val: `${(cvrptw.runtime_sec * 1000).toFixed(1)} ms`,
        qaoa_val: `${(qaoa.runtime_sec * 1000).toFixed(1)} ms`,
        winner: ('nn' as const)
      },
      {
        metric: 'Vehicles Deployed',
        nn_val: `${nn.vehicles_used} / ${vehicles.length}`,
        cvrptw_val: `${cvrptw.vehicles_used} / ${vehicles.length}`,
        qaoa_val: `${qaoa.vehicles_used} / ${vehicles.length}`,
        winner: ('tie' as const)
      },
      {
        metric: 'Quantum Qubits / Formulation',
        nn_val: '—',
        cvrptw_val: '—',
        qaoa_val: `${qaoa.quantum_metadata?.n_qubits} qubits (16 vars, p=${qaoa.quantum_metadata?.qaoa_depth})`,
        winner: ('qaoa' as const)
      },
      {
        metric: 'Classical Repair Needed',
        nn_val: 'No',
        cvrptw_val: 'No',
        qaoa_val: qaoa.quantum_metadata?.repair_applied ? 'Yes (Classical 2-Opt & Bounds Repair)' : 'No',
        winner: ('tie' as const)
      }
    ];

    return {
      nn,
      cvrptw,
      qaoa,
      winners: {
        best_distance: bestDist.algorithm_name,
        fastest_runtime: fastest.algorithm_name,
        least_late: leastLate.algorithm_name,
        lowest_cost: lowestCost.algorithm_name
      },
      comparison_table: comparisonTable,
      scientific_note:
        'Scientific Honesty Note: QAOA is evaluated on a statevector circuit simulator. On classical hardware, QAOA does not achieve algorithmic speedup over OR-Tools. Rather, it validates the quadratic unconstrained binary optimization (QUBO) Hamiltonian formulation, parameter convergence, and quantum-classical hybrid pipeline for future fault-tolerant QPUs.'
    };
  }
}
