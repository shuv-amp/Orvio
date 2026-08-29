import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let environment: RulesTestEnvironment;
const eventPath = "events/abhiyantrix-2026";

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "orvio-rules-test",
    firestore: { rules: readFileSync(resolve("firestore.rules"), "utf8") },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), eventPath), {
      name: "Synthetic event",
    });
    await setDoc(
      doc(context.firestore(), `${eventPath}/scores/team-1_judge-1`),
      { judgeId: "judge-1", finalized: true },
    );
    await setDoc(
      doc(context.firestore(), `${eventPath}/leaderboards/current`),
      { published: true, teams: [] },
    );
  });
});

afterAll(async () => environment.cleanup());

describe("Firestore authorization rules", () => {
  it("denies unauthenticated event data but permits a published leaderboard", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, eventPath)));
    await assertSucceeds(getDoc(doc(db, `${eventPath}/leaderboards/current`)));
  });

  it("lets an organizer manage event configuration", async () => {
    const db = environment
      .authenticatedContext("organizer-1", { role: "organizer" })
      .firestore();
    await assertSucceeds(
      setDoc(doc(db, eventPath), { name: "Updated synthetic event" }),
    );
  });

  it("lets participants edit only profile preferences, never attendance or team state", async () => {
    const db = environment
      .authenticatedContext("participant-1", { role: "participant" })
      .firestore();
    const ownProfile = doc(db, `${eventPath}/participants/participant-1`);
    await assertSucceeds(
      setDoc(ownProfile, {
        name: "Aanya",
        role: "Designer",
        skills: [],
        interests: [],
        availability: 1,
      }),
    );
    await assertSucceeds(updateDoc(ownProfile, { availability: 0.9 }));
    await assertFails(updateDoc(ownProfile, { checkedIn: true }));
    await assertFails(updateDoc(ownProfile, { teamId: "team-1" }));
    await assertFails(
      setDoc(doc(db, `${eventPath}/participants/participant-2`), {
        name: "Impersonated",
      }),
    );
    await assertFails(
      setDoc(doc(db, `${eventPath}/participants/participant-1`), {
        name: "Aanya",
        admin: true,
      }),
    );
  });

  it("allows a judge to create only their own finalized score", async () => {
    const db = environment
      .authenticatedContext("judge-2", { role: "judge" })
      .firestore();
    const ownScore = doc(db, `${eventPath}/scores/team-2_judge-2`);
    await assertSucceeds(
      setDoc(ownScore, {
        judgeId: "judge-2",
        teamId: "team-2",
        rubricVersion: "v3",
        finalized: true,
        scores: { functionality: 8 },
        feedback: "Clear evidence supplied.",
      }),
    );
    await assertFails(
      setDoc(doc(db, `${eventPath}/scores/team-2_judge-3`), {
        judgeId: "judge-3",
        finalized: true,
      }),
    );
    await assertFails(
      setDoc(doc(db, `${eventPath}/scores/team-3_judge-2`), {
        judgeId: "judge-2",
        finalized: true,
        admin: true,
      }),
    );
    await assertFails(updateDoc(ownScore, { finalized: false }));
  });

  it("prevents participants from reading raw judge scores", async () => {
    const db = environment
      .authenticatedContext("participant-1", { role: "participant" })
      .firestore();
    await assertFails(getDoc(doc(db, `${eventPath}/scores/team-1_judge-1`)));
  });

  it("lets a participant read only their own ticket", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `${eventPath}/tickets/ticket-1`), {
        participantId: "participant-1",
        revoked: false,
      });
      await setDoc(doc(context.firestore(), `${eventPath}/tickets/ticket-2`), {
        participantId: "participant-2",
        revoked: false,
      });
    });
    const db = environment
      .authenticatedContext("participant-1", { role: "participant" })
      .firestore();
    await assertSucceeds(getDoc(doc(db, `${eventPath}/tickets/ticket-1`)));
    await assertFails(getDoc(doc(db, `${eventPath}/tickets/ticket-2`)));
  });

  it("keeps check-ins, used nonces, and audit writes server-only", async () => {
    const db = environment
      .authenticatedContext("organizer-1", { role: "organizer" })
      .firestore();
    await assertFails(
      setDoc(doc(db, `${eventPath}/checkIns/ticket-1`), { scannedAt: "now" }),
    );
    await assertFails(
      setDoc(doc(db, `${eventPath}/qrNonces/nonce-1`), { usedAt: "now" }),
    );
    await assertFails(
      setDoc(doc(db, `${eventPath}/auditLogs/log-1`), { action: "forged" }),
    );
  });
});
