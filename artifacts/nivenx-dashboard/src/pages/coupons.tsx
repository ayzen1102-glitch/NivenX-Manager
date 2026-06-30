import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tag, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Coupons() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: "", max_uses: "1" });
  const qc = useQueryClient();

  const { data: coupons = [], isLoading, refetch } = useQuery({
    queryKey: ["coupons"],
    queryFn: api.coupons,
  });

  const { mutate: createCoupon, isPending: creating } = useMutation({
    mutationFn: () =>
      api.createCoupon({
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: Number(form.max_uses),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created");
      setShowForm(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", max_uses: "1" });
    },
    onError: () => toast.error("Failed to create coupon"),
  });

  const { mutate: deleteCoupon } = useMutation({
    mutationFn: (code: string) => api.deleteCoupon(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deactivated");
    },
    onError: () => toast.error("Failed to deactivate coupon"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{coupons.filter((c) => c.active).length} active codes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Coupon
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Create Coupon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Value</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === "percentage" ? "20" : "10.00"}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Uses</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                placeholder="1"
                min="1"
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createCoupon()}
              disabled={creating || !form.code || !form.discount_value}
              className="text-xs bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create Coupon"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs bg-muted text-muted-foreground px-4 py-2 rounded-lg font-medium hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uses</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading coupons…
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No coupons yet
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-purple-400">{c.code}</span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{c.discount_type}</td>
                    <td className="px-4 py-3 text-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.uses} / {c.max_uses}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                        c.active
                          ? "bg-green-500/15 text-green-400 border-green-500/20"
                          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                      }`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.created_by}</td>
                    <td className="px-4 py-3">
                      {!!c.active && (
                        <button
                          onClick={() => deleteCoupon(c.code)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
