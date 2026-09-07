import { Customer, Depot, RepairResult, ValidationResult, Vehicle } from '../types';
import { haversine_km, travel_time_min } from '../utils/distance';

export class RouteValidator {
  static validate(
    route: string[],
    subproblemCustomers: Customer[],
    vehicle: Vehicle,
    depot: Depot,
    traffic_multiplier: number = 1.0
  ): ValidationResult {
    const customerMap = new Map(subproblemCustomers.map(c => [c.customer_id, c]));
    const violations: string[] = [];
    
    // 1. Check duplicate customer IDs
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of route) {
      if (seen.has(id)) {
        duplicates.push(id);
      } else {
        seen.add(id);
      }
    }
    const no_duplicates = duplicates.length === 0;
    if (!no_duplicates) {
      violations.push(`Duplicate customer assignments detected: ${duplicates.join(', ')}`);
    }

    // 2. Check missing subproblem customers
    const missing: string[] = [];
    for (const c of subproblemCustomers) {
      if (!seen.has(c.customer_id)) {
        missing.push(c.customer_id);
      }
    }
    const no_missing = missing.length === 0;
    if (!no_missing) {
      violations.push(`Missing customers from target set: ${missing.join(', ')}`);
    }

    // 3. Capacity check
    let totalDemand = 0;
    for (const id of route) {
      const c = customerMap.get(id);
      if (c) totalDemand += c.demand_kg;
    }
    const capacity_ok = totalDemand <= vehicle.capacity_kg;
    if (!capacity_ok) {
      violations.push(`Vehicle capacity exceeded: ${totalDemand} kg > ${vehicle.capacity_kg} kg`);
    }

    // 4. Time windows & Depot bounds
    let currentTime = vehicle.start_time;
    let curLat = depot.latitude;
    let curLon = depot.longitude;
    let lateDeliveries = 0;

    for (const id of route) {
      const c = customerMap.get(id);
      if (!c) continue;
      const d = haversine_km(curLat, curLon, c.latitude, c.longitude);
      const t = travel_time_min(d, vehicle.speed_kmph, traffic_multiplier);
      const arrival = currentTime + t;
      if (arrival > c.time_window_end) {
        lateDeliveries++;
      }
      const serviceStart = Math.max(arrival, c.time_window_start);
      currentTime = serviceStart + c.service_time_min;
      curLat = c.latitude;
      curLon = c.longitude;
    }

    // Return to depot check
    const returnDist = haversine_km(curLat, curLon, depot.latitude, depot.longitude);
    const returnTime = travel_time_min(returnDist, vehicle.speed_kmph, traffic_multiplier);
    currentTime += returnTime;
    const depot_constraints = currentTime <= vehicle.end_time;
    if (!depot_constraints) {
      violations.push(`Route completion time (${currentTime.toFixed(1)}m) exceeds shift limit (${vehicle.end_time}m)`);
    }

    const time_windows_ok = lateDeliveries === 0;
    if (!time_windows_ok) {
      violations.push(`${lateDeliveries} delivery(ies) projected outside customer time windows`);
    }

    const all_served = route.every(id => customerMap.has(id));
    const is_valid = no_duplicates && no_missing && capacity_ok && depot_constraints && all_served;

    return {
      is_valid,
      checks: {
        all_served,
        no_duplicates,
        no_missing,
        capacity_ok,
        time_windows_ok,
        depot_constraints
      },
      violations,
      duplicate_ids: duplicates,
      missing_ids: missing,
      total_demand: totalDemand,
      capacity_available: vehicle.capacity_kg - totalDemand,
      late_deliveries: lateDeliveries,
      repair_needed: !is_valid || lateDeliveries > 0
    };
  }
}

