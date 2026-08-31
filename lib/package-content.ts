import { packages as samplePackages } from "@/lib/sample-data";
import type { PackageStatus, TravelPackage } from "@/lib/types";

export type PackageAvailabilityStatus = "available" | "limited" | "sold_out";

export const packageStatuses: PackageStatus[] = ["draft", "published", "archived"];
export const packageTypes: TravelPackage["type"][] = ["domestic", "international"];
export const packageAvailabilityStatuses: PackageAvailabilityStatus[] = ["available", "limited", "sold_out"];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "package";
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function newPackage(): TravelPackage {
  const id = `pkg-${Date.now()}`;
  return {
    id,
    slug: id,
    title: "New Package",
    destination: "",
    country: "",
    type: "domestic",
    duration: "",
    airline: "Cebu Pacific",
    hotel: "3-4 Star Hotels",
    description: "",
    coverImageUrl: "",
    galleryUrls: [],
    status: "draft",
    price: 0,
    travelDates: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    requirements: [],
    brochureUrl: "",
    addons: []
  };
}

export function normalizePackage(input?: Partial<TravelPackage> | null): TravelPackage {
  const fallback = newPackage();
  const legacyPricing = input && "pricing" in input ? input.pricing as { adult?: number } | undefined : undefined;
  const title = input?.title ?? fallback.title;
  const id = input?.id ?? `pkg-${Date.now()}`;

  return {
    id,
    slug: input?.slug || slugify(title),
    title,
    destination: input?.destination ?? fallback.destination,
    country: input?.country ?? fallback.country,
    type: input?.type === "international" ? "international" : "domestic",
    duration: input?.duration ?? fallback.duration,
    airline: input?.airline || fallback.airline,
    hotel: input?.hotel || fallback.hotel,
    description: input?.description ?? fallback.description,
    coverImageUrl: input?.coverImageUrl ?? fallback.coverImageUrl,
    status: packageStatuses.includes(input?.status as PackageStatus) ? input?.status as PackageStatus : "draft",
    price: numberValue(input?.price ?? legacyPricing?.adult),
    galleryUrls: Array.isArray(input?.galleryUrls) ? input.galleryUrls.filter(Boolean) : [],
    travelDates: Array.isArray(input?.travelDates)
      ? input.travelDates.map((item, index) => ({
          id: item.id || `date-${Date.now()}-${index}`,
          startDate: item.startDate || "",
          endDate: item.endDate || "",
          additionalAmount: numberValue(item.additionalAmount),
          availabilityStatus: packageAvailabilityStatuses.includes(item.availabilityStatus) ? item.availabilityStatus : "available"
        }))
      : [],
    itinerary: Array.isArray(input?.itinerary)
      ? input.itinerary.map((item) => ({
          day: item.day || "",
          name: item.name || "",
          icon: item.icon || item.activities?.[0]?.icon || "MapPin",
          imageUrl: item.imageUrl || "",
          activities: Array.isArray(item.activities)
            ? item.activities.map((activity) => ({
                activity: activity.activity || "",
                icon: activity.icon || "MapPin"
              }))
            : []
        }))
      : [],
    brochureUrl: input?.brochureUrl ?? fallback.brochureUrl,
    inclusions: Array.isArray(input?.inclusions) ? input.inclusions.filter(Boolean) : [],
    exclusions: Array.isArray(input?.exclusions) ? input.exclusions.filter(Boolean) : [],
    requirements: Array.isArray(input?.requirements) ? input.requirements.filter(Boolean) : [],
    addons: Array.isArray(input?.addons)
      ? input.addons.map((addon, index) => ({
          id: addon.id || `addon-${Date.now()}-${index}`,
          label: addon.label || "",
          price: numberValue(addon.price)
        }))
      : []
  };
}

export function defaultPackages() {
  return samplePackages.map((item) => normalizePackage(item));
}
