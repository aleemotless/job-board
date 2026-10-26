import type { ApplicationInput, StoredCv } from "@/types";
import { createApplication } from "@/lib/data/applications";
import { getOpenJob } from "./jobs";
import { MAX_CV_FILE_NAME_LENGTH } from "@/lib/config";

export { deleteApplication, getApplication, getApplicationCv, getApplications, updateApplicationStatus } from "@/lib/data/applications";

type ApplyResult = { ok: true } | { ok: false; reason: "job-closed" };

export async function acceptsApplications(jobId: string): Promise<boolean> {
    return (await getOpenJob(jobId)) !== undefined;
}

export async function applyToJob(jobId: string, input: ApplicationInput, cv: StoredCv): Promise<ApplyResult> {
    if (!(await acceptsApplications(jobId))) return { ok: false, reason: "job-closed" };

    await createApplication(jobId, input, { ...cv, fileName: cv.fileName.slice(-MAX_CV_FILE_NAME_LENGTH) });
    return { ok: true };
}
