import { Customer, Depot, RouteOptimizationResult, RouteStop, Vehicle, VehicleRoute } from '../types';
import { haversine_km, travel_time_min } from '../utils/distance';

/**
 * Level 1 Classical Routing: Nearest Neighbor Heuristic.
 * Greedily selects the closest feasible unvisited customer until capacity is exhausted
 * or time window bounds are reached, then returns to depot.
 */
export function solve_nearest_neighbor(
  customers: Customer[],
  vehicles: Vehicle[],
  depot: Depot,
  traffic_multiplier: number = 1.0,
  closedArcs?: Set<string>
): RouteOptimizationResult {
  const startTime = performance.now();
  const unvisited = new Set(customers.map(c => c.customer_id));
  const customerMap = new Map<string, Customer>(customers.map(c => [c.customer_id, c]));
  
  const vehicleRoutes: VehicleRoute[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let totalLateCount = 0;

  for (const vehicle of vehicles) {
    if (unvisited.size === 0) break;

    let currentLoad = 0;
    let currentTime = vehicle.start_time; // minutes from 08:00
    let currentLat = depot.latitude;
    let currentLon = depot.longitude;
    let currentId = depot.depot_id;

    const routeStops: RouteStop[] = [];
    const routeCustomerIds: string[] = [];
    let vehicleDistance = 0;

    while (unvisited.size > 0) {
      let bestCandidate: Customer | null = null;
      let minDistance = Infinity;

      for (const candId of unvisited) {
        const candidate = customerMap.get(candId)!;

        // Check capacity constraint
        if (currentLoad + candidate.demand_kg > vehicle.capacity_kg) {
          continue;
        }

        const dist = haversine_km(currentLat, currentLon, candidate.latitude, candidate.longitude);
        
        // Road closure check: penalty multiplier if arc is closed
        const arcKey = `${currentId}->${candidate.customer_id}`;
        const revArcKey = `${candidate.customer_id}->${currentId}`;
        const isClosed = closedArcs && (closedArcs.has(arcKey) || closedArcs.has(revArcKey));
        const effectiveDist = isClosed ? dist * 1.9 : dist;

        if (effectiveDist < minDistance) {
          minDistance = effectiveDist;
          bestCandidate = candidate;
        }
      }

      if (!bestCandidate) {
        // Vehicle cannot serve any more customers due to capacity
        break;
      }

      // Serve best candidate
      const dist = haversine_km(currentLat, currentLon, bestCandidate.latitude, bestCandidate.longitude);
      const arcKey = `${currentId}->${bestCandidate.customer_id}`;
      const revArcKey = `${bestCandidate.customer_id}->${currentId}`;
      const isClosed = closedArcs && (closedArcs.has(arcKey) || closedArcs.has(revArcKey));
      const mult = isClosed ? 1.90 : traffic_multiplier;

      const travelTime = travel_time_min(dist, vehicle.speed_kmph, mult);
      const arrivalTime = currentTime + travelTime;
      
      // Early arrival waiting: vehicle waits until customer's time window opens
      const serviceStartTime = Math.max(arrivalTime, bestCandidate.time_window_start);
      const departureTime = serviceStartTime + bestCandidate.service_time_min;
      const isLate = arrivalTime > bestCandidate.time_window_end;

      routeStops.push({
        customer_id: bestCandidate.customer_id,
        name: bestCandidate.name,
        latitude: bestCandidate.latitude,
        longitude: bestCandidate.longitude,
        demand_kg: bestCandidate.demand_kg,
        distance_from_prev_km: Number(dist.toFixed(2)),
        arrival_min: Number(arrivalTime.toFixed(1)),
        delivery_min: Number(serviceStartTime.toFixed(1)),
        depart_min: Number(departureTime.toFixed(1)),
        tw_start: bestCandidate.time_window_start,
        tw_end: bestCandidate.time_window_end,
        is_late: isLate,
        priority: bestCandidate.priority,
        zone: bestCandidate.zone,
        service_time_min: bestCandidate.service_time_min
      });

      routeCustomerIds.push(bestCandidate.customer_id);
      unvisited.delete(bestCandidate.customer_id);
      currentLoad += bestCandidate.demand_kg;
      vehicleDistance += dist;
      currentTime = departureTime;
      currentLat = bestCandidate.latitude;
      currentLon = bestCandidate.longitude;
      currentId = bestCandidate.customer_id;

      if (isLate) totalLateCount++;
    }

    // Return to depot
    if (routeStops.length > 0) {
      const returnDist = haversine_km(currentLat, currentLon, depot.latitude, depot.longitude);
      const returnTime = travel_time_min(returnDist, vehicle.speed_kmph, traffic_multiplier);
      vehicleDistance += returnDist;
      currentTime += returnTime;
    }

    const vehicleDuration = currentTime - vehicle.start_time;
    totalDistance += vehicleDistance;
    totalDuration += vehicleDuration;

    vehicleRoutes.push({
      vehicle_id: vehicle.vehicle_id,
      vehicle_name: vehicle.name,
      vehicle_color: vehicle.color,
      route: routeCustomerIds,
      route_details: routeStops,
      load_kg: currentLoad,
      capacity_kg: vehicle.capacity_kg,
      distance_km: Number(vehicleDistance.toFixed(2)),
      duration_min: Number(vehicleDuration.toFixed(1)),
      late_deliveries: routeStops.filter(s => s.is_late).length,
      customers_served: routeStops.length,
      algorithm: 'nearest_neighbor'
    });
  }

  const endTime = performance.now();
  const unserved = Array.from(unvisited);
  const totalCost = vehicleRoutes.reduce((sum, r) => {
    const v = vehicles.find(veh => veh.vehicle_id === r.vehicle_id);
    return sum + r.distance_km * (v?.cost_per_km || 2.5);
  }, 0);

  return {
    algorithm: 'nn',
    algorithm_name: 'Nearest Neighbor Baseline (Greedy)',
    routes: vehicleRoutes,
    total_distance_km: Number(totalDistance.toFixed(2)),
    total_duration_min: Number(totalDuration.toFixed(1)),
    total_cost_inr: Number(totalCost.toFixed(2)),
    late_deliveries: totalLateCount,
    customers_served: customers.length - unserved.length,
    customers_total: customers.length,
    vehicles_used: vehicleRoutes.filter(r => r.customers_served > 0).length,
    unserved,
    feasible: unserved.length === 0,
    runtime_sec: Number(((endTime - startTime) / 1000).toFixed(4)),
    objective_value: Number((totalDistance + totalLateCount * 15).toFixed(2))
  };
}
