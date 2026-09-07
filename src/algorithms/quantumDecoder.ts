import { Customer, Depot, QuantumMetadata, RouteOptimizationResult, RouteStop, Vehicle, VehicleRoute } from '../types';
import { haversine_km, travel_time_min } from '../utils/distance';
import { solve_cvrptw } from './cvrptwSolver';
import { QAOASolution, QAOASolver } from './qaoaSolver';
import { QUBOBuilder, select_quantum_subproblem } from './quboBuilder';
import { RouteRepairer, RouteValidator } from './validatorRepair';

/**
 * Quantum-Classical Hybrid Pipeline:
 * 1. Selects tight-window / high-priority subproblem (4–6 customers).
 * 2. Formulates subproblem into QUBO Hamiltonian.
 * 3. Runs QAOA Quantum Circuit Simulator.
 * 4. Decodes bitstring, validates constraints, and applies classical repair if necessary.
 * 5. Integrates quantum sub-route into full vehicle fleet dispatch.
 */
export function solve_quantum_hybrid(
  allCustomers: Customer[],
  vehicles: Vehicle[],
  depot: Depot,
  traffic_multiplier: number = 1.0,
  closedArcs?: Set<string>,
  qaoa_reps: number = 2,
  qaoa_shots: number = 1024,
  max_quantum_nodes: number = 4
): RouteOptimizationResult {
  const startTime = performance.now();

  // 1. Classical Decomposition: Select the critical subproblem
  const subproblem = select_quantum_subproblem(allCustomers, max_quantum_nodes, 'tight_windows');
  const subproblemIds = new Set(subproblem.map(c => c.customer_id));
  const primaryVehicle = vehicles[0]; // Van Alpha assigned to quantum subproblem

  // 2. Formulate QUBO
  const quboBuilder = new QUBOBuilder(subproblem, depot, primaryVehicle);
  const quboModel = quboBuilder.build();

  // 3. QAOA Circuit Simulation
  const qaoaSolver = new QAOASolver(quboModel, qaoa_reps, qaoa_shots);
  const qaoaSolution: QAOASolution = qaoaSolver.solve();

  // 4. Bitstring Decoding
  const rawDecodedRoute = quboBuilder.decodeBitstring(qaoaSolution.best_bitstring);

  // 5. Validation & Repair
  const validation = RouteValidator.validate(rawDecodedRoute, subproblem, primaryVehicle, depot, traffic_multiplier);
  let finalSubRoute = rawDecodedRoute;
  let repairApplied = false;
  let repairOps: string[] = [];

  if (validation.repair_needed || !validation.is_valid) {
    repairApplied = true;
    const repairRes = RouteRepairer.repair(rawDecodedRoute, validation, subproblem, primaryVehicle, depot, traffic_multiplier);
    finalSubRoute = repairRes.repaired_route;
    repairOps = repairRes.operations;
  }

  // 6. Integrate Quantum Route with remaining fleet (Van Beta, Van Gamma, etc.)
  // The remaining customers are routed via classical CVRPTW optimizer
  const remainingCustomers = allCustomers.filter(c => !subproblemIds.has(c.customer_id));
  const otherVehicles = vehicles.slice(1);

  const classicalRemainder = solve_cvrptw(
    remainingCustomers,
    otherVehicles,
    depot,
    traffic_multiplier,
    closedArcs
  );

  // Build RouteStop list for Primary Vehicle with Quantum Route
  const customerMap = new Map(allCustomers.map(c => [c.customer_id, c]));
  let curLat = depot.latitude;
  let curLon = depot.longitude;
  let curTime = primaryVehicle.start_time;
  let curId = 'DEPOT';
  let quantumDist = 0;
  let quantumLoad = 0;
  const quantumStops: RouteStop[] = [];

  for (const cid of finalSubRoute) {
    const c = customerMap.get(cid)!;
    const d = haversine_km(curLat, curLon, c.latitude, c.longitude);
    const arc = `${curId}->${cid}`;
    const isClosed = closedArcs && (closedArcs.has(arc) || closedArcs.has(`${cid}->${curId}`));
    const mult = isClosed ? 1.90 : traffic_multiplier;

    quantumDist += d;
    const t = travel_time_min(d, primaryVehicle.speed_kmph, mult);
    const arrival = curTime + t;
    const serviceStart = Math.max(arrival, c.time_window_start);
    const departure = serviceStart + c.service_time_min;
    const isLate = arrival > c.time_window_end;

    quantumStops.push({
      customer_id: c.customer_id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      demand_kg: c.demand_kg,
      distance_from_prev_km: Number(d.toFixed(2)),
      arrival_min: Number(arrival.toFixed(1)),
      delivery_min: Number(serviceStart.toFixed(1)),
      depart_min: Number(departure.toFixed(1)),
      tw_start: c.time_window_start,
      tw_end: c.time_window_end,
      is_late: isLate,
      priority: c.priority,
      zone: c.zone,
      service_time_min: c.service_time_min
    });

    quantumLoad += c.demand_kg;
    curTime = departure;
    curLat = c.latitude;
    curLon = c.longitude;
    curId = cid;
  }

  // Return to depot
  const returnDist = haversine_km(curLat, curLon, depot.latitude, depot.longitude);
  quantumDist += returnDist;
  const returnTime = travel_time_min(returnDist, primaryVehicle.speed_kmph, traffic_multiplier);
  curTime += returnTime;

  const primaryVehicleRoute: VehicleRoute = {
    vehicle_id: primaryVehicle.vehicle_id,
    vehicle_name: `${primaryVehicle.name} (QAOA Optimized)`,
    vehicle_color: primaryVehicle.color,
    route: finalSubRoute,
    route_details: quantumStops,
    load_kg: quantumLoad,
    capacity_kg: primaryVehicle.capacity_kg,
    distance_km: Number(quantumDist.toFixed(2)),
    duration_min: Number((curTime - primaryVehicle.start_time).toFixed(1)),
    late_deliveries: quantumStops.filter(s => s.is_late).length,
    customers_served: quantumStops.length,
    algorithm: 'qaoa_hybrid'
  };

  const combinedRoutes: VehicleRoute[] = [primaryVehicleRoute, ...classicalRemainder.routes];

  const totalDistance = combinedRoutes.reduce((sum, r) => sum + r.distance_km, 0);
  const totalDuration = combinedRoutes.reduce((sum, r) => sum + r.duration_min, 0);
  const totalLateDeliveries = combinedRoutes.reduce((sum, r) => sum + r.late_deliveries, 0);
  const totalCost = combinedRoutes.reduce((sum, r) => {
    const v = vehicles.find(veh => veh.vehicle_id === r.vehicle_id);
    return sum + r.distance_km * (v?.cost_per_km || 2.5);
  }, 0);

  const servedIds = new Set(combinedRoutes.flatMap(r => r.route));
  const unserved = allCustomers.filter(c => !servedIds.has(c.customer_id)).map(c => c.customer_id);

  const endTime = performance.now();

  const quantumMetadata: QuantumMetadata = {
    n_qubits: qaoaSolution.n_qubits,
    n_variables: quboModel.n_qubits,
    qaoa_depth: qaoa_reps,
    shots: qaoa_shots,
    n_evaluations: qaoaSolution.n_evaluations,
    subproblem_customers: subproblem.map(c => c.customer_id),
    best_bitstring: qaoaSolution.best_bitstring,
    best_objective: qaoaSolution.best_value,
    repair_applied: repairApplied,
    repair_operations: repairOps,
    original_valid: validation.is_valid,
    top_bitstrings: qaoaSolution.top_bitstrings,
    gammas: qaoaSolution.opt_gammas,
    betas: qaoaSolution.opt_betas,
    simulation_method: 'statevector_qiskit_equivalent'
  };

  return {
    algorithm: 'qaoa',
    algorithm_name: 'Quantum-Hybrid QAOA (Subproblem QUBO + Classical Dispatch)',
    routes: combinedRoutes,
    total_distance_km: Number(totalDistance.toFixed(2)),
    total_duration_min: Number(totalDuration.toFixed(1)),
    total_cost_inr: Number(totalCost.toFixed(2)),
    late_deliveries: totalLateDeliveries,
    customers_served: allCustomers.length - unserved.length,
    customers_total: allCustomers.length,
    vehicles_used: combinedRoutes.filter(r => r.customers_served > 0).length,
    unserved,
    feasible: unserved.length === 0,
    runtime_sec: Number(((endTime - startTime) / 1000).toFixed(4)),
    objective_value: Number((totalDistance + totalLateDeliveries * 18).toFixed(2)),
    quantum_metadata: quantumMetadata
  };
}
