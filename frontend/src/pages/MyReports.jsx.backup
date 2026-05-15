import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, X } from "lucide-react";
import PageHeader from "../components/PageHeader";

const MyReports = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("Last Report first");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sample reports data
  const reports = [
    {
      id: 1,
      title: "Large pothole on Main Street causing traffic hazard",
      category: "Road Damage / Potholes ",
      description: "Deep pothole approximately 2 feet wide near the intersection with Ayala Avenue. Causing dangerous conditions for vehicles and bicycles, traffic is slow from bottleneck.",
      status: "PENDING",
      statusColor: "bg-orange-500",
      location: "Kanto Nwebe",
      date: "2 days ago",
      isResolved: true,
      resolvedDate: "3 days ago"
    },
    {
      id: 2,
      title: "Street light not working on PI Garcia",
      category: "Streetlights / Electrical Issues",
      description: "Major high traffic at PI Garcia has been out for a week, creating safety concerns for pedestrians walking at night.",
      status: "IN PROGRESS",
      statusColor: "bg-blue-500",
      location: "PI Garcia St.",
      isResolved: false,
      date: "3 days ago"
    },
    {
      id: 3,
      title: "Damaged storm drain on Caraycaray",
      category: "Drainage / Flooding",
      description: "Storm drain cover is broken and partially blocking road flow. Risk of flooding during heavy rain.",
      status: "APPROVED",
      statusColor: "bg-green-500",
      location: "Caraycaray",
      isResolved: false,
      date: "5 days ago"
    }
  ];

  const stats = [
    { label: "Pending", count: 3, color: "bg-yellow-500" },
    { label: "In Progress", count: 2, color: "bg-gray-500" },
    { label: "Approved", count: 2, color: "bg-green-500" },
    { label: "Rejected", count: 1, color: "bg-red-500" }
  ];

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
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base sm:text-xl font-semibold text-white flex-1">
                    {report.title}
                  </h3>
                  <span className={`${report.statusColor} text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase whitespace-nowrap`}>
                    {report.status}
                  </span>
                </div>        
                <div className="bg-[#062B67] inline-flex items-center p-1.5 sm:p-2 rounded-md mt-2">
                  <p className="text-[10px] sm:text-xs font-bold rounded-full uppercase text-[#3168FA]">{report.category}</p>
                </div>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                {report.description}
              </p>

              <hr className="border-gray-700 my-3 sm:my-4" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    📍 {report.location}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 Submitted {report.date}
                  </span>
                  {(report.isResolved || report.resolvedDate) && (
                    <span className="flex items-center gap-1">
                      {report.isResolved ? `✅ Resolved ${report.resolvedDate}` : "Not Resolved"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyReports;