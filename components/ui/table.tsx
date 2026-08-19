import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-viaje-line", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-viaje-line transition-colors hover:bg-viaje-paper/70", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-11 px-4 text-left align-middle font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-viaje-soft", className)} {...props} />;
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}
