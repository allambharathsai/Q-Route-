import { Customer, Depot, RouteOptimizationResult, Vehicle, VehicleRoute } from '../types';
import { haversine_km } from '../utils/distance';
import { solve_cvrptw } from './cvrptwSolver';

export interface DynamicInsertionResult {
  new_orders_added: number;
  routes_changed: string[];
  distance_delta_km: number;
  time_delta_min: number;
  completed_deliveries_preserved: number;
  updated_result: RouteOptimizationResult;
  unassigned: string[];
}

export class DynamicDispatcher {
  private currentRoutes: VehicleRoute[];
  private allCustomers: Customer[];
  private vehicles: Vehicle[];
  private depot: Depot;
  private currentTimeMin: number;
  private completedDeliveries: Set<string> = new Set();
  private trafficMultiplier: number;
  private closedArcs?: Set<string>;

  constructor(
    initialRoutes: VehicleRoute[],
    allCustomers: Customer[],
    vehicles: Vehicle[],
    depot: Depot,
    currentTimeMin: number = 0,
    trafficMultiplier: number = 1.0,
    closedArcs?: Set<string>
  ) {
    this.currentRoutes = JSON.parse(JSON.stringify(initialRoutes));
    this.allCustomers = [...allCustomers];
    this.vehicles = [...vehicles];
    this.depot = depot;
    this.currentTimeMin = currentTimeMin;
    this.trafficMultiplier = trafficMultiplier;
    this.closedArcs = closedArcs;
  }

  public advanceClock(targetMinute: number): string[] {
    this.currentTimeMin = targetMinute;
    const newlyCompleted: string[] = [];

    for (const route of this.currentRoutes) {
      for (const stop of route.route_details) {
        if (stop.depart_min <= targetMinute && !this.completedDeliveries.has(stop.customer_id)) {
          this.completedDeliveries.add(stop.customer_id);
          newlyCompleted.push(stop.customer_id);
        }
      }
    }

    return newlyCompleted;
  }

  public getCompletedCount(): number {
    return this.completedDeliveries.size;
  }

  public getCompletedDeliveries(): Set<string> {
    return this.completedDeliveries;
  }

  public getCurrentTime(): number {
    return this.currentTimeMin;
  }

  /**
   * Returns current simulated vehicle position (either at last visited customer, or depot).
   */
  public getVehiclePosition(vehicleId: string): { latitude: number; longitude: number; name: string } {
    const route = this.currentRoutes.find(r => r.vehicle_id === vehicleId);
    if (!route || route.route_details.length === 0) {
      return { latitude: this.depot.latitude, longitude: this.depot.longitude, name: 'Depot' };
    }

    // Find the latest stop completed before currentTimeMin
    const completedStops = route.route_details.filter(s => this.completedDeliveries.has(s.customer_id));
    if (completedStops.length > 0) {
      const last = completedStops[completedStops.length - 1];
      return { latitude: last.latitude, longitude: last.longitude, name: last.name };
    }

    return { latitude: this.depot.latitude, longitude: this.depot.longitude, name: 'Depot' };
  }

