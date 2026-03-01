import React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Agent from "./pages/Agent";
import Auth from "./pages/Auth";
import CreateProfile from "./pages/CreateProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Redirects unauthenticated users to login with return URL; after auth, they come back here. */
function AuthRequiredRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?redirect=${redirectTo}`} replace />;
  }
  return <>{children}</>;
}

function OwnerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profileId: authProfileId } = useAuth();
  const { profileId } = useParams<{ profileId: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (authProfileId !== profileId) return <Navigate to={`/${profileId}`} replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SonnerToaster richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/create" element={<Navigate to="/" replace />} />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Landing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:profileId"
              element={
                <AuthRequiredRoute>
                  <Index />
                </AuthRequiredRoute>
              }
            />
            <Route
              path="/:profileId/edit"
              element={
                <OwnerOnlyRoute>
                  <CreateProfile />
                </OwnerOnlyRoute>
              }
            />
            <Route
              path="/:profileId/agent"
              element={
                <AuthRequiredRoute>
                  <Agent />
                </AuthRequiredRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
