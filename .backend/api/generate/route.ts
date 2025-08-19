// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";

export const runtime = "nodejs"; // required for Anthropic SDK (not Edge)

type Section = { id: string; name: string; tokens?: number; html?: string; markdown?: string; };
type DocRun = {
  id: string;
  title: string;
  project: string;
  generatedAt: string; // ISO
  mockMode: boolean;
  status: "success" | "running" | "error";
  sections: Section[];
  html: string;
  markdown: string;
  raw: Record<string, any>;
  shareUrl?: string;
};

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const { title, project, instructions } = await req.json();

  const system =
    "You generate professional documents. Return clean, concise Markdown with sensible headings (H1/H2/H3) and readable paragraphs. Avoid giant fonts or excessive spacing.";

  const user = `
Create a document titled "${title}" for project "${project}".
${instructions || "Write a well-structured document with 6–10 sections, including an executive summary."}
Return ONLY Markdown. Do not include code fences.
`;

  // Call Claude
  const resp = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 4000,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: user }],
  });

  const markdown = (resp.content?.[0] as any)?.text ?? "";
  const html = marked.parse(markdown) as string;

  // quick sectionizer from headings
  const sections: Section[] = markdown
    .split(/\n(?=#+\s)/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((md) => {
      const m = md.match(/^#{1,6}\s+(.*)$/m);
      const name = m ? m[1].trim() : "Section";
      return {
        id: crypto.randomUUID(),
        name,
        markdown: md,
        html: marked.parse(md) as string,
        tokens: md.split(/\s+/).length,
      };
    });

  const run: DocRun = {
    id: crypto.randomUUID(),
    title,
    project,
    generatedAt: new Date().toISOString(),
    mockMode: false,
    status: "success",
    sections,
    html,
    markdown,
    raw: resp as any,
  };

  return NextResponse.json(run);
}
