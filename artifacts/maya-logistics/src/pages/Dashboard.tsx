import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetRecentShipments,
  useGetRevenueTrend,
  useListShipments,
  getGetDashboardSummaryQueryKey,
  getGetRecentShipmentsQueryKey,
  getGetRevenueTrendQueryKey,
  getListShipmentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  Banknote,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatNPR, statusBadgeClass, statusLabel, cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-secondary">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            accent,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const summary = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const recent = useGetRecentShipments({
    query: { queryKey: getGetRecentShipmentsQueryKey() },
  });
  const trend = useGetRevenueTrend({
    query: { queryKey: getGetRevenueTrendQueryKey() },
  });

  if (summary.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const s = summary.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-secondary">Operations Overview</h1>
        <p className="mt-1 text-gray-600">
          Live view of shipments moving through the Maya network.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Shipments"
          value={String(s?.totalShipments ?? 0)}
          icon={Package}
          accent="bg-secondary/10 text-secondary"
          hint={`${s?.shipmentsThisMonth ?? 0} this month`}
        />
        <StatCard
          label="In Transit"
          value={String(s?.inTransit ?? 0)}
          icon={Truck}
          accent="bg-blue-100 text-blue-600"
          hint={`${s?.pending ?? 0} pending pickup`}
        />
        <StatCard
          label="Delivered"
          value={String(s?.delivered ?? 0)}
          icon={CheckCircle}
          accent="bg-emerald-100 text-emerald-600"
          hint={formatNPR(s?.deliveredRevenue ?? 0) + " collected"}
        />
        <StatCard
          label="Total Revenue"
          value={formatNPR(s?.totalRevenue ?? 0)}
          icon={Banknote}
          accent="bg-primary/10 text-primary"
          hint={formatNPR(s?.revenueThisMonth ?? 0) + " this month"}
        />
        <StatCard
          label="Customers"
          value={String(s?.totalCustomers ?? 0)}
          icon={Users}
          accent="bg-violet-100 text-violet-600"
        />
        <StatCard
          label="Staff"
          value={String(s?.totalStaff ?? 0)}
          icon={Users}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Avg. Shipment Cost"
          value={formatNPR(s?.avgShipmentCost ?? 0)}
          icon={TrendingUp}
          accent="bg-rose-100 text-rose-600"
        />
        <StatCard
          label="Pending Bookings"
          value={String(s?.pending ?? 0)}
          icon={Clock}
          accent="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-secondary">
              Revenue & Volume — last 12 months
            </h2>
            <p className="text-sm text-gray-500">
              Monthly cargo bookings vs. total revenue.
            </p>
          </div>
        </div>
        <div className="h-72">
          {trend.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data ?? []}>
                <defs>
                  <linearGradient id="g-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-shipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => format(parseISO(`${v}-01`), "MMM")}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? formatNPR(value) : value
                  }
                  labelFormatter={(v) =>
                    format(parseISO(`${v}-01`), "MMMM yyyy")
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  fill="url(#g-revenue)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="shipments"
                  stroke="#1e3a8a"
                  fill="url(#g-shipments)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary">Recent Shipments</h2>
          <Link href="/shipments">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recent.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (recent.data ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No shipments yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3">Tracking</th>
                  <th className="py-3">Route</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent.data ?? []).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/shipments/${row.id}`}
                        className="font-mono font-semibold text-secondary hover:text-primary"
                      >
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.customerName ?? "—"}
                    </td>
                    <td className="py-3 font-semibold text-secondary">
                      {formatNPR(row.cost)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const list = useListShipments(undefined, {
    query: { queryKey: getListShipmentsQueryKey() },
  });
  const shipments = list.data ?? [];
  const totalSpent = shipments.reduce((sum, s) => sum + Number(s.cost), 0);
  const active = shipments.filter((s) => s.status !== "delivered");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-secondary">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your shipments and book new freight from your dashboard.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Total Shipments"
          value={String(shipments.length)}
          icon={Package}
          accent="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Active Shipments"
          value={String(active.length)}
          icon={Truck}
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Total Spent"
          value={formatNPR(totalSpent)}
          icon={Banknote}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary">Your Shipments</h2>
          <Link href="/shipments/new">
            <Button className="bg-primary hover:bg-primary/90">
              Book a shipment
            </Button>
          </Link>
        </div>
        {list.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              You haven't booked any shipments yet.
            </p>
            <Link href="/shipments/new">
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                Book your first shipment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3">Tracking</th>
                  <th className="py-3">Route</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/shipments/${row.id}`}
                        className="font-mono font-semibold text-secondary hover:text-primary"
                      >
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="py-3 font-semibold text-secondary">
                      {formatNPR(row.cost)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      {user?.role === "customer" ? <CustomerDashboard /> : <StaffDashboard />}
      <WhatsAppButton />
    </>
  );
}
