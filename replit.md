# NivenX Assistant

A production-ready Discord.js v14 business management bot for NivenX, handling orders, tickets, invoices, coupons, reviews, and admin/staff workflows.

## Run & Operate

- `pnpm --filter @workspace/nivenx-bot run dev` — start the bot
- `pnpm --filter @workspace/nivenx-bot run deploy` — deploy slash commands to Discord
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Required env secrets: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`

## Stack

- pnpm workspaces, Node.js 24, ESM (`"type": "module"`)
- Discord.js v14 with slash commands, buttons, modals, select menus
- SQLite via Node.js built-in `node:sqlite` (Node 22.5+) — no native deps
- Drizzle-style query layer in `src/database/queries.js`
- Express 5 API server (separate artifact, not used by bot)

## Where things live

```
artifacts/nivenx-bot/
├── src/
│   ├── index.js                  # Bot entry point
│   ├── deploy-commands.js        # Slash command deployer (run once or on changes)
│   ├── config/config.js          # ← All configuration lives here
│   ├── database/
│   │   ├── database.js           # DB init using node:sqlite
│   │   └── queries.js            # All DB operations (Orders, Tickets, Invoices, etc.)
│   ├── services/
│   │   ├── orderService.js       # Order business logic
│   │   ├── ticketService.js      # Ticket creation/closing with transcripts
│   │   ├── invoiceService.js     # Invoice generation
│   │   └── schedulerService.js   # Auto-close tickets/orders background job
│   ├── handlers/
│   │   ├── commandHandler.js     # Dynamic command loader
│   │   ├── eventHandler.js       # Dynamic event loader
│   │   ├── interactionHandler.js # Routes all interactions
│   │   └── subhandlers/          # button, selectMenu, modal, command sub-routers
│   ├── commands/
│   │   ├── public/               # /order, /services, /ticket, /review
│   │   ├── client/               # /myorders, /myinvoices
│   │   ├── staff/                # /orders, /tickets, /invoice
│   │   └── admin/                # /admin, /panel, /staffpanel
│   ├── events/                   # ready, interactionCreate, messageCreate, guildMemberAdd
│   └── ui/
│       ├── embeds/               # Order, ticket, general embed builders
│       └── components/           # Buttons, select menus, modals
└── data/nivenx.db                # SQLite database (auto-created)
```

## Architecture decisions

- **node:sqlite over better-sqlite3**: Avoids native compilation (gyp/Python) issues in Replit. Built-in since Node 22.5, stable enough for production.
- **ESM throughout**: All files use `import/export`. Entry point uses top-level `await`.
- **Config-first design**: All services, roles, statuses, and branding live in `src/config/config.js`. Change that file, not the code.
- **Modular interaction routing**: Each interaction type (button, modal, select, command) has its own sub-handler in `handlers/subhandlers/` to keep files small and focused.
- **Pending orders in memory**: Temporary order sessions (between service selection and modal submission) are stored in `client.pendingOrders` Map with 10-min TTL.

## Product

- **Order system**: `/order` → service menu → dynamic form modal → summary → confirm. Unique IDs (NVX-0001).
- **Ticket system**: `/ticket` → category menu → private channel with staff access, welcome embed, transcript on close.
- **Admin panel**: `/admin stats|auditlog|coupon_create|coupon_list|coupon_delete|setup`
- **Staff panel**: `/staffpanel`, `/orders`, `/tickets`, `/invoice`
- **Client dashboard**: `/myorders`, `/myinvoices`
- **Persistent panels**: `/panel orders` and `/panel tickets` post menus in any channel
- **Auto-close**: Inactive tickets (72h) and stale payment-awaiting orders (48h) auto-close
- **Reviews**: `/review` with 1–5 stars, linked to orders, posted to #reviews channel

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/nivenx-bot run deploy` whenever you add or rename a slash command.
- The `--experimental-sqlite` flag is required. It's wired into the `dev` and `deploy` scripts.
- `node:sqlite` uses synchronous `.prepare().run()/.get()/.all()` — same API shape as better-sqlite3.
- Channels named `bot-logs`, `orders`, `reviews`, `ticket-transcripts`, `welcome` are looked up by name. Use `/admin setup` to auto-create them.
- Staff/Admin roles are looked up by name ("Staff", "Admin", "Owner") — must exist in the guild.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
