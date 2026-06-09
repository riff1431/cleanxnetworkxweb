import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeaderBar from "./DashboardHeaderBar";

const DashboardLayout = () => {
  const { user, loading, role, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && role === "cleaner") navigate("/cleaner/dashboard", { replace: true });
  }, [role, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role === "cleaner") return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/40">
        <DashboardSidebar />
        <SidebarInset className="flex-1">
          <DashboardHeaderBar
            variant="customer"
            messagesPath="/dashboard/messages"
            profilePath="/dashboard/profile"
          />
          <main className="flex-1 p-5 md:p-7">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
