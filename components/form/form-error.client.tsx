"use client";

import { FieldError } from "@/components/ui/field";
import { useFormFields } from "./form-fields-context.client";

// The action's error that isn't tied to one field, e.g. "This job is no longer accepting applications."
export function FormError() {
    const { formError } = useFormFields();
    return formError ? <FieldError>{formError}</FieldError> : null;
}
