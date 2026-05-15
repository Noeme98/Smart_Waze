// Helper function to format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

// Status color mapping
export const getStatusColor = (statusName) => {
  const statusColors = {
    'Pending': 'bg-orange-500',
    'Approved': 'bg-green-500',
    'In Progress': 'bg-blue-500',
    'Rejected': 'bg-red-500',
    'Resolved': 'bg-emerald-500'
  };
  return statusColors[statusName] || 'bg-gray-500';
};

// Loading component
export const ReportsLoading = () => (
  <div className="space-y-4">
    {/* Stats Loading */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50 animate-pulse"
        >
          <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>

    {/* Reports Loading */}
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700/50 animate-pulse"
      >
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    ))}
  </div>
);
