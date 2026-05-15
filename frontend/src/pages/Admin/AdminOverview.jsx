import { useState, useEffect } from "react";
import { BarChart3, Building2, PieChart } from "lucide-react";
import { reportAPI } from "../../services/api";

const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await reportAPI.getAdminOverview();
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Could not load admin overview.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0 flex items-center justify-center">
        <p className="text-gray-400">Loading overview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0 p-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const byAuth = data?.by_authority || [];

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
          ADMIN OVERVIEW
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          All reports across offices — counts by routing authority and status
        </p>
      </div>

      <div className="p-4 sm:p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total reports</p>
              <PieChart className="text-purple-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{data?.total_reports ?? 0}</h3>
          </div>
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Offices with routing</p>
              <Building2 className="text-cyan-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{byAuth.length}</h3>
          </div>
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Unassigned (no office)</p>
              <BarChart3 className="text-amber-400" size={20} />
            </div>
            <h3 className="text-3xl font-bold">{data?.unassigned_reports ?? 0}</h3>
            <p className="text-xs text-gray-500 mt-2">Subcategory has no authority linked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Reports by office (routed authority)</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {byAuth.length === 0 ? (
                <p className="text-gray-500 text-sm">No routed reports yet.</p>
              ) : (
                byAuth.map((row) => (
                  <div
                    key={row.authority_id}
                    className="flex items-center justify-between p-3 bg-[#0F0C1F] rounded-lg"
                  >
                    <span className="font-medium text-sm">{row.authority_name}</span>
                    <span className="text-emerald-400 font-bold">{row.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">By status</h3>
            <div className="space-y-2">
              {(data?.by_status || []).map((row) => (
                <div
                  key={row.status__code || "unknown"}
                  className="flex items-center justify-between p-3 bg-[#0F0C1F] rounded-lg"
                >
                  <span className="text-sm text-gray-300 capitalize">
                    {(row.status__code || "").replace(/_/g, " ") || "—"}
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4">By category</h3>
          <div className="flex flex-wrap gap-3">
            {(data?.by_category || []).map((row) => (
              <div
                key={row.report_type__report_type}
                className="px-4 py-2 rounded-lg bg-[#0F0C1F] border border-gray-700/50"
              >
                <span className="text-gray-400 text-xs block">{row.report_type__report_type}</span>
                <span className="text-xl font-bold">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
