import { useEffect, useState } from "react";
import {
  Search, Trash2, Loader2,
  Users, MapPin, UtensilsCrossed, ChefHat, Sparkles, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../components/ui/button";
import DeleteConfirmModal from "./DeleteConfirmModal";

type TabKey = "users" | "providers" | "venues" | "restaurants" | "catering" | "decor";

type UserRow = {
  user_id: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  status: string | null;
  role_id: number;
  created_at: string | null;
  service_count?: number;
};

type ServiceRow = {
  id: number;
  name: string;
  city: string | null;
  status: string | null;
  rating: number | null;
  created_at: string | null;
  table: string;
  idCol: string;
  provider_name: string | null;
};

const SERVICE_CONFIGS = [
  { key: "venues"      as TabKey, label: "Venues",      table: "venues",               idCol: "venue_id",      icon: MapPin },
  { key: "restaurants" as TabKey, label: "Restaurants", table: "restaurants",           idCol: "restaurant_id", icon: UtensilsCrossed },
  { key: "catering"    as TabKey, label: "Catering",    table: "catering_services",     idCol: "catering_id",   icon: ChefHat },
  { key: "decor"       as TabKey, label: "Decor",       table: "decoration_services",   idCol: "decoration_id", icon: Sparkles },
];

const TABS = [
  { key: "users"       as TabKey, label: "Users",       icon: Users },
  { key: "providers"   as TabKey, label: "Providers",   icon: ShieldCheck },
  ...SERVICE_CONFIGS.map(({ key, label, icon }) => ({ key, label, icon })),
];

function matchSearch(q: string, ...fields: (string | null | undefined)[]) {
  if (!q.trim()) return true;
  const lq = q.toLowerCase();
  return fields.some(f => f?.toLowerCase().includes(lq));
}

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default function AdminManage() {
  const [activeTab, setActiveTab]   = useState<TabKey>("users");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState("");

  const [users, setUsers]           = useState<UserRow[]>([]);
  const [providers, setProviders]   = useState<UserRow[]>([]);
  const [services, setServices]     = useState<Record<string, ServiceRow[]>>({
    venues: [], restaurants: [], catering: [], decor: [],
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAction, setDeleteAction]       = useState<null | (() => Promise<void>)>(null);
  const [deleteText, setDeleteText]           = useState({ title: "", description: "" });

  const openDelete = (title: string, description: string, action: () => Promise<void>) => {
    setDeleteText({ title, description });
    setDeleteAction(() => action);
    setDeleteModalOpen(true);
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, providersRes, ...serviceResults] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("providers").select("provider_id, user_id"),
        ...SERVICE_CONFIGS.map(cfg =>
          supabase.from(cfg.table).select("*").order("created_at", { ascending: false })
        ),
      ]);
      if (usersRes.error) throw usersRes.error;

      const allUsers = (usersRes.data || []) as UserRow[];
      const providerRows = (providersRes.data || []) as { provider_id: number; user_id: string }[];

      // Maps for lookups
      const userIdToProviderId = Object.fromEntries(providerRows.map(p => [p.user_id, p.provider_id]));
      const providerIdToName = Object.fromEntries(
        providerRows.map(p => {
          const u = allUsers.find(u => u.user_id === p.user_id);
          return [p.provider_id, u ? `${u.name || ""} ${u.surname || ""}`.trim() || "—" : "—"];
        })
      );

      // Count services per provider_id across all tables
      const serviceCounts: Record<number, number> = {};
      serviceResults.forEach(res => {
        (res.data || []).forEach((row: any) => {
          if (row.provider_id) serviceCounts[row.provider_id] = (serviceCounts[row.provider_id] || 0) + 1;
        });
      });

      setUsers(allUsers.filter(u => u.role_id === 4));
      setProviders(allUsers.filter(u => u.role_id === 5).map(u => ({
        ...u,
        service_count: serviceCounts[userIdToProviderId[u.user_id]] || 0,
      })));

      const updated: Record<string, ServiceRow[]> = { venues: [], restaurants: [], catering: [], decor: [] };
      SERVICE_CONFIGS.forEach((cfg, i) => {
        const res = serviceResults[i];
        updated[cfg.key] = (res.data || []).map((row: any) => ({
          id:            row[cfg.idCol],
          name:          row.name,
          city:          row.city ?? null,
          status:        row.status ?? null,
          rating:        row.rating ?? null,
          created_at:    row.created_at ?? null,
          table:         cfg.table,
          idCol:         cfg.idCol,
          provider_name: providerIdToName[row.provider_id] ?? "—",
        }));
      });
      setServices(updated);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const deleteUser = (user: UserRow) => {
    openDelete(
      `Delete ${user.name || "account"}?`,
      "This account will be permanently deleted.",
      async () => {
        setDeleting(true);
        const { error } = await supabase.from("users").delete().eq("user_id", user.user_id);
        setDeleting(false);
        if (error) { toast.error(error.message); return; }
        setDeleteModalOpen(false);
        await loadData();
      },
    );
  };

  const deleteService = (svc: ServiceRow) => {
    openDelete(
      `Delete ${svc.name}?`,
      "This listing will be permanently removed.",
      async () => {
        setDeleting(true);
        const { error } = await supabase.from(svc.table).delete().eq(svc.idCol, svc.id);
        setDeleting(false);
        if (error) { toast.error(error.message); return; }
        setDeleteModalOpen(false);
        await loadData();
      },
    );
  };

  // counts per tab
  const counts: Record<TabKey, number> = {
    users:       users.length,
    providers:   providers.length,
    venues:      services.venues.length,
    restaurants: services.restaurants.length,
    catering:    services.catering.length,
    decor:       services.decor.length,
  };

  // filtered data
  const filteredUsers = users.filter(u =>
    matchSearch(search, u.name, u.surname, u.phone, u.status),
  );
  const filteredProviders = providers.filter(u =>
    matchSearch(search, u.name, u.surname, u.phone, u.status),
  );
  const filteredServices = (services[activeTab] ?? []).filter(s =>
    matchSearch(search, s.name, s.city, s.status),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  const isUserTab    = activeTab === "users" || activeTab === "providers";
  const currentUsers = activeTab === "users" ? filteredUsers : filteredProviders;

  return (
    <div className="min-h-screen bg-[#fdf7f8] p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">Manage</h1>
          <p className="mt-2 text-slate-500">View, search and remove users, providers, and service listings.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-3xl border bg-white shadow-sm">
          {/* Tab bar */}
          <div className="flex flex-wrap items-center gap-1 border-b px-6 pt-5 pb-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearch(""); }}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "border border-b-white border-[#EABAB0]/50 bg-white text-[#875A6B] -mb-px"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === key ? "bg-[#875A6B]/10 text-[#875A6B]" : "bg-slate-100 text-slate-500"
                }`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="relative mb-5 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}…`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#875A6B]/50 focus:outline-none focus:ring-2 focus:ring-[#875A6B]/10"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isUserTab ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Surname</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Joined</th>
                      {activeTab === "providers" && <th className="pb-3 pr-4">Services</th>}
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === "providers" ? 7 : 6} className="py-10 text-center text-slate-400">
                          {search ? "No results match your search." : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map(u => (
                        <tr key={u.user_id} className="group border-b last:border-none hover:bg-slate-50/60">
                          <td className="py-3.5 pr-4 font-medium text-slate-800">{u.name || "—"}</td>
                          <td className="pr-4 text-slate-600">{u.surname || "—"}</td>
                          <td className="pr-4 text-slate-500">{u.phone || "—"}</td>
                          <td className="pr-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {u.status || "—"}
                            </span>
                          </td>
                          <td className="pr-4 text-slate-400">{fmtDate(u.created_at)}</td>
                          {activeTab === "providers" && (
                            <td className="pr-4">
                              <span className="inline-block rounded-full bg-[#875A6B]/10 px-2.5 py-0.5 text-xs font-semibold text-[#875A6B]">
                                {u.service_count ?? 0}
                              </span>
                            </td>
                          )}
                          <td className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleting}
                              className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => deleteUser(u)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Provider</th>
                      <th className="pb-3 pr-4">City</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Rating</th>
                      <th className="pb-3 pr-4">Listed</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          {search ? "No results match your search." : "No listings found."}
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map(s => (
                        <tr key={s.id} className="group border-b last:border-none hover:bg-slate-50/60">
                          <td className="py-3.5 pr-4 font-medium text-slate-800">{s.name}</td>
                          <td className="pr-4 text-slate-600">{s.provider_name || "—"}</td>
                          <td className="pr-4 text-slate-600">{s.city || "—"}</td>
                          <td className="pr-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              s.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {s.status || "—"}
                            </span>
                          </td>
                          <td className="pr-4 text-slate-500">
                            {s.rating != null ? (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold text-[#875A6B]">{Number(s.rating).toFixed(1)}</span>
                                <span className="text-yellow-400">★</span>
                              </span>
                            ) : "—"}
                          </td>
                          <td className="pr-4 text-slate-400">{fmtDate(s.created_at)}</td>
                          <td className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleting}
                              className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => deleteService(s)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

      <DeleteConfirmModal
        open={deleteModalOpen}
        title={deleteText.title}
        description={deleteText.description}
        loading={deleting}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => { if (deleteAction) void deleteAction(); }}
      />
    </div>
  );
}
