import React, { use, useMemo } from "react";
import { formatDate, getStatusColor } from "./ReportsHelpers";

// Component to display reports using React 19's use hook
export const ReportsList = ({ reportsPromise, searchQuery, statusFilter, categoryFilter, sortBy }) => {
  // Use React 19's use hook to unwrap the promise
  const data = use(reportsPromise);

  // Extract reports from the response
  const allReports = data?.results || [];

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = [...allReports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.citizen_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter(report =>
        report.status_name?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Category filter
    if (categoryFilter !== "All categories") {
      filtered = filtered.filter(report =>
        report.category_name?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "Oldest first") {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [allReports, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const statusCounts = {
      'Pending': 0,
      'In Progress': 0,
      'Approved': 0,
      'Rejected': 0
    };

    allReports.forEach(report => {
      const status = report.status_name;
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    return [
      { label: "Pending", count: statusCounts['Pending'], color: "bg-yellow-500" },
      { label: "In Progress", count: statusCounts['In Progress'], color: "bg-gray-500" },
      { label: "Approved", count: statusCounts['Approved'], color: "bg-green-500" },
      { label: "Rejected", count: statusCounts['Rejected'], color: "bg-red-500" }
    ];
  }, [allReports]);

  if (filteredReports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No reports found</div>
        <p className="text-gray-500 text-sm">
          {searchQuery || statusFilter !== "All Statuses" || categoryFilter !== "All categories"
            ? "Try adjusting your filters"
            : "Create your first report to get started"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
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

      {/* Reports List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all"
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
                  {report.category_name}
                  {report.sub_category_name && ` / ${report.sub_category_name}`}
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
                  📍 {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
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
        ))}
      </div>
    </>
  );
};
