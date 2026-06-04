import type { Metadata } from "next";

import { SITE_CONFIG } from "@/constants/site";

type SeoMetadataInput = {
  title: string;
  description: string;
  path?: string;
  images?: string[];
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = SITE_CONFIG.url.replace(/\/+$/g, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export function createSeoMetadata({
  description,
  images = [SITE_CONFIG.ogImage],
  path = "/",
  title,
  type = "website",
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrls = images.map((image) => absoluteUrl(image));

  return {
    alternates: {
      canonical,
    },
    description,
    openGraph: {
      description,
      images: imageUrls,
      siteName: SITE_CONFIG.name,
      title,
      type,
      url: canonical,
    },
    title,
    twitter: {
      card: "summary_large_image",
      creator: SITE_CONFIG.social.twitter,
      description,
      images: imageUrls,
      title,
    },
  };
}
