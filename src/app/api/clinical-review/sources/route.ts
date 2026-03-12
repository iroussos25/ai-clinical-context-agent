import { NextResponse } from "next/server";

import { searchPubMedLiterature } from "@/lib/pubmed";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const context = typeof body.context === "string" ? body.context.trim() : "";

    if (!prompt || !context) {
      return NextResponse.json({ error: "Prompt and context are required" }, { status: 400 });
    }

    const result = await searchPubMedLiterature(prompt, context);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Literature search failed",
      },
      { status: 500 }
    );
  }
}
