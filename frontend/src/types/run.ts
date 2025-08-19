export type Section = { id: string; name: string; tokens?: number; html?: string; markdown?: string };
export type DocRun = {
  id: string;
  title: string;
  project: string;
  generatedAt: string; // ISO
  mockMode: boolean;
  status: "success" | "running" | "error";
  sections: Section[];
  html: string;
  markdown: string;
  raw?: Record<string, any>;
  shareUrl?: string;
};