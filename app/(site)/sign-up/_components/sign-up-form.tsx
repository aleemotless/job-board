import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { ButtonLink } from "@/components/common/button-link";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { FormSubmitButton } from "@/components/form/form-submit-button.client";
import { FormTextField } from "@/components/form/form-text-field.client";
import { SIGN_IN_PATH, USER_FIELD_LIMITS } from "@/lib/config";
import type { SignUpFormState } from "@/types";

type SignUpFormProps = {
    action: (state: SignUpFormState, formData: FormData) => Promise<SignUpFormState>;
};

// The action redirects on success, so there is no success message.
export function SignUpForm({ action }: SignUpFormProps) {
    return (
        <ActionForm action={action} initialState={{}} schema="signUp" className="max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-2xl">Your details</h2>
                    </CardTitle>
                    <CardDescription>You can apply to jobs and track your applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <FormTextField name="name" label="Full name" autoComplete="name" />
                        <FormTextField name="email" label="Email" type="email" autoComplete="email" />
                        <FormTextField
                            name="password"
                            label="Password"
                            type="password"
                            autoComplete="new-password"
                            hint={`At least ${USER_FIELD_LIMITS.passwordMin} characters.`}
                        />
                        <FormError />
                        <FormSubmitButton pendingLabel="Creating account...">Create account</FormSubmitButton>
                        <ButtonLink href={SIGN_IN_PATH} variant="link">
                            Already have an account? Sign in
                        </ButtonLink>
                    </FieldGroup>
                </CardContent>
            </Card>
        </ActionForm>
    );
}
