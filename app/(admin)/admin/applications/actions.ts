"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { deleteApplication, updateApplicationStatus } from "@/lib/services/applications";
import { APPLICATIONS_TAG } from "@/lib/config";
import type { ActionFormState } from "@/types";
import { applicationStatusSchema } from "@/lib/schemas/application";

// TODO: check the admin session here once auth exists; proxy.ts only routes.

// Bound to an application id; the clicked button supplies `status`.
export async function updateApplicationStatusAction(id: string, _prev: ActionFormState, formData: FormData): Promise<ActionFormState> {
    const status = applicationStatusSchema.safeParse(formData.get("status"));
    if (!status.success) return { formError: "Pick a valid status." };

    if (!(await updateApplicationStatus(id, status.data))) return { formError: "This application no longer exists." };
    updateTag(APPLICATIONS_TAG);
    return {};
}

export async function deleteApplicationAction(id: string): Promise<ActionFormState> {
    await deleteApplication(id);
    updateTag(APPLICATIONS_TAG);
    redirect("/admin/applications");
}
