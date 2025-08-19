"use client";
import { useState } from "react";
import { generateDoc } from "@/lib/ai";
import type { DocRun } from "@/types/run";

export default function Page() {
  const [run, setRun] = useState<DocRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    try {
      setError(null);
      setLoading(true);
      const r = await generateDoc({
        title: "Declaración de Impacto Ambiental – BESS",
        project: "Chilean BESS Environmental Impact Assessment",
        instructions:
          "Executive Summary, Legal Framework, Site Description, Technology, Environmental Baseline, Impact Assessment, Mitigation & Monitoring, Public Participation, Conclusion.",
      });
      setRun(r);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate test document"}
      </button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {run && (
        <>
          <div className="text-sm text-slate-600">
            mockMode: <b>{String(run.mockMode)}</b> • status: <b>{run.status}</b>
          </div>
          <h2 className="text-xl font-semibold">{run.title}</h2>
          <div
            className="prose max-w-none border rounded p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: run.html }}
          />
        </>
      )}
    </div>
  );
}
