// frontend/src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";
import createDOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";

export const runtime = "nodejs"; // required for SDK/env

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const { title, project, instructions } = await req.json();
  const client = new Anthropic({ apiKey });

  const resp = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 4000,
    temperature: 0.2,
    system: "Return clean, professional Markdown (H1–H3, concise paragraphs).",
    messages: [
      { role: "user", content: `Create a document titled "${title}" for project "${project}". ${instructions || ""} Return ONLY Markdown.` }
    ],
  });

  const markdown = (resp as any)?.content?.[0]?.text ?? "";
  const html = marked.parse(markdown) as string;

  // Sanitize HTML for safety
  const window = new JSDOM("").window as unknown as Window;
  const DOMPurify = createDOMPurify(window);
  const safeHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

  return NextResponse.json({
    id: crypto.randomUUID(),
    title,
    project,
    generatedAt: new Date().toISOString(),
    mockMode: false,
    status: "success",
    sections: [],
    html: safeHtml,
    markdown,
    raw: resp,
  });
}

// app/api/generate/route.ts
import { anthropic } from "@anthropic-ai/sdk"; // or your client
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // call your orchestrator/Claude here
  const result = await anthropic.messages.create({
    model: body.model ?? "claude-3-7-sonnet-2025-xx",
    system: body.system, // your QUALITY-FIRST system prompt
    messages: body.messages,
    max_tokens: 8000, // tune as needed
  });

  // DO NOT console.log the full content — send it to the client:
  // result.content may be array segments; flatten to a single string
  const text = Array.isArray(result.content)
    ? result.content.map(p => ("text" in p ? p.text : "")).join("")
    : (result as any).content?.[0]?.text || (result as any).content || "";

  return NextResponse.json({ text });
}
