import { Customer, Depot, Vehicle } from '../types';

export const DEPOT: Depot = {
  depot_id: 'DEPOT_VJA',
  name: 'Vijayawada Central Logistics Hub',
  address: 'Near Old Bus Stand, Governorpet',
  city: 'Vijayawada',
  state: 'Andhra Pradesh',
  latitude: 16.5062,
  longitude: 80.6480,
  operating_hours_start: 0,   // 08:00
  operating_hours_end: 480,   // 16:00
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    customer_id: 'C001',
    name: 'Andhra Hospital Super Specialty',
    latitude: 16.5124,
    longitude: 80.6512,
    demand_kg: 28,
    time_window_start: 30,
    time_window_end: 150, // MORNING - TIGHT
    service_time_min: 15,
    priority: 'HIGH',
    zone: 'Governorpet',
    type: 'hospital'
  },
  {
    customer_id: 'C002',
    name: 'Apollo Pharmacy MG Road',
    latitude: 16.5041,
    longitude: 80.6425,
    demand_kg: 12,
    time_window_start: 60,
    time_window_end: 240, // NORMAL
    service_time_min: 10,
    priority: 'HIGH',
    zone: 'MG Road',
    type: 'pharmacy'
  },
  {
    customer_id: 'C003',
    name: 'Benz Circle Retail Mall',
    latitude: 16.4975,
    longitude: 80.6558,
    demand_kg: 42,
    time_window_start: 90,
    time_window_end: 180, // TIGHT
    service_time_min: 20,
    priority: 'HIGH',
    zone: 'Benz Circle',
    type: 'retail'
  },
  {
    customer_id: 'C004',
    name: 'Siddhartha Medical Diagnostic',
    latitude: 16.5011,
    longitude: 80.6592,
    demand_kg: 18,
    time_window_start: 45,
    time_window_end: 160, // MORNING
    service_time_min: 12,
    priority: 'HIGH',
    zone: 'Moghalrajpuram',
    type: 'hospital'
  },
  {
    customer_id: 'C005',
    name: 'Patamata Tech Hub & Offices',
    latitude: 16.4912,
    longitude: 80.6681,
    demand_kg: 35,
    time_window_start: 90,
    time_window_end: 180, // TIGHT
    service_time_min: 15,
    priority: 'HIGH',
    zone: 'Patamata',
    type: 'vip'
  },
  {
    customer_id: 'C006',
    name: 'Labbipet Multi-Specialty Clinic',
    latitude: 16.5034,
    longitude: 80.6472,
    demand_kg: 22,
    time_window_start: 30,
    time_window_end: 120, // TIGHT MORNING
    service_time_min: 14,
    priority: 'HIGH',
    zone: 'Labbipet',
    type: 'hospital'
  },
  {
    customer_id: 'C007',
    name: 'Auto Nagar Industrial Spares Depot',
    latitude: 16.4880,
    longitude: 80.6795,
    demand_kg: 45,
    time_window_start: 120,
    time_window_end: 360, // NORMAL
    service_time_min: 18,
    priority: 'MEDIUM',
    zone: 'Auto Nagar',
    type: 'retail'
  },
  {
    customer_id: 'C008',
    name: 'Suryaraopet Fresh Mart',
    latitude: 16.5152,
    longitude: 80.6418,
    demand_kg: 24,
    time_window_start: 60,
    time_window_end: 300, // NORMAL
    service_time_min: 10,
    priority: 'MEDIUM',
    zone: 'Suryaraopet',
    type: 'retail'
  },
  {
    customer_id: 'C009',
    name: 'PVP Square Shopping Complex',
    latitude: 16.5008,
    longitude: 80.6505,
    demand_kg: 30,
    time_window_start: 120,
    time_window_end: 300, // NORMAL
    service_time_min: 15,
    priority: 'MEDIUM',
    zone: 'MG Road',
    type: 'retail'
  },
  {
    customer_id: 'C010',
    name: 'Moghalrajpuram Electronics Hub',
    latitude: 16.5085,
    longitude: 80.6610,
    demand_kg: 16,
    time_window_start: 150,
    time_window_end: 360, // NORMAL
    service_time_min: 12,
    priority: 'MEDIUM',
    zone: 'Moghalrajpuram',
    type: 'retail'
  },
  {
    customer_id: 'C011',
    name: 'Governorpet Hardware Wholesale',
    latitude: 16.5110,
    longitude: 80.6450,
    demand_kg: 38,
    time_window_start: 60,
    time_window_end: 330, // NORMAL
    service_time_min: 15,
    priority: 'MEDIUM',
    zone: 'Governorpet',
    type: 'retail'
  },
  {
    customer_id: 'C012',
    name: 'Patamata High Street Bakery',
    latitude: 16.4940,
    longitude: 80.6640,
    demand_kg: 14,
    time_window_start: 0,
    time_window_end: 240, // MORNING
    service_time_min: 8,
    priority: 'MEDIUM',
    zone: 'Patamata',
    type: 'retail'
  },
  {
    customer_id: 'C013',
    name: 'Benz Circle Organic Foods',
    latitude: 16.4990,
    longitude: 80.6575,
    demand_kg: 19,
    time_window_start: 90,
    time_window_end: 210, // TIGHT
    service_time_min: 10,
    priority: 'MEDIUM',
    zone: 'Benz Circle',
    type: 'retail'
  },
  {
    customer_id: 'C014',
    name: 'Suryaraopet Residential Society A',
    latitude: 16.5180,
    longitude: 80.6435,
    demand_kg: 8,
    time_window_start: 0,
    time_window_end: 480, // WIDE
    service_time_min: 5,
    priority: 'LOW',
    zone: 'Suryaraopet',
    type: 'residential'
  },
  {
    customer_id: 'C015',
    name: 'Auto Nagar Logistics Shed 4',
    latitude: 16.4855,
    longitude: 80.6830,
    demand_kg: 26,
    time_window_start: 240,
    time_window_end: 420, // AFTERNOON
    service_time_min: 15,
    priority: 'LOW',
    zone: 'Auto Nagar',
    type: 'retail'
  },
  {
    customer_id: 'C016',
    name: 'Labbipet Apartment Complex 12',
    latitude: 16.5050,
    longitude: 80.6440,
    demand_kg: 6,
    time_window_start: 0,
    time_window_end: 480, // WIDE
    service_time_min: 6,
    priority: 'LOW',
    zone: 'Labbipet',
    type: 'residential'
  },
  {
    customer_id: 'C017',
    name: 'Governorpet General Store',
    latitude: 16.5080,
    longitude: 80.6495,
    demand_kg: 15,
    time_window_start: 180,
    time_window_end: 420, // AFTERNOON
    service_time_min: 10,
    priority: 'LOW',
    zone: 'Governorpet',
    type: 'retail'
  },
  {
    customer_id: 'C018',
    name: 'Moghalrajpuram Sunset Villas',
    latitude: 16.5055,
    longitude: 80.6655,
    demand_kg: 9,
    time_window_start: 0,
    time_window_end: 480, // WIDE
    service_time_min: 7,
    priority: 'LOW',
    zone: 'Moghalrajpuram',
    type: 'residential'
  },
  {
    customer_id: 'C019',
    name: 'MG Road Stationery Emporium',
    latitude: 16.5020,
    longitude: 80.6460,
    demand_kg: 11,
    time_window_start: 210,
    time_window_end: 420, // AFTERNOON
    service_time_min: 8,
    priority: 'LOW',
    zone: 'MG Road',
    type: 'retail'
  },
  {
    customer_id: 'C020',
    name: 'Patamata Greenview Enclave',
    latitude: 16.4895,
    longitude: 80.6620,
    demand_kg: 7,
    time_window_start: 0,
    time_window_end: 480, // WIDE
    service_time_min: 5,
    priority: 'LOW',
    zone: 'Patamata',
    type: 'residential'
  }
];

