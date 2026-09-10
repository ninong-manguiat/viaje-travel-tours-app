"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { BookOpen, CreditCard, FileText, LayoutDashboard, Menu, Package, PanelsTopLeft, ChevronLeft, WalletCards } from "lucide-react";

const groups = [
  {
    label: "DONE",
    items: [
      { href: "/admin/website-content", label: "Website Content", icon: PanelsTopLeft },
      { href: "/admin/packages", label: "Packages", icon: Package },
      { href: "/admin/payment-management", label: "Payment Management", icon: WalletCards },
      { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
      { href: "/admin/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "ON GOING",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/payments/verification", label: "Payments", icon: CreditCard },
    ],
  },
] satisfies Array<{ label: string; items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> }>;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`min-h-screen bg-viaje-paper lg:grid ${open ? "lg:grid-cols-[230px_1fr]" : "lg:grid-cols-[72px_1fr]"}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 h-screen bg-viaje-navy px-4 py-5 text-white/75 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${open ? "w-[230px] translate-x-0" : "w-[72px] -translate-x-full lg:translate-x-0"}`}>
        <div className="mb-6 flex items-center justify-between gap-2 px-1 pb-4">
          <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white" aria-label={open ? "Collapse sidebar" : "Open sidebar"}>
            {open ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="grid gap-1">
              {open && <p className="px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{group.label}</p>}
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-white/70 hover:bg-white/10 hover:text-white" title={item.label}>
                  <item.icon className="h-4 w-4 opacity-80" />
                  {open && item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-viaje-navy text-white shadow-lg lg:hidden" aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </button>
      )}
      <main>
        <div className="px-4 py-7 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
