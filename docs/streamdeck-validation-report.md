# Stream Deck Validation Report

Use this report when validating the first-party StreamSlate Stream Deck plugin
against Stream Deck hardware or Stream Deck Mobile. Commit the completed report,
or attach it to the validation issue or MR, before marking roadmap 1.7 hardware
validation complete.

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
- Known blockers before submission:
- Follow-up tasks:
