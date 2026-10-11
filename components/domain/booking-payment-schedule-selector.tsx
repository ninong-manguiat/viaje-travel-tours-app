"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/utils";

type PaymentScheduleItem = {
  id?: string;
  label?: string;
  amount?: number;
  dueDate?: string;
  status?: string;
};

function isPayable(status?: string) {
  return ["pending", "unpaid", "rejected"].includes(String(status || "pending").toLowerCase());
}

export function BookingPaymentScheduleSelector({
  token,
  schedule,
}: {
  token: string;
  schedule: PaymentScheduleItem[];
}) {
  const payableIds = useMemo(() => schedule.filter((item) => item.id && isPayable(item.status)).map((item) => String(item.id)), [schedule]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedItems = schedule.filter((item) => item.id && selectedIds.includes(String(item.id)) && payableIds.includes(String(item.id)));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paymentHref = selectedIds.length
    ? `/book/${encodeURIComponent(token)}/payment?schedules=${encodeURIComponent(selectedIds.join(","))}`
    : "";

  function toggle(id: string) {
    if (!payableIds.includes(id)) return;
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="space-y-5">
      <Table>
        <THead>
          <TR>
            <TH className="w-12">Pay</TH>
            <TH>Payment</TH>
            <TH>Amount</TH>
            <TH>Due Date</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {!schedule.length && <TR><TD colSpan={5}>No payment schedule available.</TD></TR>}
          {schedule.map((item, index) => {
            const id = String(item.id || "");
            const payable = Boolean(id && payableIds.includes(id));
            return (
              <TR key={item.id || `${item.label}-${index}`}>
                <TD>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-viaje-line accent-viaje-red disabled:cursor-not-allowed disabled:opacity-40"
                    checked={Boolean(id && selectedIds.includes(id))}
                    disabled={!payable}
                    onChange={() => toggle(id)}
                    aria-label={`Select ${item.label || `Payment ${index + 1}`}`}
                  />
                </TD>
                <TD>{item.label || `Payment ${index + 1}`}</TD>
                <TD>{formatPeso(Number(item.amount || 0))}</TD>
                <TD>{item.dueDate ? formatDate(item.dueDate) : "N/A"}</TD>
                <TD><StatusBadge status={item.status || "pending"} /></TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      <div className="rounded-[10px] border border-viaje-line bg-viaje-paper p-4">
        <h3 className="font-serif text-lg font-semibold text-viaje-navy">Selected Payments</h3>
        <div className="mt-3 space-y-2 text-sm">
          {selectedItems.length ? selectedItems.map((item) => (
            <div key={item.id} className="flex justify-between gap-4">
              <span>{item.label || "Selected payment"}</span>
              <strong className="text-viaje-navy">{formatPeso(Number(item.amount || 0))}</strong>
            </div>
          )) : (
            <p className="text-viaje-soft">Select one or more payable schedules to continue.</p>
          )}
          <div className="flex justify-between gap-4 border-t border-viaje-line pt-3 text-base">
            <span className="font-semibold text-viaje-navy">Total Selected</span>
            <strong className="text-viaje-navy">{formatPeso(selectedTotal)}</strong>
          </div>
        </div>
        {paymentHref ? (
          <Link href={paymentHref as Route} className="mt-4 block">
            <Button className="w-full">Continue Payment</Button>
          </Link>
        ) : (
          <Button className="mt-4 w-full" disabled>Continue Payment</Button>
        )}
      </div>
    </div>
  );
}
