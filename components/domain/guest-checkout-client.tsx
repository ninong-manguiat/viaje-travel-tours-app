"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isoCountryCodes } from "@/lib/countries";
import type { TravelPackage } from "@/lib/types";
import { formatDate, formatPeso } from "@/lib/utils";

const steps = [
  { id: "guests", label: "Guests" },
  { id: "payment", label: "Payment" },
] as const;
const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const inputClass = "h-11 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 text-sm text-viaje-ink outline-none focus-visible:ring-2 focus-visible:ring-ring";
type CheckoutStep = typeof steps[number]["id"];

type Guest = {
  firstName: string;
  lastName: string;
  nationality: string;
  isPwd: boolean;
  passportNumber: string;
};

type GroupContact = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  emailAddress: string;
};

export type GuestCheckoutDraft = {
  id: string;
  status: "draft" | "completed";
  packageId: string;
  packageSlug: string;
  departureId: string;
  addonId: string;
  pax: number;
  guests: Guest[];
  groupContact: GroupContact;
  useGuestOne?: boolean;
  paymentMethodId: string;
  paymentProofUrl: string;
  paymentReference: string;
  currentStep: CheckoutStep;
};

type ValidationErrors = Record<string, string>;

const paymentMethods = [
  { id: "gcash", label: "GCash", color: "#0b5cff" },
  { id: "bdo", label: "BDO", color: "#0b4ea2" },
  { id: "bpi", label: "BPI", color: "#ad3630" },
];

function paymentImage(label: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" rx="28" fill="#ffffff"/><rect x="24" y="24" width="272" height="272" rx="20" fill="${color}" opacity="0.1"/><path d="M72 72h64v64H72zM184 72h64v64h-64zM72 184h64v64H72z" fill="${color}"/><path d="M184 184h24v24h-24zM224 184h24v64h-24zM184 224h24v24h-24z" fill="${color}"/><text x="160" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="${color}">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function upper(value: string) {
  return value.toUpperCase();
}

function newGuest(): Guest {
  return { firstName: "", lastName: "", nationality: "PH", isPwd: false, passportNumber: "" };
}

function normalizedStep(value?: string): CheckoutStep {
  return value === "payment" ? "payment" : "guests";
}

function normalizeGuests(value: Guest[] | undefined, count: number) {
  const existing = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => ({ ...newGuest(), ...existing[index] }));
}

function hasGuestInfo(guests: Guest[], groupContact: GroupContact) {
  return guests.every((guest) => guest.firstName && guest.lastName && guest.nationality) &&
    Boolean(groupContact.firstName && groupContact.lastName && groupContact.mobileNumber && groupContact.emailAddress);
}

function validateGuestStep(guests: Guest[], groupContact: GroupContact) {
  const errors: ValidationErrors = {};

  guests.forEach((guest, index) => {
    if (!guest.firstName.trim()) errors[`guest-${index}-firstName`] = `Guest ${index + 1} first name is required.`;
    if (!guest.lastName.trim()) errors[`guest-${index}-lastName`] = `Guest ${index + 1} last name is required.`;
    if (!guest.nationality.trim()) errors[`guest-${index}-nationality`] = `Guest ${index + 1} nationality is required.`;
  });

  if (!groupContact.firstName.trim()) errors.contactFirstName = "Group contact first name is required.";
  if (!groupContact.lastName.trim()) errors.contactLastName = "Group contact last name is required.";
  if (!groupContact.mobileNumber.trim()) errors.contactMobileNumber = "Group contact mobile number is required.";
  if (!groupContact.emailAddress.trim()) errors.contactEmailAddress = "Group contact email address is required.";

  return errors;
}

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function SummaryRows({
  pkg,
  selectedDeparture,
  selectedAddon,
  pax,
  finalAmount,
}: {
  pkg: TravelPackage;
  selectedDeparture: TravelPackage["travelDates"][number] | null;
  selectedAddon: TravelPackage["addons"][number] | null;
  pax: number;
  finalAmount: number;
}) {
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><span>Selected departure</span>
        <strong>
        {selectedDeparture ? (
              <>
                {formatDate(selectedDeparture.startDate)} -
                <br />
                {formatDate(selectedDeparture.endDate)}
              </>
              ) : (
              "TBD"
              )}
        </strong>
      </div>
      <div className="flex justify-between gap-4"><span>Selected add-on</span><strong>{selectedAddon?.label ?? "None"}</strong></div>
      <div className="flex justify-between gap-4"><span>Number of guests</span><strong>{pax}</strong></div>
      <div className="flex justify-between gap-4"><span>Package/base amount</span><strong>{formatPeso(pkg.price)}</strong></div>
      <div className="flex justify-between gap-4"><span>Departure additional amount</span><strong>{formatPeso(departureAdditionalAmount)}</strong></div>
      <div className="flex justify-between gap-4"><span>Add-on amount</span><strong>{formatPeso(addonAmount)}</strong></div>
      <div className="border-t border-viaje-line pt-3">
        <div className="flex justify-between gap-4 text-lg text-viaje-navy"><span className="font-semibold">Final amount</span><strong>{formatPeso(finalAmount)}</strong></div>
      </div>
    </div>
  );
}

