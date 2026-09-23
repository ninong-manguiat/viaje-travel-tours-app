import type { ReactNode } from "react";
import type { PaymentMethod } from "@/lib/payment-methods";

export function PaymentMethodButtonContent({ method }: { method: PaymentMethod }) {
  return (
    <div className="flex min-h-12 items-center gap-3 p-4 font-semibold text-viaje-navy">
      {method.bankLogoUrl && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-viaje-line bg-white p-1">
          <img src={method.bankLogoUrl} alt="" className="max-h-full w-full object-contain" />
        </span>
      )}
      <span className="min-w-0 break-words">{method.bank}</span>
    </div>
  );
}

export function PaymentMethodQrImage({ method, className = "" }: { method: PaymentMethod; className?: string }) {
  if (!method.qrImageUrl) return null;

  return (
    <img
      src={method.qrImageUrl}
      alt={`${method.bank} payment QR`}
      className={`aspect-square w-full rounded-lg border border-viaje-line object-cover ${className}`}
    />
  );
}

export function PaymentMethodDetails({ method, referenceAction }: { method: PaymentMethod; referenceAction?: ReactNode }) {
  return (
    <div className="rounded-lg border border-viaje-line bg-viaje-paper p-4 text-sm">
      <p className="font-semibold text-viaje-navy">{method.bank}</p>
      {method.accountName && (
        <p className="mt-1 text-viaje-soft">
          Account Name: <strong className="text-viaje-navy">{method.accountName}</strong>
        </p>
      )}
      <p className="mt-1 flex flex-wrap items-center gap-2 text-viaje-soft">
        <span>Account Number: <strong className="text-viaje-navy">{method.referenceNumber}</strong></span>
        {referenceAction}
      </p>
    </div>
  );
}
