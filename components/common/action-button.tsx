import type { ReactNode } from "react";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { FormSubmitButton } from "@/components/form/form-submit-button.client";
import type { ActionFormState, ButtonSize, ButtonVariant } from "@/types";

type ActionButtonProps = {
    // Usually a Server Action bound to an id; any formError it returns shows under the button.
    action: (state: ActionFormState, formData: FormData) => Promise<ActionFormState>;
    children: ReactNode;
    pendingLabel: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
};

// A single button that runs a Server Action, e.g. "Delete". Shows a pending label while it runs.
export function ActionButton({ action, children, pendingLabel, variant = "destructive", size }: ActionButtonProps) {
    return (
        <ActionForm action={action} initialState={{}}>
            <FormSubmitButton pendingLabel={pendingLabel} variant={variant} size={size}>
                {children}
            </FormSubmitButton>
            <FormError />
        </ActionForm>
    );
}
