"use client";

import { useActionState, type ReactNode } from "react";
import type { FormSchemaName } from "@/lib/schemas/forms";
import type { ActionFormState } from "@/types";
import { FormFieldsContext } from "./form-fields-context.client";
import { useLiveValidation } from "./use-live-validation.client";

type ActionFormProps<State extends ActionFormState> = {
    // Awaited<State> mirrors useActionState's signature; for a concrete state type it is the same type.
    action: (state: Awaited<State>, formData: FormData) => Promise<State>;
    initialState: Awaited<State>;
    // Re-runs this schema in the browser for live field errors (see useLiveValidation).
    schema?: FormSchemaName;
    // Pre-fills the fields, e.g. the job being edited. Typed values win after a failed submit.
    initialValues?: Partial<Record<string, string>>;
    // Rendered instead of the form once the action returns `submitted: true`.
    success?: ReactNode;
    children: ReactNode;
    className?: string;
};

// The only stateful part of a form: runs the Server Action through useActionState and shares
// the result with the fields. Everything around it (cards, headings, the fields' layout and
// the success message) is rendered by the Server Component that uses it.
export function ActionForm<State extends ActionFormState>({ action, initialState, schema, initialValues, success, children, className }: ActionFormProps<State>) {
    const [state, formAction] = useActionState(action, initialState);
    const { errors, handlers } = useLiveValidation(schema, state);

    if (state.submitted && success) return success;

    // After a failed submit, re-fill what was typed; otherwise start from initialValues.
    const values = state.values ?? initialValues;

    return (
        <FormFieldsContext value={{ errors, values, formError: state.formError }}>
            {/* key: remount after a failed submit so defaultValue picks up the typed values */}
            <form key={JSON.stringify(state.values)} action={formAction} className={className} noValidate {...handlers}>
                {children}
            </form>
        </FormFieldsContext>
    );
}
