import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
}

const colors = {
  blue:   "bg-blue-500/10 text-blue-400",
  green:  "bg-green-500/10 text-green-400",
  yellow: "bg-yellow-500/10 text-yellow-400",
  purple: "bg-purple-500/10 text-purple-400",
  red:    "bg-red-500/10 text-red-400",
};

export function StatCard({ title, value, sub, icon: Icon, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{title}</div>
        <div className="text-2xl font-bold text-foreground leading-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
