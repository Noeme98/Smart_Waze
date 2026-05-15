import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, Clock, Calendar, Car, Bike, Truck, Bus, AlertTriangle, Construction, PartyPopper, FileText, Layers, X, Settings, Navigation } from "lucide-react";

// Traffic movement geometries used to render lane flows on the map.
import turnMovementsGeoJSON from "../assets/turn_movements.json";
import trafficFlowCsvRaw from "../assets/traffic_flow.csv?raw";

// Hourly traffic counts loaded from the source dataset.
const CSV_HEADERS = [
  "timeFrom",
  "timeTo",
  "direction",
  "day",
  "motorcycle",
  "tricycle",
  "car",
  "lightTruck",
  "heavyTruck",
  "total",
];

const DAY_NAME_FROM_INDEX = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const INTERPOLATION_BY_DAY = {
  Tuesday: 0.25,
  Wednesday: 0.5,
  Thursday: 0.75,
};

const WEEKEND_SCALE_BY_DAY = {
  Saturday: 0.82,
  Sunday: 0.68,
};

const TRAFFIC_FIELDS = ["motorcycle", "tricycle", "car", "lightTruck", "heavyTruck"];

const parseCsvLine = (line) => {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  out.push(current);
  return out;
};

const parseTrafficCsv = (csvText) => {
  const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    CSV_HEADERS.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    return {
      timeFrom: Number.parseInt(row.timeFrom, 10),
      timeTo: Number.parseInt(row.timeTo, 10),
      direction: row.direction,
      day: row.day,
      motorcycle: Number.parseInt(row.motorcycle, 10),
      tricycle: Number.parseInt(row.tricycle, 10),
      car: Number.parseInt(row.car, 10),
      lightTruck: Number.parseInt(row.lightTruck, 10),
      heavyTruck: Number.parseInt(row.heavyTruck, 10),
      total: Number.parseInt(row.total, 10),
    };
  });
};

const TRAFFIC_DATA = parseTrafficCsv(trafficFlowCsvRaw);

const getDayName = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Monday";
  return DAY_NAME_FROM_INDEX[date.getDay()] || "Monday";
};

const roundTrafficRow = (row) => {
  const rounded = { ...row };
  TRAFFIC_FIELDS.forEach((field) => {
    rounded[field] = Math.max(0, Math.round(row[field]));
  });
  rounded.total = TRAFFIC_FIELDS.reduce((sum, field) => sum + rounded[field], 0);
  return rounded;
};

const interpolateRows = (fromRow, toRow, ratio) => {
  const output = { ...fromRow };

  TRAFFIC_FIELDS.forEach((field) => {
    output[field] = fromRow[field] + (toRow[field] - fromRow[field]) * ratio;
  });

  output.total = TRAFFIC_FIELDS.reduce((sum, field) => sum + output[field], 0);
  return roundTrafficRow(output);
};

const scaleRow = (row, factor) => {
  const output = { ...row };

  TRAFFIC_FIELDS.forEach((field) => {
    output[field] = row[field] * factor;
  });

  output.total = TRAFFIC_FIELDS.reduce((sum, field) => sum + output[field], 0);
  return roundTrafficRow(output);
};

const getTodayDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Leaflet expects coordinates in [lat, lng] order.
const FLOW_LINES = {};
const DIRECTION_COLORS = {
  "East to West (Straight)": "#3b82f6",
  "East to North (Right Turn to Castin N)": "#22c55e",
  "East to South (Left Turn to Castin S)": "#f59e0b",
  "North to South (Straight)": "#ef4444",
  "North to West (Right Turn to Vicentillo W)": "#8b5cf6",
  "North U-Turn": "#6b7280",
  "South to North (Straight)": "#ec4899",
  "South to West (Left Turn to Vicentillo W)": "#06b6d4",
  "South U-Turn": "#6b7280",
};

// Convert the source geometry into the structure consumed by the map layer.
turnMovementsGeoJSON.features.forEach(feature => {
  const direction = feature.properties.direction;
  const coords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

  FLOW_LINES[direction] = {
    coords,
    color: DIRECTION_COLORS[direction] || "#6b7280",
    label: `${feature.properties.from_dir} → ${feature.properties.to_dir}`
  };
});

