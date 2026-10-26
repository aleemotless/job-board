"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import type { z } from "zod";
import { FORM_SCHEMAS, type FormSchemaName } from "@/lib/schemas/forms";
import { firstFieldErrors } from "@/lib/validation/form";
import type { ActionFormState } from "@/types";

type FieldErrors = Partial<Record<string, string>>;

function fieldName(target: EventTarget): string | undefined {
    const isField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    return isField && target.name ? target.name : undefined;
}

// Validates fields in the browser with the form's zod schema: a field is checked when it loses
// focus, re-checked as it changes once it shows an error, and every field is checked on submit
// (which is blocked while any is invalid). A new server response resets it, so the server's
// errors show until the user edits that field again.
export function useLiveValidation(schemaName: FormSchemaName | undefined, serverState: ActionFormState) {
    // A key present means "checked in the browser since the last server response"; undefined = valid.
    const [live, setLive] = useState<{ for: ActionFormState; errors: FieldErrors }>({ for: serverState, errors: {} });
    const liveErrors = live.for === serverState ? live.errors : {};
    const errors = { ...serverState.errors, ...liveErrors };

    function validate(form: HTMLFormElement): FieldErrors {
        if (!schemaName) return {};
        // Widened: the hook only needs field names and messages, not the parsed value.
        const schema: z.ZodType = FORM_SCHEMAS[schemaName];
        const result = schema.safeParse(Object.fromEntries(new FormData(form)));
        return result.success ? {} : firstFieldErrors(result.error);
    }

    function check(form: HTMLFormElement, names: string[]) {
        const found = validate(form);
        const checked = Object.fromEntries(names.map((name) => [name, found[name]]));
        setLive((prev) => ({ for: serverState, errors: { ...(prev.for === serverState ? prev.errors : {}), ...checked } }));
    }

    const handlers = {
        onBlur(event: FocusEvent<HTMLFormElement>) {
            const name = fieldName(event.target);
            if (name) check(event.currentTarget, [name]);
        },
        onChange(event: FormEvent<HTMLFormElement>) {
            const name = fieldName(event.target);
            // File and select fields have no typing phase, so check them on every change.
            const immediate = event.target instanceof HTMLSelectElement || (event.target instanceof HTMLInputElement && event.target.type === "file");
            if (name && (errors[name] || immediate)) check(event.currentTarget, [name]);
        },
        onSubmit(event: FormEvent<HTMLFormElement>) {
            const found = validate(event.currentTarget);
            if (!Object.keys(found).length) return;
            event.preventDefault();
            check(event.currentTarget, [...new Set([...new FormData(event.currentTarget).keys(), ...Object.keys(found)])]);
        },
    };

    return { errors, handlers };
}
