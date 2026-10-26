"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { FormFieldProps } from "@/types";
import { useFormFields } from "./form-fields-context.client";

// Everything a control needs to wire itself to its label, hint and error.
export function useFormField(name: string, hint?: string) {
    const { errors, values } = useFormFields();
    const error = errors?.[name];
    const hintId = hint ? `${name}-hint` : undefined;
    const errorId = `${name}-error`;
    const describedBy = [hintId, error && errorId].filter(Boolean).join(" ") || undefined;

    return {
        error,
        hintId,
        errorId,
        defaultValue: values?.[name],
        controlProps: { id: name, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy },
    };
}

// Label, hint and error around one control; the control is the child.
export function FormField({ name, label, hint, children }: FormFieldProps) {
    const { error, hintId, errorId } = useFormField(name, hint);

    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {children}
            {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
            {error && <FieldError id={errorId}>{error}</FieldError>}
        </Field>
    );
}
