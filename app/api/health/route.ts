import { connection } from "next/server";

// Liveness probe used by the deployment pipeline. `connection()` keeps it
// rendered per request (Cache Components would otherwise prerender it), and
// `version` lets the pipeline confirm which release is serving traffic.
export async function GET() {
  await connection();
  return Response.json(
    { status: "ok", version: process.env.APP_VERSION ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