export const DYNAMIC_ORDERS_BATCH_1: Customer[] = [
  {
    customer_id: 'C021',
    name: 'Manipal Hospital Emergency Supply',
    latitude: 16.4965,
    longitude: 80.6635,
    demand_kg: 15,
    time_window_start: 140,
    time_window_end: 220, // Rush delivery
    service_time_min: 10,
    priority: 'HIGH',
    zone: 'Patamata',
    type: 'hospital'
  },
  {
    customer_id: 'C022',
    name: 'Governorpet Express Books',
    latitude: 16.5098,
    longitude: 80.6470,
    demand_kg: 8,
    time_window_start: 150,
    time_window_end: 320,
    service_time_min: 6,
    priority: 'MEDIUM',
    zone: 'Governorpet',
    type: 'retail'
  },
  {
    customer_id: 'C023',
    name: 'Labbipet MedPlus Store',
    latitude: 16.5028,
    longitude: 80.6485,
    demand_kg: 12,
    time_window_start: 160,
    time_window_end: 280,
    service_time_min: 8,
    priority: 'HIGH',
    zone: 'Labbipet',
    type: 'pharmacy'
  },
  {
    customer_id: 'C024',
    name: 'Auto Nagar Packaging Materials',
    latitude: 16.4862,
    longitude: 80.6760,
    demand_kg: 20,
    time_window_start: 180,
    time_window_end: 360,
    service_time_min: 12,
    priority: 'LOW',
    zone: 'Auto Nagar',
    type: 'retail'
  },
  {
    customer_id: 'C025',
    name: 'Benz Circle Boutique Gifts',
    latitude: 16.4982,
    longitude: 80.6540,
    demand_kg: 6,
    time_window_start: 170,
    time_window_end: 300,
    service_time_min: 7,
    priority: 'MEDIUM',
    zone: 'Benz Circle',
    type: 'vip'
  }
];

