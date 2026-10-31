// App-wide configuration: every tunable constant lives here.
// Not here on purpose: Next.js file conventions (each page's `metadata`, proxy.ts `config.matcher`,
// next/font instances), runtime objects (React contexts, the mock store) and component-internal
// Tailwind class maps / table column definitions.
//
// Imported by next.config.ts, so use relative imports (no "@/" alias) for runtime values.
import type { ApplicationStatus } from "../types/application";
import type { NavItem } from "../types/navigation";
import { capitalize } from "./format/text";

const MB = 1024 * 1024;

// --- Brand --------------------------------------------------------------

export const SITE = {
    name: "Joblezz",
    tagline: "Find your next opportunity, or your next hire.",
    description: "Find your next opportunity on the Joblezz job board.",
} as const;

// --- Routing & navigation -----------------------------------------------

// Admin routes live under this prefix; the admin subdomain serves them without it (see proxy.ts).
export const ADMIN_BASE_PATH = "/admin";

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

export const SITE_NAV: NavItem[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/jobs", label: "Jobs" },
    { href: "/post-job", label: "Post a job" },
];

export const ADMIN_NAV: NavItem[] = [
    { href: ADMIN_BASE_PATH, label: "Dashboard", icon: "dashboard", exact: true },
    { href: `${ADMIN_BASE_PATH}/jobs`, label: "Jobs", icon: "jobs" },
    { href: `${ADMIN_BASE_PATH}/applications`, label: "Applications", icon: "applications" },
    { href: `${ADMIN_BASE_PATH}/candidates`, label: "Candidates", icon: "candidates" },
];

export const FOOTER_LINKS: NavItem[] = [
    { href: "/jobs", label: "Browse jobs" },
    { href: "/post-job", label: "Post a job" },
];

// --- Page sizes ---------------------------------------------------------

// "Featured" = the newest open roles; there is no featured flag on jobs.
export const FEATURED_JOBS_COUNT = 3;
export const RECENT_APPLICATIONS_COUNT = 5;

// --- Cache tags ---------------------------------------------------------

// Tags for the "use cache" reads in lib/data and lib/services. Mutations call updateTag (see the Server Actions)
// so pages show fresh data right after a change.
export const JOBS_TAG = "jobs";
export const APPLICATIONS_TAG = "applications";

// --- Database -----------------------------------------------------------

// Most sockets each server process's MongoDB pool may open. The total across the app is
// roughly running containers × this, which must stay under the cluster's connection limit.
export const MONGODB_MAX_POOL_SIZE = 10;

// --- Statuses (the JobStatus / ApplicationStatus types are derived from these) ---

export const JOB_STATUSES = ["open", "closed"] as const;
export const JOB_STATUS_OPTIONS = JOB_STATUSES.map((status) => ({ value: status, label: capitalize(status) }));

export const APPLICATION_STATUSES = ["pending", "reviewing", "accepted", "rejected"] as const;

// A candidate's stage is the first of these that any of their applications has,
// so "rejected" shows only when every application was rejected.
export const CANDIDATE_STAGE_ORDER: readonly ApplicationStatus[] = ["accepted", "reviewing", "pending", "rejected"];

// Public sign-up always creates a candidate.
export const USER_ROLES = ["candidate", "admin"] as const;

// --- Validation limits --------------------------------------------------
// Apply to admin and public submissions alike; the public forms are unauthenticated.

// The job form's text fields: rendered by JobForm and checked by jobInputSchema, in this order.
export const JOB_TEXT_FIELDS = [
    { name: "title", label: "Title", maxLength: 120 },
    { name: "company", label: "Company", maxLength: 120 },
    { name: "location", label: "Location", maxLength: 120 },
    { name: "salary", label: "Salary", maxLength: 80, hint: "e.g. EGP 40,000 – 55,000 / month" },
    { name: "description", label: "Description", maxLength: 5000, multiline: true },
    { name: "requirements", label: "Requirements", maxLength: 3000, hint: "One requirement per line.", multiline: true },
] as const;

export const APPLICATION_FIELD_LIMITS = { name: 120, email: 254, coverLetter: 5000 } as const;

// bcrypt ignores everything past 72 bytes, so longer passwords are rejected rather than silently cut.
export const USER_FIELD_LIMITS = { name: 120, email: 254, passwordMin: 8, passwordMax: 72 } as const;

// --- Auth ---------------------------------------------------------------

// bcrypt cost factor for password hashes (each +1 doubles the hashing time).
export const PASSWORD_HASH_ROUNDS = 12;

// Loose shape check; the real check is whether the applicant answers.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- CV uploads ---------------------------------------------------------

export const MAX_CV_BYTES = 5 * MB;
export const MAX_CV_FILE_NAME_LENGTH = 200;

// Extension -> the content type we store and serve. The browser-reported type is not trusted
// for serving; the extension must be one of these and the reported type must agree with it.
export const CV_TYPES = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export const CV_ACCEPT = Object.keys(CV_TYPES).join(",");

// Server Action request body cap (next.config.ts): the largest CV plus multipart overhead.
export const SERVER_ACTION_BODY_LIMIT_BYTES = MAX_CV_BYTES + MB;
