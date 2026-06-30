---
name: NivenX SQLite choice
description: Why node:sqlite is used instead of better-sqlite3 in this project
---

Use `node:sqlite` (built-in, Node 22.5+) for SQLite in this Replit environment.

**Why:** `better-sqlite3` requires native compilation via node-gyp, which needs Python. Python is unavailable in the Replit NixOS container, so `gyp ERR! Could not find any Python installation` is fatal. `sql.js` (WebAssembly) works but has a completely different async API that requires significant code changes.

**How to apply:** Import with `import { DatabaseSync } from 'node:sqlite'`. Requires `--experimental-sqlite` Node flag (wired into package.json scripts). API is synchronous and nearly identical to better-sqlite3: `.prepare(sql).run(...)`, `.prepare(sql).get(...)`, `.prepare(sql).all(...)`.
