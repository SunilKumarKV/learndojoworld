export const SITE_CONFIG = {
  name: "LearnDojoWorld",
  titleTemplate: "%s | LearnDojoWorld",
  description:
    "LearnDojoWorld combines AI tutoring, expert courses, a memory engine, and creator-powered learning paths for global learners.",
  url: process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000",
  ogImage: "/opengraph-image.png",
  links: [
    { label: "Explore", href: "/explore" },
    { label: "Pricing", href: "/pricing" },
    { label: "Creators", href: "/become-creator" },
    { label: "About", href: "/about" },
  ],
  social: {
    twitter: "@LearnDojoWorld",
  },
} as const;

export const LEARNER_MODES = ["Builder", "Exam", "Career"] as const;
