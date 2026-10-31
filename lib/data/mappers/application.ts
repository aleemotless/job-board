import type { Application, ApplicationWithJob } from "@/types";
import type { ApplicationRecord, ApplicationWithJobRecord } from "../models/application";

export function toApplication(app: ApplicationRecord): Application {
    return {
        id: app._id.toString(),
        jobId: app.jobId.toString(),
        name: app.name,
        email: app.email,
        coverLetter: app.coverLetter,
        cv: app.cv ? { fileName: app.cv.fileName, contentType: app.cv.contentType, size: app.cv.size } : null,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
    };
}

export function toApplicationWithJob(app: ApplicationWithJobRecord): ApplicationWithJob {
    const application = toApplication(app);
    return { ...application, job: app.job ? { id: application.jobId, title: app.job.title } : null };
}
