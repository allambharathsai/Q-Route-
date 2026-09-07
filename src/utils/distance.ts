import { Customer, Depot, LocationPoint } from '../types';

/**
 * Calculates Great-Circle distance using Haversine Formula between two coordinates in kilometers.
 * d = 2 * R * asin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
 * Where R = 6371.0088 km (Earth mean radius)
 */
export function haversine_km(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371.0088; // Earth's radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(4));
}

/**
 * Builds N x N pairwise distance matrix.
 * By standard convention, index 0 is ALWAYS the Depot.
 */
export function build_distance_matrix(depot: Depot, customers: Customer[]): number[][] {
  const allPoints: LocationPoint[] = [
    { latitude: depot.latitude, longitude: depot.longitude },
    ...customers.map(c => ({ latitude: c.latitude, longitude: c.longitude }))
  ];

  const n = allPoints.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = haversine_km(
          allPoints[i].latitude,
          allPoints[i].longitude,
          allPoints[j].latitude,
          allPoints[j].longitude
        );
      }
    }
  }

  return matrix;
}

/**
 * Calculates travel time in minutes based on distance, vehicle speed, and traffic multiplier.
 * travel_time = (distance_km / speed_kmph) * 60 * traffic_multiplier
 */
export function travel_time_min(
  distance_km: number,
  speed_kmph: number = 40.0,
  traffic_multiplier: number = 1.0
): number {
  if (speed_kmph <= 0) return 0;
  const baseMinutes = (distance_km / speed_kmph) * 60;
  return Number((baseMinutes * traffic_multiplier).toFixed(2));
}

/**
 * Builds N x N pairwise travel time matrix.
 */
export function build_time_matrix(
  dist_matrix: number[][],
  speed_kmph: number = 40.0,
  traffic_multiplier: number = 1.0
): number[][] {
  return dist_matrix.map(row =>
    row.map(d => travel_time_min(d, speed_kmph, traffic_multiplier))
  );
}

/**
 * Formats minutes from 08:00 AM into human-readable HH:MM AM/PM string.
 * Example: 0 -> "08:00 AM", 135 -> "10:15 AM", 240 -> "12:00 PM"
 */
export function formatMinutesToTime(minutesFrom8AM: number): string {
  const totalMinutes = 8 * 60 + Math.round(minutesFrom8AM);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const displayHours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(displayHours)}:${pad(minutes)} ${period}`;
}
