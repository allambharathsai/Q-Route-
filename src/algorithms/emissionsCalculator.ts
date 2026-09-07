import { EmissionsComparison, EmissionsResult, RouteOptimizationResult, Vehicle } from '../types';

export class EmissionsCalculator {
  public static readonly CO2_PER_LITRE_KG = 2.31; // IPCC Standard for petrol/diesel combustion

  public static calculateRouteEmissions(
    result: RouteOptimizationResult,
    vehicles: Vehicle[]
  ): EmissionsResult {
    const vehicleMap = new Map(vehicles.map(v => [v.vehicle_id, v]));
    let totalFuel = 0;
    let totalCo2 = 0;
    let totalCost = 0;
    let totalDist = 0;

    const perVehicle = result.routes.map(r => {
      const v = vehicleMap.get(r.vehicle_id) || vehicles[0];
      const dist = r.distance_km;
      const fuel = Number((dist * v.fuel_rate).toFixed(3));
      const co2 = Number((fuel * this.CO2_PER_LITRE_KG).toFixed(3));
      const cost = Number((dist * v.cost_per_km).toFixed(2));

      totalFuel += fuel;
      totalCo2 += co2;
      totalCost += cost;
      totalDist += dist;

      return {
        vehicle_id: r.vehicle_id,
        vehicle_name: r.vehicle_name,
        distance_km: dist,
        fuel_L: fuel,
        co2_kg: co2,
        cost_inr: cost
      };
    });

    return {
      fuel_consumed_L: Number(totalFuel.toFixed(2)),
      co2_kg: Number(totalCo2.toFixed(2)),
      cost_inr: Number(totalCost.toFixed(2)),
      distance_km: Number(totalDist.toFixed(2)),
      per_vehicle: perVehicle
    };
  }

  public static compareAll(
    nnResult: RouteOptimizationResult,
    ortoolsResult: RouteOptimizationResult,
    qaoaResult: RouteOptimizationResult,
    vehicles: Vehicle[]
  ): EmissionsComparison {
    const nnEmissions = this.calculateRouteEmissions(nnResult, vehicles);
    const ortoolsEmissions = this.calculateRouteEmissions(ortoolsResult, vehicles);
    const qaoaEmissions = this.calculateRouteEmissions(qaoaResult, vehicles);

    const fuelSavedOrtools = nnEmissions.fuel_consumed_L > 0
      ? ((nnEmissions.fuel_consumed_L - ortoolsEmissions.fuel_consumed_L) / nnEmissions.fuel_consumed_L) * 100
      : 0;

    const co2SavedOrtools = nnEmissions.co2_kg > 0
      ? ((nnEmissions.co2_kg - ortoolsEmissions.co2_kg) / nnEmissions.co2_kg) * 100
      : 0;

    const fuelSavedQaoa = nnEmissions.fuel_consumed_L > 0
      ? ((nnEmissions.fuel_consumed_L - qaoaEmissions.fuel_consumed_L) / nnEmissions.fuel_consumed_L) * 100
      : 0;

    const co2SavedQaoa = nnEmissions.co2_kg > 0
      ? ((nnEmissions.co2_kg - qaoaEmissions.co2_kg) / nnEmissions.co2_kg) * 100
      : 0;

    return {
      baseline_nn: nnEmissions,
      ortools: ortoolsEmissions,
      qaoa_hybrid: qaoaEmissions,
      fuel_saved_ortools_pct: Number(fuelSavedOrtools.toFixed(1)),
      co2_saved_ortools_pct: Number(co2SavedOrtools.toFixed(1)),
      fuel_saved_qaoa_pct: Number(fuelSavedQaoa.toFixed(1)),
      co2_saved_qaoa_pct: Number(co2SavedQaoa.toFixed(1)),
      assumptions: {
        co2_per_litre_kg: this.CO2_PER_LITRE_KG,
        fuel_rate_van_alpha: 0.12,
        fuel_rate_van_beta: 0.10,
        fuel_rate_van_gamma: 0.15,
        base_speed_kmph: 40.0,
        disclaimer: 'Estimated metrics based on IPCC 2006 Guidelines for National Greenhouse Gas Inventories (2.31 kg CO2/L petrol). Actual emissions depend on vehicle maintenance, topography, payload, and driving cycles.'
      }
    };
  }
}
