import { Search, Filter, Eye, Check, X, Clock, MapPin, Calendar, User } from "lucide-react";
import { reportAPI } from "../../services/api";
import { useEffect, useState, useCallback } from "react";

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
    .filter(Boolean)
    .map(toAbsoluteUrl)
    .filter(Boolean);

  return urls;
};

const AuthorityReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statsData, setStatsData] = useState({
    total_reports: 0,
    by_status: [],
  });

  const getStatusCount = (code) => {
    return statsData.by_status?.find(s => {
      const apiCode = s.status__code?.toLowerCase() || "";
      const normalizedCode = code.toLowerCase();
      return apiCode === normalizedCode || apiCode === normalizedCode.replace("_", " ");
    })?.count || 0;
  };

  const stats = [
    { label: "Total Reports", count: statsData.total_reports, color: "bg-purple-500", icon: <Filter size={20} /> },
    { label: "Pending Review", count: getStatusCount("pending"), color: "bg-orange-500", icon: <Clock size={20} /> },
    { label: "In Progress", count: getStatusCount("in_progress"), color: "bg-blue-500", icon: <Clock size={20} /> },
    { label: "Resolved", count: getStatusCount("resolved"), color: "bg-green-500", icon: <Check size={20} /> },
  ];

  const STATUS = {
    Pending: { id: 1, label: "Pending" },
    Approved: { id: 2, label: "Approved" },
    "In Progress": { id: 3, label: "In Progress" },
    Rejected: { id: 4, label: "Rejected" },
    Resolved: { id: 5, label: "Resolved" },
  };

  const ACTIONS = {
    approve: STATUS.Approved,
    start: STATUS["In Progress"],
    resolve: STATUS.Resolved,
    reject: STATUS.Rejected,
  };

  const getStatusColor = (label) => {
    switch (label) {
      case "Pending":
        return "bg-orange-500";
      case "Approved":
        return "bg-purple-500";
      case "In Progress":
        return "bg-blue-500";
      case "Rejected":
        return "bg-red-500";
      case "Resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const mapReportForUI = (r) => {
    const displayStatus = r.status_name || "Pending";
    const imageUrls = extractImageUrls(r);
    const imageCount = typeof r.image_count === "number"
      ? r.image_count
      : Array.isArray(r.images)
        ? r.images.length
        : imageUrls.length;

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      status: displayStatus,
      statusCode: r.status_name?.toLowerCase().replace(" ", "_") || "pending",
      statusColor: getStatusColor(displayStatus),
      category: r.sub_category_name || r.category_name,
      reportType: r.category_name,
      location: `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`,
      submittedDate: new Date(r.created_at).toLocaleDateString(),
      submittedBy: r.citizen_name || "Unknown",
      imageUrls,
      images: imageCount,
    };
  };

  const openReportDetails = useCallback(async (report) => {
    // Render the selected row immediately, then replace it with the detailed payload.
    setSelectedReport(report);

    try {
      const detailRes = await reportAPI.getById(report.id);
      const raw = detailRes?.data && detailRes?.data?.id ? detailRes.data : detailRes;
      if (raw?.id) {
        setSelectedReport(mapReportForUI(raw));
      }
    } catch (err) {
      console.error("Failed to fetch report details:", err);
    }
  }, []);

  // Load the report list and summary statistics together.
  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      const reportsRes = await reportAPI.getAll();
      
      let raw = [];
      if (Array.isArray(reportsRes)) {
        raw = reportsRes;
      } else if (reportsRes?.results && Array.isArray(reportsRes.results)) {
        raw = reportsRes.results;
      } else if (reportsRes?.data && Array.isArray(reportsRes.data)) {
        raw = reportsRes.data;
      }
      
      if (raw.length > 0) {
        const mapped = raw.map(mapReportForUI);
        setReports(mapped);
      } else {
        console.warn("No reports found in response");
        setReports([]);
      }

      let statsRes;
      try {
        statsRes = await reportAPI.getStats();
      } catch (statsErr) {
        console.error("Stats API error:", statsErr);
      }

      if (statsRes && statsRes.total_reports !== undefined) {
        setStatsData(statsRes);
      } else {
        // Fall back to client-side aggregation when the stats endpoint is unavailable.
        const pending = raw.filter(r => r.status_name?.toLowerCase() === "pending").length;
        const inProgress = raw.filter(r => r.status_name?.toLowerCase() === "in progress").length;
        const resolved = raw.filter(r => r.status_name?.toLowerCase() === "resolved").length;
        
        setStatsData({
          total_reports: raw.length,
          by_status: [
            { status__code: "pending", count: pending },
            { status__code: "in_progress", count: inProgress },
            { status__code: "resolved", count: resolved },
          ]
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (reportId, action) => {
    try {
      const next = ACTIONS[action];
      if (!next) return;

      await reportAPI.updateStatus(reportId, next.id);

      // Refresh the list so the updated status is reflected consistently.
      await fetchAllData();

      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update report status");
    }
  };

  // Populate the page on first render.
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      {/* Header */}
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 sm:mb-2 tracking-tight text-white">
              REPORT MANAGEMENT
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300">
              Review and manage infrastructure issue reports from citizens
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {stat.count}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className={`bg-[#1E1C3A]/40 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50 ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm w-full"
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
                className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm w-full"
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
                className="bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm w-full"
              >
                <option>Most Recent</option>
                <option>Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading reports...</p>
          </div>
        )}

        {/* Reports List */}
        {!isLoading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                role="button"
                tabIndex={0}
                onClick={() => openReportDetails(report)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openReportDetails(report);
                }}
                className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        {report.title}
                      </h3>
                      <span
                        className={`${report.statusColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase w-fit`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="bg-[#062B67] inline-flex items-center px-3 py-1 rounded-md">
                        <p className="text-xs font-bold uppercase text-[#3168FA]">
                          {report.category}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {report.reportType}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    {report.description}
                  </p>

                  <hr className="border-gray-700" />

                  {/* Info Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className="text-purple-400 flex-shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-400 flex-shrink-0" />
                        {report.submittedDate}
                      </span>
                      <span className="flex items-center gap-2">
                        <User size={16} className="text-emerald-400 flex-shrink-0" />
                        {report.submittedBy}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      📷 {report.images} image{report.images > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReportDetails(report);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    {report.status === "Pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(report.id, "approve");
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(report.id, "reject");
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </>
                    )}
                    {report.status === "In Progress" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(report.id, "resolve");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                      >
                        <Check size={16} />
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No reports found</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
          <div className="bg-[#1E1C3A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-[#1E1C3A] border-b border-gray-700 p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
                    {selectedReport.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span
                      className={`${selectedReport.statusColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}
                    >
                      {selectedReport.status}
                    </span>
                    <span className="bg-[#062B67] text-[#3168FA] text-xs font-bold px-3 py-1 rounded-md uppercase">
                      {selectedReport.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Action Buttons - Always Visible */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                {selectedReport.status === "Pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleAction(selectedReport.id, "approve");
                        setSelectedReport(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <Check size={20} />
                      Approve Report
                    </button>
                    <button
                      onClick={() => {
                        handleAction(selectedReport.id, "reject");
                        setSelectedReport(null);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <X size={20} />
                      Reject Report
                    </button>
                  </>
                )}

                {selectedReport.status === "Approved" && (
                  <button
                    onClick={() => {
                      handleAction(selectedReport.id, "start");
                      setSelectedReport(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <Clock size={20} />
                    Start In Progress
                  </button>
                )}

                {selectedReport.status === "In Progress" && (
                  <button
                    onClick={() => {
                      handleAction(selectedReport.id, "resolve");
                      setSelectedReport(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <Check size={20} />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1">
              <div className="p-4 sm:p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">
                    Description
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Image Gallery */}
                <div>
                  <h3 className="text-sm text-gray-400 uppercase font-semibold mb-3">
                    Attached Images ({selectedReport.imageUrls?.length || 0})
                  </h3>
                  {selectedReport.imageUrls?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedReport.imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden border border-gray-600 hover:border-purple-500 transition-all cursor-pointer"
                          >
                            <img
                              src={url}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No images attached</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">
                      Location
                    </h3>
                    <p className="text-white flex items-center gap-2">
                      <MapPin size={16} className="text-purple-400" />
                      {selectedReport.location}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">
                      Submitted By
                    </h3>
                    <p className="text-white">{selectedReport.submittedBy}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">
                      Date Submitted
                    </h3>
                    <p className="text-white">{selectedReport.submittedDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityReports;
