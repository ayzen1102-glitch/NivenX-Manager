import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Order } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ShoppingCart, Search, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["All", "Pending", "Awaiting Payment", "Paid", "In Progress", "Completed", "Cancelled"];

export default function Orders() {
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["orders", filterStatus],
    queryFn: () => api.orders(filterStatus === "All" ? undefined : filterStatus),
    refetchInterval: 30000,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateOrderStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Order status updated");
      setUpdatingId(null);
    },
    onError: () => {
      toast.error("Failed to update order status");
      setUpdatingId(null);
    },
  });

  const filtered = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.username.toLowerCase().includes(search.toLowerCase()) ||
      o.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} orders</p>
        </div>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors border ${
                filterStatus === s
                  ? "bg-primary text-white border-primary"
                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coupon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading orders…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.order_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-primary font-semibold">{order.order_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{order.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{order.service}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      {order.coupon_code ? (
                        <span className="font-mono text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">
                          {order.coupon_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDropdown
                        current={order.status}
                        orderId={order.order_id}
                        loading={updatingId === order.order_id}
                        onSelect={(status) => {
                          setUpdatingId(order.order_id);
                          updateStatus({ id: order.order_id, status });
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({
  current,
  orderId,
  loading,
  onSelect,
}: {
  current: string;
  orderId: string;
  loading: boolean;
  onSelect: (s: string) => void;
}) {
  const statuses = ["Pending", "Awaiting Payment", "Paid", "In Progress", "Completed", "Cancelled"];
  return (
    <div className="relative inline-block">
      {loading ? (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        <select
          value={current}
          onChange={(e) => onSelect(e.target.value)}
          className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none pr-6"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}
