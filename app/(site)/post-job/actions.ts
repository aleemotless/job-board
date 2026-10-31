"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { submitJob } from "@/lib/services/jobs";
import { JOBS_TAG } from "@/lib/config";
import { parseJobForm } from "@/lib/validation/job";
import type { JobFormState } from "@/types";

// Signed-in users only; submitJob saves it as closed until an admin opens it.
export async function submitJobAction(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
    await requireUser();
    const { input, state } = parseJobForm(formData);
    if (!input) return state;

    await submitJob(input);
    updateTag(JOBS_TAG);
    redirect("/post-job/submitted");
}
