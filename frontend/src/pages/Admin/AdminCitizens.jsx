import { useEffect, useState } from "react";
import { citizenAPI } from "../../services/api";

const AdminCitizens = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await citizenAPI.list();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not load citizens.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          Citizens
        </h1>
        <p className="text-sm text-gray-300">
          Directory of registered citizen accounts (read-only).
        </p>
      </div>
      <div className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700/50 bg-[#1E1C3A]/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700/50">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800/80">
                    <td className="p-3 text-white">{r.name}</td>
                    <td className="p-3 text-gray-300">{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="p-6 text-gray-500 text-sm">No citizens found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCitizens;
