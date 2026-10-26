"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { FormFieldProps } from "@/types";
import { FormField, useFormField } from "./form-field.client";

type FormSelectFieldProps = Omit<FormFieldProps, "children"> & {
    options: readonly { value: string; label: string }[];
    defaultValue?: string;
};

export function FormSelectField({ name, label, hint, options, defaultValue }: FormSelectFieldProps) {
    const { controlProps, defaultValue: value } = useFormField(name, hint);

    return (
        <FormField name={name} label={label} hint={hint}>
            <NativeSelect {...controlProps} defaultValue={value ?? defaultValue}>
                {options.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
        </FormField>
    );
}
