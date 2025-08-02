Agents Guide for StreamSlate

“Write only what is true, useful, and lean.”

This document defines how automated coding or documentation agents (LLMs, code-gen bots, etc.) should operate when contributing to the StreamSlate repository. Treat it as your source-of-truth operating manual—follow it verbatim unless a human maintainer explicitly overrides it.

⸻

1. Mission & Scope

1.1 Product Context
	•	StreamSlate is a desktop PDF-annotation app for live streamers and YouTubers.
	•	Tauri (Rust + WebView) shell
	•	React + TypeScript front-end
	•	Tailwind CSS theming
	•	PDF.js + pdf-lib rendering/authoring
	•	Local WebSocket / NDI integrations for OBS, Stream Deck, etc.
	•	The codebase is dual-licensed (GPL-3 or commercial). All generated code must include GPL header stubs unless told otherwise.

1.2 Agent Responsibilities

Agent	Primary Tasks
FrontendAgent	Build React components, hooks, Tailwind styles, and Cypress tests.
BackendAgent	Implement Rust commands, Tauri APIs, file I/O, and performance optimisations.
DocsAgent	Produce / update .mdx documentation, API references, and changelogs.
DevOpsAgent	Maintain GitHub Actions, release pipelines, code-signing, and packaging scripts.

Agents must stay within their role unless explicitly delegated cross-tasks by a maintainer.

⸻

2. Workflow Rules
	1.	Grounding & Truthfulness
	•	Derive facts only from existing repository files, official dependencies, or instructions in an open issue/PR.
	•	If information is missing, leave a clear // TODO: or <!-- TODO: --> note rather than hallucinating.
	2.	Atomic Commits
	•	One logical change per commit.
	•	Use Conventional Commits format (feat:, fix:, docs:…).
	3.	File Types
	•	Documentation: write .mdx or .md files (never .txt).
	•	UI: use .tsx with functional React components.
	•	Rust: follow Rust 2021 edition, clippy clean.
	•	Tests: place alongside source with .test.tsx or .rs.
	4.	Style Guides
	•	Prettier + ESLint config lives in repo—run npm run lint:fix.
	•	Tailwind utility classes only; avoid custom CSS unless absolutely necessary.
	•	Rust code passes cargo fmt and cargo clippy -- -D warnings.
	5.	Documentation First
	•	Update relevant docs in the same PR.
	•	Public-facing docs live under docs/; developer notes under internal/.
	6.	Testing & CI
	•	Add/adjust tests so coverage doesn’t drop.
	•	Ensure npm run test and cargo test succeed locally before opening a PR.

⸻

3. Security & Privacy
	•	NO hard-coded secrets or tokens. Use environment variables and .env.example templates.
	•	User data (annotations, settings) must stay local; do not transmit externally unless feature-flagged and opt-in.

⸻

4. Communication Protocol

Agents interact via GitHub PRs, Issues, and comments:
	1.	Proposals → open a Draft PR titled agent/<feature>.
	2.	Clarifications → ask questions as PR comments; do not guess.
	3.	Status Updates → push incremental commits; prefix with wip: while unfinished.

⸻

5. Forbidden Actions
	•	Generating or referencing fictional product features.
	•	Exposing personal data about any individual (including the creator’s family).
	•	Adding dependencies exceeding 200 kB gzip without maintainer approval.
	•	Committing generated lock-files (package-lock.json, Cargo.lock) unless they change legitimately.

⸻

6. Helpful Shortcuts

Command	Purpose
npm run tauri dev	Hot-reload desktop build
npm run lint && npm run test	Pre-push check
cargo tauri build	Production bundle
npm run release:beta	Draft GitHub release


⸻

7. Final Reminder

Always anchor your output to verifiable repository context.
When uncertain, ask; when certain, be concise; when adding, document.

Happy shipping!
