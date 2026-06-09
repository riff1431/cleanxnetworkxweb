import { useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminDashboardSidebar from "./AdminDashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import DashboardHeaderBar from "@/components/dashboard/DashboardHeaderBar";

const AdminDashboardLayout = () => {
  const { user, loading, role, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && role && role !== "admin") {
      navigate(role === "cleaner" ? "/cleaner/dashboard" : "/dashboard", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role && role !== "admin") return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/40">
        <AdminDashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeaderBar
            variant="admin"
            messagesPath="/admin/messages"
            profilePath="/admin/settings"
          />
          <main className="flex-1 p-5 md:p-7 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardLayout;
