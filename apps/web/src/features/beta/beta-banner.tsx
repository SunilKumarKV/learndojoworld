"use client";

import Link from "next/link";
import { MessageSquareWarning, Send } from "lucide-react";

export function BetaBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">LearnDojoWorld Beta</p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <Link
            className="inline-flex items-center gap-1 hover:underline"
            href={{ pathname: "/feedback" }}
          >
            <Send className="h-3.5 w-3.5" />
            Feedback
          </Link>
          <Link
            className="inline-flex items-center gap-1 hover:underline"
            href={{ pathname: "/support" }}
          >
            <MessageSquareWarning className="h-3.5 w-3.5" />
            Report issue
          </Link>
        </div>
      </div>
    </div>
  );
}
