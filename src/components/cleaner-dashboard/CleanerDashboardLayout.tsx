import { useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import CleanerDashboardSidebar from "./CleanerDashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import DashboardHeaderBar from "@/components/dashboard/DashboardHeaderBar";

const CleanerDashboardLayout = () => {
  const { user, loading, role, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && role && role !== "cleaner") navigate("/dashboard", { replace: true });
  }, [role, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role && role !== "cleaner") return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/40">
        <CleanerDashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeaderBar
            variant="cleaner"
            messagesPath="/cleaner/messages"
            profilePath="/cleaner/profile"
          />
          <main className="flex-1 p-5 md:p-7 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CleanerDashboardLayout;
