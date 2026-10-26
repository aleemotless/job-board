// UI types shared by several files. A props type used by one component lives in that component's file.
import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

// Column config for DataTable; each table view defines its own columns.
export type DataTableColumn<Row> = {
    header: string;
    align?: "left" | "right";
    cell: (row: Row) => ReactNode;
};

// The shape every form Server Action returns (JobFormState, ApplyFormState narrow it).
export type ActionFormState = {
    errors?: Partial<Record<string, string>>;
    values?: Partial<Record<string, string>>;
    // Error not tied to one field.
    formError?: string;
    submitted?: boolean;
};

// Shared by FormField and every FormXField built on it.
export type FormFieldProps = { name: string; label: string; hint?: string; children: ReactNode };
