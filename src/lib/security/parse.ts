import { ZodSchema } from "zod";

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function parseAndValidateJson<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let jsonBody: unknown;

  try {
    jsonBody = await request.json();
  } catch {
    return { ok: false, message: "Malformed JSON payload" };
  }

  const parsed = schema.safeParse(jsonBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      message: firstIssue?.message ?? "Validation failed",
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
