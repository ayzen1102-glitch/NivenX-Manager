import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import Overview from "@/pages/overview";
import Orders from "@/pages/orders";
import Tickets from "@/pages/tickets";
import Reviews from "@/pages/reviews";
import Coupons from "@/pages/coupons";
import Invoices from "@/pages/invoices";
import AuditLog from "@/pages/auditlog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000 },
  },
});

function NotFound() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Page not found
    </div>
  );
}

function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Switch>
            <Route path="/" component={Overview} />
            <Route path="/orders" component={Orders} />
            <Route path="/tickets" component={Tickets} />
            <Route path="/reviews" component={Reviews} />
            <Route path="/coupons" component={Coupons} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/auditlog" component={AuditLog} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout />
      </WouterRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(220 8% 15%)",
            border: "1px solid hsl(216 8% 22%)",
            color: "hsl(210 40% 95%)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
