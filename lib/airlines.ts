export const airlineNames = ["Cebu Pacific", "AirAsia", "JAL", "Jetstar", "EVA Air"] as const;

export type AirlineName = (typeof airlineNames)[number];

function airlineLogoDataUri(label: string, background: string, foreground = "#ffffff") {
  const initials = label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="${background}"/><text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${foreground}">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const airlineOptions = airlineNames.map((name) => ({
  name,
  logoSrc:
    name === "Cebu Pacific" ? airlineLogoDataUri(name, "#00a3ad") :
    name === "AirAsia" ? airlineLogoDataUri(name, "#e70504") :
    name === "JAL" ? airlineLogoDataUri(name, "#cf102d") :
    name === "Jetstar" ? airlineLogoDataUri(name, "#f58220", "#111111") :
    airlineLogoDataUri(name, "#0b4ea2"),
}));

export function getAirline(name?: string) {
  return airlineOptions.find((airline) => airline.name === name) ?? airlineOptions[0];
}
