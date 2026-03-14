# Project Roadmap

## Tracking

- [Roadmap tracking issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/1)

> Last Updated: March 2026

## Current Status

**v1.4.0+** (March 2026)

StreamSlate is production-ready and professional-grade. All README feature claims are backed by working code. Core annotation, WebSocket remote control, presets, templates, output integrations (NDI/Syphon as build-time opt-in), presenter mode wiring, PDF page inversion, and release automation are complete. 211 unit tests, lint, and CI clean.

## Phases

### MVP ✅

- [x] Dark viewer
- [x] Highlighter
- [x] OBS browser source

### Beta ✅

- [x] Annotation save/export
- [x] WebSocket remote control API

### 1.0 ✅ (Public Release)

- [x] Local WebSocket sync and remote control
- [x] Native screen capture (ScreenCaptureKit)
- [x] Cross-platform builds (macOS, Windows, Linux)
- [x] CI/CD with code signing and notarization
- [x] E2E test coverage (Cypress)

### 1.1 ✅ (Annotation Presets, Templates, Hardening)

- [x] Annotation presets library ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/5))
- [x] Template system for common use cases ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/6))
- [x] Real WebSocket integration state (replaced simulated status)
- [x] UI consistency and design token alignment
- [x] Core workflow E2E test coverage
- [x] Syphon output scaffolding (macOS only) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/2))

### Post-1.1 ✅

- [x] NDI output (build-time opt-in, requires NDI SDK) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/3))
- [x] Syphon output GA (macOS only, build-time opt-in) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/2))
- [x] Portable settings export/import
- [x] Auto-update key setup ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/4))
- [x] Multi-monitor capture (macOS ScreenCaptureKit) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/9))

### 1.5 ✅ (Professional Grade — Truthfulness & Gap Closure)

- [x] Documentation truthfulness audit and README/ROADMAP corrections
- [x] Code cleanup (removed unused annotation types, isolated OBS stub)
- [x] Presenter mode wired to Tauri window commands (open/close/toggle)
- [x] PDF page inversion toggle (independent of dark mode)
- [x] Output settings promoted from experimental to first-class UI
- [x] Verification coverage: 180 → 211 tests (+31)
- [x] Manual verification checklist for NDI/Syphon/multi-monitor

### Future

- [ ] OBS WebSocket integration (direct scene/source control)
- [ ] Stream Deck plugin (official Elgato SDK v2 plugin)
- [ ] Mobile companion (iPad side-car) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/7))
- [ ] Cloud sync for settings ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/8))

## References

| Document               | Purpose               |
| ---------------------- | --------------------- |
| [README.md](README.md) | Project documentation |
| [AGENTS.md](AGENTS.md) | Agent guidance        |
