export const SITE_CONFIG = {
  name: "LearnDojoWorld",
  description: "A startup-grade AI learning operating system for focused, adaptive learning.",
  links: [
    { label: "Memory", href: "#memory" },
    { label: "Courses", href: "#courses" },
    { label: "Creators", href: "#creators" },
  ],
} as const;

export const LEARNER_MODES = ["Builder", "Exam", "Career"] as const;
