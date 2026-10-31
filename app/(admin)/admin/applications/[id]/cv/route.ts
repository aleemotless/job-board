import { getApplicationCv } from "@/lib/services/applications";

// Admins only: proxy.ts blocks /admin/* for anyone without the admin role.

// Downloads an applicant's CV. Always served as an attachment with the content type
// chosen at upload (lib/validation/application.ts), never the browser-reported one.
export async function GET(_request: Request, ctx: RouteContext<"/admin/applications/[id]/cv">) {
    const { id } = await ctx.params;
    const cv = await getApplicationCv(id);
    if (!cv) return new Response("Not found", { status: 404 });

    const safeName = cv.fileName.replace(/[^\w.-]+/g, "_");
    return new Response(Buffer.from(cv.data), {
        headers: {
            "Content-Type": cv.contentType,
            "Content-Length": String(cv.size),
            "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(cv.fileName)}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
