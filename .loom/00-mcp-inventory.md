# MCP Inventory

## Why

This inventory captures MCP capability and health for the current planning effort so execution choices are evidence-based.

## Calls Made

1. `list_mcp_resources()`
2. `list_mcp_resource_templates()`
3. `list_mcp_resources(server="loom")`
4. `list_mcp_resource_templates(server="loom")`
5. `read_mcp_resource(server="loom", uri="loom://servers")`
6. `read_mcp_resource(server="loom", uri="loom://health")`
7. `read_mcp_resource(server="loom", uri="loom://config")`

## Snapshot

- Active Loom profile: `full`
- Registered servers: `42`
- Registered tools: `369`
- Server-specific listing calls for `loom` timed out in this environment; global listing succeeded.

## Resources and Templates

### Server: `loom`

- Resources:
  - `loom://servers`
  - `loom://tools`
  - `loom://health`
  - `loom://config`
- Resource templates:
  - `loom://servers`
  - `loom://tools`
  - `loom://health`
  - `loom://config`

## Planning-Relevant Tooling

- `git`, `git_worktree`: branch/diff/change tracking.
- `codebase_memory`: code navigation when scoping refactors.
- `browserkit`: UI screenshot validation during polish passes.
- `devbox`: isolated build/test execution when host environment drifts.
- `agent_context`: preserve decisions/tasks across sessions.

## Health and Constraints

- `loom://health` reports unavailable servers: `confluence`, `context7`, `postgres`.
- Most execution-critical servers for this task (`git`, `codebase_memory`, `browserkit`, `devbox`) are healthy.
- `list_mcp_resources(server="loom")` and `list_mcp_resource_templates(server="loom")` timed out; fall back to global listing + direct resource reads.

## Best Tool For Job (UI + Core Tightening)

- Ground truth on current app behavior: local file reads + local commands (`npm`, `rg`, `git`).
- UI validation during implementation: `browserkit` screenshots + Cypress.
- Context continuity: `agent_context` session/task tracking.

## Sources

- MCP: `list_mcp_resources()`
- MCP: `list_mcp_resource_templates()`
- MCP: `list_mcp_resources(server="loom")` (timeout observed)
- MCP: `list_mcp_resource_templates(server="loom")` (timeout observed)
- MCP: `read_mcp_resource(server="loom", uri="loom://servers")`
- MCP: `read_mcp_resource(server="loom", uri="loom://health")`
- MCP: `read_mcp_resource(server="loom", uri="loom://config")`
