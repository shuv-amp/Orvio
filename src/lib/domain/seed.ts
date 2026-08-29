import type {
  Announcement,
  AuditEvent,
  EventMetrics,
  Participant,
  Team,
} from "./types";

export const currentParticipant: Participant = {
  id: "p-aanya",
  name: "Aanya Sharma",
  initials: "AS",
  role: "Product designer",
  skills: ["UI/UX", "Research", "Pitching"],
  interests: ["Climate", "Civic tech", "AI agents"],
  availability: 0.95,
  checkedIn: true,
};

const people: Participant[] = [
  {
    id: "p-kabir",
    name: "Kabir Mehta",
    initials: "KM",
    role: "ML engineer",
    skills: ["Python", "Gemini", "ML"],
    interests: ["Climate", "AI agents"],
    availability: 0.91,
    checkedIn: true,
    teamId: "t-1",
  },
  {
    id: "p-zoya",
    name: "Zoya Khan",
    initials: "ZK",
    role: "Cloud engineer",
    skills: ["Firebase", "Cloud Run", "TypeScript"],
    interests: ["Civic tech", "Climate"],
    availability: 0.88,
    checkedIn: true,
    teamId: "t-1",
  },
  {
    id: "p-neel",
    name: "Neel Rao",
    initials: "NR",
    role: "Backend engineer",
    skills: ["Go", "APIs", "Security"],
    interests: ["Fintech", "Civic tech"],
    availability: 0.84,
    checkedIn: true,
    teamId: "t-2",
  },
  {
    id: "p-mira",
    name: "Mira Joshi",
    initials: "MJ",
    role: "Data scientist",
    skills: ["Python", "Analytics", "ML"],
    interests: ["Health", "AI agents"],
    availability: 0.8,
    checkedIn: true,
    teamId: "t-2",
  },
  {
    id: "p-isha",
    name: "Isha Sen",
    initials: "IS",
    role: "Frontend engineer",
    skills: ["React", "Accessibility", "TypeScript"],
    interests: ["Climate", "Education"],
    availability: 0.9,
    checkedIn: true,
    teamId: "t-3",
  },
];

export const teams: Team[] = [
  {
    id: "t-1",
    name: "Project Aster",
    project: "Arrival risk controller",
    members: people.slice(0, 2),
    score: 92.4,
    trend: 2,
    judged: 3,
  },
  {
    id: "t-2",
    name: "Relay Health",
    project: "Offline triage network",
    members: people.slice(2, 4),
    score: 89.7,
    trend: 1,
    judged: 3,
  },
  {
    id: "t-3",
    name: "CivicLens",
    project: "Accessible public feedback",
    members: people.slice(4, 5),
    score: 86.2,
    trend: -1,
    judged: 2,
  },
];

export const announcements: Announcement[] = [
  {
    id: "a-1",
    title: "Judging starts at 17:00",
    body: "Freeze submissions by 16:45. Judges will review the latest commit on your default branch.",
    audience: "All participants",
    time: "12 min ago",
    urgent: true,
    reach: 82,
  },
  {
    id: "a-2",
    title: "Workshop room changed",
    body: "The Gemini clinic has moved from Lab 2 to the Main Hall.",
    audience: "Gemini track",
    time: "38 min ago",
    reach: 94,
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "log-1",
    actor: "System",
    action: "QR verified",
    detail: "Ticket •••42 accepted at North Gate",
    time: "14:07",
  },
  {
    id: "log-2",
    actor: "Shuvam (Organizer)",
    action: "Announcement sent",
    detail: "Judging starts at 17:00 · 426 recipients",
    time: "13:58",
  },
  {
    id: "log-3",
    actor: "Judge Arjun",
    action: "Score finalized",
    detail: "Project Aster · rubric v3",
    time: "13:51",
  },
];

export const initialMetrics: EventMetrics = {
  totalParticipants: 512,
  checkedIn: 438,
  arrivalRate: 26,
  scanThroughput: 20,
  unmatchedParticipants: 61,
  teamCutoffMinutes: 24,
  pendingReviews: 37,
  completedReviews: 78,
  activeJudges: 8,
  minutesRemaining: 48,
  averageReviewMinutes: 9,
  announcementReach: 58,
  announcementAgeMinutes: 12,
};

export const skillTaxonomy = [
  "AI/ML",
  "Backend",
  "Cloud",
  "Frontend",
  "Product",
  "Pitching",
  "Research",
  "UI/UX",
];

/**
 * Twelve five-minute samples per headline metric, covering the last hour.
 *
 * The dashboard tiles draw their sparklines from these series so the shape of
 * the chart always matches the number printed above it. The last sample of
 * each series equals the corresponding field in {@link initialMetrics}.
 */
export const metricHistory = {
  checkedIn: [281, 305, 327, 344, 361, 379, 392, 404, 415, 424, 431, 438],
  matched: [368, 379, 391, 402, 411, 419, 427, 434, 440, 445, 449, 451],
  judgingProgress: [22, 27, 31, 36, 41, 45, 50, 55, 58, 62, 65, 68],
  announcementReach: [0, 12, 24, 33, 41, 47, 51, 54, 56, 57, 58, 58],
} as const satisfies Record<string, readonly number[]>;
