import type { z } from "zod";
import type { mockStoreSchema } from "@/lib/schemas/store";

export type MockStore = z.infer<typeof mockStoreSchema>;
