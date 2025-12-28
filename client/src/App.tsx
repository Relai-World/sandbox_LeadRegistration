import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminIndex from "./pages/AdminIndex";
import AgentIndex from "./pages/AgentIndex";
import NotFound from "./pages/NotFound";
import SharePage from "./pages/SharePage";

const queryClient = new QueryClient();

// Protected Route component - simplified
const ProtectedRoute = ({ children, requiredUserType }: { children: React.ReactNode, requiredUserType?: 'admin' | 'agent' }) => {
  return <>{children}</>;
};

// Main App component with routing logic
const AppRoutes = () => {
  const { isAuthenticated, userType } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? (userType === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/agent" replace />)
            : <Navigate to="/agent" replace />
        } 
      />
      <Route 
        path="/admin" 
        element={
          isAuthenticated && userType === 'admin' 
            ? <AdminIndex />
            : <AdminIndex />
        } 
      />
      <Route 
        path="/agent" 
        element={<AgentIndex />} 
      />
      <Route 
        path="/share/:token" 
        element={<SharePage />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
