"use server";

import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { acceptsApplications, applyToJob } from "@/lib/services/applications";
import { APPLICATIONS_TAG } from "@/lib/config";
import { parseApplicationForm } from "@/lib/validation/application";
import type { ApplyFormState } from "@/types";

// Signed-in users only. Bound to a job id by the job page.
export async function applyToJobAction(jobId: string, _prev: ApplyFormState, formData: FormData): Promise<ApplyFormState> {
    await requireUser();
    const { input, cv, state } = parseApplicationForm(formData);

    // Return the typed values too, so the form re-fills instead of clearing.
    const closed: ApplyFormState = { formError: "This job is no longer accepting applications.", values: input ?? state.values };
    // Checked before field errors, so nobody fixes a form for a job they can't apply to.
    if (!(await acceptsApplications(jobId))) return closed;
    if (!input || !cv) return state;

    const result = await applyToJob(jobId, input, {
        fileName: cv.file.name,
        contentType: cv.contentType,
        size: cv.file.size,
        data: new Uint8Array(await cv.file.arrayBuffer()),
    });
    if (!result.ok) return closed;

    updateTag(APPLICATIONS_TAG);
    return { submitted: true };
}
