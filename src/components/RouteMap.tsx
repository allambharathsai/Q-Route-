import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Customer, Depot, RoadClosure, Vehicle, VehicleRoute } from '../types';
import { formatMinutesToTime } from '../utils/distance';

interface RouteMapProps {
  depot: Depot;
  routes: VehicleRoute[];
  vehicles: Vehicle[];
  allCustomers: Customer[];
  activeClosures: RoadClosure[];
  simMinute: number;
  highlightVehicleId?: string | null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  depot,
  routes,
  vehicles,
  allCustomers,
  activeClosures,
  simMinute,
  highlightVehicleId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [depot.latitude, depot.longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // CartoDB Dark Matter / Positron Tiles for high-tech Logistics Command Center aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive during tab switches or cleanup on unmount
    };
  }, [depot]);

  // Update Markers, Polylines, and Layers whenever routes or closures change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. Depot Marker (Distinctive Golden Star / Warehouse Icon)
    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div style="
          width: 38px; height: 38px;
          background: #DC2626;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
          border-radius: 50%;
          display: flex; items-center; justify-content: center;
          color: white; font-weight: 800; font-size: 16px;
          line-height: 32px; text-align: center;
          cursor: pointer;
        ">
          ★
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20]
    });

    const depotMarker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon });
    depotMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase;">Central Depot</div>
        <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 2px 0;">${depot.name}</div>
        <div style="font-size: 12px; color: #475569;">${depot.address}, ${depot.city}</div>
        <div style="margin-top: 6px; font-size: 11px; background: #F1F5F9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
          Shift Hours: 08:00 AM – 04:00 PM (480 min)
        </div>
      </div>
    `);
    layers.addLayer(depotMarker);

    // 2. Active Road Closures Overlay
    activeClosures.forEach(closure => {
      if (closure.active) {
        const closureLine = L.polyline([closure.fromCoords, closure.toCoords], {
          color: '#DC2626',
          weight: 6,
          dashArray: '8, 8',
          opacity: 0.9
        });

        closureLine.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: #DC2626;">⚠ ROAD CLOSURE ACTIVE</div>
            <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin: 2px 0;">${closure.fromName} ↔ ${closure.toName}</div>
            <div style="font-size: 12px; color: #475569;">${closure.description}</div>
            <div style="font-size: 11px; color: #DC2626; margin-top: 4px; font-weight: 600;">Traffic Multiplier: +90% (1.90x delay)</div>
          </div>
        `);
        layers.addLayer(closureLine);
      }
    });

    // 3. Vehicle Routes & Customer Sequence Markers
    routes.forEach(route => {
      const isHighlighted = !highlightVehicleId || highlightVehicleId === route.vehicle_id;
      const opacity = isHighlighted ? 0.85 : 0.25;
      const weight = isHighlighted ? 4.5 : 2.5;

      const pathCoords: [number, number][] = [
        [depot.latitude, depot.longitude],
        ...route.route_details.map(s => [s.latitude, s.longitude] as [number, number]),
        [depot.latitude, depot.longitude]
      ];

      // Polyline for route
      const polyline = L.polyline(pathCoords, {
        color: route.vehicle_color,
        weight: weight,
        opacity: opacity,
        dashArray: route.algorithm === 'qaoa_hybrid' ? '6, 4' : undefined
      });

      polyline.bindTooltip(`${route.vehicle_name}: ${route.distance_km} km, ${route.duration_min} min`, {
        sticky: true
      });
      layers.addLayer(polyline);

      // Stop Markers
      route.route_details.forEach((stop, index) => {
        const seqNum = index + 1;
        const radius = Math.max(10, Math.min(22, 10 + stop.demand_kg * 0.25));
        const lateBorder = stop.is_late ? '3px solid #DC2626' : '2px solid #FFFFFF';
        const shadowColor = stop.is_late ? 'rgba(220, 38, 38, 0.5)' : 'rgba(0, 0, 0, 0.25)';

        const stopIcon = L.divIcon({
          className: `stop-marker-${stop.customer_id}`,
          html: `
            <div style="
              width: ${radius * 2}px; height: ${radius * 2}px;
              background: ${route.vehicle_color};
              border: ${lateBorder};
              box-shadow: 0 2px 8px ${shadowColor};
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 700; font-size: ${radius > 14 ? '12px' : '10px'};
              cursor: pointer;
              transform: translate(-${radius}px, -${radius}px);
            ">
              ${seqNum}
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [0, 0],
          popupAnchor: [0, -radius]
        });

        const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon });

        const statusBadge = stop.is_late
          ? '<span style="background: #FEE2E2; color: #DC2626; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">LATE DELIVERED</span>'
          : '<span style="background: #DCFCE7; color: #16A34A; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">ON TIME</span>';

        const priorityBadge = stop.priority === 'HIGH'
          ? '<span style="background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">HIGH PRIORITY</span>'
          : `<span style="background: #F1F5F9; color: #64748B; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">${stop.priority}</span>`;

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 800; color: ${route.vehicle_color};">Stop #${seqNum} • ${route.vehicle_name}</span>
              ${priorityBadge}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 2px 0;">${stop.name}</div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">${stop.customer_id} • ${stop.zone}</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F8FAFC; padding: 6px 8px; border-radius: 6px; font-size: 11px; margin-bottom: 6px;">
              <div><strong>Demand:</strong> ${stop.demand_kg} kg</div>
              <div><strong>Service:</strong> ${stop.service_time_min} min</div>
              <div><strong>Arrival ETA:</strong> ${formatMinutesToTime(stop.arrival_min)}</div>
              <div><strong>Time Window:</strong> ${formatMinutesToTime(stop.tw_start)} – ${formatMinutesToTime(stop.tw_end)}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #475569;">Leg Dist: ${stop.distance_from_prev_km} km</span>
              ${statusBadge}
            </div>
          </div>
        `);

        layers.addLayer(marker);
      });
    });
  }, [depot, routes, activeClosures, highlightVehicleId]);

  return (
    <div className="relative w-full h-[480px] lg:h-[580px] rounded-xl overflow-hidden border border-slate-800 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Overlay Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-xs shadow-lg text-slate-200">
        <div className="font-semibold text-slate-100 mb-1.5 flex items-center justify-between gap-4">
          <span>Fleet Map Legend</span>
          <span className="text-[10px] text-slate-400 font-mono">Vijayawada</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">★</span>
            <span className="text-slate-300">Central Depot (Governorpet)</span>
          </div>
          {vehicles.map(v => (
            <div key={v.vehicle_id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }}></span>
              <span className="text-slate-300">{v.name} ({v.capacity_kg}kg)</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-3 h-3 rounded-full border-2 border-rose-500 bg-slate-800"></span>
            <span className="text-rose-400 font-medium">Late Delivery (Time Window Breach)</span>
          </div>
          {activeClosures.some(c => c.active) && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-red-600 border-t border-dashed border-red-400"></span>
              <span className="text-red-400 font-bold">Active Road Blockage</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
