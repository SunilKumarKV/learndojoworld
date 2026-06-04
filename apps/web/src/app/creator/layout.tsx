import type { ReactNode } from "react";

import { CreatorLayoutSwitch } from "@/features/creator/components/creator-layout-switch";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <CreatorLayoutSwitch>{children}</CreatorLayoutSwitch>;
}
