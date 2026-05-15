import { useCallback, useEffect, useState } from "react";
import { reportAPI, authorityAPI } from "../../services/api";

const AdminReportsReadOnly = () => {
  const [rows, setRows] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selection, setSelection] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, authList] = await Promise.all([reportAPI.getAll(), authorityAPI.list()]);
      const raw = Array.isArray(res) ? res : res?.results || [];
      setRows(raw);
      setAuthorities(Array.isArray(authList) ? authList : []);
      setSelection((prev) => {
        const next = { ...prev };
        for (const r of raw) {
          if (next[r.id] === undefined) {
            next[r.id] =
              r.assigned_authority_id != null && r.assigned_authority_id !== undefined
                ? String(r.assigned_authority_id)
                : "";
          }
        }
        return next;
      });
    } catch (e) {
      setError(e?.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectChange = (reportId, value) => {
    setSelection((prev) => ({ ...prev, [reportId]: value }));
  };

  const handleSaveAssignment = async (report) => {
    const value = selection[report.id];
    setSavingId(report.id);
    setError(null);
    try {
      const res = await reportAPI.assignAuthority(report.id, value === "" ? null : value);
      const updated = res?.data;
      if (updated?.id) {
        setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
        setSelection((prev) => ({
          ...prev,
          [report.id]:
            updated.assigned_authority_id != null && updated.assigned_authority_id !== undefined
              ? String(updated.assigned_authority_id)
              : "",
        }));
      } else {
        await load();
      }
    } catch (e) {
      setError(e?.message || "Could not update assignment.");
    } finally {
      setSavingId(null);
    }
  };

  const selectValueFor = (r) => {
    if (selection[r.id] !== undefined) return selection[r.id];
    return r.assigned_authority_id != null ? String(r.assigned_authority_id) : "";
  };

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          All reports
        </h1>
        <p className="text-sm text-gray-300 max-w-3xl">
          System-wide oversight. Use <span className="text-amber-200/90">Assign office</span> to route a
          report to a specific authority. That office then sees it in their dashboard and can update status.
          Choose <span className="text-gray-200">Default (from category)</span> to clear an override and use
          the subcategory&apos;s mapped office again.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Status changes are still performed by the assigned office (authority login), not here.
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
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Receiving office</th>
                  <th className="p-3 font-medium min-w-[220px]">Assign office</th>
                  <th className="p-3 font-medium">Citizen</th>
                  <th className="p-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const subDefault = r.subcategory_authority_id;
                  const overrideActive =
                    r.assigned_authority_id != null && r.assigned_authority_id !== undefined;
                  return (
                    <tr key={r.id} className="border-b border-gray-800/80 align-top">
                      <td className="p-3 text-white max-w-[180px] truncate">{r.title || "—"}</td>
                      <td className="p-3 text-gray-300 whitespace-nowrap">{r.status_name || "—"}</td>
                      <td className="p-3 text-gray-300 max-w-[160px]">
                        <div className="truncate">{r.sub_category_name || r.category_name || "—"}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-amber-200/90">{r.authority_name || "—"}</div>
                        {overrideActive && (
                          <div className="text-[10px] text-amber-400/80 mt-0.5">Admin override</div>
                        )}
                        {!overrideActive && subDefault && (
                          <div className="text-[10px] text-gray-500 mt-0.5">From category map</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <select
                            className="bg-[#0e1030] border border-gray-600 rounded-md px-2 py-1.5 text-xs text-white min-w-[160px]"
                            value={selectValueFor(r)}
                            onChange={(e) => handleSelectChange(r.id, e.target.value)}
                            disabled={savingId === r.id}
                          >
                            <option value="">Default (from category)</option>
                            {authorities.map((a) => (
                              <option key={a.id} value={String(a.id)}>
                                {a.authority_name || a.email || `Office #${a.id}`}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={savingId === r.id || selectValueFor(r) === (r.assigned_authority_id != null ? String(r.assigned_authority_id) : "")}
                            onClick={() => handleSaveAssignment(r)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {savingId === r.id ? "Saving…" : "Apply"}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">{r.citizen_name || "—"}</td>
                      <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-6 text-gray-500 text-sm">No reports yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsReadOnly;
