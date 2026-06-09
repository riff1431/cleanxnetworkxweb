import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
  hasAccess: boolean;
  message?: string;
  className?: string;
}

const SubscriptionGate = ({ children, hasAccess, message = "Upgrade your plan to unlock this feature", className }: SubscriptionGateProps) => {
  const navigate = useNavigate();

  if (hasAccess) return <>{children}</>;

  return (
    <div className={`relative ${className || ""}`}>
      <div className="pointer-events-none opacity-40 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <Lock className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center mb-3 max-w-[200px]">{message}</p>
        <Button size="sm" onClick={() => navigate("/pricing")}>
          View Plans
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionGate;
