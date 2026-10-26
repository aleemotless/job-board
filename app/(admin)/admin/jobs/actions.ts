"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createJob, deleteJob, updateJob } from "@/lib/services/jobs";
import { APPLICATIONS_TAG, JOBS_TAG } from "@/lib/config";
import { parseJobForm } from "@/lib/validation/job";
import type { ActionFormState, JobFormState } from "@/types";

// TODO: check the admin session here once auth exists; proxy.ts only routes.

export async function createJobAction(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
    const { input, state } = parseJobForm(formData);
    if (!input) return state;

    await createJob(input);
    updateTag(JOBS_TAG);
    redirect("/admin/jobs");
}

export async function updateJobAction(id: string, _prev: JobFormState, formData: FormData): Promise<JobFormState> {
    const { input, state } = parseJobForm(formData);
    if (!input) return state;

    if (!(await updateJob(id, input))) return { formError: "This job no longer exists.", values: input };
    updateTag(JOBS_TAG);
    redirect("/admin/jobs");
}

export async function deleteJobAction(id: string): Promise<ActionFormState> {
    await deleteJob(id);
    updateTag(JOBS_TAG);
    updateTag(APPLICATIONS_TAG); // the job's applications are deleted too
    redirect("/admin/jobs");
}
