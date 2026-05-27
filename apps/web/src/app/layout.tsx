import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/app/providers";
import { SITE_CONFIG } from "@/constants/site";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