export function GuestCheckoutClient({
  pkg,
  departureId,
  addonId,
  pax,
  draft,
  requestedStep,
}: {
  pkg: TravelPackage;
  departureId: string;
  addonId: string;
  pax: number;
  draft?: GuestCheckoutDraft;
  requestedStep?: string;
}) {
  const router = useRouter();
  const initialGuestCount = Math.max(1, Math.floor(draft?.pax ?? pax));
  const initialDepartureId = draft?.departureId ?? departureId;
  const initialAddonId = draft?.addonId ?? addonId;
  const initialGuests = normalizeGuests(draft?.guests, initialGuestCount);
  const initialGroupContact = draft?.groupContact ?? { firstName: "", lastName: "", mobileNumber: "", emailAddress: "" };
  const initialStep = normalizedStep(requestedStep ?? draft?.currentStep);
  const [draftId, setDraftId] = useState(draft?.id ?? "");
  const [draftStatus, setDraftStatus] = useState<GuestCheckoutDraft["status"]>(draft?.status ?? "draft");
  const [step, setStep] = useState<CheckoutStep>(initialStep === "payment" && !hasGuestInfo(initialGuests, initialGroupContact) ? "guests" : initialStep);
  const [guestCount] = useState(initialGuestCount);
  const [selectedDepartureId] = useState(initialDepartureId);
  const [selectedAddonId] = useState(initialAddonId);
  const selectedDeparture = pkg.travelDates.find((item) => item.id === selectedDepartureId) ?? pkg.travelDates[0] ?? null;
  const selectedAddon = pkg.addons.find((item) => item.id === selectedAddonId) ?? null;
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const finalAmount = (pkg.price + departureAdditionalAmount + addonAmount) * guestCount;
  const changeDetailsHref = `/packages/${pkg.slug}?departureId=${selectedDeparture?.id ?? ""}&addonId=${selectedAddon?.id ?? "none"}&pax=${guestCount}`;
  const [guests, setGuests] = useState<Guest[]>(() => initialGuests);
  const [groupContact, setGroupContact] = useState<GroupContact>(initialGroupContact);
  const [useGuestOne, setUseGuestOne] = useState(Boolean(draft?.useGuestOne));
  const [paymentMethodId, setPaymentMethodId] = useState(draft?.paymentMethodId ?? paymentMethods[0].id);
  const [paymentProofUrl, setPaymentProofUrl] = useState(draft?.paymentProofUrl ?? "");
  const [paymentReference, setPaymentReference] = useState(draft?.paymentReference ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const selectedPaymentMethod = paymentMethods.find((item) => item.id === paymentMethodId) ?? paymentMethods[0];
  const nationalityOptions = useMemo(() => isoCountryCodes.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name)), []);

  const draftPayload = useMemo(() => ({
    packageId: pkg.id,
    packageSlug: pkg.slug,
    departureId: selectedDeparture?.id ?? "",
    addonId: selectedAddon?.id ?? "none",
    pax: guestCount,
    pricing: {
      baseAmount: pkg.price,
      departureAdditionalAmount,
      addonAmount,
      finalAmount,
    },
    guests,
    groupContact,
    useGuestOne,
    paymentMethodId: selectedPaymentMethod.id,
    paymentProofUrl,
    paymentReference,
    currentStep: step,
  }), [addonAmount, departureAdditionalAmount, finalAmount, groupContact, guestCount, guests, paymentProofUrl, paymentReference, pkg.id, pkg.price, pkg.slug, selectedAddon?.id, selectedDeparture?.id, selectedPaymentMethod.id, step, useGuestOne]);

  function goToStep(nextStep: CheckoutStep) {
    setStep(nextStep);
    if (draftId) router.replace(`/guest-checkout/${draftId}?step=${nextStep}`);
  }

  async function continueToPayment() {
    const errors = validateGuestStep(guests, groupContact);
    setValidationErrors(errors);

    if (Object.keys(errors).length) return;

    setSaveState("saving");
    const response = await fetch(draftId ? `/api/booking-drafts/${draftId}` : "/api/booking-drafts", {
      method: draftId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draftPayload, currentStep: "payment" }),
    });

    if (!response.ok) {
      setSaveState("idle");
      return;
    }

    const data = await response.json();
    const nextDraftId = data.draft.id;
    setDraftId(nextDraftId);
    setSaveState("saved");
    setStep("payment");
    router.replace(`/guest-checkout/${nextDraftId}?step=payment`);
  }

  function updateGuest(index: number, value: Partial<Guest>) {
    setGuests((current) => current.map((guest, guestIndex) => {
      if (guestIndex !== index) return guest;
      const nextGuest = { ...guest, ...value };
      if (guestIndex === 0 && useGuestOne) {
        setGroupContact((contact) => ({ ...contact, firstName: nextGuest.firstName, lastName: nextGuest.lastName }));
      }
      return nextGuest;
    }));
  }

  function toggleGuestOne(enabled: boolean) {
    setUseGuestOne(enabled);
    if (enabled) {
      const guestOne = guests[0] ?? newGuest();
      setGroupContact((contact) => ({ ...contact, firstName: guestOne.firstName, lastName: guestOne.lastName }));
    }
  }

  async function submit() {
    setSubmitting(true);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId,
        packageId: pkg.id,
        departureId: selectedDeparture?.id ?? "",
        addonId: selectedAddon?.id ?? "none",
        pax: guestCount,
        guests,
        groupContact,
        payment: {
          method: selectedPaymentMethod.id,
          referenceNumber: paymentReference,
          amountSubmitted: finalAmount,
          receiptUrl: paymentProofUrl,
          paymentDate: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    setSubmitting(false);
    if (!response.ok) return;
    const data = await response.json();
    setDraftStatus("completed");
    setSubmittedReference(data.booking.reference);
  }

  if (draftStatus === "completed" && !submittedReference) {
    return (
      <main className="container-page max-w-4xl py-10">
        <Card>
          <CardContent className="p-8">
            <StatusBadge status="for_verification" />
            <h1 className="mt-4 text-3xl font-bold text-viaje-navy">This draft has already been submitted</h1>
            <p className="mt-3 text-viaje-soft">Create a new checkout from the package page if another booking is needed.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (submittedReference) {
    return (
      <main className="container-page max-w-4xl py-10">
        <Card>
          <CardContent className="p-8">
            <StatusBadge status="for_verification" />
            <h1 className="mt-4 text-3xl font-bold text-viaje-navy">Booking submitted for payment verification</h1>
            <p className="mt-3 text-viaje-soft">Reference: <strong className="text-viaje-navy">{submittedReference}</strong></p>
            <p className="mt-3 text-viaje-soft">Our staff will review your payment within 24 hours and send an update to the provided email address.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <a href={changeDetailsHref}>
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /></Button>
        </a>
        <div>
          <p className="font-semibold text-viaje-red">Guest Checkout</p>
          <h1 className="text-3xl font-bold text-viaje-navy">{pkg.title}</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-viaje-soft">
          {saveState === "saving" && <span>Saving...</span>}
          {saveState === "saved" && <span>Saved</span>}
        </div>
      </div>

      <div className="mb-8 grid gap-2 md:grid-cols-2">
        {steps.map((item, index) => (
          <button key={item.id} type="button" className={`rounded-md border px-3 py-2 text-sm font-semibold ${item.id === step ? "border-viaje-navy bg-viaje-navy text-white" : "bg-white"}`} onClick={() => goToStep(item.id)}>
            {index + 1}. {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] lg:items-start">
        <Card>
          <CardHeader><CardTitle>{steps.find((item) => item.id === step)?.label}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {step === "guests" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-viaje-soft">{guestCount} guest form{guestCount === 1 ? "" : "s"} generated from your package selection.</p>
                </div>
                {Object.keys(validationErrors).length > 0 && (
                  <div className="rounded-lg border border-viaje-red/30 bg-viaje-red/5 p-4 text-sm text-viaje-red">
                    {Object.values(validationErrors)[0]}
                  </div>
                )}
                {guests.map((guest, index) => (
                  <div key={index} className="grid gap-4 rounded-lg border border-viaje-line p-4 md:grid-cols-2">
                    <h3 className="font-serif text-xl font-semibold text-viaje-navy md:col-span-2">Guest {index + 1}</h3>
                    <label className={fieldClass}><span className={labelClass}>First Name</span><Input required value={guest.firstName} onChange={(event) => updateGuest(index, { firstName: upper(event.target.value) })} /></label>
                    <label className={fieldClass}><span className={labelClass}>Last Name</span><Input required value={guest.lastName} onChange={(event) => updateGuest(index, { lastName: upper(event.target.value) })} /></label>
                    <label className={fieldClass}>
                      <span className={labelClass}>Nationality</span>
                      <select required value={guest.nationality} onChange={(event) => updateGuest(index, { nationality: event.target.value })} className={inputClass}>
                        {nationalityOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                      </select>
                    </label>
                    <label className={fieldClass}><span className={labelClass}>Passport Number (Optional)</span><Input value={guest.passportNumber} onChange={(event) => updateGuest(index, { passportNumber: upper(event.target.value) })} /></label>
                    <label className="flex items-center gap-2 text-sm font-medium text-viaje-ink md:col-span-2">
                      <input type="checkbox" checked={guest.isPwd} onChange={(event) => updateGuest(index, { isPwd: event.target.checked })} />
                      Person with Disability
                    </label>
                  </div>
                ))}

                <div className="grid gap-4 rounded-lg border border-viaje-line bg-viaje-paperAlt p-4 md:grid-cols-2">
                  <h3 className="font-serif text-xl font-semibold text-viaje-navy md:col-span-2">Group Contact Person</h3>
                  <label className="flex items-center gap-2 text-sm font-medium text-viaje-ink md:col-span-2">
                    <input type="checkbox" checked={useGuestOne} onChange={(event) => toggleGuestOne(event.target.checked)} />
                    Use Guest 1 as contact person
                  </label>
                  <label className={fieldClass}><span className={labelClass}>First Name</span><Input required value={groupContact.firstName} onChange={(event) => setGroupContact((current) => ({ ...current, firstName: upper(event.target.value) }))} disabled={useGuestOne} /></label>
                  <label className={fieldClass}><span className={labelClass}>Last Name</span><Input required value={groupContact.lastName} onChange={(event) => setGroupContact((current) => ({ ...current, lastName: upper(event.target.value) }))} disabled={useGuestOne} /></label>
                  <label className={fieldClass}><span className={labelClass}>Mobile Number</span><Input required value={groupContact.mobileNumber} onChange={(event) => setGroupContact((current) => ({ ...current, mobileNumber: event.target.value }))} /></label>
                  <label className={fieldClass}>
                    <span className={labelClass}>Email Address</span>
                    <Input required type="email" value={groupContact.emailAddress} onChange={(event) => setGroupContact((current) => ({ ...current, emailAddress: event.target.value }))} />
                  </label>
                  <label className={fieldClass}>
                    <span className="text-xs text-viaje-soft">Booking confirmation and updates will be sent to this email address and contact number.</span>
                  </label>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const selected = method.id === paymentMethodId;
                    return (
                      <button key={method.id} type="button" onClick={() => setPaymentMethodId(method.id)} className="text-left">
                        <Card className={`rounded-lg transition ${selected ? "border-viaje-red ring-2 ring-viaje-red/20" : ""}`}>
                          <CardContent className="p-4 font-semibold text-viaje-navy">{method.label}</CardContent>
                        </Card>
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  <img src={paymentImage(selectedPaymentMethod.label, selectedPaymentMethod.color)} alt={`${selectedPaymentMethod.label} payment QR`} className="aspect-square w-full rounded-lg border border-viaje-line object-cover" />
                  <div className="space-y-4">
                    <label className={fieldClass}><span className={labelClass}>Reference Number</span><Input value={paymentReference} onChange={(event) => setPaymentReference(upper(event.target.value))} /></label>
                    <div className="max-w-[220px]">
                      <span className={labelClass}>Proof of Payment Screenshot</span>
                      <div className="mt-2">
                        <PackageMediaField label="Proof of Payment Screenshot" folder="payment-proofs" value={paymentProofUrl} onUploaded={setPaymentProofUrl} uploadUrl="/api/bookings/payment-proof/upload" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="rounded-lg border border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">
                  Payment submissions are subject to verification. Our staff will review your payment within 24 hours and send an update to the provided email address.
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-3">
              {step === "payment" ? (
                <Button type="button" variant="outline" onClick={() => goToStep("guests")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <a href={changeDetailsHref}>
                  <Button variant="outline" className="w-fit">Change Booking Details</Button>
                </a>
              )}
              {step === "guests" ? (
                <Button onClick={continueToPayment} disabled={saveState === "saving"}>
                  {saveState === "saving" ? "Saving..." : "Continue to Payment"}
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting || !paymentProofUrl}>
                  {submitting ? "Submitting..." : "Submit for Verification"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader><CardTitle>Booking / Cost Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SummaryRows pkg={pkg} selectedDeparture={selectedDeparture} selectedAddon={selectedAddon} pax={guestCount} finalAmount={finalAmount} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
