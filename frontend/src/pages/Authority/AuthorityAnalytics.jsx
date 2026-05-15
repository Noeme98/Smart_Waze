import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MapPin, Zap, Clock, FileText, Filter } from "lucide-react";
import { reportAPI } from "../../services/api";

const AnalyticsDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
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

        // Map to consistent format for analytics
        const mapped = raw.map(r => ({
          id: r.id,
          title: r.title,
          category: r.sub_category_name || r.category_name,
          status: r.status_name?.toLowerCase() || "pending",
          location: r.location_name || r.street_name || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`,
          created: r.created_at,
          resolved: r.resolved_at || null,
        }));

        setReports(mapped);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [timeRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === "resolved").length;
    const pendingReports = reports.filter(r => r.status === "pending").length;
    const inProgressReports = reports.filter(r => r.status === "in_progress").length;

    // Resolution time in days
    const resolutionTimes = reports
      .filter(r => r.status === "resolved" && r.resolved)
      .map(r => {
        const created = new Date(r.created);
        const resolved = new Date(r.resolved);
        return Math.floor((resolved - created) / (1000 * 60 * 60 * 24));
      });

    const avgResolutionTime = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
      : 0;

    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

    return {
      totalReports,
      resolvedReports,
      pendingReports,
      inProgressReports,
      avgResolutionTime,
      resolutionRate,
    };
  }, [reports]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const grouped = reports.reduce((acc, report) => {
      const existing = acc.find(item => item.name === report.category);
      if (existing) {
        existing.value += 1;
        existing.resolved += report.status === "resolved" ? 1 : 0;
      } else {
        acc.push({
          name: report.category,
          value: 1,
          resolved: report.status === "resolved" ? 1 : 0,
        });
      }
      return acc;
    }, []);
    return grouped.sort((a, b) => b.value - a.value);
  }, [reports]);

  // Location analysis
  const locationData = useMemo(() => {
    const grouped = reports.reduce((acc, report) => {
      const existing = acc.find(item => item.name === report.location);
      if (existing) {
        existing.count += 1;
        existing.resolved += report.status === "resolved" ? 1 : 0;
      } else {
        acc.push({
          name: report.location,
          count: 1,
          resolved: report.status === "resolved" ? 1 : 0,
        });
      }
      return acc;
    }, []);
    return grouped.sort((a, b) => b.count - a.count);
  }, [reports]);

  // Status distribution
  const statusData = useMemo(() => {
    return [
      { name: "Resolved", value: metrics.resolvedReports, fill: "#10b981" },
      { name: "In Progress", value: metrics.inProgressReports, fill: "#3b82f6" },
      { name: "Pending", value: metrics.pendingReports, fill: "#f59e0b" },
    ];
  }, [metrics]);

  // Resolution time trend
  const timelineData = useMemo(() => {
    const grouped = reports
      .filter(r => r.status === "resolved" && r.resolved)
      .reduce((acc, report) => {
        const created = new Date(report.created);
        const resolved = new Date(report.resolved);
        const days = Math.floor((resolved - created) / (1000 * 60 * 60 * 24));

        const existing = acc.find(item => item.name === `${days}d`);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ name: `${days}d`, count: 1 });
        }
        return acc;
      }, []);
    return grouped.sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [reports]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  if (isLoading) {
    return (
      <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      {/* Header */}
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2">
              ANALYTICS
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300">Comprehensive insights into report management</p>
          </div>
          <div className="flex gap-2">
            {["7days", "30days", "90days"].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-purple-600 text-white"
                    : "bg-[#1E1C3A] text-gray-400 hover:text-white"
                }`}
              >
                {range === "7days" ? "7 Days" : range === "30days" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Reports</p>
              <FileText className="text-purple-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{metrics.totalReports}</h3>
            <p className="text-xs text-gray-500 mt-2">All-time records</p>
          </div>

          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Resolved</p>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{metrics.resolutionRate}%</h3>
            <p className="text-xs text-gray-500 mt-2">{metrics.resolvedReports} reports</p>
          </div>

          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Avg Resolution</p>
              <Clock className="text-blue-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{metrics.avgResolutionTime}d</h3>
            <p className="text-xs text-gray-500 mt-2">Days to resolve</p>
          </div>

          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">In Progress</p>
              <Zap className="text-yellow-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{metrics.inProgressReports}</h3>
            <p className="text-xs text-gray-500 mt-2">Being worked on</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Distribution */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-6">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0F0C1F", border: "1px solid #374151" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution Time Distribution */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-6">Resolution Time Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" label={{ value: 'Days to Resolve', position: 'insideBottomRight', offset: -5, fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" label={{ value: 'Number of Reports', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: "#0F0C1F", border: "1px solid #374151" }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reports by Category */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-6">Reports by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" label={{ value: 'Number of Reports', position: 'insideBottomRight', offset: -5, fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#0F0C1F", border: "1px solid #374151" }} />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reports by Location */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-6">Reports by Location</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" label={{ value: 'Number of Reports', position: 'insideBottomRight', offset: -5, fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#0F0C1F", border: "1px solid #374151" }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Performance */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#0F0C1F] rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.value} reports</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{cat.resolved}/{cat.value}</p>
                    <p className="text-xs text-gray-400">{Math.round((cat.resolved / cat.value) * 100)}% resolved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Performance */}
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Location Performance</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {locationData.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#0F0C1F] rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-xs text-gray-400">{loc.count} reports</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{loc.resolved}/{loc.count}</p>
                    <p className="text-xs text-gray-400">{Math.round((loc.resolved / loc.count) * 100)}% resolved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;