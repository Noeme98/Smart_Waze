import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { authorityAPI, subCategoryAPI } from "../../services/api";

const emptyForm = {
  authority_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

const AdminAuthorities = () => {
  const [rows, setRows] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mappedIds, setMappedIds] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  const loadAuthorities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorityAPI.list();
      setRows(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      setError(e?.message || "Could not load office accounts.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthorities();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSubsLoading(true);
      try {
        const data = await subCategoryAPI.getAll();
        const list = Array.isArray(data) ? data : data?.results || [];
        if (!cancelled) setSubcategories(list);
      } catch {
        if (!cancelled) setSubcategories([]);
      } finally {
        if (!cancelled) setSubsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedSubs = useMemo(() => {
    const m = new Map();
    for (const s of subcategories) {
      const cat = s.category_name || "Other";
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat).push(s);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [subcategories]);

  const openCreate = () => {
    setForm(emptyForm);
    setMappedIds(new Set());
    setModal("create");
  };

  const openEdit = (row) => {
    setForm({
      authority_name: row.authority_name || "",
      email: row.email || "",
      password: "",
      confirm_password: "",
      id: row.id,
    });
    const ids = (row.mapped_subcategories || []).map((x) => x.id);
    setMappedIds(new Set(ids));
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setForm(emptyForm);
    setMappedIds(new Set());
  };

  const toggleSub = (id) => {
    setMappedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const routing = { mapped_subcategory_ids: Array.from(mappedIds) };
      if (modal === "create") {
        await authorityAPI.create({
          authority_name: form.authority_name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirm_password: form.confirm_password,
          ...routing,
        });
      } else if (modal === "edit" && form.id) {
        const payload = {
          authority_name: form.authority_name.trim(),
          email: form.email.trim(),
          ...routing,
        };
        if (form.password) {
          payload.password = form.password;
          payload.confirm_password = form.confirm_password;
        }
        await authorityAPI.patch(form.id, payload);
      }
      closeModal();
      await loadAuthorities();
    } catch (e) {
      const d = e?.response?.data;
      const msg =
        (typeof d === "object" && d?.mapped_subcategory_ids?.[0]) ||
        d?.message ||
        e?.message ||
        "Save failed.";
      setError(Array.isArray(msg) ? msg.join(" ") : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this office account? Reports already routed stay in the database.")) return;
    setError(null);
    try {
      await authorityAPI.delete(id);
      await loadAuthorities();
    } catch (e) {
      setError(e?.message || "Delete failed.");
    }
  };

  const routingSummary = (row) => {
    const n = row.mapped_subcategories?.length ?? 0;
    if (n === 0) return "—";
    return `${n} type${n === 1 ? "" : "s"}`;
  };

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
            Office accounts
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl">
            Create authority logins and <span className="text-amber-200/90">tick the report types</span> each
            office handles. New citizen reports use this map automatically (subcategory → office). Use{" "}
            <span className="text-gray-200">All reports</span> only when you need a one-off override.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold transition-colors"
        >
          <Plus size={18} />
          Add office account
        </button>
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
                  <th className="p-3 font-medium">Office name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Default routing</th>
                  <th className="p-3 font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800/80 hover:bg-[#0F0C1F]/50">
                    <td className="p-3 text-white">{r.authority_name}</td>
                    <td className="p-3 text-gray-300">{r.email}</td>
                    <td className="p-3 text-amber-200/90">{routingSummary(r)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-md text-amber-400 hover:bg-white/5"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-md text-red-400 hover:bg-white/5"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-6 text-gray-500 text-sm">No office accounts yet.</p>}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[#1E1C3A] border border-gray-600 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {modal === "create" ? "New office account" : "Edit office account"}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Office name</label>
                <input
                  className="w-full bg-[#0F0C1F] border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={form.authority_name}
                  onChange={(e) => setForm({ ...form, authority_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full bg-[#0F0C1F] border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {modal === "edit" ? "New password (optional)" : "Password"}
                </label>
                <input
                  type="password"
                  className="w-full bg-[#0F0C1F] border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Confirm password</label>
                <input
                  type="password"
                  className="w-full bg-[#0F0C1F] border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                />
              </div>

              <div className="pt-2 border-t border-gray-700/60">
                <label className="block text-xs text-amber-200/90 mb-1">
                  Report types this office receives (automatic routing)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Each issue type can go to only one office. Choosing it here moves routing from any other
                  office that had it before.
                </p>
                {subsLoading ? (
                  <p className="text-gray-500 text-sm py-2">Loading categories…</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-700 bg-[#0F0C1F]/80 p-3 space-y-3">
                    {groupedSubs.map(([categoryName, subs]) => (
                      <div key={categoryName}>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">
                          {categoryName}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {subs.map((s) => (
                            <label
                              key={s.id}
                              className="flex items-start gap-2 text-xs text-gray-200 cursor-pointer hover:text-white"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-gray-500"
                                checked={mappedIds.has(s.id)}
                                onChange={() => toggleSub(s.id)}
                              />
                              <span>{s.sub_category_display || s.sub_category}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuthorities;
