"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getQueryClient } from "@/services/query-client";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
