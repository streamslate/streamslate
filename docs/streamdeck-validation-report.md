# Stream Deck Validation Report

Use this report when validating the first-party StreamSlate Stream Deck plugin
against Stream Deck hardware or Stream Deck Mobile. Commit the completed report,
or attach it to the validation issue or MR, before marking roadmap 1.7 hardware
validation complete.

For a prefilled environment and loopback API evidence capture, run this from
`plugins/streamdeck`:

```bash
npm run capture:validation -- --probe --target "Stream Deck Mobile" --result partial --evidence-link validation-capture.md --output validation-report.md
```

Copy the generated details into this report, or attach the generated file as
evidence alongside the completed manual action results.

The capture helper is covered by automated plugin tests for its CLI help,
markdown output, output-file writing, argument validation, and loopback probe
capture. Those tests validate the evidence tool, not the external hardware or
Stream Deck Mobile action results recorded below.

## Summary

- Date:
- Tester:
- Result: pass | fail | partial
- StreamSlate commit:
- StreamSlate version:
- Plugin package version:
- Validation target: hardware | Stream Deck Mobile
- Evidence links:

## Environment

- OS and version:
- Stream Deck app version:
- Stream Deck device or mobile version:
- Node.js version:
- Stream Deck CLI version:
- StreamSlate launch command:
- Plugin install method: link | local package
- Validation capture artifact:

## Preflight

- [ ] `npm run preflight` passes in `plugins/streamdeck`
- [ ] StreamSlate starts successfully
- [ ] A multi-page PDF is open
- [ ] `GET_CAPABILITIES` returns page, zoom, presenter, ping, and state support
- [ ] Plugin is linked or installed in Stream Deck
- [ ] StreamSlate actions are added to a test profile

## Action Results

| Action           | Expected result                         | Result | Notes |
| ---------------- | --------------------------------------- | ------ | ----- |
| Next Page        | Current page increments                 |        |       |
| Previous Page    | Current page decrements                 |        |       |
| Go To Page       | Configured page opens                   |        |       |
| Set Zoom         | Configured zoom applies                 |        |       |
| Toggle Presenter | Presenter mode opens or closes          |        |       |
| Refresh State    | Key state/title reflects current PDF    |        |       |
| Health Check     | Plugin reports StreamSlate availability |        |       |

## Resilience

- [ ] Quitting StreamSlate while Stream Deck remains open shows a disconnected or error state without crashing Stream Deck
- [ ] Restarting StreamSlate reconnects the plugin and refreshes state
- [ ] Invalid page or zoom input reports an error without leaving stale key state
- [ ] Removing the active PDF clears page-dependent state

## Marketplace Readiness Notes

- Icon and action names reviewed:
- Manifest metadata reviewed:
- Marketplace checklist reviewed:
- Known blockers before submission:
- Follow-up tasks:

After this report passes, use
[Stream Deck Marketplace Checklist](streamdeck-marketplace-checklist.md) to
prepare the submission package. Do not mark Marketplace publication complete
from this validation report alone.
