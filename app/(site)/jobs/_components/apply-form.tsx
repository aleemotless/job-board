import { CircleCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { MessageCard } from "@/components/common/message-card";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { FormFileField } from "@/components/form/form-file-field.client";
import { FormSubmitButton } from "@/components/form/form-submit-button.client";
import { FormTextField } from "@/components/form/form-text-field.client";
import { CV_ACCEPT, MAX_CV_BYTES } from "@/lib/config";
import { formatFileSize } from "@/lib/format/file";
import type { ApplyFormState } from "@/types";

type ApplyFormProps = {
    action: (state: ApplyFormState, formData: FormData) => Promise<ApplyFormState>;
};

// Server Component: the card, heading and success message render on the server;
// ActionForm and the fields are the only client parts.
export function ApplyForm({ action }: ApplyFormProps) {
    return (
        <ActionForm
            action={action}
            initialState={{}}
            schema="application"
            success={
                <MessageCard
                    live
                    icon={<CircleCheck aria-hidden className="size-6" />}
                    title="Application sent"
                    description="Thanks for applying. The team will review your CV and get back to you by email."
                />
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-2xl">Apply now</h2>
                    </CardTitle>
                    <CardDescription>Send your details and CV.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <FormTextField name="name" label="Full name" autoComplete="name" />
                        <FormTextField name="email" label="Email" type="email" autoComplete="email" />
                        <FormTextField name="coverLetter" label="Cover letter (optional)" multiline />
                        <FormFileField name="cv" label="CV" hint={`PDF, DOC or DOCX, up to ${formatFileSize(MAX_CV_BYTES)}.`} accept={CV_ACCEPT} />
                        <FormError />
                        <FormSubmitButton pendingLabel="Sending...">Submit application</FormSubmitButton>
                    </FieldGroup>
                </CardContent>
            </Card>
        </ActionForm>
    );
}
