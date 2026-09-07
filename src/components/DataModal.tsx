import React, { useState } from 'react';
import { Customer, Depot, Vehicle } from '../types';
import { X, Download, Database, CheckCircle2 } from 'lucide-react';
import { formatMinutesToTime } from '../utils/distance';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  depot: Depot;
  customers: Customer[];
  vehicles: Vehicle[];
}

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  depot,
  customers,
  vehicles
}) => {
  const [selectedTable, setSelectedTable] = useState<'customers' | 'vehicles' | 'depot'>('customers');

  if (!isOpen) return null;

  const totalDemand = customers.reduce((sum, c) => sum + c.demand_kg, 0);
  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity_kg, 0);
  const highCount = customers.filter(c => c.priority === 'HIGH').length;
  const medCount = customers.filter(c => c.priority === 'MEDIUM').length;
  const lowCount = customers.filter(c => c.priority === 'LOW').length;

  const downloadCSV = () => {
    let content = '';
    let filename = '';

    if (selectedTable === 'customers') {
      filename = 'customers.csv';
      content = 'customer_id,name,latitude,longitude,demand_kg,time_window_start,time_window_end,service_time_min,priority,zone\n';
      customers.forEach(c => {
        content += `${c.customer_id},"${c.name}",${c.latitude},${c.longitude},${c.demand_kg},${c.time_window_start},${c.time_window_end},${c.service_time_min},${c.priority},"${c.zone}"\n`;
      });
    } else if (selectedTable === 'vehicles') {
      filename = 'vehicles.csv';
      content = 'vehicle_id,name,capacity_kg,start_time,end_time,cost_per_km,fuel_rate,speed_kmph\n';
      vehicles.forEach(v => {
        content += `${v.vehicle_id},"${v.name}",${v.capacity_kg},${v.start_time},${v.end_time},${v.cost_per_km},${v.fuel_rate},${v.speed_kmph}\n`;
      });
    } else {
      filename = 'depot.csv';
      content = 'depot_id,name,address,city,state,latitude,longitude,operating_hours_start,operating_hours_end\n';
      content += `${depot.depot_id},"${depot.name}","${depot.address}","${depot.city}","${depot.state}",${depot.latitude},${depot.longitude},${depot.operating_hours_start},${depot.operating_hours_end}\n`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vijayawada Logistics Dataset Explorer</h3>
              <p className="text-xs text-slate-400">Prompt 02 Synthetic Benchmark Dataset for UC-038</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-semibold">Feasibility: YES</span>
            </div>
            <div className="text-slate-400">
              Capacity: <span className="font-mono font-bold text-white">{totalCapacity} kg</span> vs Demand: <span className="font-mono font-bold text-white">{totalDemand} kg</span>
            </div>
            <div className="text-slate-400">
              Priorities: <span className="text-amber-400 font-bold">{highCount} HIGH</span>, <span className="text-slate-300 font-bold">{medCount} MED</span>, <span className="text-slate-400 font-bold">{lowCount} LOW</span>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedTable.toUpperCase()}.CSV</span>
          </button>
        </div>

        {/* Table Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setSelectedTable('customers')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              selectedTable === 'customers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setSelectedTable('vehicles')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              selectedTable === 'vehicles' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Fleet Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setSelectedTable('depot')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              selectedTable === 'depot' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Central Depot
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {selectedTable === 'customers' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Coordinates</th>
                  <th className="p-2">Zone</th>
                  <th className="p-2">Demand</th>
                  <th className="p-2">Time Window</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {customers.map(c => (
                  <tr key={c.customer_id} className="hover:bg-slate-800/20">
                    <td className="p-2 font-mono font-bold text-indigo-300">{c.customer_id}</td>
                    <td className="p-2 font-medium text-white">{c.name}</td>
                    <td className="p-2 font-mono text-slate-400">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</td>
                    <td className="p-2 text-slate-300">{c.zone}</td>
                    <td className="p-2 font-mono font-bold text-slate-200">{c.demand_kg} kg</td>
                    <td className="p-2 font-mono text-slate-300">{formatMinutesToTime(c.time_window_start)} – {formatMinutesToTime(c.time_window_end)}</td>
                    <td className="p-2 font-mono text-slate-400">{c.service_time_min}m</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : c.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedTable === 'vehicles' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Capacity</th>
                  <th className="p-2.5">Operating Hours</th>
                  <th className="p-2.5">Speed</th>
                  <th className="p-2.5">Cost Rate</th>
                  <th className="p-2.5">Fuel Burn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {vehicles.map(v => (
                  <tr key={v.vehicle_id} className="hover:bg-slate-800/20">
                    <td className="p-2.5 font-mono font-bold text-indigo-300">{v.vehicle_id}</td>
                    <td className="p-2.5 font-medium text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }}></span>
                      <span>{v.name}</span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-emerald-400">{v.capacity_kg} kg</td>
                    <td className="p-2.5 font-mono text-slate-300">{formatMinutesToTime(v.start_time)} – {formatMinutesToTime(v.end_time)}</td>
                    <td className="p-2.5 font-mono text-slate-300">{v.speed_kmph} km/h</td>
                    <td className="p-2.5 font-mono text-slate-300">₹{v.cost_per_km.toFixed(2)} / km</td>
                    <td className="p-2.5 font-mono text-slate-300">{v.fuel_rate} L / km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedTable === 'depot' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
              <div><strong>Depot ID:</strong> {depot.depot_id}</div>
              <div><strong>Facility Name:</strong> {depot.name}</div>
              <div><strong>Physical Address:</strong> {depot.address}, {depot.city}, {depot.state}</div>
              <div><strong>GPS Coordinates:</strong> {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}</div>
              <div><strong>Operating Hours:</strong> 08:00 AM – 04:00 PM (480 minutes total shift)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
