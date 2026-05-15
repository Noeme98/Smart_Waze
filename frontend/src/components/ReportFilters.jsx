import { Search, Filter, X } from "lucide-react";

const ReportFilters = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  accentColor = "purple",
  // New flexible props
  categoryOptions = [
    "All categories",
    "Road Damage",
    "Street Light",
    "Storm Drain",
    "Traffic Signal",
    "Flooding",
    "Potholes",
    "Debris",
    "Other",
  ],
  sortOptions = ["Most Recent", "Oldest First"],
  searchPlaceholder = "Search reports...",
  showCategoryFilter = true,
  showSortFilter = true,
  showSearchBar = true,
  customFilters = null, // For additional custom filters
}) => {
  const accentColorMap = {
    purple: "focus:border-purple-500",
    blue: "focus:border-blue-500",
    orange: "focus:border-orange-500",
    green: "focus:border-green-500",
    red: "focus:border-red-500",
    yellow: "focus:border-yellow-500",
  };

  const accentButtonColor = {
    purple: "bg-purple-600 hover:bg-purple-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
  };

  const focusColor = accentColorMap[accentColor] || accentColorMap.purple;
  const buttonColor = accentButtonColor[accentColor] || accentButtonColor.purple;

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`sm:hidden ${buttonColor} text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all w-full justify-center`}
      >
        <Filter size={18} />
        {showFilters ? "Hide" : "Show"} Filters
      </button>

      {/* Filters Container */}
      <div
        className={`bg-[#1E1C3A]/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 ${
          showFilters ? "block" : "hidden sm:block"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search Input */}
          {showSearchBar && (
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 ${focusColor} focus:outline-none text-sm`}
              />
            </div>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Category Filter */}
            {showCategoryFilter && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 ${focusColor} focus:outline-none text-sm w-full`}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Filter */}
            {showSortFilter && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 ${focusColor} focus:outline-none text-sm w-full`}
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Custom Filters */}
            {customFilters &&
              customFilters.map((filter) => (
                <div key={filter.id}>
                  {filter.type === "select" && (
                    <select
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className={`bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 ${focusColor} focus:outline-none text-sm w-full`}
                    >
                      {filter.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {filter.type === "input" && (
                    <input
                      type={filter.inputType || "text"}
                      placeholder={filter.placeholder}
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className={`w-full bg-[#0F0C1F] text-white px-4 py-2.5 rounded-lg border border-gray-700 ${focusColor} focus:outline-none text-sm`}
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportFilters;