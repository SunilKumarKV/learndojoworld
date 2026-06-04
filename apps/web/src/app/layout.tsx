import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/app/providers";
import { SITE_CONFIG } from "@/constants/site";
import { absoluteUrl } from "@/lib/seo/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    description: SITE_CONFIG.description,
    images: [absoluteUrl(SITE_CONFIG.ogImage)],
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    type: "website",
    url: absoluteUrl("/"),
  },
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_CONFIG.social.twitter,
    description: SITE_CONFIG.description,
    images: [absoluteUrl(SITE_CONFIG.ogImage)],
    title: SITE_CONFIG.name,
  },
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
