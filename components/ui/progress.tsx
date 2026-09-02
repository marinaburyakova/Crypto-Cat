// components/ui/progress.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Progress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: number }>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/50", className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";
