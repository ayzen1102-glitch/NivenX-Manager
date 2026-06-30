---
name: NivenX Bot project structure
description: Key facts about the NivenX Assistant Discord bot layout and deploy workflow
---

Bot lives at `artifacts/nivenx-bot/`. Pure Node.js (no web artifact), ESM throughout.

**Deploy commands:** After adding/renaming any slash command, run `pnpm --filter @workspace/nivenx-bot run deploy`. Guild ID is set so deployment is instant.

**Workflow name:** "NivenX Bot" — `outputType: "console"`.

**Pending orders:** Stored in `client.pendingOrders` Map (keyed `userId_tempId`). TTL 10 min. This is the bridge between the service-select menu and the modal submit.

**Why:** Discord modals can't carry state — the tempId in the modal customId is the only link back to the pending context. Storing in-memory (not DB) keeps it simple; sessions expire naturally.

**Config file:** `src/config/config.js` is the single place to change services, roles, colors, order prefix, auto-close thresholds. Do not scatter config across files.
