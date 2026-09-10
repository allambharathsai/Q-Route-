import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlgorithmType,
  Customer,
  DispatchEvent,
  EmissionsComparison,
  EmissionsResult,
  RoadClosure,
  RouteOptimizationResult,
  TrafficLevel
} from './types';
import {
  DEPOT,
  DYNAMIC_ORDERS_BATCH_1,
  DYNAMIC_ORDERS_BATCH_2,
  INITIAL_CUSTOMERS,
  VEHICLES
} from './data/vijayawadaDataset';
import { solve_nearest_neighbor } from './algorithms/nearestNeighbor';
import { solve_cvrptw } from './algorithms/cvrptwSolver';
import { solve_quantum_hybrid } from './algorithms/quantumDecoder';
import { BenchmarkEngine, BenchmarkReport } from './algorithms/benchmarkEngine';
import { EmissionsCalculator } from './algorithms/emissionsCalculator';
import { TrafficEngine } from './algorithms/trafficEngine';
import { DynamicDispatcher } from './algorithms/dynamicDispatch';
import { formatMinutesToTime } from './utils/distance';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KPICards } from './components/KPICards';
import { RouteMap } from './components/RouteMap';
import { QuantumInspector } from './components/QuantumInspector';
import { BenchmarkView } from './components/BenchmarkView';
import { GanttTimeline } from './components/GanttTimeline';
import { RouteTable } from './components/RouteTable';
import { EventFeed } from './components/EventFeed';
import { HackathonGuideModal } from './components/HackathonGuideModal';
import { DataModal } from './components/DataModal';

import { MapPin, BarChart2, Atom, Clock, ListChecks, Radio } from 'lucide-react';

