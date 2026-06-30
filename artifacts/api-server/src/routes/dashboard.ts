/**
 * NivenX Dashboard API Routes
 * Reads directly from the bot's SQLite database using node:sqlite.
 */

import { Router, type IRouter } from "express";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "fs";
import { join } from "path";

const router: IRouter = Router();

// process.cwd() is the package dir (/home/runner/workspace/artifacts/api-server)
const DB_PATH = join(process.cwd(), "../nivenx-bot/data/nivenx.db");
console.log("[Dashboard] DB_PATH resolved to:", DB_PATH);

function getDb() {
  if (!existsSync(DB_PATH)) return null;
  return new DatabaseSync(DB_PATH);
}

function withDb(handler: (db: DatabaseSync) => unknown) {
  const db = getDb();
  if (!db) return { error: "Database not found. Make sure the bot has started at least once." };
  try {
    const result = handler(db);
    db.close();
    return result;
  } catch (err: unknown) {
    db.close();
    throw err;
  }
}

// GET /api/dashboard/stats
router.get("/stats", (req, res) => {
  const data = withDb((db) => {
    const orderCount = (db.prepare("SELECT COUNT(*) as n FROM orders").get() as { n: number }).n;
    const ticketCount = (db.prepare("SELECT COUNT(*) as n FROM tickets WHERE status='open'").get() as { n: number }).n;
    const reviewStats = db.prepare("SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews").get() as { avg: number; total: number };
    const couponCount = (db.prepare("SELECT COUNT(*) as n FROM coupons WHERE active=1").get() as { n: number }).n;

    const statuses = ["Pending", "Awaiting Payment", "Paid", "In Progress", "Completed", "Cancelled"];
    const byStatus: Record<string, number> = {};
    for (const s of statuses) {
      byStatus[s] = (db.prepare("SELECT COUNT(*) as n FROM orders WHERE status=?").get(s) as { n: number }).n;
    }

    return {
      orders: { total: orderCount, byStatus },
      tickets: { open: ticketCount },
      reviews: { avg: reviewStats.avg ? Number(reviewStats.avg).toFixed(1) : null, total: reviewStats.total },
      coupons: { active: couponCount },
    };
  });
  res.json(data);
});

// GET /api/dashboard/orders
router.get("/orders", (req, res) => {
  const { status, limit = "50" } = req.query as { status?: string; limit?: string };
  const data = withDb((db) => {
    const rows = status
      ? db.prepare("SELECT * FROM orders WHERE status=? ORDER BY created_at DESC LIMIT ?").all(status, Number(limit))
      : db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?").all(Number(limit));

    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      details: (() => { try { return JSON.parse(r.details as string); } catch { return r.details; } })(),
    }));
  });
  res.json(data);
});

// GET /api/dashboard/orders/:id
router.get("/orders/:id", (req, res) => {
  const data = withDb((db) => {
    const row = db.prepare("SELECT * FROM orders WHERE order_id=?").get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...row, details: (() => { try { return JSON.parse(row.details as string); } catch { return row.details; } })() };
  });
  if (!data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

// PATCH /api/dashboard/orders/:id/status
router.patch("/orders/:id/status", (req, res) => {
  const { status } = req.body as { status: string };
  const allowed = ["Pending", "Awaiting Payment", "Paid", "In Progress", "Completed", "Cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  withDb((db) => {
    db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE order_id=?").run(status, req.params.id);
  });
  res.json({ success: true });
});

// GET /api/dashboard/tickets
router.get("/tickets", (req, res) => {
  const { status = "open" } = req.query as { status?: string };
  const data = withDb((db) =>
    db.prepare("SELECT * FROM tickets WHERE status=? ORDER BY created_at DESC LIMIT 100").all(status)
  );
  res.json(data);
});

// GET /api/dashboard/reviews
router.get("/reviews", (req, res) => {
  const data = withDb((db) =>
    db.prepare("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50").all()
  );
  res.json(data);
});

// GET /api/dashboard/coupons
router.get("/coupons", (req, res) => {
  const data = withDb((db) =>
    db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all()
  );
  res.json(data);
});

// DELETE /api/dashboard/coupons/:code
router.delete("/coupons/:code", (req, res) => {
  withDb((db) =>
    db.prepare("UPDATE coupons SET active=0 WHERE code=?").run(req.params.code.toUpperCase())
  );
  res.json({ success: true });
});

// POST /api/dashboard/coupons
router.post("/coupons", (req, res) => {
  const { code, discount_type, discount_value, max_uses = 1 } = req.body as {
    code: string; discount_type: string; discount_value: number; max_uses?: number;
  };
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: "code, discount_type, and discount_value are required" });
  }
  withDb((db) =>
    db.prepare("INSERT INTO coupons (code, discount_type, discount_value, max_uses, created_by) VALUES (?,?,?,?,?)")
      .run(code.toUpperCase(), discount_type, discount_value, max_uses, "dashboard")
  );
  res.json({ success: true });
});

// GET /api/dashboard/auditlog
router.get("/auditlog", (req, res) => {
  const data = withDb((db) =>
    db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50").all()
  );
  res.json(data);
});

// GET /api/dashboard/invoices
router.get("/invoices", (req, res) => {
  const data = withDb((db) =>
    db.prepare("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 100").all()
  );
  res.json(data);
});

export default router;
