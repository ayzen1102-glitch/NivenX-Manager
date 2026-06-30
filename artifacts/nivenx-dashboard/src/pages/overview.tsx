import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ShoppingCart, Ticket, Star, Tag, Clock, CheckCircle, XCircle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#eab308",
  "Awaiting Payment": "#f97316",
  Paid: "#3b82f6",
  "In Progress": "#818cf8",
  Completed: "#22c55e",
  Cancelled: "#ef4444",
};

export default function Overview() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["stats"], queryFn: api.stats, refetchInterval: 30000 });
  const { data: orders } = useQuery({ queryKey: ["orders", "recent"], queryFn: () => api.orders() });
  const { data: reviews } = useQuery({ queryKey: ["reviews"], queryFn: api.reviews });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = stats?.orders?.byStatus
    ? Object.entries(stats.orders.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  const recentOrders = (Array.isArray(orders) ? orders : []).slice(0, 5);
  const recentReviews = (Array.isArray(reviews) ? reviews : []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">NivenX bot analytics at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.orders?.total ?? 0}
          sub="All time"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.tickets?.open ?? 0}
          sub="Awaiting response"
          icon={Ticket}
          color="yellow"
        />
        <StatCard
          title="Avg Rating"
          value={stats?.reviews?.avg ? `${stats.reviews.avg} ★` : "—"}
          sub={`${stats?.reviews?.total ?? 0} total reviews`}
          icon={Star}
          color="green"
        />
        <StatCard
          title="Active Coupons"
          value={stats?.coupons?.active ?? 0}
          sub="Valid discount codes"
          icon={Tag}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Orders by status chart */}
        <div className="xl:col-span-3 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Orders by Status</h2>
              <p className="text-xs text-muted-foreground">Distribution across all statuses</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          {chartData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220 8% 15%)",
                    border: "1px solid hsl(216 8% 22%)",
                    borderRadius: 8,
                    color: "hsl(210 40% 95%)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "hsl(216 8% 22%)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#818cf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick stats */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground mb-4">Order Summary</h2>
          {stats?.orders?.byStatus &&
            Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: STATUS_COLORS[status] ?? "#818cf8" }}
                  />
                  <span className="text-sm text-muted-foreground">{status}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.order_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary">{order.order_id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{order.service} · {order.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{review.username}</span>
                      <span className="text-xs text-yellow-400">{"★".repeat(review.rating)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground truncate">{review.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
