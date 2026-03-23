import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import RoleSelectionScreen from "./components/RoleSelectionScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

function AppContent() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const [activeView, setActiveView] = useState<
    "dashboard" | "projects" | "tasks" | "team" | "settings"
  >("dashboard");

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (isLoading || !isFetched) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (isFetched && (!userProfile || !userProfile.role)) {
    return <RoleSelectionScreen existingProfile={userProfile ?? null} />;
  }

  return (
    <Dashboard
      userProfile={userProfile!}
      activeView={activeView}
      setActiveView={setActiveView}
    />
  );
}