export const App: React.FC = () => {
  // --- Core State ---
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [vehicles] = useState(VEHICLES);
  const [depot] = useState(DEPOT);

  const [algorithm, setAlgorithm] = useState<AlgorithmType>('cvrptw');
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>('NORMAL');
  const [trafficEngine] = useState(() => new TrafficEngine('NORMAL'));
  const [roadClosures, setRoadClosures] = useState<RoadClosure[]>(() => trafficEngine.getRoadClosures());

  const [qaoaDepth, setQaoaDepth] = useState<number>(2);
  const [qaoaShots, setQaoaShots] = useState<number>(1024);

  const [simMinute, setSimMinute] = useState<number>(0); // 08:00 AM
  const [hasAddedBatch1, setHasAddedBatch1] = useState<boolean>(false);
  const [hasAddedBatch2, setHasAddedBatch2] = useState<boolean>(false);

  const [currentResult, setCurrentResult] = useState<RouteOptimizationResult | null>(null);
  const [prevResult, setPrevResult] = useState<RouteOptimizationResult | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [emissions, setEmissions] = useState<EmissionsResult | null>(null);
  const [emissionsComp, setEmissionsComp] = useState<EmissionsComparison | null>(null);

  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const [activeMainTab, setActiveMainTab] = useState<'map' | 'comparison' | 'quantum' | 'timeline' | 'manifest'>('map');
  const [isPitchGuideOpen, setIsPitchGuideOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  // Dynamic Dispatcher ref
  const [dispatcher, setDispatcher] = useState<DynamicDispatcher | null>(null);

  // Helper to append a dispatch event
  const addEvent = useCallback(
    (
      type: DispatchEvent['type'],
      title: string,
      description: string,
      deltaDist?: number,
      deltaTime?: number,
      affectedVehicles?: string[]
    ) => {
      const newEvent: DispatchEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: formatMinutesToTime(simMinute),
        sim_minute: simMinute,
        type,
        title,
        description,
        delta_distance_km: deltaDist,
        delta_time_min: deltaTime,
        affected_vehicles: affectedVehicles
      };
      setEvents(prev => [newEvent, ...prev]);
    },
    [simMinute]
  );

  // --- Optimization Execution ---
  const runOptimization = useCallback(() => {
    setIsOptimizing(true);

    setTimeout(() => {
      const mult = trafficEngine.getMultiplier();
      const closedArcs = trafficEngine.getClosedArcs();

      let result: RouteOptimizationResult;

      if (algorithm === 'nn') {
        result = solve_nearest_neighbor(customers, vehicles, depot, mult, closedArcs);
      } else if (algorithm === 'cvrptw') {
        result = solve_cvrptw(customers, vehicles, depot, mult, closedArcs);
      } else if (algorithm === 'qaoa') {
        result = solve_quantum_hybrid(customers, vehicles, depot, mult, closedArcs, qaoaDepth, qaoaShots, 4);
      } else {
        // 'all' benchmark
        const report = BenchmarkEngine.runAll(customers, vehicles, depot, mult, closedArcs, qaoaDepth, qaoaShots);
        setBenchmarkReport(report);
        result = report.qaoa; // Set champion QAOA as active result
        setActiveMainTab('comparison');
      }

      // Compute emissions
      const em = EmissionsCalculator.calculateRouteEmissions(result, vehicles);
      setEmissions(em);

      // Always compute side-by-side emissions comparison
      const nnRes = solve_nearest_neighbor(customers, vehicles, depot, mult, closedArcs);
      const cvrptwRes = solve_cvrptw(customers, vehicles, depot, mult, closedArcs);
      const qaoaRes = solve_quantum_hybrid(customers, vehicles, depot, mult, closedArcs, qaoaDepth, qaoaShots, 4);
      const emComp = EmissionsCalculator.compareAll(nnRes, cvrptwRes, qaoaRes, vehicles);
      setEmissionsComp(emComp);

      // Store benchmark report
      if (algorithm === 'all' || !benchmarkReport) {
        setBenchmarkReport(
          BenchmarkEngine.runAll(customers, vehicles, depot, mult, closedArcs, qaoaDepth, qaoaShots)
        );
      }

      setPrevResult(currentResult);
      setCurrentResult(result);

      // Initialize Dynamic Dispatcher state
      const disp = new DynamicDispatcher(result.routes, customers, vehicles, depot, simMinute, mult, closedArcs);
      setDispatcher(disp);

      addEvent(
        'OPTIMIZATION',
        `Optimization Completed: ${result.algorithm_name}`,
        `Routed ${result.customers_served}/${result.customers_total} customers across ${result.vehicles_used} vehicles. Total distance: ${result.total_distance_km} km with ${result.late_deliveries} late deliveries.`,
        currentResult ? Number((result.total_distance_km - currentResult.total_distance_km).toFixed(2)) : undefined,
        currentResult ? Number((result.total_duration_min - currentResult.total_duration_min).toFixed(1)) : undefined
      );

      setIsOptimizing(false);
    }, 120);
  }, [
    algorithm,
    customers,
    vehicles,
    depot,
    trafficEngine,
    qaoaDepth,
    qaoaShots,
    simMinute,
    currentResult,
    benchmarkReport,
    addEvent
  ]);

  // Initial Run on Mount
  useEffect(() => {
    runOptimization();
    addEvent(
      'OPTIMIZATION',
      'Logistics Command Center Initialized',
      'Loaded Vijayawada Central Logistics Hub (16.5062, 80.6480) with 20 initial client orders and 3 fleet vans.'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Traffic Level Change Handler ---
  const handleTrafficChange = (level: TrafficLevel) => {
    const update = trafficEngine.setTrafficLevel(level);
    setTrafficLevel(level);
    addEvent(
      'TRAFFIC_CHANGE',
      `City Traffic Changed: ${level} (${update.multiplier}x)`,
      update.description
    );
    // Auto-trigger re-optimization with new traffic parameters
    setTimeout(runOptimization, 50);
  };

  // --- Road Closure Toggle Handler ---
  const handleToggleRoadClosure = (id: string) => {
    const closure = trafficEngine.toggleRoadClosure(id);
    setRoadClosures([...trafficEngine.getRoadClosures()]);

    if (closure) {
      addEvent(
        'ROAD_CLOSURE',
        closure.active ? `Road Closure Imposed: ${closure.fromName}` : `Road Reopened: ${closure.fromName}`,
        closure.description
      );
      setTimeout(runOptimization, 50);
    }
  };

  // --- Dynamic Order Injection: Batch 1 (t=135m / 10:15 AM) ---
  const handleAddDynamicBatch1 = () => {
    if (hasAddedBatch1 || !currentResult) return;

    const newSimTime = 135; // 10:15 AM
    setSimMinute(newSimTime);
    setHasAddedBatch1(true);

    const mult = trafficEngine.getMultiplier();
    const closedArcs = trafficEngine.getClosedArcs();

    const disp = new DynamicDispatcher(
      currentResult.routes,
      customers,
      vehicles,
      depot,
      newSimTime,
      mult,
      closedArcs
    );

    // Advance clock: mark deliveries completed up to 10:15 AM
    const newlyCompleted = disp.advanceClock(newSimTime);
    const result = disp.insertNewOrders(DYNAMIC_ORDERS_BATCH_1);

    setCustomers(prev => [...prev, ...DYNAMIC_ORDERS_BATCH_1]);
    setPrevResult(currentResult);
    setCurrentResult(result.updated_result);
    setDispatcher(disp);

    const em = EmissionsCalculator.calculateRouteEmissions(result.updated_result, vehicles);
    setEmissions(em);

    addEvent(
      'DYNAMIC_ORDER',
      '+5 Rush Medical & Retail Orders (10:15 AM)',
      `Preserved ${result.completed_deliveries_preserved} completed deliveries (${newlyCompleted.join(
        ', '
      )}). Successfully inserted C021-C025 with dynamic rerouting across ${result.routes_changed.join(', ')}.`,
      result.distance_delta_km,
      result.time_delta_min,
      result.routes_changed
    );
  };

  // --- Dynamic Order Injection: Batch 2 (t=210m / 11:30 AM) ---
  const handleAddDynamicBatch2 = () => {
    if (hasAddedBatch2 || !hasAddedBatch1 || !currentResult) return;

    const newSimTime = 210; // 11:30 AM
    setSimMinute(newSimTime);
    setHasAddedBatch2(true);

    const mult = trafficEngine.getMultiplier();
    const closedArcs = trafficEngine.getClosedArcs();

    const disp = new DynamicDispatcher(
      currentResult.routes,
      customers,
      vehicles,
      depot,
      newSimTime,
      mult,
      closedArcs
    );

    const newlyCompleted = disp.advanceClock(newSimTime);
    const result = disp.insertNewOrders(DYNAMIC_ORDERS_BATCH_2);

    setCustomers(prev => [...prev, ...DYNAMIC_ORDERS_BATCH_2]);
    setPrevResult(currentResult);
    setCurrentResult(result.updated_result);
    setDispatcher(disp);

    const em = EmissionsCalculator.calculateRouteEmissions(result.updated_result, vehicles);
    setEmissions(em);

    addEvent(
      'DYNAMIC_ORDER',
      '+3 Urgent Afternoon Orders (11:30 AM)',
      `Preserved ${result.completed_deliveries_preserved} completed deliveries. Rerouted vehicles for C026-C028.`,
      result.distance_delta_km,
      result.time_delta_min,
      result.routes_changed
    );
  };

  // --- Reset Simulation ---
  const handleReset = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setSimMinute(0);
    setHasAddedBatch1(false);
    setHasAddedBatch2(false);
    setTrafficLevel('NORMAL');
    trafficEngine.setTrafficLevel('NORMAL');
    trafficEngine.getRoadClosures().forEach(c => {
      if (c.active) trafficEngine.toggleRoadClosure(c.id);
    });
    setRoadClosures([...trafficEngine.getRoadClosures()]);

    addEvent(
      'OPTIMIZATION',
      'Simulation Reset to 08:00 AM',
      'Reverted fleet schedule to baseline 20-order configuration.'
    );

    setTimeout(() => {
      const res = solve_cvrptw(INITIAL_CUSTOMERS, vehicles, depot, 1.0);
      setCurrentResult(res);
      setPrevResult(null);
      setEmissions(EmissionsCalculator.calculateRouteEmissions(res, vehicles));
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        currentMinute={simMinute}
        totalCustomers={customers.length}
        vehicleCount={vehicles.length}
        onReset={handleReset}
        onOpenPitchGuide={() => setIsPitchGuideOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        activeAlgo={algorithm}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Interactive Control Sidebar */}
        <Sidebar
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          trafficLevel={trafficLevel}
          setTrafficLevel={handleTrafficChange}
          roadClosures={roadClosures}
          onToggleRoadClosure={handleToggleRoadClosure}
          qaoaDepth={qaoaDepth}
          setQaoaDepth={setQaoaDepth}
          qaoaShots={qaoaShots}
          setQaoaShots={setQaoaShots}
          onRunOptimization={runOptimization}
          onAddDynamicBatch1={handleAddDynamicBatch1}
          onAddDynamicBatch2={handleAddDynamicBatch2}
          hasAddedBatch1={hasAddedBatch1}
          hasAddedBatch2={hasAddedBatch2}
          isOptimizing={isOptimizing}
          simMinute={simMinute}
        />

        {/* Center / Right Content Panel */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
          {/* Row 1: KPI Cards */}
          <KPICards
            currentResult={currentResult}
            prevResult={prevResult}
            emissions={emissions}
          />

          {/* Row 2: Main Views Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveMainTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeMainTab === 'map'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Live Vijayawada Map</span>
              </button>

              <button
                onClick={() => setActiveMainTab('comparison')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeMainTab === 'comparison'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Algorithm Benchmark</span>
              </button>

              <button
                onClick={() => setActiveMainTab('quantum')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeMainTab === 'quantum'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Quantum Diagnostics</span>
              </button>

              <button
                onClick={() => setActiveMainTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeMainTab === 'timeline'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Shift Timeline (Gantt)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('manifest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeMainTab === 'manifest'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Stop Manifest</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Real-Time Fleet Routing</span>
            </div>
          </div>

          {/* Row 3: Active Tab Content */}
          <div>
            {activeMainTab === 'map' && currentResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <RouteMap
                    depot={depot}
                    routes={currentResult.routes}
                    vehicles={vehicles}
                    allCustomers={customers}
                    activeClosures={roadClosures}
                    simMinute={simMinute}
                  />
                </div>
                <div className="lg:col-span-1 space-y-4">
                  <EventFeed events={events} />
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Vijayawada Operating Context</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Routes navigate 8 neighborhoods: Governorpet, Patamata, Suryaraopet, MG Road, Moghalrajpuram, Labbipet, Benz Circle, and Auto Nagar with time-window constraints and capacity tracking.
                    </p>
                    <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-mono">
                      <span className="text-slate-400">Total Assigned Payload:</span>
                      <span className="font-bold text-white">
                        {currentResult.routes.reduce((sum, r) => sum + r.load_kg, 0)} kg / 470 kg fleet cap
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMainTab === 'comparison' && (
              <BenchmarkView report={benchmarkReport} emissionsComp={emissionsComp} />
            )}

            {activeMainTab === 'quantum' && (
              <QuantumInspector metadata={currentResult?.quantum_metadata} />
            )}

            {activeMainTab === 'timeline' && currentResult && (
              <GanttTimeline routes={currentResult.routes} />
            )}

            {activeMainTab === 'manifest' && currentResult && (
              <RouteTable routes={currentResult.routes} />
            )}
          </div>

          {/* Row 4: Secondary Table & Events when Map is Active */}
          {activeMainTab === 'map' && currentResult && (
            <div className="space-y-4 pt-2">
              <RouteTable routes={currentResult.routes} />
              <GanttTimeline routes={currentResult.routes} />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <HackathonGuideModal
        isOpen={isPitchGuideOpen}
        onClose={() => setIsPitchGuideOpen(false)}
      />

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        depot={depot}
        customers={customers}
        vehicles={vehicles}
      />
    </div>
  );
};
export default App;
