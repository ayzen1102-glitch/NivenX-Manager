import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ClipboardList, RefreshCw } from "lucide-react";

export default function AuditLog() {
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["auditlog"],
    queryFn: api.auditlog,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Last {logs.length} actions</p>
        </div>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
            No audit logs yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{log.action}</span>
                    {log.target && (
                      <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {log.target}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">by {log.performed_by}</span>
                    {log.details && (
                      <span className="text-xs text-muted-foreground truncate max-w-sm">{log.details}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
