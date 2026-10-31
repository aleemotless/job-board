import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { ButtonLink } from "@/components/common/button-link";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { FormSubmitButton } from "@/components/form/form-submit-button.client";
import { FormTextField } from "@/components/form/form-text-field.client";
import { SIGN_UP_PATH } from "@/lib/config";
import type { SignInFormState } from "@/types";

type SignInFormProps = {
    action: (state: SignInFormState, formData: FormData) => Promise<SignInFormState>;
};

// The action redirects on success, so there is no success message.
export function SignInForm({ action }: SignInFormProps) {
    return (
        <ActionForm action={action} initialState={{}} schema="signIn" className="max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-2xl">Welcome back</h2>
                    </CardTitle>
                    <CardDescription>Sign in with your email and password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <FormTextField name="email" label="Email" type="email" autoComplete="email" />
                        <FormTextField name="password" label="Password" type="password" autoComplete="current-password" />
                        <FormError />
                        <FormSubmitButton pendingLabel="Signing in...">Sign in</FormSubmitButton>
                        <ButtonLink href={SIGN_UP_PATH} variant="link">
                            New here? Create an account
                        </ButtonLink>
                    </FieldGroup>
                </CardContent>
            </Card>
        </ActionForm>
    );
}