export class RouteRepairer {
  static repair(
    rawRoute: string[],
    validation: ValidationResult,
    subproblemCustomers: Customer[],
    vehicle: Vehicle,
    depot: Depot,
    traffic_multiplier: number = 1.0
  ): RepairResult {
    const startTime = performance.now();
    const customerMap = new Map(subproblemCustomers.map(c => [c.customer_id, c]));
    const operations: string[] = [];
    let route = [...rawRoute];

    const calcDist = (r: string[]) => {
      let d = 0;
      let curLat = depot.latitude;
      let curLon = depot.longitude;
      for (const id of r) {
        const c = customerMap.get(id);
        if (!c) continue;
        d += haversine_km(curLat, curLon, c.latitude, c.longitude);
        curLat = c.latitude;
        curLon = c.longitude;
      }
      d += haversine_km(curLat, curLon, depot.latitude, depot.longitude);
      return d;
    };

    const distBefore = calcDist(route);

    // Strategy 1: Remove duplicates
    if (!validation.checks.no_duplicates) {
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const id of route) {
        if (!seen.has(id) && customerMap.has(id)) {
          seen.add(id);
          deduped.push(id);
        }
      }
      operations.push(`Removed duplicate IDs: ${validation.duplicate_ids.join(', ')}`);
      route = deduped;
    }

    // Strategy 2: Insert missing customers via Cheapest Insertion
    if (!validation.checks.no_missing) {
      const currentInRoute = new Set(route);
      const missingCustomers = subproblemCustomers.filter(c => !currentInRoute.has(c.customer_id));

      for (const missing of missingCustomers) {
        let bestPos = 0;
        let minIncrease = Infinity;

        for (let i = 0; i <= route.length; i++) {
          const testRoute = [...route.slice(0, i), missing.customer_id, ...route.slice(i)];
          const testDist = calcDist(testRoute);
          if (testDist < minIncrease) {
            minIncrease = testDist;
            bestPos = i;
          }
        }

        route.splice(bestPos, 0, missing.customer_id);
        operations.push(`Inserted missing ${missing.customer_id} (${missing.name}) at position ${bestPos}`);
      }
    }

    // Strategy 3: Fix capacity overflow by shedding lowest priority customers
    const customersRemoved: string[] = [];
    let currentDemand = route.reduce((acc, id) => acc + (customerMap.get(id)?.demand_kg || 0), 0);
    if (currentDemand > vehicle.capacity_kg) {
      // Sort in-route customers by priority (LOW first, then smallest demand)
      const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      while (currentDemand > vehicle.capacity_kg && route.length > 0) {
        let lowestIdx = -1;
        let lowestPriorityVal = Infinity;
        for (let i = 0; i < route.length; i++) {
          const c = customerMap.get(route[i]);
          if (!c) continue;
          const pVal = priorityOrder[c.priority];
          if (pVal < lowestPriorityVal) {
            lowestPriorityVal = pVal;
            lowestIdx = i;
          }
        }
        if (lowestIdx >= 0) {
          const removedId = route.splice(lowestIdx, 1)[0];
          customersRemoved.push(removedId);
          currentDemand -= customerMap.get(removedId)?.demand_kg || 0;
          operations.push(`Shed ${removedId} to satisfy vehicle capacity constraint (${vehicle.capacity_kg}kg)`);
        } else {
          break;
        }
      }
    }

    // Strategy 4: 2-Opt local search refinement
    if (route.length >= 3) {
      let improved = true;
      let iters = 0;
      while (improved && iters < 20) {
        improved = false;
        iters++;
        const curD = calcDist(route);
        for (let i = 0; i < route.length - 1; i++) {
          for (let j = i + 1; j < route.length; j++) {
            const candidate = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
            const candD = calcDist(candidate);
            if (candD < curD - 0.05) {
              route = candidate;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
      operations.push('Applied classical 2-Opt local search to untangle quantum permutation sequence');
    }

    const distAfter = calcDist(route);
    const finalVal = RouteValidator.validate(route, subproblemCustomers, vehicle, depot, traffic_multiplier);
    const endTime = performance.now();

    return {
      original_route: rawRoute,
      repaired_route: route,
      operations,
      original_valid: validation.is_valid,
      final_valid: finalVal.is_valid,
      distance_before: Number(distBefore.toFixed(2)),
      distance_after: Number(distAfter.toFixed(2)),
      customers_removed: customersRemoved,
      repair_time_sec: Number(((endTime - startTime) / 1000).toFixed(4))
    };
  }
}