// Preset scenarios used to adjust the traffic model.
const SCENARIOS = [
  { id: "normal", label: "Normal Day", icon: Calendar, description: "View actual recorded traffic data", multiplier: 1.0 },
  { id: "am_rush", label: "AM Rush Hour", icon: Clock, description: "Focus on morning peak (7-9 AM)", multiplier: 1.0, timeRange: [7, 9] },
  { id: "pm_rush", label: "PM Rush Hour", icon: Clock, description: "Focus on evening peak (5-7 PM)", multiplier: 1.0, timeRange: [17, 19] },
  { id: "construction", label: "Road Construction", icon: Construction, description: "Simulated 30% capacity reduction", multiplier: 1.3 },
  { id: "accident", label: "Accident", icon: AlertTriangle, description: "Simulated 50% capacity reduction", multiplier: 1.5 },
  { id: "event", label: "Event Day", icon: PartyPopper, description: "Simulated 20% traffic increase", multiplier: 1.2 },
  { id: "policy", label: "Policy Changes", icon: FileText, description: "Simulated 15% traffic reduction", multiplier: 0.85 },
];

// Display metadata for the traffic summary widgets.
const VEHICLE_TYPES = [
  { id: "motorcycle", label: "Motorcycle", icon: Bike, color: "#3b82f6" },
  { id: "tricycle", label: "Tricycle/Pedicab", icon: Navigation, color: "#22c55e" },
  { id: "car", label: "Car/Jeepney/Van", icon: Car, color: "#f59e0b" },
  { id: "lightTruck", label: "Light Truck", icon: Truck, color: "#8b5cf6" },
  { id: "heavyTruck", label: "Heavy Truck/Bus", icon: Bus, color: "#ef4444" },
];

// Direction filter options derived from the geometry dataset.
const DIRECTION_OPTIONS = [
  { value: "all", label: "All Directions" },
  ...turnMovementsGeoJSON.features
    .filter(f => !f.properties.direction.includes("U-Turn"))
    .map(f => ({
      value: f.properties.direction,
      label: f.properties.direction
    }))
];

// Color scale for traffic density indicators.
const CONGESTION_COLORS = {
  free: "#22c55e",
  light: "#84cc16",
  moderate: "#eab308",
  heavy: "#f97316",
  severe: "#ef4444",
};

