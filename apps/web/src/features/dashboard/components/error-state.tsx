export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="max-w-xl rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-soft-xl">
        <p className="text-base font-medium text-red-700">{message}</p>
      </div>
    </div>
  );
}
