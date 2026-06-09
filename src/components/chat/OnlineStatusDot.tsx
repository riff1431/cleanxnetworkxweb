import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface OnlineStatusDotProps {
  online: boolean;
  className?: string;
  size?: "sm" | "md";
}

const OnlineStatusDot = forwardRef<HTMLSpanElement, OnlineStatusDotProps>(
  ({ online, className, size = "sm" }, ref) => {
    const sizeClasses = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

    return (
      <span
        ref={ref}
        className={cn(
          "block rounded-full border-2 border-background",
          sizeClasses,
          online ? "bg-emerald-500" : "bg-muted-foreground/30",
          className
        )}
        title={online ? "Online" : "Offline"}
      />
    );
  }
);

OnlineStatusDot.displayName = "OnlineStatusDot";

export default OnlineStatusDot;
