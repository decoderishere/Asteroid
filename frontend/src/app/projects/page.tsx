"use client";

import { useState } from "react";
import Link from "next/link";
import { generateDoc } from "@/lib/ai";
import type { DocRun } from "@/types/run";
import { upsertRun } from "@/lib/runStore";
import { ResultPreview } from "@/components/ResultPreview";

export default function ProjectsPage() {
  const [run, setRun] = useState<DocRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    try {
      setError(null);
      setLoading(true);
      const r = await generateDoc({
        title: "Declaración de Impacto Ambiental – BESS",
        project: "Chilean BESS Environmental Impact Assessment",
        instructions:
          "Executive Summary, Legal Framework, Site Description, Technology, Environmental Baseline, Impact Assessment, Mitigation & Monitoring, Public Participation, Conclusion."
      });
      setRun(r); // r.mockMode === false
      upsertRun(r);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AI Agent Document Generation</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate BESS permitting documents using our intelligent agent system</p>
      </header>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate a new document</h3>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {!run && !loading && !error && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            No results yet. Click "Generate" to create one.
          </div>
        )}

        {run && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
              <span>
                mockMode: <strong className={run.mockMode ? "text-orange-600" : "text-green-600"}>{String(run.mockMode)}</strong>
              </span>
              <span>
                status: <strong className="text-green-600">{run.status}</strong>
              </span>
              {run && run.mockMode && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                  Mock Mode
                </span>
              )}
            </div>
            
            <div className="border-t pt-4">
              <ResultPreview run={run} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-3 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(run.markdown);
                  // You could add a toast notification here
                }}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Copy Markdown
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(run.html);
                  // You could add a toast notification here
                }}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Copy HTML
              </button>
              <Link
                href={`/documents/${run.id}`}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors inline-block text-center"
              >
                Open in Documents
              </Link>
              <button
                onClick={() => setRun(null)}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}