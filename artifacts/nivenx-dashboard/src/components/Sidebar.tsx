import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Ticket,
  Star,
  Tag,
  FileText,
  ClipboardList,
  Bot,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/coupons", label: "Coupons", icon: Tag },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/auditlog", label: "Audit Log", icon: ClipboardList },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-foreground leading-tight">NivenX</div>
          <div className="text-xs text-muted-foreground">Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Management
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Bot online</span>
        </div>
      </div>
    </aside>
  );
}
