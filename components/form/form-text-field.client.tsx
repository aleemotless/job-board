"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormFieldProps } from "@/types";
import { FormField, useFormField } from "./form-field.client";

type FormTextFieldProps = Omit<FormFieldProps, "children"> & {
    multiline?: boolean;
    type?: "text" | "email";
    autoComplete?: string;
};

export function FormTextField({ name, label, hint, multiline = false, type = "text", autoComplete }: FormTextFieldProps) {
    const { controlProps, defaultValue } = useFormField(name, hint);

    return (
        <FormField name={name} label={label} hint={hint}>
            {multiline ? (
                <Textarea {...controlProps} defaultValue={defaultValue} rows={5} />
            ) : (
                <Input {...controlProps} defaultValue={defaultValue} type={type} autoComplete={autoComplete} />
            )}
        </FormField>
    );
}
