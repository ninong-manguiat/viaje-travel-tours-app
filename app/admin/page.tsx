import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, BookOpen, Calculator, CreditCard, FileText } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData, type DashboardModuleSummary } from "@/lib/admin-dashboard";
import { formatDate } from "@/lib/utils";

const moduleIcons: Record<DashboardModuleSummary["key"], typeof BookOpen> = {
  bookings: BookOpen,
  payments: CreditCard,
  quotations: Calculator,
  documents: FileText,
};

function activityDate(value: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return formatDate(date);
}

export default async function AdminDashboardPage() {
  const { modules, activities } = await getAdminDashboardData();

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Operations</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-viaje-soft">
          Monitor live bookings, payments, quotations, and document activity from Firestore.
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-viaje-navy">Module Status Overview</h2>
            <p className="text-sm text-viaje-soft">Counts are grouped by the current statuses used by each module.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = moduleIcons[module.key];
            return (
              <Link key={module.key} href={module.href as Route} className="group block h-full">
                <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <p className="mt-1 text-xs leading-5 text-viaje-soft">{module.description}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-viaje-red/10 text-viaje-red">
                      <Icon className="h-5 w-5" />
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Total Records</p>
                      <strong className="text-3xl text-viaje-navy">{module.total}</strong>
                    </div>
                    <div className="space-y-2">
                      {module.statuses.map((item) => (
                        <div key={item.status} className="flex items-center justify-between gap-3 rounded-[8px] border border-viaje-line bg-white px-3 py-2">
                          <StatusBadge status={item.status} />
                          <span className="font-semibold text-viaje-navy">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Client Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!activities.length && (
              <div className="rounded-[8px] border border-dashed border-viaje-line bg-viaje-paper p-5 text-sm text-viaje-soft">
                No recent client activity yet.
              </div>
            )}
            {activities.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-3 rounded-[8px] border border-viaje-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={activity.module} />
                    {activity.reference && <span className="font-mono text-xs font-semibold text-viaje-soft">{activity.reference}</span>}
                  </div>
                  <p className="mt-2 font-semibold text-viaje-navy">{activity.description}</p>
                  <p className="mt-1 text-xs text-viaje-soft">
                    {[activity.actorName, activityDate(activity.createdAt)].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <Link href={activity.href as Route}>
                  <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto">
                    View
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