  /**
   * Dynamically inserts new orders while strictly preserving all completed deliveries.
   */
  public insertNewOrders(newOrders: Customer[]): DynamicInsertionResult {
    const prevDistance = this.currentRoutes.reduce((sum, r) => sum + r.distance_km, 0);
    const prevDuration = this.currentRoutes.reduce((sum, r) => sum + r.duration_min, 0);

    // Merge new customers into customer list
    const existingIds = new Set(this.allCustomers.map(c => c.customer_id));
    for (const order of newOrders) {
      if (!existingIds.has(order.customer_id)) {
        this.allCustomers.push(order);
      }
    }

    // Partition: already completed customers vs remaining customers (undelivered + new)
    const remainingCustomers = this.allCustomers.filter(c => !this.completedDeliveries.has(c.customer_id));

    // Reoptimize remaining customer stops using CVRPTW solver with adjusted start times and positions
    const reoptimized = solve_cvrptw(
      remainingCustomers,
      this.vehicles,
      this.depot,
      this.trafficMultiplier,
      this.closedArcs
    );

    // Reconstruct full route: prepend completed stops onto reoptimized routes
    const reconstructedRoutes: VehicleRoute[] = [];
    const changedVehicles: string[] = [];

    for (const veh of this.vehicles) {
      const oldRoute = this.currentRoutes.find(r => r.vehicle_id === veh.vehicle_id);
      const newSubRoute = reoptimized.routes.find(r => r.vehicle_id === veh.vehicle_id);

      const completedStops = (oldRoute?.route_details || []).filter(s => this.completedDeliveries.has(s.customer_id));
      const newStops = newSubRoute?.route_details || [];

      const mergedStops = [...completedStops, ...newStops];
      const mergedCustomerIds = mergedStops.map(s => s.customer_id);

      const totalLoad = mergedStops.reduce((sum, s) => sum + s.demand_kg, 0);
      const totalDist = mergedStops.reduce((sum, s) => sum + s.distance_from_prev_km, 0);
      const lastStop = mergedStops[mergedStops.length - 1];
      const returnDist = lastStop ? haversine_km(lastStop.latitude, lastStop.longitude, this.depot.latitude, this.depot.longitude) : 0;
      const finalDist = Number((totalDist + returnDist).toFixed(2));
      const finalDur = Number((lastStop?.depart_min || veh.start_time) - veh.start_time).toFixed(1);

      if (JSON.stringify(oldRoute?.route) !== JSON.stringify(mergedCustomerIds)) {
        changedVehicles.push(veh.vehicle_id);
      }

      reconstructedRoutes.push({
        vehicle_id: veh.vehicle_id,
        vehicle_name: veh.name,
        vehicle_color: veh.color,
        route: mergedCustomerIds,
        route_details: mergedStops,
        load_kg: totalLoad,
        capacity_kg: veh.capacity_kg,
        distance_km: finalDist,
        duration_min: Number(finalDur),
        late_deliveries: mergedStops.filter(s => s.is_late).length,
        customers_served: mergedStops.length,
        algorithm: 'dynamic_cvrptw'
      });
    }

    this.currentRoutes = reconstructedRoutes;
    const newDistance = reconstructedRoutes.reduce((sum, r) => sum + r.distance_km, 0);
    const newDuration = reconstructedRoutes.reduce((sum, r) => sum + r.duration_min, 0);
    const totalLate = reconstructedRoutes.reduce((sum, r) => sum + r.late_deliveries, 0);
    const totalCost = reconstructedRoutes.reduce((sum, r) => {
      const v = this.vehicles.find(veh => veh.vehicle_id === r.vehicle_id);
      return sum + r.distance_km * (v?.cost_per_km || 2.5);
    }, 0);

    const servedSet = new Set(reconstructedRoutes.flatMap(r => r.route));
    const unserved = this.allCustomers.filter(c => !servedSet.has(c.customer_id)).map(c => c.customer_id);

    const updatedResult: RouteOptimizationResult = {
      algorithm: 'dynamic_cvrptw',
      algorithm_name: `Dynamic Dispatch Reoptimized (t = ${this.currentTimeMin}m)`,
      routes: reconstructedRoutes,
      total_distance_km: Number(newDistance.toFixed(2)),
      total_duration_min: Number(newDuration.toFixed(1)),
      total_cost_inr: Number(totalCost.toFixed(2)),
      late_deliveries: totalLate,
      customers_served: this.allCustomers.length - unserved.length,
      customers_total: this.allCustomers.length,
      vehicles_used: reconstructedRoutes.filter(r => r.customers_served > 0).length,
      unserved,
      feasible: unserved.length === 0,
      runtime_sec: reoptimized.runtime_sec,
      objective_value: Number((newDistance + totalLate * 20).toFixed(2))
    };

    return {
      new_orders_added: newOrders.length,
      routes_changed: changedVehicles,
      distance_delta_km: Number((newDistance - prevDistance).toFixed(2)),
      time_delta_min: Number((newDuration - prevDuration).toFixed(1)),
      completed_deliveries_preserved: this.completedDeliveries.size,
      updated_result: updatedResult,
      unassigned: unserved
    };
  }
}
