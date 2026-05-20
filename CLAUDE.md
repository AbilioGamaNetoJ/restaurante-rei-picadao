# CLAUDE.md — Instructions for Claude Code

> This file is automatically read by **Claude Code** when starting a session in this project.
> It defines the expected behavior and points to available agent resources.

---

## Project Context

This is **Rei do Picadão** — a restaurant delivery system. Read the [README.md](./README.md) for full details about:

- Tech stack (Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM)
- Folder structure (`src/app/(store)/`, `src/app/(dashboard)/`, `src/app/api/`)
- Database (Neon PostgreSQL with Drizzle ORM)
- Integrations (Clerk, Asaas, Google Maps, UploadThing)
- How to run the project locally

---

## Agent System

This project has a **complete AI agent kit** in the `.agent/` folder. See [AGENTS.md](./AGENTS.md) for the detailed inventory.

### Available Resources

| Resource | Location | Quantity |
|---|---|---|
| Specialist Agents | `.agent/agents/` | 20 |
| Modular Skills | `.agent/skills/` | 36 |
| Workflows (slash commands) | `.agent/workflows/` | 12 |
| Validation Scripts | `.agent/scripts/` | 2 master + 18 skill-level |

### Most Relevant Agents

- `frontend-specialist` -> UI/UX, React, Tailwind
- `backend-specialist` -> API Routes, business logic
- `database-architect` -> Drizzle Schema, queries
- `debugger` -> Bug investigation

---

## Behavior Rules

### Language
- Responses: **Brazilian Portuguese**
- Code (variables, functions): **English**

### Code
- TypeScript strict, no `any`
- Imports with `@/` alias
- Follow existing patterns in the codebase
- Use Drizzle ORM (no raw SQL)
- Sensitive variables only via `process.env`

### Before Editing
1. Read the file and understand the context
2. Check dependencies and impact
3. Preserve existing patterns
4. Never expose secrets in code

### Never Do
- Commit `.env`
- Use `any` without justification
- Write raw SQL when Drizzle works
- Ignore TypeScript typing
- Expose API keys on client-side

---

## References

| File | Purpose |
|---|---|
| [README.md](./README.md) | Complete project documentation |
| [AGENTS.md](./AGENTS.md) | Agent, skill, and workflow inventory |
| [GEMINI.md](./GEMINI.md) | Global rules for all AIs |
| [.agent/ARCHITECTURE.md](./.agent/ARCHITECTURE.md) | Agent kit architecture |