export const DYNAMIC_ORDERS_BATCH_2: Customer[] = [
  {
    customer_id: 'C026',
    name: 'Suryaraopet Dental Care Kit',
    latitude: 16.5165,
    longitude: 80.6445,
    demand_kg: 9,
    time_window_start: 220,
    time_window_end: 340,
    service_time_min: 8,
    priority: 'MEDIUM',
    zone: 'Suryaraopet',
    type: 'pharmacy'
  },
  {
    customer_id: 'C027',
    name: 'Moghalrajpuram Artisan Bakery',
    latitude: 16.5040,
    longitude: 80.6628,
    demand_kg: 14,
    time_window_start: 230,
    time_window_end: 350,
    service_time_min: 9,
    priority: 'LOW',
    zone: 'Moghalrajpuram',
    type: 'retail'
  },
  {
    customer_id: 'C028',
    name: 'MG Road Electronics Quick Fix',
    latitude: 16.5030,
    longitude: 80.6440,
    demand_kg: 5,
    time_window_start: 240,
    time_window_end: 380,
    service_time_min: 6,
    priority: 'LOW',
    zone: 'MG Road',
    type: 'retail'
  }
];

export const VEHICLES: Vehicle[] = [
  {
    vehicle_id: 'V001',
    name: 'Van Alpha',
    capacity_kg: 150,
    start_time: 0,   // 08:00
    end_time: 480,   // 16:00
    cost_per_km: 2.50, // INR
    fuel_rate: 0.12,   // L/km
    speed_kmph: 40.0,
    color: '#2563EB'   // Royal Blue
  },
  {
    vehicle_id: 'V002',
    name: 'Van Beta',
    capacity_kg: 120,
    start_time: 0,   // 08:00
    end_time: 420,   // 15:00
    cost_per_km: 2.30, // INR
    fuel_rate: 0.10,   // L/km
    speed_kmph: 42.0,
    color: '#16A34A'   // Emerald Green
  },
  {
    vehicle_id: 'V003',
    name: 'Van Gamma',
    capacity_kg: 200,
    start_time: 60,  // 09:00
    end_time: 480,   // 16:00
    cost_per_km: 3.00, // INR
    fuel_rate: 0.15,   // L/km
    speed_kmph: 35.0,
    color: '#D97706'   // Amber Orange
  }
];

export const TRAFFIC_MULTIPLIERS = {
  LOW: 0.85,
  NORMAL: 1.00,
  HIGH: 1.40,
  SEVERE: 1.90
};
