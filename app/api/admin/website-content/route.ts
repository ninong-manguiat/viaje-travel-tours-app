import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { defaultWebsiteContent, isValidLandlineNumber, mergeWebsiteContent } from "@/lib/website-content";
import { isValidContactNumber, normalizeContactNumber } from "@/lib/document-bins";
import { normalizeWebsiteContentMedia } from "@/lib/website-content-media";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

async function getDocRef() {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("websiteContent").doc("homepage");
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const docRef = await getDocRef();
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ content: normalizeWebsiteContentMedia(defaultWebsiteContent) });
  }

  return NextResponse.json({ content: normalizeWebsiteContentMedia(mergeWebsiteContent(snapshot.data())) });
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json();
  const content = normalizeWebsiteContentMedia(mergeWebsiteContent(body?.content));
  if (!isValidContactNumber(content.aboutUs.contactNumber)) {
    return NextResponse.json({ error: "About Us contact number must be a valid +63 mobile number." }, { status: 400 });
  }
  if (!isValidLandlineNumber(content.aboutUs.landlineNumber)) {
    return NextResponse.json({ error: "About Us landline number must be a valid landline number." }, { status: 400 });
  }
  content.aboutUs.contactNumber = normalizeContactNumber(content.aboutUs.contactNumber);

  const docRef = await getDocRef();
  await docRef.set(
    {
      ...content,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return NextResponse.json({ content });
}
