import { NextResponse } from "next/server";

import { createCorsHeaders } from "@/lib/security/headers";

export function getRequestId() {
  return crypto.randomUUID();
}

export function createJsonError(request: Request, status: number, message: string, requestId: string) {
  return NextResponse.json(
    {
      error: message,
      requestId,
    },
    {
      status,
      headers: {
        ...createCorsHeaders(request),
        "X-Request-Id": requestId,
      },
    }
  );
}

export function createJsonOk<T>(request: Request, data: T, requestId: string, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...createCorsHeaders(request),
      "X-Request-Id": requestId,
    },
  });
}

export function createTextResponse(
  request: Request,
  status: number,
  body: string,
  requestId: string,
  extraHeaders?: Record<string, string>
) {
  return new Response(body, {
    status,
    headers: {
      ...createCorsHeaders(request),
      "Content-Type": "text/plain; charset=utf-8",
      "X-Request-Id": requestId,
      ...(extraHeaders ?? {}),
    },
  });
}
