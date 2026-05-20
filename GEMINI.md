---
trigger: always_on
---

# GEMINI.md — AI Rules for the Rei do Picadão Project

> This file defines how **any AI tool** should behave in this workspace.
> Read the [README.md](./README.md) to understand the project before making any changes.

---

## REQUIRED READING (BEFORE ANY ACTION)

Before writing code, answering questions, or modifying files, the AI **MUST** read:

| Priority | File | What it contains |
|---|---|---|
| P0 | `GEMINI.md` (this file) | Global behavior rules |
| P0 | `CLAUDE.md` | Rules for Claude Code (points to AGENTS.md) |
| P1 | `AGENTS.md` | Agent, skill, and workflow inventory |
| P2 | `README.md` | Complete project documentation |
| P2 | `.agent/ARCHITECTURE.md` | Agent kit architecture |

---

## ABOUT THIS PROJECT

**Rei do Picadão** is a restaurant delivery system built with:

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript 5, React 19
- **Styling:** Tailwind CSS v4
- **ORM:** Drizzle ORM with PostgreSQL (Neon)
- **Auth:** Clerk (webhook sync)
- **Payments:** Asaas (PIX, card, boleto)
- **Upload:** UploadThing
- **Maps:** Google Maps Routes API
- **State:** Zustand (cart)
- **UI:** shadcn/ui + Lucide Icons
- **Forms:** React Hook Form + Zod

### App Areas

| Area | Route | Description |
|---|---|---|
| Store | `src/app/(store)/` | Public storefront (menu, cart, checkout) |
| Dashboard | `src/app/(dashboard)/` | Admin panel (products, orders, finance) |
| API | `src/app/api/` | REST endpoints (categories, products, orders, shipping, webhooks) |
| Database | `src/db/` | Drizzle schema, connection, seeds |

> For full details, see the [README.md](./README.md).

---

## AGENT SYSTEM (.agent/)

This project has an **AI agent kit** in the `.agent/` folder with:

- **20 Specialist Agents** in `.agent/agents/`
- **36 Skills** in `.agent/skills/`
- **12 Workflows** in `.agent/workflows/`
- **Validation scripts** in `.agent/scripts/`

### Kit Structure

```
.agent/
├── ARCHITECTURE.md          # Agent kit documentation
├── agents/                  # 20 specialist agents
│   ├── frontend-specialist.md
│   ├── backend-specialist.md
│   ├── database-architect.md
│   ├── orchestrator.md
│   ├── debugger.md
│   └── ... (15 more)
├── skills/                  # 36 modular skills
│   ├── clean-code/
│   ├── frontend-design/
│   ├── tailwind-patterns/
│   ├── nextjs-react-expert/
│   ├── database-design/
│   └── ... (31 more)
├── workflows/               # 12 slash commands
│   ├── create.md            # /create
│   ├── enhance.md           # /enhance
│   ├── debug.md             # /debug
│   ├── deploy.md            # /deploy
│   ├── plan.md              # /plan
│   └── ... (7 more)
├── rules/                   # Global rules
└── scripts/                 # Validation scripts
```

### Loading Protocol

```
User request
    ↓
Classify task type
    ↓
Select relevant agent(s)
    ↓
Read corresponding SKILL.md
    ↓
Apply rules → Execute task
```

### Most Relevant Agents for This Project

| Agent | When to Use |
|---|---|
| `frontend-specialist` | UI/UX, React components, Tailwind, pages |
| `backend-specialist` | API Routes, business logic, integrations |
| `database-architect` | Drizzle schema, queries, migrations |
| `debugger` | Bugs, errors, unexpected behaviors |
| `orchestrator` | Complex multi-domain tasks |
| `project-planner` | Feature planning, task breakdown |

---

## GLOBAL BEHAVIOR RULES

### Language

- The project's primary language is **Brazilian Portuguese (pt-BR)**
- Responses to the user: **in Portuguese**
- Code (variables, functions, comments): **in English**
- Table/column names in DB: **in English** (existing pattern)

### Clean Code

- Concise, self-documenting code
- No over-engineering or unnecessary abstractions
- Follow patterns already established in the codebase
- Strong TypeScript typing (no `any` except when justified)
- Imports with `@/` alias (already configured in tsconfig)

### Before Modifying Any File

1. **Read** the file before editing
2. **Understand** the context and dependencies
3. **Preserve** existing patterns (imports, naming, style)
4. **Mentally test** the impact on other files

### Environment Variables

