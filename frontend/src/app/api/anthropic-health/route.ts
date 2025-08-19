import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const k = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({ hasAnthropicKey: !!k, prefix: k ? k.slice(0,7)+"…" : null });
}
