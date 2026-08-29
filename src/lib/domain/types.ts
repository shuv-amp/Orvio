export type Role = "participant" | "judge" | "organizer";
export type Severity = "healthy" | "watch" | "critical";

export interface Participant {
  id: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  interests: string[];
  availability: number;
  checkedIn: boolean;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  project: string;
  members: Participant[];
  score: number;
  trend: number;
  judged: number;
}

export interface TeamRecommendation {
  teamId: string;
  totalScore: number;
  skillCoverage: number;
  interestMatch: number;
  roleComplementarity: number;
  availabilityMatch: number;
  teamBalance: number;
  reasons: string[];
  missingSkills: string[];
}

export interface EventSignal {
  id: string;
  type: "queue" | "teams" | "judging" | "communication";
  title: string;
  severity: Severity;
  value: string;
  evidence: string;
  recommendation: string;
}

export interface RecoveryProposal {
  id: string;
  incident: string;
  status: "draft" | "approved";
  before: { completionMinutes: number; overloadedJudges: number; reach: number };
  after: { completionMinutes: number; overloadedJudges: number; reach: number };
  actions: string[];
  announcement: string;
  source: "gemini" | "deterministic-fallback";
}

export interface ScoreRecord {
  teamId: string;
  judgeId: string;
  rubricVersion: string;
  scores: Record<string, number>;
  feedback: string;
  finalized: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  time: string;
  urgent?: boolean;
  reach: number;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  detail: string;
  time: string;
}

export interface EventMetrics {
  totalParticipants: number;
  checkedIn: number;
  arrivalRate: number;
  scanThroughput: number;
  unmatchedParticipants: number;
  teamCutoffMinutes: number;
  pendingReviews: number;
  activeJudges: number;
  minutesRemaining: number;
  averageReviewMinutes: number;
  announcementReach: number;
  announcementAgeMinutes: number;
}

export interface QrClaims {
  eventId: string;
  ticketId: string;
  jti: string;
  aud: "orvio-check-in";
  iat: number;
  exp: number;
}
