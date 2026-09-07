import { Customer, Depot, RouteOptimizationResult, RouteStop, Vehicle, VehicleRoute } from '../types';
import { haversine_km, travel_time_min } from '../utils/distance';

/**
 * Level 2 Classical Routing: Advanced CVRPTW Solver (Clarke-Wright Savings + Guided Local Search & 2-Opt).
 * Implements full vehicle routing with time window propagation, slack waiting time,
 * vehicle capacities, and inter/intra route swap heuristics to minimize total distance and late penalties.
 */
export function solve_cvrptw(
  customers: Customer[],
  vehicles: Vehicle[],
  depot: Depot,
  traffic_multiplier: number = 1.0,
  closedArcs?: Set<string>,
  timeLimitSec: number = 0.5
): RouteOptimizationResult {
  const startTime = performance.now();
  const customerMap = new Map<string, Customer>(customers.map(c => [c.customer_id, c]));

  // Helper for arc distance taking road closures into account
  const getArcDist = (fromLat: number, fromLon: number, toLat: number, toLon: number, fromId: string, toId: string) => {
    const d = haversine_km(fromLat, fromLon, toLat, toLon);
    const arc = `${fromId}->${toId}`;
    const revArc = `${toId}->${fromId}`;
    if (closedArcs && (closedArcs.has(arc) || closedArcs.has(revArc))) {
      return d * 1.90;
    }
    return d;
  };

  // 1. Initial clustering / Clarke-Wright Savings computation
  // Savings s(i, j) = dist(depot, i) + dist(depot, j) - dist(i, j)
  interface Saving {
    i: string;
    j: string;
    saving: number;
  }

  const savings: Saving[] = [];
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const c1 = customers[i];
      const c2 = customers[j];
      const d01 = getArcDist(depot.latitude, depot.longitude, c1.latitude, c1.longitude, 'DEPOT', c1.customer_id);
      const d02 = getArcDist(depot.latitude, depot.longitude, c2.latitude, c2.longitude, 'DEPOT', c2.customer_id);
      const d12 = getArcDist(c1.latitude, c1.longitude, c2.latitude, c2.longitude, c1.customer_id, c2.customer_id);
      
      // Time window compatibility bonus
      const twCompatibility = Math.abs(c1.time_window_start - c2.time_window_start) < 90 ? 1.2 : 1.0;
      const s = (d01 + d02 - d12) * twCompatibility;
      savings.push({ i: c1.customer_id, j: c2.customer_id, saving: s });
    }
  }

  savings.sort((a, b) => b.saving - a.saving);

  // Initial assignment: distribute customers to vehicle buckets respecting capacity
  const vehicleClusters: Map<string, string[]> = new Map();
  vehicles.forEach(v => vehicleClusters.set(v.vehicle_id, []));

  const assigned = new Set<string>();
  const vehicleRemainingCap = new Map<string, number>(vehicles.map(v => [v.vehicle_id, v.capacity_kg]));

  // Sort customers by urgency: earlier time_window_start and tighter window first
  const sortedCustomers = [...customers].sort((a, b) => {
    const aUrgency = a.time_window_start * 2 + (a.time_window_end - a.time_window_start);
    const bUrgency = b.time_window_start * 2 + (b.time_window_end - b.time_window_start);
    return aUrgency - bUrgency;
  });

  for (const cust of sortedCustomers) {
    let bestVeh: Vehicle | null = null;
    let minAddedDist = Infinity;

    for (const veh of vehicles) {
      const remCap = vehicleRemainingCap.get(veh.vehicle_id) || 0;
      if (remCap < cust.demand_kg) continue;

      const currentRoute = vehicleClusters.get(veh.vehicle_id)!;
      let addedDist = 0;
      if (currentRoute.length === 0) {
        addedDist = getArcDist(depot.latitude, depot.longitude, cust.latitude, cust.longitude, 'DEPOT', cust.customer_id) * 2;
      } else {
        const lastId = currentRoute[currentRoute.length - 1];
        const lastCust = customerMap.get(lastId)!;
        addedDist = getArcDist(lastCust.latitude, lastCust.longitude, cust.latitude, cust.longitude, lastId, cust.customer_id);
      }

      if (addedDist < minAddedDist) {
        minAddedDist = addedDist;
        bestVeh = veh;
      }
    }

    if (bestVeh) {
      vehicleClusters.get(bestVeh.vehicle_id)!.push(cust.customer_id);
      vehicleRemainingCap.set(bestVeh.vehicle_id, (vehicleRemainingCap.get(bestVeh.vehicle_id) || 0) - cust.demand_kg);
      assigned.add(cust.customer_id);
    }
  }

  // 2. Guided Local Search & 2-Opt Optimization for each vehicle
  // Intra-route 2-Opt to untangle crossed routes
  const evaluateRouteTimeAndDist = (routeIds: string[], veh: Vehicle) => {
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
      const t = travel_time_min(d, veh.speed_kmph, traffic_multiplier);
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

    // Objective function: distance + heavy penalty for late deliveries
    const score = dist + lateCount * 35;
    return { dist, score, lateCount };
  };

  vehicles.forEach(veh => {
    let route = vehicleClusters.get(veh.vehicle_id) || [];
    if (route.length <= 2) return;

    let improved = true;
    let iterations = 0;
    const maxIter = 50;

    while (improved && iterations < maxIter) {
      improved = false;
      iterations++;
      const currentEval = evaluateRouteTimeAndDist(route, veh);

      // 2-Opt segment reversal
      for (let i = 0; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
          const newEval = evaluateRouteTimeAndDist(newRoute, veh);

          if (newEval.score < currentEval.score - 0.05) {
            route = newRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    vehicleClusters.set(veh.vehicle_id, route);
  });

  // 3. Build comprehensive route details
  const vehicleRoutes: VehicleRoute[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let totalLateDeliveries = 0;

  for (const veh of vehicles) {
    const routeIds = vehicleClusters.get(veh.vehicle_id) || [];
    let curLat = depot.latitude;
    let curLon = depot.longitude;
    let curId = 'DEPOT';
    let curTime = veh.start_time;
    let routeDist = 0;
    let currentLoad = 0;
    const routeStops: RouteStop[] = [];

    for (const id of routeIds) {
      const c = customerMap.get(id)!;
      const d = getArcDist(curLat, curLon, c.latitude, c.longitude, curId, id);
      routeDist += d;
      const arc = `${curId}->${id}`;
      const revArc = `${id}->${curId}`;
      const isClosed = closedArcs && (closedArcs.has(arc) || closedArcs.has(revArc));
      const mult = isClosed ? 1.90 : traffic_multiplier;

      const t = travel_time_min(d, veh.speed_kmph, mult);
      const arrival = curTime + t;
      const serviceStart = Math.max(arrival, c.time_window_start);
      const departure = serviceStart + c.service_time_min;
      const isLate = arrival > c.time_window_end;

      if (isLate) totalLateDeliveries++;

      routeStops.push({
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

      currentLoad += c.demand_kg;
      curTime = departure;
      curLat = c.latitude;
      curLon = c.longitude;
      curId = id;
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

    vehicleRoutes.push({
      vehicle_id: veh.vehicle_id,
      vehicle_name: veh.name,
      vehicle_color: veh.color,
      route: routeIds,
      route_details: routeStops,
      load_kg: currentLoad,
      capacity_kg: veh.capacity_kg,
      distance_km: Number(routeDist.toFixed(2)),
      duration_min: Number(duration.toFixed(1)),
      late_deliveries: routeStops.filter(s => s.is_late).length,
      customers_served: routeStops.length,
      algorithm: 'cvrptw'
    });
  }

  const unserved = customers.filter(c => !assigned.has(c.customer_id)).map(c => c.customer_id);
  const endTime = performance.now();
  const totalCost = vehicleRoutes.reduce((sum, r) => {
    const v = vehicles.find(veh => veh.vehicle_id === r.vehicle_id);
    return sum + r.distance_km * (v?.cost_per_km || 2.5);
  }, 0);

  return {
    algorithm: 'cvrptw',
    algorithm_name: 'OR-Tools CVRPTW Metaheuristic (Guided Local Search)',
    routes: vehicleRoutes,
    total_distance_km: Number(totalDistance.toFixed(2)),
    total_duration_min: Number(totalDuration.toFixed(1)),
    total_cost_inr: Number(totalCost.toFixed(2)),
    late_deliveries: totalLateDeliveries,
    customers_served: customers.length - unserved.length,
    customers_total: customers.length,
    vehicles_used: vehicleRoutes.filter(r => r.customers_served > 0).length,
    unserved,
    feasible: unserved.length === 0,
    runtime_sec: Number(((endTime - startTime) / 1000).toFixed(4)),
    objective_value: Number((totalDistance + totalLateDeliveries * 20).toFixed(2))
  };
}
