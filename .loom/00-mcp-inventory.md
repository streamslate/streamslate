# MCP Inventory

## Runtime Mode Detection

Loom-mode is active.

- `list_mcp_resources()` returned top-level loom resources including `loom://config`, `loom://servers`, `loom://tools/index`, and `loom://health`.
- `list_mcp_resource_templates()` returned loom paged templates including `loom://tools/page/{page}` and `loom://tools/server/{server}/page/{page}`.

## Snapshot

- Active profile: `full`
- Registered servers: `45`
- Registered tools: `468`
- Tool pagination: `5` pages at `100` tools/page
- Daemon status: `running`, `drainReady=true`
- Currently running local processes called out by loom config: `morph_embeddings`, `agent_context`, `github`, `sequentialthinking`, `codebase_memory`, `devbox`, `time`

## Health

Core planning/execution services used for this repo are healthy:

- `codebase_memory`
- `agent_context`
- `devbox`
- `browserkit`
- `git`
- `github`

Some monitors show timeout noise on unrelated services, but loom still reports them healthy; none block this planning pass.

## Codebase Index Readiness

- `codebase_stats(repo_id="streamslate")` initially returned `0` chunks, so the previous index state was stale or absent.
- Rebuilt a lexical index with `embeddings=false`.
- Current index status:
  - `repo_id=streamslate`
  - `total_chunks: 593`
  - `typescript: 385`
  - `rust: 180`
  - `javascript: 28`
  - chunk types include `225` functions, `128` classes, `115` methods, and `93` modules

## Best Tools For Next Steps

- Repo truth and line-accurate sourcing: `exec_command` with `rg`, `nl`, and targeted reads
- Code navigation: `codebase_memory` lexical index
- Local validation without host dependency drift: `devbox`
- Browser/UI verification when execution starts: `browserkit`

## Constraints

- Local Node dependencies are currently absent (`node_modules/` missing), so host-shell `npm run lint` and `npm run test:unit` are not meaningful until install is restored.
- `quality` MCP exists, but current repo work is JS/TS/Rust-heavy; direct repo commands or `devbox` are the better fit here.

## Sources

- MCP: `list_mcp_resources()`
- MCP: `list_mcp_resource_templates()`
- MCP: `read_mcp_resource(server="loom", uri="loom://config")`
- MCP: `read_mcp_resource(server="loom", uri="loom://servers")`
- MCP: `read_mcp_resource(server="loom", uri="loom://tools/index")`
- MCP: `read_mcp_resource(server="loom", uri="loom://health")`
- MCP: `mcp__loom__codebase_memory__codebase_index_start(repo_id="streamslate", root="/Users/cblevins/workspace/services/streamslate", full_refresh=true, embeddings=false)`
- MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="03491e1b24ff9a86")`
- MCP: `mcp__loom__codebase_memory__codebase_stats(repo_id="streamslate")`
- Command: `ls -la node_modules 2>/dev/null || echo 'node_modules: missing'`
