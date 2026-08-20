import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { defaultWebsiteContent, mergeWebsiteContent } from "@/lib/website-content";

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
    return NextResponse.json({ content: defaultWebsiteContent });
  }

  return NextResponse.json({ content: mergeWebsiteContent(snapshot.data()) });
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json();
  const content = mergeWebsiteContent(body?.content);

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
