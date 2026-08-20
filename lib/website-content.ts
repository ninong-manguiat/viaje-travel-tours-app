export const cmsIconOptions = [
  "Plane",
  "Ship",
  "Bus",
  "ReceiptText",
  "Anchor",
  "Hotel",
  "Route",
  "CalendarCheck",
  "BadgeCheck",
  "MapPinned",
  "Globe2",
  "FileCheck",
  "IdCard",
  "FileText",
  "Car",
  "Building",
  "Landmark",
  "ShieldCheck",
  "Sparkles",
  "Facebook",
  "MapPin",
  "Phone"
] as const;

export type CmsIconName = (typeof cmsIconOptions)[number];

export interface CmsServiceListItem {
  icon: CmsIconName;
  text: string;
}

export interface CmsService {
  name: string;
  icon: CmsIconName;
  list: CmsServiceListItem[];
}

export interface CmsAccreditation {
  imageUrl: string;
  name: string;
  subtitle: string;
}

export interface CmsClient {
  logoUrl: string;
  title: string;
  subtitle: string;
}

export interface CmsActivity {
  coverPhotoUrl: string;
  date: string;
  place: string;
  title: string;
  description: string;
  galleryUrls: string[];
}

export interface CmsProofTransaction {
  title: string;
  description: string;
  galleryUrls: string[];
}

export interface WebsiteContent {
  services: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    services: CmsService[];
  };
  aboutUs: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    contactNumber: string;
    landlineNumber: string;
    facebook: string;
    direction: string;
    directionLink: string;
    officePhotoUrl: string;
  };
  accreditation: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    accreditations: CmsAccreditation[];
  };
  clients: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    clients: CmsClient[];
  };
  recentActivities: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    activities: CmsActivity[];
  };
  proofTransactions: {
    sectionDescription: string;
    sectionDescriptionSubs: string;
    proofs: CmsProofTransaction[];
  };
}

export const defaultWebsiteContent: WebsiteContent = {
  services: {
    sectionDescription: "Services",
    sectionDescriptionSubs: "Travel support for every step.",
    services: [
      {
        name: "Ticketing",
        icon: "Plane",
        list: [
          { icon: "Plane", text: "Domestic & Int'l Airline Tickets" },
          { icon: "Ship", text: "Boat Tickets" },
          { icon: "Bus", text: "Land Fares" }
        ]
      }
    ]
  },
  aboutUs: {
    sectionDescription: "About Us",
    sectionDescriptionSubs: "Your local travel partner in Sta. Cruz, Laguna.",
    contactNumber: "0915 837 5470",
    landlineNumber: "(049) 540 0782",
    facebook: "https://www.facebook.com/viajewithus/",
    direction: "2/F Lifestyle Plaza Building P. Guevarra Ave, Barangay 3, Sta Cruz, Laguna (above Figaro Coffee Shop)",
    directionLink: "https://www.google.com/maps/search/?api=1&query=2%2FF%20Lifestyle%20Plaza%20Building%20P.%20Guevarra%20Ave%2C%20Barangay%203%2C%20Sta%20Cruz%2C%20Laguna",
    officePhotoUrl: "/brand/viaje-office.jpg"
  },
  accreditation: {
    sectionDescription: "Accreditation",
    sectionDescriptionSubs: "Recognized travel standards.",
    accreditations: [
      { imageUrl: "/brand/dot-logo.webp", name: "Department of Tourism", subtitle: "Philippines accreditation reference" },
      { imageUrl: "/brand/iso-9001-2015.webp", name: "ISO 9001:2015", subtitle: "Quality management standard reference" }
    ]
  },
  clients: {
    sectionDescription: "Our Clients",
    sectionDescriptionSubs: "Trusted by travelers and groups.",
    clients: [{ logoUrl: "", title: "Corporate Client", subtitle: "Client Logo" }]
  },
  recentActivities: {
    sectionDescription: "Recent Activities",
    sectionDescriptionSubs: "Recent client trips, approvals, and travel support.",
    activities: [
      {
        coverPhotoUrl: "",
        date: "October 2026",
        place: "Japan",
        title: "Japan Autumn group departure",
        description: "Coordinated guest bookings, payment submissions, and visa document support for an upcoming Japan tour.",
        galleryUrls: []
      }
    ]
  },
  proofTransactions: {
    sectionDescription: "Proof of Transactions",
    sectionDescriptionSubs: "Sample successful arrangements.",
    proofs: [
      {
        title: "Visa Approval",
        description: "Sample approved visa transaction posts and client proof materials.",
        galleryUrls: []
      }
    ]
  }
};

function mergeAccreditations(content?: Partial<WebsiteContent> | null): CmsAccreditation[] {
  const accreditations = content?.accreditation?.accreditations;
  if (!accreditations) return defaultWebsiteContent.accreditation.accreditations;

  return accreditations.map((item) => ({
    imageUrl: "imageUrl" in item ? item.imageUrl : "",
    name: item.name,
    subtitle: item.subtitle
  }));
}

export function mergeWebsiteContent(content?: Partial<WebsiteContent> | null): WebsiteContent {
  return {
    ...defaultWebsiteContent,
    ...content,
    services: { ...defaultWebsiteContent.services, ...content?.services },
    aboutUs: { ...defaultWebsiteContent.aboutUs, ...content?.aboutUs },
    accreditation: {
      ...defaultWebsiteContent.accreditation,
      ...content?.accreditation,
      accreditations: mergeAccreditations(content)
    },
    clients: { ...defaultWebsiteContent.clients, ...content?.clients },
    recentActivities: { ...defaultWebsiteContent.recentActivities, ...content?.recentActivities },
    proofTransactions: { ...defaultWebsiteContent.proofTransactions, ...content?.proofTransactions }
  };
}
