import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

import Landing from "@/pages/landing";
import RoleSelection from "@/pages/auth/role-selection";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import AppLayout from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Club from "@/pages/club";
import Team from "@/pages/team";
import Events from "@/pages/events";
import Fees from "@/pages/fees";
import Payments from "@/pages/payments";
import PaymentSuccess from "@/pages/payment-success";
import Dependents from "@/pages/dependents";
import Posts from "@/pages/posts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading TeamHub...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show role selection if user has no roles (undefined, null, or empty array)
  if (user && (!user.roles || user.roles.length === 0)) {
    return <RoleSelection />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/club" component={Club} />
        <Route path="/team" component={Team} />
        <Route path="/events" component={Events} />
        <Route path="/fees" component={Fees} />
        <Route path="/payments" component={Payments} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/dependents" component={Dependents} />
        <Route path="/posts" component={Posts} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
