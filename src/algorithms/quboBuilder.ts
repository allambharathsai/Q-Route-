import { Customer, Depot, Vehicle } from '../types';
import { haversine_km } from '../utils/distance';

export interface QUBOModel {
  n_nodes: number;
  n_qubits: number;
  var_names: string[];
  Q: number[][]; // Upper triangular QUBO matrix
  subproblem_customers: Customer[];
  penalty_weights: {
    visit_once: number;
    position_once: number;
    capacity: number;
    depot: number;
  };
}

/**
 * Selects hard subproblem (e.g. 4–6 customers) with tightest time windows and high priorities
 * for quantum annealing/QAOA treatment.
 */
export function select_quantum_subproblem(
  customers: Customer[],
  max_nodes: number = 4,
  strategy: 'tight_windows' | 'high_priority' | 'first_k' = 'tight_windows'
): Customer[] {
  const sorted = [...customers];
  if (strategy === 'tight_windows') {
    sorted.sort((a, b) => {
      const spanA = a.time_window_end - a.time_window_start;
      const spanB = b.time_window_end - b.time_window_start;
      return spanA - spanB;
    });
  } else if (strategy === 'high_priority') {
    const pWeight = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    sorted.sort((a, b) => pWeight[a.priority] - pWeight[b.priority]);
  }
  return sorted.slice(0, Math.min(max_nodes, customers.length));
}

export class QUBOBuilder {
  private customers: Customer[];
  private depot: Depot;
  private vehicle: Vehicle;
  private n: number;
  private n_vars: number;
  private varNames: string[] = [];
  private Q: number[][] = [];
  private penaltyVisit: number;
  private penaltyPos: number;
  private penaltyCap: number;

  constructor(
    customers: Customer[],
    depot: Depot,
    vehicle: Vehicle,
    penalty_visit: number = 10.0,
    penalty_pos: number = 10.0,
    penalty_cap: number = 8.0
  ) {
    this.customers = customers;
    this.depot = depot;
    this.vehicle = vehicle;
    this.n = customers.length;
    this.n_vars = this.n * this.n;
    this.penaltyVisit = penalty_visit;
    this.penaltyPos = penalty_pos;
    this.penaltyCap = penalty_cap;

    // Generate variable names: x_p{pos}_c{cust_idx}
    for (let p = 0; p < this.n; p++) {
      for (let c = 0; c < this.n; c++) {
        this.varNames.push(`x_p${p}_${this.customers[c].customer_id}`);
      }
    }

    this.Q = Array.from({ length: this.n_vars }, () => Array(this.n_vars).fill(0));
  }

  // Maps (position p, customer index c) to flat matrix index
  private varIdx(p: number, c: number): number {
    return p * this.n + c;
  }

  private addRoutingCost(): void {
    // 1. Depot -> First customer (p = 0)
    for (let c = 0; c < this.n; c++) {
      const idx = this.varIdx(0, c);
      const dist = haversine_km(this.depot.latitude, this.depot.longitude, this.customers[c].latitude, this.customers[c].longitude);
      this.Q[idx][idx] += dist;
    }

    // 2. Consecutive transitions (p -> p + 1)
    for (let p = 0; p < this.n - 1; p++) {
      for (let c1 = 0; c1 < this.n; c1++) {
        for (let c2 = 0; c2 < this.n; c2++) {
          if (c1 === c2) continue;
          const idx1 = this.varIdx(p, c1);
          const idx2 = this.varIdx(p + 1, c2);
          const dist = haversine_km(
            this.customers[c1].latitude,
            this.customers[c1].longitude,
            this.customers[c2].latitude,
            this.customers[c2].longitude
          );
          
          const minIdx = Math.min(idx1, idx2);
          const maxIdx = Math.max(idx1, idx2);
          this.Q[minIdx][maxIdx] += dist;
        }
      }
    }

    // 3. Last customer (p = n - 1) -> Depot
    for (let c = 0; c < this.n; c++) {
      const idx = this.varIdx(this.n - 1, c);
      const dist = haversine_km(this.customers[c].latitude, this.customers[c].longitude, this.depot.latitude, this.depot.longitude);
      this.Q[idx][idx] += dist;
    }
  }

