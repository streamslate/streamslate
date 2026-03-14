# Loom Context Pack

## Quick Links

- Workspace snapshot: `00-workspace-snapshot.md`
- MCP inventory: `00-mcp-inventory.md`
- Research: `10-research.md`
- Product spec: `20-product-spec.md`
- Implementation plan: `30-implementation-plan.md`
- Decisions: `40-decisions.md`
- Worklog: `50-worklog.md`

## Current Goal

Bring StreamSlate to professional grade by closing all feature truthfulness gaps and implementation mismatches. Every README claim must be backed by working code or explicitly moved to the future roadmap.

## Current Status

- Version: `1.4.0` (aligned across `package.json`, `Cargo.toml`, `tauri.conf.json`)
- CI: full cross-platform pipeline (macOS, Windows, Linux)
- Codebase index: 593 chunks (lexical, current)
- Feature reality audit: complete (2026-03-14)

## Key Findings (2026-03-14 Audit)

### Working as claimed: 22 features
Core PDF viewing, 6 annotation types, templates/presets, WebSocket server, remote control, PDF export, settings export/import, auto-updater, NDI output, Syphon output, screen capture, multi-monitor capture, presenter view, cross-platform builds, borderless mode.

### Overclaimed (no implementation): 6 items
1. **OBS integration** — `connectOBS()` returns `OBS_NOT_IMPLEMENTED`
2. **Stream Deck plug-in** — PoC manifest only, no real SDK integration
3. **WCAG contrast** — no contrast validation code
4. **PDF page inversion** — dark mode is UI-only
5. **Presenter token auth** — no token validation
6. **Global hotkeys** — not implemented

### Partially implemented: 4 items
1. **Presenter mode** — backend ready, frontend doesn't invoke Tauri commands
2. **Underline annotation** — type defined, no rendering
3. **Multi-monitor UI** — debug panel only
4. **PresenterConfig** — accepted but unused

## Priority Sequence

1. M1: Fix documentation claims (README, ROADMAP)
2. M2: Code cleanup (remove stubs, clean types)
3. M3: Wire presenter mode frontend → Tauri
4. M4: Add PDF page inversion
5. M5: Promote multi-monitor UI
6. M6: Verification coverage
7. M7-M9: Future scope (OBS, Stream Deck, text annotations)

## Success Criteria

- [ ] Every ✅ in README backed by exercised code
- [ ] No dead stubs referenced in user-facing docs
- [ ] Presenter mode opens real window from UI toggle
- [ ] Local quality commands pass
- [ ] Feature-gated capabilities clearly labeled

## Sources

- `.loom/10-research.md` (feature reality audit, 2026-03-14)
- `.loom/30-implementation-plan.md` (execution plan)
- `package.json:4`, `src-tauri/Cargo.toml:3`, `src-tauri/tauri.conf.json:3`
- MCP: `codebase_stats(repo_id="streamslate")` → 593 chunks
