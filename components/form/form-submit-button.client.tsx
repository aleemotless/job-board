"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/types";

type FormSubmitButtonProps = {
    children: ReactNode;
    pendingLabel: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
};

// Reads the enclosing <form>'s pending state, so the form doesn't have to pass it down.
export function FormSubmitButton({ children, pendingLabel, variant, size }: FormSubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" variant={variant} size={size} disabled={pending}>
            {pending ? pendingLabel : children}
        </Button>
    );
}
