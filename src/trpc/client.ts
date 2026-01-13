"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/shared/infra/trpc/root";

export const trpc = createTRPCReact<AppRouter>();
