# Stream Deck Marketplace Checklist

Use this checklist after Stream Deck hardware or Stream Deck Mobile validation
passes. It prepares a Marketplace submission package without claiming that the
plugin has been submitted, reviewed, DRM-processed, or published.

## Status

- Submission status: not submitted.
- Publication status: not published.
- Required predecessor: completed
  [Stream Deck Validation Report](streamdeck-validation-report.md) with passing
  hardware or Stream Deck Mobile evidence.
- Package source: `plugins/streamdeck/ai.flexinfer.streamslate.sdPlugin`.

## External References

- [Stream Deck SDK distribution](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/)
- [Stream Deck CLI pack](https://docs.elgato.com/streamdeck/cli/commands/pack/)
- [Stream Deck CLI validate](https://docs.elgato.com/streamdeck/cli/commands/validate/)
- [Stream Deck manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/)

## Pre-Submission Gate

- [ ] Hardware or Stream Deck Mobile validation report is complete and passing
- [ ] Known validation issues are closed or explicitly accepted
- [ ] `npm run preflight` passes in `plugins/streamdeck`
- [ ] `streamdeck validate ./ai.flexinfer.streamslate.sdPlugin` passes with the
      latest validation rules
- [ ] `npm run pack:local` produces a `.streamDeckPlugin` installer
- [ ] Installer is tested locally from a clean Stream Deck profile

## Manifest and Runtime Review

- [ ] `manifest.json` name, description, author, category, version, and UUID are
      final for submission
- [ ] `Software.MinimumVersion`, `Nodejs.Version`, `SDKVersion`, and supported
      `OS` values match the intended submission target
- [ ] Action names, tooltips, icons, and state images match Marketplace wording
      and visual guidelines
- [ ] Runtime behavior is verified from the packaged plugin bundle, not from
      source-tree-only files
- [ ] Runtime files do not mutate packaged plugin files after distribution
- [ ] DRM compatibility is decided before submission; if DRM is required, create
      a separate implementation slice for any SDK/manifest changes

## Package Contents

- [x] `.sdignore` excludes source maps, logs, generated installers, validation
      evidence, and other local non-shipping artifacts
- [ ] Only the compiled bundle, manifest, icons, property inspector assets, and
      required runtime files are packaged
- [ ] No secrets, tokens, local paths, environment files, or unpublished test
      evidence are included
- [ ] Package version matches the release or submission version

## Listing Assets and Copy

- [ ] Marketplace title:
- [ ] Short description:
- [ ] Long description:
- [ ] Support URL:
- [ ] Privacy/license notes:
- [ ] Screenshots or demo media:
- [ ] Release notes:

## Submission Record

- Submitted by:
- Submission date:
- Elgato account or organization:
- Package filename:
- Package checksum:
- Review ticket or confirmation:
- Review result:
- Publication URL:
- Follow-up tasks:
