import type { z } from "zod";
import type { candidateSchema } from "@/lib/schemas/candidate";

export type Candidate = z.infer<typeof candidateSchema>;
