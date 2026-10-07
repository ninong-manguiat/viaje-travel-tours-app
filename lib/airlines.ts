export type AirlineStatus = "ACTIVE" | "INACTIVE";

export type Airline = {
  id: string;
  name: string;
  logoUrl: string;
  status: AirlineStatus;
  nameKey: string;
};

function airlineLogoDataUri(label: string, background: string, foreground = "#ffffff") {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${background}"/><text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${foreground}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "airline";
}

export function airlineNameKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export const defaultAirlines: Airline[] = [
  { id: "airline-cebu-pacific", name: "Cebu Pacific", logoUrl: airlineLogoDataUri("Cebu Pacific", "#00a3ad"), status: "ACTIVE", nameKey: airlineNameKey("Cebu Pacific") },
  { id: "airline-airasia", name: "AirAsia", logoUrl: airlineLogoDataUri("AirAsia", "#e70504"), status: "ACTIVE", nameKey: airlineNameKey("AirAsia") },
  { id: "airline-jal", name: "JAL", logoUrl: airlineLogoDataUri("JAL", "#cf102d"), status: "ACTIVE", nameKey: airlineNameKey("JAL") },
  { id: "airline-jetstar", name: "Jetstar", logoUrl: airlineLogoDataUri("Jetstar", "#f58220", "#111111"), status: "ACTIVE", nameKey: airlineNameKey("Jetstar") },
  { id: "airline-eva-air", name: "EVA Air", logoUrl: airlineLogoDataUri("EVA Air", "#0b4ea2"), status: "ACTIVE", nameKey: airlineNameKey("EVA Air") },
];

export function newAirline(): Airline {
  const id = `airline-${Date.now()}`;
  return {
    id,
    name: "",
    logoUrl: "",
    status: "ACTIVE",
    nameKey: "",
  };
}

export function normalizeAirline(input?: Partial<Airline> | null): Airline {
  const fallback = newAirline();
  const name = input?.name?.trim() ?? "";
  return {
    id: input?.id || (name ? `airline-${slugify(name)}` : fallback.id),
    name,
    logoUrl: input?.logoUrl?.trim() ?? "",
    status: input?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    nameKey: airlineNameKey(input?.nameKey || name),
  };
}

export function displayAirlineLogo(airline?: Partial<Airline> | null) {
  return airline?.logoUrl || defaultAirlines.find((item) => item.nameKey === airlineNameKey(airline?.name || ""))?.logoUrl || defaultAirlines[0].logoUrl;
}

export function resolvePackageAirline(packageAirline?: { airlineId?: string; airline?: string }, airlines: Airline[] = defaultAirlines) {
  const byId = packageAirline?.airlineId ? airlines.find((airline) => airline.id === packageAirline.airlineId) : null;
  const byName = packageAirline?.airline ? airlines.find((airline) => airline.nameKey === airlineNameKey(packageAirline.airline || "")) : null;
  const legacyDefault = packageAirline?.airline ? defaultAirlines.find((airline) => airline.nameKey === airlineNameKey(packageAirline.airline || "")) : null;
  if (!byId && !byName && !legacyDefault && packageAirline?.airline) {
    return {
      id: packageAirline.airlineId || "",
      name: packageAirline.airline,
      logoUrl: defaultAirlines[0].logoUrl,
      status: "ACTIVE" as AirlineStatus,
      nameKey: airlineNameKey(packageAirline.airline),
    };
  }
  const resolved = byId || byName || legacyDefault || defaultAirlines[0];
  return {
    id: resolved.id,
    name: resolved.name || packageAirline?.airline || defaultAirlines[0].name,
    logoUrl: displayAirlineLogo(resolved),
    status: resolved.status,
    nameKey: resolved.nameKey,
  };
}
