import Link from "next/link";
import type { Route } from "next";
import { BarChart3, BookOpen, CreditCard, FileText, Globe2, LayoutDashboard, Package, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/transactions/new", label: "Transactions", icon: CreditCard },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/payments/verification", label: "Payments", icon: CreditCard },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/quotations", label: "Quotations", icon: BarChart3 },
  { href: "/", label: "Website", icon: Globe2 }
] satisfies Array<{ href: Route; label: string; icon: typeof LayoutDashboard }>;

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-viaje-paper lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-viaje-navy px-4 py-5 text-white/75 lg:block">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 pb-4 font-serif text-[17px] font-semibold text-white">
          <span className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 text-viaje-red2 after:rotate-[35deg] after:content-['✈']" />
          <span>Viaje Admin</span>
        </Link>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              <item.icon className="h-4 w-4 opacity-80" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        <div className="border-b border-viaje-line bg-white px-8 py-5 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Operations</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-viaje-navy2 text-xs font-bold text-white">VA</div>
          </div>
        </div>
        <div className="px-4 py-7 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
