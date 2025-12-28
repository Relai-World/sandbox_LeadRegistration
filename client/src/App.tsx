import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import Leads from "@/pages/Leads";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

// Public Route Wrapper (redirects to dashboard if logged in)
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicRoute component={Landing} />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/properties">
        <ProtectedRoute component={Properties} />
      </Route>
      
      <Route path="/leads">
        <ProtectedRoute component={Leads} />
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
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