  private addVisitOncePenalty(): void {
    // Penalty term: P_v * (1 - sum_{p} x_{p, c})^2
    // = P_v * (1 - 2*sum_p x_{p,c} + sum_p x_{p,c} + 2*sum_{p1<p2} x_{p1,c}*x_{p2,c})
    // Linear (diagonal): P_v * (1 - 2) = -P_v
    // Quadratic (off-diagonal): 2 * P_v
    const P = this.penaltyVisit;
    for (let c = 0; c < this.n; c++) {
      for (let p1 = 0; p1 < this.n; p1++) {
        const idx1 = this.varIdx(p1, c);
        this.Q[idx1][idx1] -= P; // Diagonal

        for (let p2 = p1 + 1; p2 < this.n; p2++) {
          const idx2 = this.varIdx(p2, c);
          this.Q[idx1][idx2] += 2 * P; // Upper triangular off-diagonal
        }
      }
    }
  }

  private addPositionOncePenalty(): void {
    // Penalty term: P_pos * (1 - sum_{c} x_{p, c})^2
    // Each position p must have exactly one customer
    const P = this.penaltyPos;
    for (let p = 0; p < this.n; p++) {
      for (let c1 = 0; c1 < this.n; c1++) {
        const idx1 = this.varIdx(p, c1);
        this.Q[idx1][idx1] -= P; // Diagonal

        for (let c2 = c1 + 1; c2 < this.n; c2++) {
          const idx2 = this.varIdx(p, c2);
          this.Q[idx1][idx2] += 2 * P; // Upper triangular off-diagonal
        }
      }
    }
  }

  private addCapacityPenalty(): void {
    // Pairwise capacity check
    for (let c1 = 0; c1 < this.n; c1++) {
      for (let c2 = c1 + 1; c2 < this.n; c2++) {
        const total = this.customers[c1].demand_kg + this.customers[c2].demand_kg;
        if (total > this.vehicle.capacity_kg) {
          const penalty = (total - this.vehicle.capacity_kg) * (this.penaltyCap / 10);
          for (let p1 = 0; p1 < this.n; p1++) {
            for (let p2 = 0; p2 < this.n; p2++) {
              if (p1 === p2) continue;
              const idx1 = Math.min(this.varIdx(p1, c1), this.varIdx(p2, c2));
              const idx2 = Math.max(this.varIdx(p1, c1), this.varIdx(p2, c2));
              this.Q[idx1][idx2] += penalty;
            }
          }
        }
      }
    }
  }

  public build(): QUBOModel {
    this.addRoutingCost();
    this.addVisitOncePenalty();
    this.addPositionOncePenalty();
    this.addCapacityPenalty();

    // Ensure all upper triangular values are rounded cleanly
    for (let i = 0; i < this.n_vars; i++) {
      for (let j = 0; j < this.n_vars; j++) {
        if (i > j) {
          this.Q[i][j] = 0; // strict upper triangular
        } else {
          this.Q[i][j] = Number(this.Q[i][j].toFixed(2));
        }
      }
    }

    return {
      n_nodes: this.n,
      n_qubits: this.n_vars,
      var_names: this.varNames,
      Q: this.Q,
      subproblem_customers: this.customers,
      penalty_weights: {
        visit_once: this.penaltyVisit,
        position_once: this.penaltyPos,
        capacity: this.penaltyCap,
        depot: 10.0
      }
    };
  }

  public evaluate(bitstring: number[]): number {
    let energy = 0;
    for (let i = 0; i < this.n_vars; i++) {
      if (bitstring[i] === 0) continue;
      for (let j = i; j < this.n_vars; j++) {
        if (bitstring[j] === 1) {
          energy += this.Q[i][j];
        }
      }
    }
    return Number(energy.toFixed(3));
  }

  public decodeBitstring(bitstring: number[]): string[] {
    const route: string[] = [];
    for (let p = 0; p < this.n; p++) {
      let chosenCust: string | null = null;
      for (let c = 0; c < this.n; c++) {
        const idx = this.varIdx(p, c);
        if (bitstring[idx] === 1) {
          chosenCust = this.customers[c].customer_id;
          break; // First match for position
        }
      }
      if (chosenCust) {
        route.push(chosenCust);
      }
    }
    return route;
  }
}
