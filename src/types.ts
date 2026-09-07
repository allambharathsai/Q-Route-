export type TrafficLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'SEVERE';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type AlgorithmType = 'nn' | 'cvrptw' | 'qaoa' | 'all';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface Depot extends LocationPoint {
  depot_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  operating_hours_start: number; // minutes from 08:00 (0)
  operating_hours_end: number;   // minutes from 08:00 (480 = 16:00)
}

export interface Customer extends LocationPoint {
  customer_id: string;
  name: string;
  demand_kg: number;
  time_window_start: number; // minutes from 08:00
  time_window_end: number;   // minutes from 08:00
  service_time_min: number;
  priority: PriorityLevel;
  zone: string; // Neighborhood in Vijayawada
  type?: 'hospital' | 'pharmacy' | 'vip' | 'retail' | 'residential';
}

export interface Vehicle {
  vehicle_id: string;
  name: string;
  capacity_kg: number;
  start_time: number; // min from 08:00
  end_time: number;   // min from 08:00
  cost_per_km: number; // INR
  fuel_rate: number;   // L/km
  speed_kmph: number;
  color: string;
}

export interface RouteStop {
  customer_id: string;
  name: string;
  latitude: number;
  longitude: number;
  demand_kg: number;
  distance_from_prev_km: number;
  arrival_min: number;
  delivery_min: number;
  depart_min: number;
  tw_start: number;
  tw_end: number;
  is_late: boolean;
  priority: PriorityLevel;
  zone: string;
  service_time_min: number;
}

export interface VehicleRoute {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_color: string;
  route: string[]; // Customer IDs in order
  route_details: RouteStop[];
  load_kg: number;
  capacity_kg: number;
  distance_km: number;
  duration_min: number;
  late_deliveries: number;
  customers_served: number;
  algorithm: string;
}

export interface RouteOptimizationResult {
  algorithm: string;
  algorithm_name: string;
  routes: VehicleRoute[];
  total_distance_km: number;
  total_duration_min: number;
  total_cost_inr: number;
  late_deliveries: number;
  customers_served: number;
  customers_total: number;
  vehicles_used: number;
  unserved: string[];
  feasible: boolean;
  runtime_sec: number;
  objective_value?: number;
  quantum_metadata?: QuantumMetadata;
}

export interface QuantumMetadata {
  n_qubits: number;
  n_variables: number;
  qaoa_depth: number;
  shots: number;
  n_evaluations: number;
  subproblem_customers: string[];
  best_bitstring: number[];
  best_objective: number;
  repair_applied: boolean;
  repair_operations: string[];
  original_valid: boolean;
  top_bitstrings: { bitstring: string; value: number; probability: number }[];
  gammas: number[];
  betas: number[];
  simulation_method: 'statevector_qiskit_equivalent' | 'classical_bruteforce';
}

export interface ValidationResult {
  is_valid: boolean;
  checks: {
    all_served: boolean;
    no_duplicates: boolean;
    no_missing: boolean;
    capacity_ok: boolean;
    time_windows_ok: boolean;
    depot_constraints: boolean;
  };
  violations: string[];
  duplicate_ids: string[];
  missing_ids: string[];
  total_demand: number;
  capacity_available: number;
  late_deliveries: number;
  repair_needed: boolean;
}

export interface RepairResult {
  original_route: string[];
  repaired_route: string[];
  operations: string[];
  original_valid: boolean;
  final_valid: boolean;
  distance_before: number;
  distance_after: number;
  customers_removed: string[];
  repair_time_sec: number;
}

export interface EmissionsResult {
  fuel_consumed_L: number;
  co2_kg: number;
  cost_inr: number;
  distance_km: number;
  per_vehicle: {
    vehicle_id: string;
    vehicle_name: string;
    distance_km: number;
    fuel_L: number;
    co2_kg: number;
    cost_inr: number;
  }[];
}

export interface EmissionsComparison {
  baseline_nn: EmissionsResult;
  ortools: EmissionsResult;
  qaoa_hybrid: EmissionsResult;
  fuel_saved_ortools_pct: number;
  co2_saved_ortools_pct: number;
  fuel_saved_qaoa_pct: number;
  co2_saved_qaoa_pct: number;
  assumptions: {
    co2_per_litre_kg: number;
    fuel_rate_van_alpha: number;
    fuel_rate_van_beta: number;
    fuel_rate_van_gamma: number;
    base_speed_kmph: number;
    disclaimer: string;
  };
}

export interface RoadClosure {
  id: string;
  fromName: string;
  toName: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  trafficMultiplier: number;
  description: string;
  active: boolean;
}

export interface DispatchEvent {
  id: string;
  timestamp: string;
  sim_minute: number;
  type: 'OPTIMIZATION' | 'DYNAMIC_ORDER' | 'TRAFFIC_CHANGE' | 'ROAD_CLOSURE' | 'DELIVERY_COMPLETED';
  title: string;
  description: string;
  delta_distance_km?: number;
  delta_time_min?: number;
  affected_vehicles?: string[];
  highlightColor?: string;
}
