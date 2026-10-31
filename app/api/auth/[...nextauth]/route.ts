// Auth.js endpoints (session, CSRF, credentials callback, sign-out). Configured in lib/auth.ts.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