const TrafficSimulation = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const heatmapLayer = useRef(null);
  const animationRef = useRef(null);
  const flowAnimationRef = useRef(null);

  // Simulation state.
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentHour, setCurrentHour] = useState(8);
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue);
  const [selectedScenario, setSelectedScenario] = useState("normal");
  const [selectedDirection, setSelectedDirection] = useState("all");

  // Mobile panel visibility.
  const [showScenarios, setShowScenarios] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Map center for the sampled intersection in Naval, Biliran.
  const MAP_CENTER = [11.5621528, 124.3943467];
  const DEFAULT_TIME_RANGE = [6, 19];

  const activeScenario = useMemo(
    () => SCENARIOS.find((scenario) => scenario.id === selectedScenario) || SCENARIOS[0],
    [selectedScenario]
  );
  const [minHour, maxHour] = activeScenario.timeRange || DEFAULT_TIME_RANGE;

  const scenarioImpactText = useMemo(() => {
    if (activeScenario.multiplier === 1) return "No volume change";
    const percent = Math.abs(Math.round((activeScenario.multiplier - 1) * 100));
    return activeScenario.multiplier > 1
      ? `+${percent}% demand`
      : `-${percent}% demand`;
  }, [activeScenario]);

  const selectedDay = useMemo(() => getDayName(selectedDate), [selectedDate]);

  useEffect(() => {
    setCurrentHour((prev) => Math.min(maxHour, Math.max(minHour, prev)));
  }, [minHour, maxHour]);

  // Use observed Monday and Friday data directly, and interpolate for other days.
  const getCurrentTrafficData = useCallback(() => {
    const multiplier = activeScenario.multiplier || 1.0;

    const hourlyRows = TRAFFIC_DATA.filter((d) => d.timeFrom === currentHour);
    const directionSet = new Set(hourlyRows.map((row) => row.direction));
    const dayInterpolation = INTERPOLATION_BY_DAY[selectedDay];
    const weekendScale = WEEKEND_SCALE_BY_DAY[selectedDay];

    const filteredData = Array.from(directionSet).map((direction) => {
      const directionRows = hourlyRows.filter((row) => row.direction === direction);
      const mondayRow = directionRows.find((row) => row.day === "Monday");
      const fridayRow = directionRows.find((row) => row.day === "Friday");

      if (!mondayRow && !fridayRow) return null;

      if (selectedDay === "Monday" && mondayRow) return mondayRow;
      if (selectedDay === "Friday" && fridayRow) return fridayRow;

      if (typeof dayInterpolation === "number" && mondayRow && fridayRow) {
        return interpolateRows(mondayRow, fridayRow, dayInterpolation);
      }

      if (typeof weekendScale === "number") {
        const baseline = fridayRow || mondayRow;
        return baseline ? scaleRow(baseline, weekendScale) : null;
      }

      return fridayRow || mondayRow;
    }).filter(Boolean);

    if (filteredData.length === 0) {
      return { directions: [], totals: { motorcycle: 0, tricycle: 0, car: 0, lightTruck: 0, heavyTruck: 0, total: 0 } };
    }

    // Apply scenario multiplier and aggregate
    const directions = filteredData.map(d => ({
      ...d,
      motorcycle: Math.round(d.motorcycle * multiplier),
      tricycle: Math.round(d.tricycle * multiplier),
      car: Math.round(d.car * multiplier),
      lightTruck: Math.round(d.lightTruck * multiplier),
      heavyTruck: Math.round(d.heavyTruck * multiplier),
      total: Math.round(d.total * multiplier),
    }));

    // Calculate totals across all directions
    const totals = directions.reduce((acc, d) => ({
      motorcycle: acc.motorcycle + d.motorcycle,
      tricycle: acc.tricycle + d.tricycle,
      car: acc.car + d.car,
      lightTruck: acc.lightTruck + d.lightTruck,
      heavyTruck: acc.heavyTruck + d.heavyTruck,
      total: acc.total + d.total,
    }), { motorcycle: 0, tricycle: 0, car: 0, lightTruck: 0, heavyTruck: 0, total: 0 });

    return { directions, totals };
  }, [currentHour, selectedDay, activeScenario]);

  // Calculate simulation output
  const simulationOutput = useMemo(() => {
    const { totals } = getCurrentTrafficData();

    // Calculate congestion index based on total vehicles
    const maxCapacity = 5000;
    const congestionIndex = Math.min(100, Math.round((totals.total / maxCapacity) * 100));

    // Determine status
    let status = "Free";
    if (congestionIndex > 70) status = "Heavy";
    else if (congestionIndex > 40) status = "Moderate";

    // Calculate vehicle breakdown percentages
    const vehicleBreakdown = totals.total > 0 ? {
      motorcycle: Math.round((totals.motorcycle / totals.total) * 100),
      tricycle: Math.round((totals.tricycle / totals.total) * 100),
      car: Math.round((totals.car / totals.total) * 100),
      lightTruck: Math.round((totals.lightTruck / totals.total) * 100),
      heavyTruck: Math.round((totals.heavyTruck / totals.total) * 100),
    } : { motorcycle: 0, tricycle: 0, car: 0, lightTruck: 0, heavyTruck: 0 };

    return {
      congestionIndex,
      totalVehicles: totals.total,
      status,
      vehicleBreakdown,
      vehicleCounts: totals,
    };
  }, [getCurrentTrafficData]);

  // Get color based on intensity
  const getIntensityColor = (intensity) => {
    if (intensity > 0.7) return CONGESTION_COLORS.severe;
    if (intensity > 0.5) return CONGESTION_COLORS.heavy;
    if (intensity > 0.3) return CONGESTION_COLORS.moderate;
    if (intensity > 0.15) return CONGESTION_COLORS.light;
    return CONGESTION_COLORS.free;
  };

  // Create traffic flow lines data
  const createFlowLines = useCallback(() => {
    const { directions } = getCurrentTrafficData();

    // Filter by selected direction
    const filteredDirections = selectedDirection === "all"
      ? directions
      : directions.filter(d => d.direction === selectedDirection);

    const maxTotal = Math.max(...directions.map(d => d.total), 1);

    return filteredDirections.map(d => {
      const flowConfig = FLOW_LINES[d.direction];
      if (!flowConfig) return null;

      const intensity = d.total / maxTotal;
      return {
        direction: d.direction,
        coords: flowConfig.coords,
        baseColor: flowConfig.color,
        label: flowConfig.label,
        intensity,
        total: d.total,
        color: getIntensityColor(intensity),
        weight: Math.max(4, Math.round(intensity * 14))
      };
    }).filter(Boolean);
  }, [getCurrentTrafficData, selectedDirection]);

  const interpolatePointOnPath = useCallback((coords, progress) => {
    if (!coords || coords.length === 0) return null;
    if (coords.length === 1) return coords[0];

    const segmentLengths = [];
    let totalLength = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i];
      const end = coords[i + 1];
      const length = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      segmentLengths.push(length);
      totalLength += length;
    }

    if (totalLength === 0) return coords[0];

    let targetDistance = progress * totalLength;
    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentLength = segmentLengths[i];
      if (targetDistance <= segmentLength) {
        const start = coords[i];
        const end = coords[i + 1];
        const ratio = segmentLength === 0 ? 0 : targetDistance / segmentLength;
        return [
          start[0] + (end[0] - start[0]) * ratio,
          start[1] + (end[1] - start[1]) * ratio,
        ];
      }
      targetDistance -= segmentLength;
    }

    return coords[coords.length - 1];
  }, []);

  // Initialize the Leaflet map once.
  useEffect(() => {
    if (map.current) return;

    if (!window.L) {
      console.error("Leaflet is not loaded");
      return;
    }

    const L = window.L;

    const leafletMap = L.map(mapContainer.current).setView(MAP_CENTER, 19);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(leafletMap);

    map.current = leafletMap;

    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);

    return () => {
      // Preserve the map instance during cleanup and only stop timers.
      if (flowAnimationRef.current) {
        clearInterval(flowAnimationRef.current);
        flowAnimationRef.current = null;
        }
    };
  }, []); 


  // Rebuild the flow overlays when the input state changes.
  useEffect(() => {
    if (!map.current || !window.L) return;

    const L = window.L;

    // Clear any previously rendered overlays before redrawing.
    if (heatmapLayer.current) {
      map.current.removeLayer(heatmapLayer.current);
    }
    if (flowAnimationRef.current) {
      clearInterval(flowAnimationRef.current);
      flowAnimationRef.current = null;
    }

    // Draw the current traffic state.
    const flowLines = createFlowLines();
    const linesGroup = L.layerGroup();
    const animatedDashLines = [];
    const particleMarkers = [];

    flowLines.forEach((flow) => {
      // Render a wider line beneath the main path for contrast.
      L.polyline(flow.coords, {
        color: flow.color,
        weight: flow.weight + 6,
        opacity: 0.14 + flow.intensity * 0.15,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(linesGroup);

      // Draw the main flow line
      const polyline = L.polyline(flow.coords, {
        color: flow.color,
        weight: flow.weight,
        opacity: 0.7 + flow.intensity * 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Add popup with traffic info
      polyline.bindPopup(`
        <div style="font-family: Kanit; min-width: 150px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${flow.direction}</div>
          <div style="color: ${flow.color}; font-size: 18px; font-weight: bold;">${flow.total} VPH</div>
        </div>
      `);

      polyline.addTo(linesGroup);

      // Animated dash overlay for directional motion
      const dashLine = L.polyline(flow.coords, {
        color: "#ffffff",
        weight: Math.max(2, flow.weight - 2),
        opacity: 0.6,
        dashArray: "10 14",
        dashOffset: "0",
        lineCap: 'round',
        interactive: false
      }).addTo(linesGroup);
      animatedDashLines.push(dashLine);

      // Moving traffic particles
      const particleCount = Math.max(2, Math.round(flow.intensity * 5));
      for (let i = 0; i < particleCount; i++) {
        const initialProgress = i / particleCount;
        const point = interpolatePointOnPath(flow.coords, initialProgress);
        if (!point) continue;

        const marker = L.circleMarker(point, {
          radius: Math.max(2, Math.min(6, flow.weight / 2)),
          color: "#ffffff",
          weight: 1,
          fillColor: flow.color,
          fillOpacity: 0.95,
          opacity: 0.9,
          interactive: false
        }).addTo(linesGroup);

        particleMarkers.push({
          marker,
          coords: flow.coords,
          progress: initialProgress,
          speed: 0.004 + flow.intensity * 0.008,
        });
      }

      // Add arrow markers along each segment of the path
      const totalSegments = flow.coords.length - 1;
      const arrowsPerSegment = Math.max(1, Math.round(flow.intensity * 2));

      for (let seg = 0; seg < totalSegments; seg++) {
        const startPoint = flow.coords[seg];
        const endPoint = flow.coords[seg + 1];

        // Calculate segment length to determine arrow count
        const segLength = Math.sqrt(
          Math.pow(endPoint[0] - startPoint[0], 2) +
          Math.pow(endPoint[1] - startPoint[1], 2)
        );

        // Place arrows along this segment (skip very short segments)
        if (segLength > 0.00015) {
          for (let a = 0; a < arrowsPerSegment; a++) {
            const ratio = (a + 0.5) / arrowsPerSegment;
            const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * ratio;
            const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * ratio;

            // Calculate angle for arrow rotation based on segment direction
            const dx = endPoint[1] - startPoint[1];
            const dy = endPoint[0] - startPoint[0];
            const angle = Math.atan2(dx, dy) * (180 / Math.PI);

            // Create arrow marker
            const arrowIcon = L.divIcon({
              className: 'flow-arrow',
              html: `<div style="
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-bottom: 8px solid ${flow.color};
                transform: rotate(${angle}deg);
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
              "></div>`,
              iconSize: [10, 8],
              iconAnchor: [5, 4]
            });

            L.marker([lat, lng], { icon: arrowIcon, interactive: false }).addTo(linesGroup);
          }
        }
      }
    });

    let dashOffset = 0;
    flowAnimationRef.current = setInterval(() => {
      dashOffset -= 2;
      animatedDashLines.forEach((line) => {
        line.setStyle({ dashOffset: `${dashOffset}` });
      });

      particleMarkers.forEach((particle) => {
        particle.progress += particle.speed;
        if (particle.progress > 1) particle.progress -= 1;
        const point = interpolatePointOnPath(particle.coords, particle.progress);
        if (point) {
          particle.marker.setLatLng(point);
        }
      });
    }, 80);

    linesGroup.addTo(map.current);
    heatmapLayer.current = linesGroup;

    return () => {
      if (flowAnimationRef.current) {
        clearInterval(flowAnimationRef.current);
        flowAnimationRef.current = null;
      }
    };
  }, [createFlowLines, currentHour, selectedDay, selectedScenario, selectedDirection, interpolatePointOnPath]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentHour((prev) => {
          if (prev >= maxHour) return minHour;
          return prev + 1;
        });
      }, 1500);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, minHour, maxHour]);

  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentHour(8);
    setSelectedDate(getTodayDateInputValue());
    setSelectedScenario("normal");
    setSelectedDirection("all");
  };

  const handleScenarioSelect = (scenarioId) => {
    setSelectedScenario(scenarioId);
  };

  // Format hour display
  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  // Get status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Free": return "text-green-400";
      case "Moderate": return "text-yellow-400";
      case "Heavy": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "Free": return "bg-green-500/20 border-green-500/50";
      case "Moderate": return "bg-yellow-500/20 border-yellow-500/50";
      case "Heavy": return "bg-red-500/20 border-red-500/50";
      default: return "bg-gray-500/20 border-gray-500/50";
    }
  };

  // Get direction data for display
  const { directions } = getCurrentTrafficData();

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden font-[Kanit] pt-16 lg:pt-0 bg-gray-900">
      {/* Top Header Bar */}
      <div className="relative z-[1100] bg-gradient-to-r from-[#1B163C] to-[#2E2470] border-b border-purple-500/30 px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">Traffic Simulation</h1>
          <p className="text-purple-300 text-xs sm:text-sm">Naval, Biliran - Real Traffic Data</p>
        </div>

        {/* Time Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
            <Clock size={16} className="text-purple-300" />
            <span className="text-white font-medium">{formatHour(currentHour)}</span>
            <span className="text-purple-300 text-sm">• {selectedDay}</span>
          </div>
          <div className="hidden xl:flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
            <span className="text-purple-300 text-xs">Scenario</span>
            <span className="text-white text-sm font-medium">{activeScenario.label}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-lg transition-all ${
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={resetSimulation}
              className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Mobile Toggle Buttons */}
          <div className="flex lg:hidden gap-1">
            <button
              onClick={() => { setShowScenarios(!showScenarios); setShowControls(false); }}
              className={`p-2 rounded-lg transition-all ${showScenarios ? 'bg-purple-600' : 'bg-gray-700'} text-white`}
            >
              <Layers size={18} />
            </button>
            <button
              onClick={() => { setShowControls(!showControls); setShowScenarios(false); }}
              className={`p-2 rounded-lg transition-all ${showControls ? 'bg-purple-600' : 'bg-gray-700'} text-white`}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-0 flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* Left Panel - Scenarios (Desktop) */}
        <div className="hidden lg:flex flex-col w-64 bg-gray-800 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              Scenarios
            </h2>
          </div>
          <div className="p-3 space-y-2">
            {SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedScenario === scenario.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} />
                    <span className="font-medium text-sm">{scenario.label}</span>
                  </div>
                  <div className="text-[10px] opacity-80 mb-1">
                    {scenario.multiplier === 1
                      ? "No volume change"
                      : `${scenario.multiplier > 1 ? "+" : ""}${Math.round((scenario.multiplier - 1) * 100)}% demand`}
                    {scenario.timeRange ? ` • ${formatHour(scenario.timeRange[0])} - ${formatHour(scenario.timeRange[1])}` : ""}
                  </div>
                  <p className="text-xs opacity-75">{scenario.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Scenarios Panel */}
        {showScenarios && (
          <div className="lg:hidden absolute top-0 left-0 right-0 bottom-0 bg-gray-800 z-[1200] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Layers size={18} className="text-purple-400" />
                Scenarios
              </h2>
              <button onClick={() => setShowScenarios(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => { handleScenarioSelect(scenario.id); setShowScenarios(false); }}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedScenario === scenario.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} />
                      <span className="font-medium text-sm">{scenario.label}</span>
                    </div>
                    <div className="text-[10px] opacity-80 mb-1">
                      {scenario.multiplier === 1
                        ? "No volume change"
                        : `${scenario.multiplier > 1 ? "+" : ""}${Math.round((scenario.multiplier - 1) * 100)}% demand`}
                      {scenario.timeRange ? ` • ${formatHour(scenario.timeRange[0])} - ${formatHour(scenario.timeRange[1])}` : ""}
                    </div>
                    <p className="text-xs opacity-75">{scenario.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Center - Map View */}
        <div className="relative z-0 flex-1 min-h-[360px] lg:min-h-0">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Map Legend */}
          <div className="pointer-events-none hidden sm:block absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10 max-w-[220px]">
            <div className="font-semibold mb-2">Traffic Flow Intensity</div>
            {Object.entries(CONGESTION_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-6 h-1 rounded" style={{ backgroundColor: color }}></div>
                <span className="capitalize">{level}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-600 text-[10px] text-gray-400">
              Line thickness = volume<br/>
              Arrows = flow direction
            </div>
          </div>

          {/* Current Time - Mobile */}
          <div className="pointer-events-none sm:hidden absolute top-3 left-3 right-3 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white z-10">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-purple-300" />
              <span className="font-medium text-sm">{formatHour(currentHour)}</span>
            </div>
            <div className="text-xs text-purple-300">{selectedDay}</div>
            <div className="text-[10px] text-gray-300">{selectedDate}</div>
            <div className="text-[10px] text-gray-300 mt-1">{activeScenario.label}</div>
          </div>

          {/* Compact Legend - Mobile */}
          <div className="pointer-events-none sm:hidden absolute bottom-3 right-3 bg-gray-800/90 backdrop-blur-sm rounded-lg px-2.5 py-2 text-[10px] text-white z-10">
            <div className="font-semibold mb-1">Flow Intensity</div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: CONGESTION_COLORS.free }}></span>
              <span>Free</span>
              <span className="w-3 h-1 rounded" style={{ backgroundColor: CONGESTION_COLORS.heavy }}></span>
              <span>Heavy</span>
              <span className="w-3 h-1 rounded" style={{ backgroundColor: CONGESTION_COLORS.severe }}></span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Controls (Desktop) */}
        <div className="hidden lg:flex flex-col w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Settings size={18} className="text-purple-400" />
              Controls
            </h2>
          </div>

          <div className="p-4 space-y-5">
            {/* Time & Day */}
            <div>
              <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Time & Day</h3>
              <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2">
                <div className="text-white text-sm font-medium">{activeScenario.label}</div>
                <div className="text-[11px] text-purple-200">{scenarioImpactText}</div>
                <div className="text-[10px] text-purple-300 mt-0.5">
                  Active window: {formatHour(minHour)} - {formatHour(maxHour)}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Hour: {formatHour(currentHour)}</label>
                  <input
                    type="range"
                    min={minHour}
                    max={maxHour}
                    value={currentHour}
                    onChange={(e) => setCurrentHour(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>{formatHour(minHour)}</span>
                    <span>{formatHour(Math.round((minHour + maxHour) / 2))}</span>
                    <span>{formatHour(maxHour)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date ({selectedDay})</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Direction Filter */}
            <div>
              <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Traffic Direction</h3>
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-purple-500 mb-2"
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500">
                Note: East→West is one-way only
              </p>
            </div>

            {/* Vehicle Breakdown */}
            <div>
              <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Vehicle Breakdown</h3>
              <div className="space-y-2">
                {VEHICLE_TYPES.map((vehicle) => {
                  const Icon = vehicle.icon;
                  const count = simulationOutput.vehicleCounts[vehicle.id] || 0;
                  const percent = simulationOutput.vehicleBreakdown[vehicle.id] || 0;
                  return (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300 text-xs flex items-center gap-2">
                        <Icon size={14} style={{ color: vehicle.color }} />
                        {vehicle.label}
                      </span>
                      <div className="text-right">
                        <span className="text-white text-sm font-medium">{count}</span>
                        <span className="text-gray-400 text-xs ml-1">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direction Breakdown */}
            <div>
              <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Traffic by Direction</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {directions.map((d, idx) => (
                  <div key={idx} className="p-2 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 text-xs truncate max-w-[150px]">{d.direction}</span>
                      <span className="text-white text-sm font-medium">{d.total} VPH</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (d.total / 1500) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Controls Panel */}
        {showControls && (
          <div className="lg:hidden absolute top-0 left-0 right-0 bottom-0 bg-gray-800 z-[1200] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Settings size={18} className="text-purple-400" />
                Controls
              </h2>
              <button onClick={() => setShowControls(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Time & Day */}
              <div>
                <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Time & Day</h3>
                <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2">
                  <div className="text-white text-sm font-medium">{activeScenario.label}</div>
                  <div className="text-[11px] text-purple-200">{scenarioImpactText}</div>
                  <div className="text-[10px] text-purple-300 mt-0.5">
                    Active window: {formatHour(minHour)} - {formatHour(maxHour)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Hour: {formatHour(currentHour)}</label>
                    <input
                      type="range"
                      min={minHour}
                      max={maxHour}
                      value={currentHour}
                      onChange={(e) => setCurrentHour(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Date ({selectedDay})</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Direction Filter */}
              <div>
                <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Traffic Direction</h3>
                <select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
                >
                  {DIRECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Breakdown */}
              <div>
                <h3 className="text-purple-300 text-xs uppercase tracking-wider mb-3">Vehicle Breakdown</h3>
                <div className="space-y-2">
                  {VEHICLE_TYPES.map((vehicle) => {
                    const Icon = vehicle.icon;
                    const count = simulationOutput.vehicleCounts[vehicle.id] || 0;
                    const percent = simulationOutput.vehicleBreakdown[vehicle.id] || 0;
                    return (
                      <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                        <span className="text-gray-300 text-xs flex items-center gap-2">
                          <Icon size={14} style={{ color: vehicle.color }} />
                          {vehicle.label}
                        </span>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">{count}</span>
                          <span className="text-gray-400 text-xs ml-1">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Simulation Output */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 sm:px-6 py-3">
        <div className="grid grid-cols-2 sm:flex items-stretch sm:items-center justify-center gap-3 sm:gap-8">
          {/* Congestion Index */}
          <div className="text-center rounded-lg bg-gray-700/40 px-2.5 py-2 sm:bg-transparent sm:p-0">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Congestion Index</div>
            <div className={`text-xl sm:text-3xl font-bold ${
              simulationOutput.congestionIndex > 70 ? 'text-red-400' :
              simulationOutput.congestionIndex > 40 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {simulationOutput.congestionIndex}
              <span className="text-sm text-gray-400 ml-1">/ 100</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-gray-700"></div>

          {/* Total Vehicles */}
          <div className="text-center rounded-lg bg-gray-700/40 px-2.5 py-2 sm:bg-transparent sm:p-0">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Vehicles</div>
            <div className="text-xl sm:text-3xl font-bold text-white">
              {simulationOutput.totalVehicles.toLocaleString()}
              <span className="text-sm text-gray-400 ml-1">VPH</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-gray-700"></div>

          {/* Status */}
          <div className="text-center col-span-2 sm:col-span-1 rounded-lg bg-gray-700/40 px-2.5 py-2 sm:bg-transparent sm:p-0">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusBgColor(simulationOutput.status)} ${getStatusColor(simulationOutput.status)}`}>
              {simulationOutput.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSimulation;
