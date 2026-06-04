import { Mail, MessageSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, PublicShell } from "@/features/marketing/public-shell";
import { createSeoMetadata } from "@/lib/seo/metadata";

export const metadata = createSeoMetadata({
  description:
    "Contact LearnDojoWorld for product, creator, partnership, or support conversations. Contact form shell only; email sending is not enabled yet.",
  path: "/contact",
  title: "Contact",
});

export default function ContactPage() {
  return (
    <PublicShell>
      <MarketingHero
        description="Use this shell to shape product, creator, and partnership inquiries. Message delivery is intentionally not wired yet."
        eyebrow="Contact"
        title="Talk to LearnDojoWorld."
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="space-y-4">
          {[
            { icon: Mail, text: "Product and support inquiries" },
            { icon: MessageSquare, text: "Creator and course questions" },
            { icon: ShieldCheck, text: "Security or billing concerns" },
          ].map((item) => (
            <Card key={item.text}>
              <CardContent className="flex gap-4 p-5">
                <item.icon className="h-5 w-5 flex-none text-primary" />
                <p className="text-sm font-semibold text-slate-800">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <form className="grid gap-4">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Name
                <input className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Email
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  type="email"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Message
                <textarea className="min-h-36 w-full rounded-md border border-slate-300 p-3 text-sm" />
              </label>
              <Button disabled type="button">
                Email sending coming soon
              </Button>
              <p className="text-sm leading-6 text-slate-600">
                This form is a public contact foundation. It does not send email or store messages
                yet.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
