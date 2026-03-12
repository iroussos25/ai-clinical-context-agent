"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-zinc-50 p-6 text-zinc-900">
        <main className="mx-auto mt-10 w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold">A critical error occurred</h1>
          <p className="mt-2 text-sm">
            The application encountered a fatal error. Please retry. If the issue persists, share the
            details below.
          </p>
          <p className="mt-4 rounded bg-white/70 p-3 text-xs font-mono">{error.message || "Unknown error"}</p>
          {error.digest ? <p className="mt-2 text-xs">Error digest: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Reload app
          </button>
        </main>
      </body>
    </html>
  );
}
