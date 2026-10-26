"use client";

import { Input } from "@/components/ui/input";
import type { FormFieldProps } from "@/types";
import { FormField, useFormField } from "./form-field.client";

type FormFileFieldProps = Omit<FormFieldProps, "children"> & { accept: string };

// File inputs can't be pre-filled, so after a failed submit the user re-selects the file.
export function FormFileField({ name, label, hint, accept }: FormFileFieldProps) {
    const { controlProps } = useFormField(name, hint);

    return (
        <FormField name={name} label={label} hint={hint}>
            <Input {...controlProps} type="file" accept={accept} className="h-auto py-1.5" />
        </FormField>
    );
}
