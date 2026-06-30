const BASE = "/api/dashboard";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface Stats {
  orders: { total: number; byStatus: Record<string, number> };
  tickets: { open: number };
  reviews: { avg: string | null; total: number };
  coupons: { active: number };
}

export interface Order {
  id: number;
  order_id: string;
  user_id: string;
  username: string;
  service: string;
  status: string;
  details: Record<string, string> | string;
  coupon_code?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  channel_id: string;
  user_id: string;
  username: string;
  category: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  closed_at?: string;
}

export interface Review {
  id: number;
  order_id: string;
  user_id: string;
  username: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  uses: number;
  max_uses: number;
  active: number;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  performed_by: string;
  target?: string;
  details?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_id: string;
  order_id: string;
  user_id: string;
  username: string;
  amount: number;
  currency: string;
  status: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

export const api = {
  stats: () => req<Stats>("/stats"),
  orders: (status?: string) =>
    req<Order[]>(`/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  updateOrderStatus: (id: string, status: string) =>
    req<{ success: boolean }>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  tickets: (status = "open") =>
    req<Ticket[]>(`/tickets?status=${encodeURIComponent(status)}`),
  reviews: () => req<Review[]>("/reviews"),
  coupons: () => req<Coupon[]>("/coupons"),
  createCoupon: (data: {
    code: string;
    discount_type: string;
    discount_value: number;
    max_uses: number;
  }) => req<{ success: boolean }>("/coupons", { method: "POST", body: JSON.stringify(data) }),
  deleteCoupon: (code: string) =>
    req<{ success: boolean }>(`/coupons/${code}`, { method: "DELETE" }),
  auditlog: () => req<AuditLog[]>("/auditlog"),
  invoices: () => req<Invoice[]>("/invoices"),
};