- **NEVER** expose secrets/keys in code
- **NEVER** commit the `.env` file
- Use `process.env.VARIABLE` on the server
- Use `NEXT_PUBLIC_` prefix only for client-side variables

### Database

- Schema defined in `src/db/schema.ts` (Drizzle ORM)
- Connection in `src/db/index.ts` (Neon serverless)
- Use `drizzle-kit push` for development
- Use `drizzle-kit migrate` for production
- **NEVER** write raw SQL when Drizzle ORM works

### Authentication

- Clerk manages auth (SSO, email/password)
- Clerk webhooks sync users with `users` table
- Roles: `admin`, `funcionario`, `cliente`
- Check permissions via `src/lib/permissions.ts`

---

## HOW EACH TOOL SHOULD USE THIS FILE

### Gemini CLI / Gemini Code Assist

The **Gemini CLI** (`gemini`) and **Gemini Code Assist** automatically read the `GEMINI.md` in the project root as context instructions.

**Expected behavior:**
1. Read this file at the start of each session
2. Apply the global rules defined above
3. Consult `.agent/agents/` to use specialist agents
4. Consult `.agent/workflows/` for workflows via `/command`
5. Respond in Brazilian Portuguese

### Claude Code

**Claude Code** reads the `CLAUDE.md` in the project root. The `CLAUDE.md` file references `AGENTS.md` which in turn documents the entire agent system.

**Expected behavior:**
1. Read `CLAUDE.md` -> follows to `AGENTS.md`
2. `AGENTS.md` documents agents, skills, and workflows in `.agent/`
3. Apply the same global rules from this `GEMINI.md`
4. Use specialist agents from `.agent/agents/` when relevant
5. Respond in Brazilian Portuguese

### Antigravity Chat (Google)

**Antigravity** reads `GEMINI.md` as a user rule. It also has access to the skill system in `.agent/`.

**Expected behavior:**
1. This file is loaded as `user_rules`
2. Must follow the intelligent agent routing protocol
3. Available skills are listed automatically
4. Available workflows are listed automatically
5. Respond in Brazilian Portuguese

### OpenCode

**OpenCode** (`opencode`) reads instructions from `opencode.jsonc` for MCPs, but also respects `AGENTS.md` and `GEMINI.md` when mentioned by the user.

**Expected behavior:**
1. Read `AGENTS.md` when mentioned via `@AGENTS.md`
2. Use MCPs configured in `opencode.jsonc` (Supabase, Context7, Chrome DevTools, Tavily, Neon)
3. Apply the same global rules from this `GEMINI.md`
4. Respond in Brazilian Portuguese

### Cursor / Windsurf / Others

Any other AI IDE should:
1. Read this `GEMINI.md` as project rules
2. Read `AGENTS.md` to understand the agent system
3. Consult `README.md` for project context
4. Follow the same rules defined above

---

## AVAILABLE WORKFLOWS

Slash commands that can be invoked by the user:

| Command | File | Description |
|---|---|---|
| `/brainstorm` | `.agent/workflows/brainstorm.md` | Socratic Discovery |
| `/create` | `.agent/workflows/create.md` | Create new feature |
| `/debug` | `.agent/workflows/debug.md` | Debug issues |
| `/deploy` | `.agent/workflows/deploy.md` | Deploy to production |
| `/enhance` | `.agent/workflows/enhance.md` | Improve existing code |
| `/orchestrate` | `.agent/workflows/orchestrate.md` | Coordinate multiple agents |
| `/plan` | `.agent/workflows/plan.md` | Plan tasks |
| `/preview` | `.agent/workflows/preview.md` | Preview server |
| `/status` | `.agent/workflows/status.md` | Project status |
| `/test` | `.agent/workflows/test.md` | Run tests |
| `/ui-ux-pro-max` | `.agent/workflows/ui-ux-pro-max.md` | Advanced design |
| `/caveman` | `.agent/workflows/caveman.md` | Concise mode |

---

## FINAL CHECKLIST

Before considering a task complete:

- [ ] Code compiles without errors (`npm run build`)
- [ ] TypeScript has no type errors
- [ ] Project patterns maintained
- [ ] Sensitive variables not exposed
- [ ] Response in Brazilian Portuguese

---

> **References:**
> - Project documentation: [README.md](./README.md)
> - Agent system: [AGENTS.md](./AGENTS.md)
> - Claude Code instructions: [CLAUDE.md](./CLAUDE.md)
> - Kit architecture: [.agent/ARCHITECTURE.md](./.agent/ARCHITECTURE.md)
