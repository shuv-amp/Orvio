import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Role } from "@/lib/domain/types";

function adminApp() {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT) return null;
  return getApps()[0] ?? initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export async function authorize(request: Request, allowedRoles: Role[]) {
  if (process.env.APP_MODE === "demo" || process.env.NODE_ENV !== "production") {
    return { uid: "demo-user", role: allowedRoles[0], synthetic: true } as const;
  }
  const app = adminApp();
  const authorization = request.headers.get("authorization");
  if (!app || !authorization?.startsWith("Bearer ")) return null;
  try {
    const token = await getAuth(app).verifyIdToken(authorization.slice(7), true);
    const role = token.role as Role | undefined;
    if (!role || !allowedRoles.includes(role)) return null;
    return { uid: token.uid, role, synthetic: false } as const;
  } catch {
    return null;
  }
}

export function firestore() {
  const app = adminApp();
  return app ? getFirestore(app) : null;
}
