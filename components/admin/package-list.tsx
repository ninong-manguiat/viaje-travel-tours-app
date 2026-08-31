"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { TravelPackage } from "@/lib/types";
import { formatPeso } from "@/lib/utils";

export function PackageList() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load packages")))
      .then((data) => setPackages(data.packages))
      .catch(() => setStatus("Unable to load package records."))
      .finally(() => setLoading(false));
  }, []);

  async function removePackage(packageId: string) {
    const response = await fetch(`/api/admin/packages/${packageId}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete package.");
      return;
    }
    setPackages((current) => current.filter((item) => item.id !== packageId));
    setStatus("Package deleted.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Packages</h1>
        </div>
        <Link href="/admin/packages/new/edit">
          <Button><Plus className="h-4 w-4" />New Package</Button>
        </Link>
      </div>
      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}
      <Card>
        <CardHeader><CardTitle>Package Management</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Cover</TH><TH>Title</TH><TH>Destination</TH><TH>Price</TH><TH>Dates</TH><TH>Status</TH><TH /></TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={7}>Loading packages...</TD></TR>}
              {!loading && packages.map((pkg) => (
                <TR key={pkg.id}>
                  <TD>
                    <div className="h-12 w-16 overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper">
                      {pkg.coverImageUrl ? (
                        <img src={pkg.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-viaje-paperAlt" />
                      )}
                    </div>
                  </TD>
                  <TD>{pkg.title}</TD>
                  <TD>{pkg.destination}</TD>
                  <TD>{formatPeso(pkg.price)}</TD>
                  <TD>{pkg.travelDates.length}</TD>
                  <TD><StatusBadge status={pkg.status} /></TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/packages/${pkg.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
                      <Button type="button" size="sm" variant="ghost" className="text-viaje-red" onClick={() => removePackage(pkg.id)} aria-label={`Delete ${pkg.title}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
