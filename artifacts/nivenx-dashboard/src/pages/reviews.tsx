import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Star, RefreshCw } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { data: rawReviews, isLoading, refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: api.reviews,
    refetchInterval: 60000,
  });
  const reviews = Array.isArray(rawReviews) ? rawReviews : [];

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
    pct: reviews.length ? (reviews.filter((r) => r.rating === n).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{reviews.length} total reviews</p>
        </div>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-foreground mb-1">{avg ?? "—"}</div>
          {avg && <StarRating rating={Math.round(Number(avg))} />}
          <p className="text-xs text-muted-foreground mt-2">{reviews.length} reviews</p>
        </div>

        {/* Distribution */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-2">
          {distribution.map(({ n, count, pct }) => (
            <div key={n} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-4 text-right">{n}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 flex items-center justify-center py-12 text-muted-foreground gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Star className="w-8 h-8 mb-2 opacity-30" />
            No reviews yet
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {r.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{r.username}</span>
                </div>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-primary">{r.order_id}</span>
                <span>·</span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
