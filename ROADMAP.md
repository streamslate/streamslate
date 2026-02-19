# Project Roadmap

## Tracking

- [Roadmap tracking issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/1)

> Last Updated: February 2026

## Current Status

**v1.1.1** (February 2026)

StreamSlate is production-ready. Core annotation, streaming integration, live collaboration, presets, and template features are complete. See README.md for feature highlights.

## Phases

### MVP ✅

- [x] Dark viewer
- [x] Highlighter
- [x] OBS browser source

### Beta ✅

- [x] Annotation save/export
- [x] Stream Deck plug-in

### 1.0 ✅ (Public Release)

- [x] Live collaboration (WebSocket Sync)
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

- [x] NDI output (requires NDI SDK) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/3))
- [x] Syphon output GA (macOS only) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/2))
- [x] Auto-update key setup ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/4))

### Future

- [ ] Mobile companion (iPad side-car) ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/7))
- [ ] Cloud sync for settings ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/8))
- [ ] Multi-monitor capture ([Issue](https://gitlab.flexinfer.ai/services/streamslate/-/issues/9))

## References

| Document               | Purpose               |
| ---------------------- | --------------------- |
| [README.md](README.md) | Project documentation |
| [AGENTS.md](AGENTS.md) | Agent guidance        |
