"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { submitJob } from "@/lib/services/jobs";
import { JOBS_TAG } from "@/lib/config";
import { parseJobForm } from "@/lib/validation/job";
import type { JobFormState } from "@/types";

// Public and unauthenticated; submitJob saves it as closed until an admin opens it.
export async function submitJobAction(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
    const { input, state } = parseJobForm(formData);
    if (!input) return state;

    await submitJob(input);
    updateTag(JOBS_TAG);
    redirect("/post-job/submitted");
}
