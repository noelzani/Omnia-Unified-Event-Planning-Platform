import { useEffect, useState, type ReactNode } from "react";
import { Users, Building2, Loader2 } from "lucide-react";
import {
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "../../../lib/supabase";

type MonthPoint    = { month: string; users: number; providers: number };
type PropPoint     = { month: string; count: number };
type GrowthPoint   = { month: string; total: number };
type CityPoint     = { city: string; count: number };
type BookingPoint  = { month: string; bookings: number };

const CITY_COLORS = ["#875A6B", "#9b6d7e", "#b07f91", "#c49aa6", "#EABAB0", "#d4c4c8", "#e0d0d4", "#ede0e3"];

const propertyTables = [
  { label: "Venues",      table: "venues",              idColumn: "venue_id" },
  { label: "Restaurants", table: "restaurants",         idColumn: "restaurant_id" },
  { label: "Catering",    table: "catering_services",   idColumn: "catering_id" },
  { label: "Decor",       table: "decoration_services", idColumn: "decoration_id" },
] as const;

function getLast12Months() {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    out.push({ key, label });
  }
  return out;
}

function countByMonth(records: { created_at: string | null }[]) {
  const counts: Record<string, number> = {};
  for (const r of records) {
    if (!r.created_at) continue;
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #EABAB0",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  fontSize: 12,
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userCount, setUserCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [propertyCounts, setPropertyCounts] = useState<{ label: string; count: number }[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);

  const [registrations, setRegistrations] = useState<MonthPoint[]>([]);
  const [propMonthly, setPropMonthly]       = useState<PropPoint[]>([]);
  const [providerGrowth, setProviderGrowth] = useState<GrowthPoint[]>([]);
  const [topCities, setTopCities]           = useState<CityPoint[]>([]);
  const [bookingTrend, setBookingTrend]     = useState<BookingPoint[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [usersRes, bookRes, ...propResults] = await Promise.all([
          supabase.from("users").select("created_at, role_id"),
          supabase.from("bookings").select("created_at"),
          ...propertyTables.map((t) => supabase.from(t.table).select("created_at, city")),
        ]);

        if (usersRes.error) throw usersRes.error;

        const allUsers     = usersRes.data || [];
        const regularUsers = allUsers.filter((u) => u.role_id === 4);
        const providers    = allUsers.filter((u) => u.role_id === 5);

        setUserCount(regularUsers.length);
        setProviderCount(providers.length);

        const propData = propResults.map((r, i) => ({
          label: propertyTables[i].label,
          rows: r.data || [],
        }));

        const counts = propData.map((p) => ({ label: p.label, count: p.rows.length }));
        setPropertyCounts(counts);
        setTotalProperties(counts.reduce((s, c) => s + c.count, 0));

        const allProps   = propData.flatMap((p) => p.rows);
        const bookings   = bookRes.data || [];
        const months     = getLast12Months();

        const usersByMonth     = countByMonth(regularUsers);
        const providersByMonth = countByMonth(providers);
        const propsByMonth     = countByMonth(allProps);
        const booksByMonth     = countByMonth(bookings);

        setRegistrations(months.map(({ key, label }) => ({
          month: label,
          users:     usersByMonth[key]     || 0,
          providers: providersByMonth[key] || 0,
        })));

        setPropMonthly(months.map(({ key, label }) => ({
          month: label,
          count: propsByMonth[key] || 0,
        })));

        const periodStart = new Date(months[0].key + "-01");
        let running = providers.filter((p) => p.created_at && new Date(p.created_at) < periodStart).length;
        setProviderGrowth(months.map(({ key, label }) => {
          running += providersByMonth[key] || 0;
          return { month: label, total: running };
        }));

        const cityCounts: Record<string, number> = {};
        for (const r of allProps) {
          if ((r as any).city) cityCounts[(r as any).city] = (cityCounts[(r as any).city] || 0) + 1;
        }
        setTopCities(
          Object.entries(cityCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([city, count]) => ({ city, count })),
        );

        setBookingTrend(months.map(({ key, label }) => ({
          month: label,
          bookings: booksByMonth[key] || 0,
        })));
      } catch (err: any) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf7f8] p-6">
      <div className="mx-auto max-w-7xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-500">Platform overview, trends, and growth insights.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <StatCard title="Users"      value={userCount}       icon={<Users />} />
          <StatCard title="Providers"  value={providerCount}   icon={<Users />} />
          <StatCard title="Properties" value={totalProperties} icon={<Building2 />} />
        </div>

        {/* Properties by type + Account split */}
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="text-base font-semibold text-slate-800">Properties by Type</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">Total listings across all categories</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={propertyCounts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#fdf7f8" }} formatter={(v: number) => [v, "Properties"]} />
                <Bar dataKey="count" fill="#875A6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-800">Account Split</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">Users vs providers breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Users",     value: userCount },
                    { name: "Providers", value: providerCount },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                >
                  <Cell fill="#875A6B" />
                  <Cell fill="#EABAB0" />
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "#64748b" }}>{v}</span>} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Accounts"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration timeline */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">New Registrations</h2>
          <p className="mb-5 mt-0.5 text-xs text-slate-400">Monthly new users & providers — last 12 months</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={registrations} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#875A6B" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#875A6B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9995A" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#C9995A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#64748b" }}>{v}</span>} />
              <Area type="monotone" dataKey="users"     name="Users"     stroke="#875A6B" strokeWidth={2} fill="url(#gU)" dot={false} />
              <Area type="monotone" dataKey="providers" name="Providers" stroke="#C9995A" strokeWidth={2} fill="url(#gP)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* New listings + provider growth */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">New Listings Per Month</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">All service types combined</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={propMonthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Listings"]} />
                <Bar dataKey="count" name="Listings" fill="#875A6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">Provider Growth</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">Cumulative registered providers over time</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={providerGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Providers"]} />
                <Line type="monotone" dataKey="total" name="Providers" stroke="#C9995A" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top cities + booking volume */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">Top Cities</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">Cities with the most service listings</p>
            {topCities.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No city data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCities} layout="vertical" margin={{ top: 4, right: 8, left: 55, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Listings"]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {topCities.map((_, i) => <Cell key={i} fill={CITY_COLORS[i] ?? "#EABAB0"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">Booking Volume</h2>
            <p className="mb-5 mt-0.5 text-xs text-slate-400">Monthly bookings placed on the platform</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={bookingTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#875A6B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#875A6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Bookings"]} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#875A6B" strokeWidth={2} fill="url(#gB)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border bg-white p-6 shadow-sm">
      <div>
        <p className="text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-bold">{value}</h3>
      </div>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EABAB0]/40 text-[#875A6B]">
        {icon}
      </div>
    </div>
  );
}
