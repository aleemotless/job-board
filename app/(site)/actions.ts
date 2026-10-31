"use server";

import { signOut } from "@/lib/auth";
import type { ActionFormState } from "@/types";

export async function signOutAction(): Promise<ActionFormState> {
    await signOut({ redirectTo: "/" });
    return {};
}
