import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Pending:           "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Awaiting Payment": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Paid:              "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "In Progress":     "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  Completed:         "bg-green-500/15 text-green-400 border-green-500/20",
  Cancelled:         "bg-red-500/15 text-red-400 border-red-500/20",
  open:              "bg-green-500/15 text-green-400 border-green-500/20",
  closed:            "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  paid:              "bg-green-500/15 text-green-400 border-green-500/20",
  unpaid:            "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  overdue:           "bg-red-500/15 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", style)}>
      {status}
    </span>
  );
}
