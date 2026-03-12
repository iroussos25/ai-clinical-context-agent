"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app_error]", error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm">
        We hit an unexpected issue while loading this page. Please retry. If this keeps happening,
        capture the error details below and share them.
      </p>
      <p className="mt-4 rounded bg-white/70 p-3 text-xs font-mono">{error.message || "Unknown error"}</p>
      {error.digest ? <p className="mt-2 text-xs">Error digest: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  );
}
