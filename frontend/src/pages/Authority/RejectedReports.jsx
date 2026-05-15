import { useState, useEffect } from "react";
import { Eye, XCircle, MapPin, Calendar, User, AlertTriangle } from "lucide-react";
import { reportAPI } from "../../services/api";
import ReportFilters from "../../components/ReportFilters";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

const toAbsoluteUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ROOT}${value.startsWith("/") ? "" : "/"}${value}`;
};

const extractImageUrls = (report) => {
  const fromArray = Array.isArray(report?.images) ? report.images : [];
  return fromArray
    .map((image) => {
      if (typeof image === "string") return image;
      if (!image || typeof image !== "object") return null;
      return image.image_url || image.url || image.image || image.file || image.photo_url || null;
    })
    .filter(Boolean)
    .map(toAbsoluteUrl)
    .filter(Boolean);
};

const RejectedReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusColor = (label) => {
    switch (label) {
      case "Rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const mapReportForUI = (r) => {
    const displayStatus = r.status_name || "Rejected";
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
      statusCode: r.status_name?.toLowerCase().replace(" ", "_") || "rejected",
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

  const fetchReports = async () => {
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

      // Filter only REJECTED reports
      const rejectedReports = raw.filter(r =>
        r.status_name?.toLowerCase() === "rejected"
      );

      const mapped = rejectedReports.map(mapReportForUI);
      setReports(mapped);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const query = searchQuery.toLowerCase();
      return (
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.location.toLowerCase().includes(query) ||
        report.submittedBy.toLowerCase().includes(query)
      );
    })
    .filter(report => {
      if (categoryFilter === "All categories") return true;
      return report.category === categoryFilter;
    })
    .sort((a, b) => {
      if (sortBy === "Most Recent") {
        return new Date(b.submittedDate) - new Date(a.submittedDate);
      } else if (sortBy === "Oldest First") {
        return new Date(a.submittedDate) - new Date(b.submittedDate);
      }
      return 0;
    });

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      {/* Header */}
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                REJECTED
              </h1>
              <span className="bg-red-500 text-white text-sm sm:text-lg font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full">
                {filteredReports.length}
              </span>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300">Reports that were not approved</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        {/* Alert Banner */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
          <div>
            <p className="text-red-200 font-semibold">Rejected Reports</p>
            <p className="text-red-300/80 text-sm">{filteredReports.length} report{filteredReports.length !== 1 ? 's have' : ' has'} been rejected with reasons provided.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ReportFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            accentColor="red"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading reports...</p>
          </div>
        )}

        {/* Reports List */}
        {!isLoading && filteredReports.length > 0 && (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-red-500/50 transition-all"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        {report.title}
                      </h3>
                      <span className={`${report.statusColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase w-fit flex items-center gap-1`}>
                        <XCircle size={12} />
                        {report.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="bg-[#062B67] inline-flex items-center px-3 py-1 rounded-md">
                        <p className="text-xs font-bold uppercase text-[#3168FA]">{report.category}</p>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className="text-red-400 flex-shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar size={16} className="text-red-400 flex-shrink-0" />
                        {report.submittedDate}
                      </span>
                      <span className="flex items-center gap-2">
                        <User size={16} className="text-emerald-400 flex-shrink-0" />
                        {report.submittedBy}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      📷 {report.images} image{report.images > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No rejected reports found</p>
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
                    <span className={`${selectedReport.statusColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1`}>
                      <XCircle size={12} />
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
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1">
              <div className="p-4 sm:p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">Description</h3>
                  <p className="text-gray-300 text-sm sm:text-base">{selectedReport.description}</p>
                </div>

                {/* Image Gallery */}
                <div>
                  <h3 className="text-sm text-gray-400 uppercase font-semibold mb-3">Attached Images ({selectedReport.imageUrls?.length || 0})</h3>
                  {selectedReport.imageUrls?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedReport.imageUrls.map((url, idx) => (
                        <div key={idx} className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden border border-gray-600 hover:border-red-500 transition-all cursor-pointer">
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
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">Location</h3>
                    <p className="text-white flex items-center gap-2">
                      <MapPin size={16} className="text-red-400" />
                      {selectedReport.location}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">Submitted By</h3>
                    <p className="text-white">{selectedReport.submittedBy}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase font-semibold mb-2">Date Submitted</h3>
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

export default RejectedReports;
