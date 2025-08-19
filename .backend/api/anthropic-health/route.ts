import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    hasAnthropicKey: Boolean(key),
    prefix: key ? key.slice(0, 7) + "…" : null,
    length: key ? key.length : 0,
  });
}
