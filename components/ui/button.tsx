import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-transparent text-sm font-semibold transition duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-viaje-red text-white hover:bg-viaje-red2",
        variant === "secondary" && "bg-viaje-navy2 text-white hover:bg-viaje-navy",
        variant === "outline" && "border-viaje-navy2 bg-transparent text-viaje-navy2 hover:bg-viaje-paperAlt",
        variant === "ghost" && "text-viaje-navy hover:bg-viaje-paperAlt",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        size === "default" && "h-12 px-6 py-3",
        size === "sm" && "h-9 px-4 text-xs",
        size === "icon" && "h-10 w-10",
        className
      )}
      {...props}
    />
  );
}
