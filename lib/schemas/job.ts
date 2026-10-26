import { z } from "zod";
import { JOB_STATUSES, JOB_TEXT_FIELDS } from "@/lib/config";

export const jobStatusSchema = z.enum(JOB_STATUSES);

export const jobSchema = z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    description: z.string(),
    // One requirement per line; rendered as a list on the job page.
    requirements: z.string(),
    // Free text so any currency/period works, e.g. "EGP 40,000 – 55,000 / month".
    salary: z.string(),
    status: jobStatusSchema,
    createdAt: z.string(),
});

export const jobWithApplicationCountSchema = jobSchema.extend({ applicationCount: z.number() });

// A job for its public page: `requirements` also parsed into a list.
export const jobWithRequirementsSchema = jobSchema.extend({ requirementList: z.array(z.string()) });

type JobTextFieldName = (typeof JOB_TEXT_FIELDS)[number]["name"];

function requiredText(label: string, maxLength: number) {
    return z.string().trim().min(1, `${label} is required.`).max(maxLength, `${label} must be at most ${maxLength} characters.`);
}

// Labels and limits come from JOB_TEXT_FIELDS, the same list JobForm renders.
const jobTextFields = Object.fromEntries(
    JOB_TEXT_FIELDS.map(({ name, label, maxLength }) => [name, requiredText(label, maxLength)]),
) as Record<JobTextFieldName, ReturnType<typeof requiredText>>;

// The job form (admin and public). A missing or unknown status falls back to "open";
// the public form has no status field and submitJob saves it as closed anyway.
export const jobInputSchema = z.object({ ...jobTextFields, status: jobStatusSchema.catch("open") });
