import { RoadClosure, TrafficLevel, VehicleRoute } from '../types';
import { TRAFFIC_MULTIPLIERS } from '../data/vijayawadaDataset';

export class TrafficEngine {
  private currentLevel: TrafficLevel = 'NORMAL';
  private closedArcs: Set<string> = new Set();
  private roadClosures: RoadClosure[] = [
    {
      id: 'closure_mg_road',
      fromName: 'MG Road Junction',
      toName: 'PVP Square',
      fromCoords: [16.5041, 80.6425],
      toCoords: [16.5008, 80.6505],
      trafficMultiplier: 1.90,
      description: 'Flyover maintenance & metro construction on MG Road stretch',
      active: false
    },
    {
      id: 'closure_benz_circle',
      fromName: 'Benz Circle',
      toName: 'Patamata Main Road',
      fromCoords: [16.4975, 80.6558],
      toCoords: [16.4912, 80.6681],
      trafficMultiplier: 1.90,
      description: 'Water pipeline emergency repair near Benz Circle signal',
      active: false
    }
  ];

  constructor(initialLevel: TrafficLevel = 'NORMAL') {
    this.currentLevel = initialLevel;
  }

  public setTrafficLevel(level: TrafficLevel): {
    prev: TrafficLevel;
    current: TrafficLevel;
    multiplier: number;
    description: string;
  } {
    const prev = this.currentLevel;
    this.currentLevel = level;
    const descriptions: Record<TrafficLevel, string> = {
      LOW: 'Early morning / low-density flow across Vijayawada corridors (-15% travel time)',
      NORMAL: 'Standard free-flow conditions along Bandar Road and Eluru Road',
      HIGH: 'Peak rush-hour congestion around Benz Circle, Governorpet, and Auto Nagar (+40% travel time)',
      SEVERE: 'Severe monsoon waterlogging & gridlock (+90% travel time across city)'
    };

    return {
      prev,
      current: level,
      multiplier: this.getMultiplier(),
      description: descriptions[level]
    };
  }

  public getTrafficLevel(): TrafficLevel {
    return this.currentLevel;
  }

  public getMultiplier(): number {
    return TRAFFIC_MULTIPLIERS[this.currentLevel] || 1.0;
  }

  public toggleRoadClosure(closureId: string): RoadClosure | undefined {
    const closure = this.roadClosures.find(r => r.id === closureId);
    if (!closure) return undefined;

    closure.active = !closure.active;
    const arcKey = `${closure.fromName}->${closure.toName}`;
    const revKey = `${closure.toName}->${closure.fromName}`;

    if (closure.active) {
      this.closedArcs.add(arcKey);
      this.closedArcs.add(revKey);
    } else {
      this.closedArcs.delete(arcKey);
      this.closedArcs.delete(revKey);
    }

    return closure;
  }

  public getRoadClosures(): RoadClosure[] {
    return this.roadClosures;
  }

  public getClosedArcs(): Set<string> {
    return this.closedArcs;
  }

  public findAffectedRoutes(routes: VehicleRoute[]): string[] {
    const affected: string[] = [];
    if (this.closedArcs.size === 0) return affected;

    for (const r of routes) {
      for (let i = 0; i < r.route_details.length - 1; i++) {
        const from = r.route_details[i].name;
        const to = r.route_details[i + 1].name;
        const arc = `${from}->${to}`;
        const rev = `${to}->${from}`;
        if (this.closedArcs.has(arc) || this.closedArcs.has(rev)) {
          affected.push(r.vehicle_id);
          break;
        }
      }
    }
    return affected;
  }
}
