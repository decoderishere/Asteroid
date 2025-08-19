// components/GenerateButton.tsx
"use client";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { splitClaudeSections } from "@/lib/splitClaudeSections";
import { saveRun } from "@/lib/runStore";

export default function GenerateButton({ payload, title }: { payload: any; title: string }) {
  const router = useRouter();

  const onClick = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { text } = await res.json();           // ← this is the full Claude output
    const { finalRaw, uiMd, traceJson } = splitClaudeSections(text);

    if (!finalRaw) {
      alert("No FINAL ANSWER found. Check prompts/markers.");
      return;
    }

    // If Claude returns markdown, you can render as MD; if it returns HTML, sanitize & render as HTML.
    // Here we assume HTML-ish content for a DIA:
    const sanitizedHtml = DOMPurify.sanitize(finalRaw, { USE_PROFILES: { html: true } });

    const id = crypto.randomUUID();
    saveRun({
      id,
      title: title || "DIA BESS",
      html: sanitizedHtml,
      uiMd,
      trace: traceJson,
      createdAt: new Date().toISOString(),
    });

    router.push(`/documents/${id}`); // go show it
  };

  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl shadow bg-black text-white">
      Generate
    </button>
  );
}
