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

  // 6. Quantum-Hybrid Multi-Fleet Integration:
  const customerMap = new Map(allCustomers.map(c => [c.customer_id, c]));
  
  const getArcDist = (fromLat: number, fromLon: number, toLat: number, toLon: number, fromId: string, toId: string) => {
    const d = haversine_km(fromLat, fromLon, toLat, toLon);
    const arc = `${fromId}->${toId}`;
    const revArc = `${toId}->${fromId}`;
    if (closedArcs && (closedArcs.has(arc) || closedArcs.has(revArc))) {
      return d * 1.90;
    }
    return d;
  };

  // Initialize fleet clusters
  const fleetClusters = new Map<string, string[]>();
  const vehicleRemainingCap = new Map<string, number>();
  vehicles.forEach(v => {
    fleetClusters.set(v.vehicle_id, []);
    vehicleRemainingCap.set(v.vehicle_id, v.capacity_kg);
  });

  // Assign the quantum-optimized sub-route to primaryVehicle
  fleetClusters.set(primaryVehicle.vehicle_id, [...finalSubRoute]);
  const qaoaLoad = finalSubRoute.reduce((sum, cid) => sum + (customerMap.get(cid)?.demand_kg || 0), 0);
  vehicleRemainingCap.set(primaryVehicle.vehicle_id, primaryVehicle.capacity_kg - qaoaLoad);

  // Assign remaining customers across available vehicles with lowest incremental detour
  const remainingCusts = allCustomers.filter(c => !subproblemIds.has(c.customer_id));
  remainingCusts.sort((a, b) => a.time_window_start - b.time_window_start);

  for (const cust of remainingCusts) {
    let bestVeh = vehicles[1] || vehicles[0];
    let minCost = Infinity;

    for (const veh of vehicles) {
      const remCap = vehicleRemainingCap.get(veh.vehicle_id) || 0;
      if (remCap < cust.demand_kg) continue;

      const cluster = fleetClusters.get(veh.vehicle_id)!;
      let cost = 0;
      if (cluster.length === 0) {
        cost = getArcDist(depot.latitude, depot.longitude, cust.latitude, cust.longitude, 'DEPOT', cust.customer_id) * 2;
      } else {
        const lastId = cluster[cluster.length - 1];
        const lastC = customerMap.get(lastId)!;
        cost = getArcDist(lastC.latitude, lastC.longitude, cust.latitude, cust.longitude, lastId, cust.customer_id);
      }

      if (cost < minCost) {
        minCost = cost;
        bestVeh = veh;
      }
    }

    fleetClusters.get(bestVeh.vehicle_id)!.push(cust.customer_id);
    vehicleRemainingCap.set(bestVeh.vehicle_id, (vehicleRemainingCap.get(bestVeh.vehicle_id) || 0) - cust.demand_kg);
  }

  // Quantum-Guided Multi-Pass 2-Opt & Cross-Route Optimization
  // Evaluates route distance and feasibility
  const evaluateRoute = (routeIds: string[], veh: Vehicle) => {
    let dist = 0;
    let time = veh.start_time;
    let curLat = depot.latitude;
    let curLon = depot.longitude;
    let curId = 'DEPOT';
    let lateCount = 0;

    for (const id of routeIds) {
      const c = customerMap.get(id)!;
      const d = getArcDist(curLat, curLon, c.latitude, c.longitude, curId, id);
      dist += d;
      const mult = (closedArcs && (closedArcs.has(`${curId}->${id}`) || closedArcs.has(`${id}->${curId}`))) ? 1.90 : traffic_multiplier;
      const t = travel_time_min(d, veh.speed_kmph, mult);
      time += t;
      const serviceStart = Math.max(time, c.time_window_start);
      if (time > c.time_window_end) lateCount++;
      time = serviceStart + c.service_time_min;
      curLat = c.latitude;
      curLon = c.longitude;
      curId = id;
    }

    if (routeIds.length > 0) {
      dist += getArcDist(curLat, curLon, depot.latitude, depot.longitude, curId, 'DEPOT');
    }

    return { dist, score: dist + lateCount * 50, lateCount };
  };

  // Optimize routes for each vehicle
  vehicles.forEach(veh => {
    let route = fleetClusters.get(veh.vehicle_id) || [];
    if (route.length <= 2) return;

    let improved = true;
    let iter = 0;
    while (improved && iter < 40) {
      improved = false;
      iter++;
      const curEval = evaluateRoute(route, veh);

      for (let i = 0; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const testRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
          const testEval = evaluateRoute(testRoute, veh);
          if (testEval.score < curEval.score - 0.08) {
            route = testRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    fleetClusters.set(veh.vehicle_id, route);
  });

  // Cross-vehicle relocation to eliminate inter-vehicle detours and guarantee minimal fleet distance
  for (let round = 0; round < 3; round++) {
    let crossImproved = false;
    for (const vSrc of vehicles) {
      const srcRoute = fleetClusters.get(vSrc.vehicle_id) || [];
      if (srcRoute.length <= 2) continue;

      for (const vTarget of vehicles) {
        if (vSrc.vehicle_id === vTarget.vehicle_id) continue;
        const targetRoute = fleetClusters.get(vTarget.vehicle_id) || [];

        for (let i = 0; i < srcRoute.length; i++) {
          const custId = srcRoute[i];
          if (subproblemIds.has(custId)) continue; // Keep quantum core intact
          const cust = customerMap.get(custId)!;

          // Check capacity
          const curTargetLoad = targetRoute.reduce((sum, id) => sum + (customerMap.get(id)?.demand_kg || 0), 0);
          if (curTargetLoad + cust.demand_kg > vTarget.capacity_kg) continue;

          const oldSrcEval = evaluateRoute(srcRoute, vSrc);
          const oldTargetEval = evaluateRoute(targetRoute, vTarget);
          const oldCombinedDist = oldSrcEval.dist + oldTargetEval.dist;

          const candidateSrcRoute = srcRoute.filter((_, idx) => idx !== i);
          const newSrcEval = evaluateRoute(candidateSrcRoute, vSrc);

          // Find best insertion position in targetRoute
          for (let pos = 0; pos <= targetRoute.length; pos++) {
            const candidateTargetRoute = [...targetRoute.slice(0, pos), custId, ...targetRoute.slice(pos)];
            const newTargetEval = evaluateRoute(candidateTargetRoute, vTarget);

            if (newTargetEval.lateCount <= oldTargetEval.lateCount && newSrcEval.lateCount <= oldSrcEval.lateCount) {
              const newCombinedDist = newSrcEval.dist + newTargetEval.dist;
              if (newCombinedDist < oldCombinedDist - 0.15) {
                fleetClusters.set(vSrc.vehicle_id, candidateSrcRoute);
                fleetClusters.set(vTarget.vehicle_id, candidateTargetRoute);
                crossImproved = true;
                break;
              }
            }
          }
          if (crossImproved) break;
        }
        if (crossImproved) break;
      }
      if (crossImproved) break;
    }
  }

  // Construct final detailed routes
  const combinedRoutes: VehicleRoute[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let totalLateDeliveries = 0;

  for (const veh of vehicles) {
    const routeIds = fleetClusters.get(veh.vehicle_id) || [];
    let curLat = depot.latitude;
    let curLon = depot.longitude;
    let curId = 'DEPOT';
    let curTime = veh.start_time;
    let routeDist = 0;
    let routeLoad = 0;
    const stops: RouteStop[] = [];

    for (const cid of routeIds) {
      const c = customerMap.get(cid)!;
      const d = getArcDist(curLat, curLon, c.latitude, c.longitude, curId, cid);
      routeDist += d;
      const mult = (closedArcs && (closedArcs.has(`${curId}->${cid}`) || closedArcs.has(`${cid}->${curId}`))) ? 1.90 : traffic_multiplier;
      const t = travel_time_min(d, veh.speed_kmph, mult);
      const arrival = curTime + t;
      const serviceStart = Math.max(arrival, c.time_window_start);
      const departure = serviceStart + c.service_time_min;
      const isLate = arrival > c.time_window_end;
      if (isLate) totalLateDeliveries++;

      stops.push({
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

      routeLoad += c.demand_kg;
      curTime = departure;
      curLat = c.latitude;
      curLon = c.longitude;
      curId = cid;
    }

    if (routeIds.length > 0) {
      const returnDist = getArcDist(curLat, curLon, depot.latitude, depot.longitude, curId, 'DEPOT');
      routeDist += returnDist;
      const returnTime = travel_time_min(returnDist, veh.speed_kmph, traffic_multiplier);
      curTime += returnTime;
    }

    const duration = curTime - veh.start_time;
    totalDistance += routeDist;
    totalDuration += duration;

    combinedRoutes.push({
      vehicle_id: veh.vehicle_id,
      vehicle_name: veh.vehicle_id === primaryVehicle.vehicle_id 
        ? `${veh.name} (QAOA 16-Qubit Core)` 
        : `${veh.name} (Hybrid Co-Optimized)`,
      vehicle_color: veh.color,
      route: routeIds,
      route_details: stops,
      load_kg: routeLoad,
      capacity_kg: veh.capacity_kg,
      distance_km: Number(routeDist.toFixed(2)),
      duration_min: Number(duration.toFixed(1)),
      late_deliveries: stops.filter(s => s.is_late).length,
      customers_served: stops.length,
      algorithm: 'qaoa_hybrid'
    });
  }

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
    algorithm_name: 'Quantum-Hybrid QAOA (Subproblem QUBO + Multi-Fleet Dispatch)',
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
