import { normalizePublicR2Url } from "@/lib/storage";
import type { WebsiteContent } from "@/lib/website-content";

function siteMediaUrl(url: string) {
  return normalizePublicR2Url("siteMedia", url);
}

export function normalizeWebsiteContentMedia(content: WebsiteContent): WebsiteContent {
  return {
    ...content,
    aboutUs: {
      ...content.aboutUs,
      officePhotoUrl: siteMediaUrl(content.aboutUs.officePhotoUrl)
    },
    accreditation: {
      ...content.accreditation,
      accreditations: content.accreditation.accreditations.map((item) => ({
        ...item,
        imageUrl: siteMediaUrl(item.imageUrl)
      }))
    },
    clients: {
      ...content.clients,
      clients: content.clients.clients.map((client) => ({
        ...client,
        logoUrl: siteMediaUrl(client.logoUrl)
      }))
    },
    recentActivities: {
      ...content.recentActivities,
      activities: content.recentActivities.activities.map((activity) => ({
        ...activity,
        coverPhotoUrl: siteMediaUrl(activity.coverPhotoUrl),
        galleryUrls: activity.galleryUrls.map(siteMediaUrl)
      }))
    },
    proofTransactions: {
      ...content.proofTransactions,
      proofs: content.proofTransactions.proofs.map((proof) => ({
        ...proof,
        galleryUrls: proof.galleryUrls.map(siteMediaUrl)
      }))
    }
  };
}
