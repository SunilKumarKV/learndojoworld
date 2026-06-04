import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          LearnDojoWorld
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or is no longer available.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
