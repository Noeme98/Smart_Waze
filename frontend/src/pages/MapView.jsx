import { useEffect, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { reportAPI } from "../services/api"; // Adjust path if needed

const MapLegend = () => {
  const legendItems = [
    { color: "bg-black", label: "PENDING REVIEW" },
    { color: "bg-green-500", label: "APPROVED" },
    { color: "bg-yellow-500", label: "IN PROGRESS" },
    { color: "bg-red-500", label: "REJECTED" },
  ];

  return (
    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-gray-700/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white text-[10px] sm:text-xs font-medium shadow-lg z-[1000]">
      {legendItems.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 last:mb-0">
          <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${color} border border-white/30`}></div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Reports");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);
  const markersRef = useRef([]);

  // Helper function to get marker color based on status
  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#000000',
      'Approved': '#22c55e',
      'In Progress': '#eab308',
      'Rejected': '#ef4444'
    };
    return colors[status] || '#000000';
  };

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const data = await reportAPI.getAll();
        const reportsData = data?.results || data || [];
        setReports(reportsData);
        
        // Extract unique categories
        const categories = [...new Set(reportsData.map(r => r?.category_name))].filter(Boolean);
        setAvailableCategories(categories);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
        setAvailableCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Filter reports based on selected filters
  useEffect(() => {
    let filtered = reports;

    if (statusFilter !== "All Reports") {
      filtered = filtered.filter(report => report.status_name === statusFilter);
    }

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter(report => report.category_name === categoryFilter);
    }

    setFilteredReports(filtered);
  }, [reports, statusFilter, categoryFilter]);

  // Update map with filtered markers
  useEffect(() => {
    if (map.current && !isLoading) {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      if (!window.L || filteredReports.length === 0) return;

      const L = window.L;

      // Add markers for filtered reports
      filteredReports.forEach(report => {
        const lat = parseFloat(report.latitude);
        const lng = parseFloat(report.longitude);
        const color = getStatusColor(report.status_name);

        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
          "></div>`,
          iconSize: [24, 24]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon })
          .bindPopup(`
          <div style="font-family: Kanit; font-size: 13px; padding: 8px; min-width: 200px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #1f2937;">
              ${report.title}
            </div>
            <div style="margin-bottom: 4px;">
              <b>Category:</b> ${report.category_name}${report.sub_category_name ? ` / ${report.sub_category_name}` : ''}
            </div>
            <div style="margin-bottom: 4px;">
              <b>Status:</b> <span style="color: ${color}; font-weight: 600;">${report.status_name}</span>
            </div>
            ${report.description ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; color: #6b7280;">
              ${report.description}
            </div>` : ''}
            <div style="margin-top: 6px; font-size: 11px; color: #9ca3af;">
              Reported by: ${report.citizen_name}
            </div>
          </div>`)
          .addTo(map.current);
        
        markersRef.current.push(marker);
      });
    }
  }, [filteredReports, isLoading]);

  // Initialize map
  useEffect(() => {
    if (map.current || isLoading || reports.length === 0) return;

    if (!window.L) {
      console.error("Leaflet is not loaded");
      return;
    }

    const L = window.L;

    const centerLat = reports.length > 0 ? parseFloat(reports[0].latitude) : 11.5550;
    const centerLng = reports.length > 0 ? parseFloat(reports[0].longitude) : 124.3950;

    map.current = L.map(mapContainer.current).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [reports, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-screen font-[Kanit] pt-16 lg:pt-0">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Map View</h1>
        <p className="text-gray-400 text-sm sm:text-base">View infrastructure reports around Naval, Biliran</p>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-gray-900 relative min-h-0 z-0">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-[2000]">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading reports...</p>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && filteredReports.length === 0 && reports.length > 0 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600/90 text-white px-4 py-3 rounded-lg z-[1000]">
            No reports match the selected filters
          </div>
        )}

        <MapLegend />
        
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden absolute top-4 right-4 bg-gray-700/90 backdrop-blur-sm text-white rounded-lg p-2.5 border border-gray-600 z-[1000] shadow-lg"
        >
          {showFilters ? <X size={20} /> : <Filter size={20} />}
        </button>

        {/* Desktop Filters */}
        <div className="hidden lg:flex absolute top-4 right-4 gap-2 z-[1000]">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700/90 backdrop-blur-sm text-white text-sm rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option>All Reports</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>In Progress</option>
            <option>Rejected</option>
          </select>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-700/90 backdrop-blur-sm text-white text-sm rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option>All Categories</option>
            {availableCategories.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Mobile Filter Panel */}
        {showFilters && (
          <div className="lg:hidden absolute top-16 right-4 left-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 z-[1000] shadow-xl border border-gray-700">
            <div className="space-y-3">
              <div>
                <label className="block text-white text-xs font-medium mb-1.5">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  <option>All Reports</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>In Progress</option>
                  <option>Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-xs font-medium mb-1.5">Category</label>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  <option>All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div
            onClick={() => setShowFilters(false)}
            className="lg:hidden absolute inset-0 bg-black/30 z-[999]"
          />
        )}
      </div>
    </div>
  );
};

export default MapView;