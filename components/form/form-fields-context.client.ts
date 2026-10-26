"use client";

import { createContext, useContext } from "react";
import type { ActionFormState } from "@/types";

type FormFieldsContextValue = Pick<ActionFormState, "errors" | "values" | "formError">;

// Provided by <ActionForm> (from its useActionState result) so each field reads its own
// error and value. Pending state comes from useFormStatus instead (see FormSubmitButton).
export const FormFieldsContext = createContext<FormFieldsContextValue | null>(null);

export function useFormFields(): FormFieldsContextValue {
    const context = useContext(FormFieldsContext);
    if (!context) throw new Error("useFormFields must be used inside <ActionForm>.");
    return context;
}
