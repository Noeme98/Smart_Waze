import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { reportAPI } from "../services/api";

// Helper functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  // Reset time to midnight for accurate day comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.floor((nowOnly - dateOnly) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const getStatusColor = (status) => {
  const colors = { 'Pending': 'bg-orange-500', 'Approved': 'bg-green-500', 'In Progress': 'bg-blue-500', 'Rejected': 'bg-red-500' };
  return colors[status] || 'bg-gray-500';
};

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ROOT}${value.startsWith("/") ? "" : "/"}${value}`;
};

const extractImageUrls = (report) => {
  const fromArray = Array.isArray(report?.images) ? report.images : [];
  const urls = fromArray
    .map((image) => {
      if (typeof image === "string") return image;
      if (!image || typeof image !== "object") return null;
      return image.image_url || image.url || image.image || image.file || image.photo_url || null;
    })
    .filter(Boolean);

  const fallbackSingle = report?.image_url || report?.image || report?.photo_url || report?.photo || null;
  if (urls.length === 0 && fallbackSingle) {
    urls.push(fallbackSingle);
  }

  return urls.map(toAbsoluteUrl).filter(Boolean);
};

const MyReports = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("Last Report first");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  // Reverse geocode function using free geocoding services
  const getLocationName = async (lat, lng) => {
    try {
      // Try Nominatim with better zoom levels for establishments
      // First try zoom=19 for very specific places (buildings, POIs)
      let response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'Smartwayz-App/1.0' // Nominatim requires user agent
          }
        }
      );

      if (!response.ok) {
        console.error(`Geocoding request failed with status: ${response.status}`);
        return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
      }

      let data = await response.json();

      // Check if we got a specific establishment (school, university, etc.)
      if (data && data.address) {
        const addr = data.address;
        const name = data.name || data.namedetails?.name;

        // Priority: school/university > amenity > building name > road
        if (addr.school) {
          return `${addr.school}, ${addr.suburb || addr.city || addr.town || ''}`.trim().replace(/,\s*$/, '');
        }
        if (addr.university) {
          return `${addr.university}, ${addr.suburb || addr.city || addr.town || ''}`.trim().replace(/,\s*$/, '');
        }
        if (addr.amenity) {
          return `${name || addr.amenity}, ${addr.road || addr.suburb || addr.city || ''}`.trim().replace(/,\s*$/, '');
        }
        if (name && name !== addr.road) {
          // We have a named place that's not just a street
          return `${name}, ${addr.road || addr.suburb || ''}, ${addr.city || addr.town || ''}`.trim().replace(/,\s*,/g, ',').replace(/,\s*$/, '');
        }
      }

      // Fallback: Try LocationIQ (free tier: 5000 requests/day, no API key needed for basic usage)
      // Or use Nominatim with different zoom for general area
      response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Smartwayz-App/1.0'
          }
        }
      );
      data = await response.json();

      if (data && data.display_name) {
        // Parse and format the address nicely
        const parts = data.display_name.split(',').map(p => p.trim());
        // Take first 2-3 most relevant parts (avoid country and postcode)
        const relevantParts = parts.slice(0, Math.min(3, parts.length));
        return relevantParts.join(', ');
      }

      return 'Unknown Location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
    }
  };

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const data = await reportAPI.getAll();
        const reportsData = data?.results || data || [];
        setReports(reportsData);

        // Fetch location names for all reports
        const locations = {};
        for (const report of reportsData) {
          const key = `${report.latitude}_${report.longitude}`;
          if (!locations[key]) {
            const locationName = await getLocationName(report.latitude, report.longitude);
            locations[key] = locationName;
            // Add delay to respect OpenStreetMap's usage policy (max 1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        setLocationNames(locations);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    const counts = { 'Pending': 0, 'In Progress': 0, 'Approved': 0, 'Rejected': 0 };
    reports.forEach(r => { if (counts.hasOwnProperty(r.status_name)) counts[r.status_name]++; });
    return [
      { label: "Pending", count: counts['Pending'], color: "bg-yellow-500" },
      { label: "In Progress", count: counts['In Progress'], color: "bg-gray-500" },
      { label: "Approved", count: counts['Approved'], color: "bg-green-500" },
      { label: "Rejected", count: counts['Rejected'], color: "bg-red-500" }
    ];
  }, [reports]);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((report) =>
        report.title?.toLowerCase().includes(q) ||
        report.description?.toLowerCase().includes(q) ||
        report.category_name?.toLowerCase().includes(q) ||
        report.sub_category_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((report) => report.status_name === statusFilter);
    }

    if (categoryFilter !== "All categories") {
      filtered = filtered.filter((report) => {
        const category = `${report.category_name || ""} ${report.sub_category_name || ""}`.toLowerCase();
        return category.includes(categoryFilter.toLowerCase());
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === "Oldest first") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return filtered;
  }, [reports, searchQuery, statusFilter, categoryFilter, sortBy]);

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] pt-16 lg:pt-0 min-h-screen">
      {/* Header */}
      <PageHeader
        title="MY REPORTS"
        description="Track and manage all your submitted infrastructure reports"
        action={
          <button 
            onClick={() => navigate('/new-report')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 font-medium transition-all text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New Report</span>
            <span className="sm:hidden">New</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stat.color}`}></div>
                <span className="text-xs sm:text-sm text-gray-400">{stat.label}</span>
              </div>
              <div className="text-2xl sm:text-4xl font-bold">{stat.count}</div>
            </div>
          ))}
        </div>

        {/* Filters - Desktop */}
        <div className="hidden lg:block bg-[#1E1C3A]/40 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search reports, name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm min-w-[140px]"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm min-w-[140px]"
            >
              <option>All categories</option>
              <option>Road Damage</option>
              <option>Street Light</option>
              <option>Storm Drain</option>
              <option>Traffic Signal</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm min-w-[160px]"
            >
              <option>Last Report first</option>
              <option>Oldest first</option>
            </select>
          </div>
        </div>

        {/* Filters - Mobile */}
        <div className="lg:hidden mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1E1C3A]/60 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full bg-[#1E1C3A]/60 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg border border-gray-700 flex items-center justify-center gap-2 text-sm font-medium"
          >
            {showMobileFilters ? <X size={18} /> : <Filter size={18} />}
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Mobile Filter Panel */}
          {showMobileFilters && (
            <div className="mt-3 bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 space-y-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#0F0C1F] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0F0C1F] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                >
                  <option>All categories</option>
                  <option>Road Damage</option>
                  <option>Street Light</option>
                  <option>Storm Drain</option>
                  <option>Traffic Signal</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#0F0C1F] text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                >
                  <option>Last Report first</option>
                  <option>Oldest first</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredReports.map((report) => {
            return (
            <div
              key={report.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedReport(report)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedReport(report);
              }}
              className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base sm:text-xl font-semibold text-white flex-1">
                    {report.title}
                  </h3>
                  <span className={`${getStatusColor(report.status_name)} text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase whitespace-nowrap`}>
                    {report.status_name}
                  </span>
                </div>
                <div className="bg-[#062B67] inline-flex items-center p-1.5 sm:p-2 rounded-md mt-2">
                  <p className="text-[10px] sm:text-xs font-bold rounded-full uppercase text-[#3168FA]">
                    {report.category_name}{report.sub_category_name && ` / ${report.sub_category_name}`}
                  </p>
                </div>
              </div>

              {report.description && (
                <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  {report.description}
                </p>
              )}

              <hr className="border-gray-700 my-3 sm:my-4" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    📍 {locationNames[`${report.latitude}_${report.longitude}`] || `${parseFloat(report.latitude).toFixed(4)}, ${parseFloat(report.longitude).toFixed(4)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 Submitted {formatDate(report.created_at)}
                  </span>
                  {report.status_name === 'Resolved' && (
                    <span className="flex items-center gap-1">
                      ✅ Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1B1A36] border border-gray-700 rounded-xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg sm:text-2xl font-semibold text-white">{selectedReport.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {selectedReport.category_name}{selectedReport.sub_category_name && ` / ${selectedReport.sub_category_name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
                aria-label="Close report details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {extractImageUrls(selectedReport).map((url, index) => (
                <img
                  key={`${selectedReport.id}-img-${index}`}
                  src={url}
                  alt={`Report evidence ${index + 1}`}
                  className="w-full h-48 sm:h-56 object-cover rounded-lg border border-gray-700"
                  loading="lazy"
                />
              ))}
            </div>

            {selectedReport.description && (
              <p className="text-sm text-gray-300 mb-4">{selectedReport.description}</p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <span>📍 {locationNames[`${selectedReport.latitude}_${selectedReport.longitude}`] || `${parseFloat(selectedReport.latitude).toFixed(4)}, ${parseFloat(selectedReport.longitude).toFixed(4)}`}</span>
              <span>📅 Submitted {formatDate(selectedReport.created_at)}</span>
              <span className={`${getStatusColor(selectedReport.status_name)} text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full uppercase w-fit`}>
                {selectedReport.status_name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
