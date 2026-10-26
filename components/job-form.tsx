import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { ButtonLink } from "@/components/common/button-link";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { FormSelectField } from "@/components/form/form-select-field.client";
import { FormSubmitButton } from "@/components/form/form-submit-button.client";
import { FormTextField } from "@/components/form/form-text-field.client";
import { JOB_STATUS_OPTIONS, JOB_TEXT_FIELDS } from "@/lib/config";
import type { Job, JobFormState } from "@/types";

type JobFormProps = {
    action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
    job?: Job;
    submitLabel: string;
    cancelHref: string;
    // Hidden on the public form, where submissions are always saved as closed.
    showStatus?: boolean;
};

// Create/edit a job. Used by the admin dashboard and the public "Post a job" page.
// Server Component: only ActionForm and the fields inside it run on the client.
export function JobForm({ action, job, submitLabel, cancelHref, showStatus = true }: JobFormProps) {
    return (
        <Card className="max-w-xl">
            <CardContent>
                <ActionForm action={action} initialState={{}} schema="job" initialValues={job}>
                    <FieldGroup>
                        {JOB_TEXT_FIELDS.map((field) => (
                            <FormTextField
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                hint={"hint" in field ? field.hint : undefined}
                                multiline={"multiline" in field && field.multiline}
                            />
                        ))}
                        {showStatus && <FormSelectField name="status" label="Status" options={JOB_STATUS_OPTIONS} defaultValue="open" />}
                        <FormError />
                        <Field orientation="horizontal">
                            <FormSubmitButton pendingLabel="Saving...">{submitLabel}</FormSubmitButton>
                            <ButtonLink href={cancelHref} variant="outline">
                                Cancel
                            </ButtonLink>
                        </Field>
                    </FieldGroup>
                </ActionForm>
            </CardContent>
        </Card>
    );
}
