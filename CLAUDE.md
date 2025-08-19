# 🧠 BESS Permitting Multi-Agent System – Agent-First, Next.js App Router – Claude System Brief

## 0. Context

We are building a **agent-based system** for Chile-only BESS permitting.  

The system should **auto-generate all relevant permitting/interconnection draft documents** from structured and unstructured inputs, update them dynamically when new data arrives, and allow leadership to see progress and quality metrics.  

Our MVP runs locally for now. We will later extend to cloud deployment.

The goal here:  
- Claude Code plans and writes **agentic backend (Python)** and **Next.js App Router frontend (TypeScript)**.  
- Claude chooses **optimal architecture variants** after evaluating alternatives.  
- Claude uses **OpenRouter** to dynamically route sub-tasks to best-suited LLMs/tools.  
- Claude ensures **full transparency** of intermediate outputs, reasoning, and document provenance.  
- The system must allow **interrogation of any step** (agent reasoning, source data, document generation steps).  

---

## 1. Problem Definition

Given:
- Substation ID + basic project data (any format: PDF, Word, email, free text).
- Regulatory templates & Chile-specific permitting rules.
  
We need:
- Drafting of all required Chile BESS permitting/interconnection documents.
- Quality review + feedback incorporation loop.
- Leadership dashboard for visibility into progress, risks, and KPIs.

Constraints:
- Run locally (MVP).
- Allow multiple agents to coordinate tasks.
- Support bilingual output (Spanish default, English optional).
- All outputs must be **versioned, traceable, and cite sources**.

---

## 2. Primary User Flows

### Flow A – Create New Project
1. **Developer** creates project (frontend form).
2. Uploads documents via drag-and-drop or chat.
3. **Ingestion Agent** parses → extracts structured fields.
4. **Drafting Agent** generates drafts for all possible docs given available data.
5. **Quality Reviewer Agent** scores them and identifies missing info.
6. Project dashboard updates with status + KPIs.

### Flow B – Update Project
1. Developer uploads new/updated doc.
2. Ingestion re-runs on only new data.
3. Drafting Agent updates only affected docs.
4. Docs return to “Needs Review” state.

### Flow C – Leadership Oversight
1. Leadership views dashboard with all projects.
2. Can interrogate any doc’s history, sources, and reasoning.
3. Can approve/reject docs with comments.
4. Alerts when barriers or missing info are detected.

---

## 3. Agent Definitions

**Orchestrator Agent**
- Routes tasks between other agents.
- Maintains global project state & dependencies.
- Monitors task completion + errors.

**Ingestion Agent**
- Handles multi-format ingestion (PDF, Word, email).
- Extracts structured metadata + text chunks.
- Stores original + processed files with source mapping.

**Drafting Agent**
- Generates Chile-specific permitting drafts using templates + retrieved facts.
- Flags placeholders when info is missing.
- Produces DOCX + PDF outputs with citations.

**Quality Reviewer Agent**
- Scores each draft (0–100) for completeness, compliance, clarity.
- Logs missing elements + recommended fixes.

**Feedback Integration Agent**
- Reads human reviewer feedback.
- Regenerates improved drafts with applied fixes.

**Progress Tracking Agent**
- Maintains KPI metrics:
  - % of required docs generated
  - Average quality score per doc type
  - Average feedback iterations before approval

---

## 4. Compute & Architecture Requirements

Claude should:
- **Evaluate architecture variations**:
  - Monolithic Python backend vs. microservices
  - In-process vs. queue-based agent orchestration
  - SQLite vs. Postgres local dev DB
  - Direct LLM calls vs. retrieval-augmented
- Choose optimal trade-offs for:
  - Local performance
  - Ease of later cloud migration
  - Debuggability & transparency

**Backend (Python)**  
- Agent orchestration engine.
- REST/GraphQL API for frontend.
- Model routing via OpenRouter (Claude, GPT-4o, etc. depending on task type).

**Frontend (Next.js / TypeScript)**  
- Pages: Project list, project detail, document review, leadership dashboard.
- Components for file uploads, doc viewers, KPI charts.
- Role-based UI (Developer, Reviewer, Leadership).

**Storage**
- Local filesystem for files.
- SQLite/Postgres for metadata + logs.

---

## 5. Interrogation & Transparency Features

Claude must ensure:
- Every doc has source provenance (file + location).
- Every agent step logs input, output, and model used.
- Every agent's reasoning trace is stored and viewable.
- User can request replay of any agent step with different parameters.

---

## 6. Technical Brief for Implementation

### Language & Frameworks
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy.
- **Frontend:** Next.js 15, Tailwind CSS, TypeScript.
- **Agents:** Modular Python classes with clear input/output schemas.
- **DB:** SQLite (MVP), upgrade path to Postgres.
- **Model Access:** OpenRouter API for multi-LLM orchestration.

### Deliverables
1. **Backend Code (Python)**  
   - Agent orchestration system.  
   - REST/GraphQL endpoints.  
   - Local run scripts + tests.  
2. **Frontend Code (TypeScript)**  
   - Next.js UI with page routing.  
   - File upload, document review, KPI views.  
3. **Config**  
   - `.env` for OpenRouter keys, DB path.  
4. **Docs**  
   - README with run instructions.  
   - Agent interaction diagrams.

---

## 7. Claude Action Plan

Claude should:
1. **Propose architecture variants** → choose one based on trade-offs.
2. **Design data schema** for projects, files, documents, KPIs.
3. **Define agent I/O contracts** and orchestration flow.
4. **Implement**:
   - Python backend with modular agents.
   - Next.js frontend.
5. **Integrate model routing** with OpenRouter.
6. **Ensure logging & interrogation features** are built-in.
7. **Test end-to-end flow** locally with mock data.

---

## 8. Output Expectations

- Fully working local MVP.
- Agents can be run individually for debugging.
- Clear CLI and frontend ways to trigger any flow.
- KPI dashboard visible to leadership role.
- Code well-documented for later scaling.
