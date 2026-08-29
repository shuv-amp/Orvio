import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Role } from "@/lib/domain/types";

function adminApp() {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_CLOUD_PROJECT)
    return null;
  return (
    getApps()[0] ??
    initializeApp({
      credential: applicationDefault(),
      projectId:
        process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
    })
  );
}

/**
 * Verify a Firebase ID token in cloud mode. Demo mode returns a labeled
 * synthetic identity scoped to allowed roles — never a wildcard admin.
 */
export async function authorize(
  request: Request,
  allowedRoles: Role[],
): Promise<{ uid: string; role: Role; synthetic: boolean } | null> {
  // Unset APP_MODE is the labeled demo path. Cloud mode fails closed.
  if (process.env.APP_MODE !== "cloud") {
    return {
      uid: "demo-user",
      role: allowedRoles[0],
      synthetic: true,
    } as const;
  }
  const app = adminApp();
  const authorization = request.headers.get("authorization");
  if (!app || !authorization?.startsWith("Bearer ")) return null;
  try {
    const token = await getAuth(app).verifyIdToken(
      authorization.slice(7),
      true,
    );
    const role = token.role as Role | undefined;
    if (!role || !allowedRoles.includes(role)) return null;
    return { uid: token.uid, role, synthetic: false } as const;
  } catch {
    return null;
  }
}

/** Admin Firestore client, or null when the project is not configured. */
export function firestore() {
  const app = adminApp();
  return app ? getFirestore(app) : null;
}
