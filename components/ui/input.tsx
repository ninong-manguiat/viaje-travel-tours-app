import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("flex h-11 w-full rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 py-3 text-sm text-viaje-ink outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
    {...props}
  />
));
Input.displayName = "Input";
