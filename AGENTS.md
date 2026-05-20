# AGENTS.md — AI Agent System for Rei do Picadão

> Complete inventory of specialist agents, skills, and workflows available in this project.
> Read the [README.md](./README.md) for project context.
> See [GEMINI.md](./GEMINI.md) for global AI behavior rules.

---

## How to Use This File

This file is the **entry point** for AI tools interacting with the project. It maps:

1. **Agents** -> Specialists the AI can "assume" for specific tasks
2. **Skills** -> Knowledge modules the agents load
3. **Workflows** -> Slash commands (`/create`, `/debug`, etc.) for structured procedures

### Which Tool Reads This File?

| Tool | How It Accesses | Entry File |
|---|---|---|
| **Claude Code** | Reads `CLAUDE.md` -> references this file | `CLAUDE.md` |
| **Gemini CLI** | Reads `GEMINI.md` -> references this file | `GEMINI.md` |
| **Antigravity** | Loads `GEMINI.md` as user rules | `GEMINI.md` |
| **OpenCode** | Via `@AGENTS.md` mention by user | `opencode.jsonc` + this file |
| **Cursor/Windsurf** | Via project rules or mention | This file |

---

## Agent Kit Structure

All resources are in the `.agent/` folder in the project root:

```
.agent/
├── ARCHITECTURE.md           # Complete kit documentation
├── agents/                   # 20 specialist agents (.md)
├── skills/                   # 36 modular skills (folders)
├── workflows/                # 12 workflows/slash commands (.md)
├── rules/                    # Global rules (internal GEMINI.md)
├── scripts/                  # Validation scripts (Python)
└── mcp_config.json           # MCP configuration
```

---

## Specialist Agents (20)

Each agent is a `.md` file in `.agent/agents/` with persona, rules, and associated skills.

### Most Used Agents in This Project

| Agent | File | When to Use |
|---|---|---|
| `frontend-specialist` | `.agent/agents/frontend-specialist.md` | UI/UX, React components, Tailwind, pages |
| `backend-specialist` | `.agent/agents/backend-specialist.md` | API Routes, business logic, integrations |
| `database-architect` | `.agent/agents/database-architect.md` | Drizzle schema, queries, migrations |
| `debugger` | `.agent/agents/debugger.md` | Bugs, errors, unexpected behaviors |
| `orchestrator` | `.agent/agents/orchestrator.md` | Complex multi-domain tasks |
| `project-planner` | `.agent/agents/project-planner.md` | Planning, feature breakdown |

### Complete Agent List

| # | Agent | Focus |
|---|---|---|
| 1 | `orchestrator` | Multi-agent coordination |
| 2 | `project-planner` | Discovery and planning |
| 3 | `frontend-specialist` | Web UI/UX |
| 4 | `backend-specialist` | API and business logic |
| 5 | `database-architect` | Schema and SQL |
| 6 | `mobile-developer` | iOS, Android, React Native |
| 7 | `game-developer` | Game logic |
| 8 | `devops-engineer` | CI/CD, Docker, infrastructure |
| 9 | `security-auditor` | Security compliance |
| 10 | `penetration-tester` | Offensive security |
| 11 | `test-engineer` | Testing strategies |
| 12 | `debugger` | Root cause analysis |
| 13 | `performance-optimizer` | Performance, Web Vitals |
| 14 | `seo-specialist` | SEO, ranking |
| 15 | `documentation-writer` | Documentation |
| 16 | `product-manager` | Requirements, user stories |
| 17 | `product-owner` | Strategy, backlog, MVP |
| 18 | `qa-automation-engineer` | E2E tests, CI |
| 19 | `code-archaeologist` | Legacy code, refactoring |
| 20 | `explorer-agent` | Codebase analysis |

---

## Skills (36)

Skills are knowledge modules in `.agent/skills/`. Each skill has a `SKILL.md` with instructions.

### Skills Relevant to This Project (Next.js + Drizzle + Tailwind)

| Skill | Folder | Relevance |
|---|---|---|
| `nextjs-react-expert` | `.agent/skills/nextjs-react-expert/` | Project core |
| `tailwind-patterns` | `.agent/skills/tailwind-patterns/` | Styling |
| `frontend-design` | `.agent/skills/frontend-design/` | UI/UX |
| `database-design` | `.agent/skills/database-design/` | Drizzle schema |
| `api-patterns` | `.agent/skills/api-patterns/` | API Routes |
| `clean-code` | `.agent/skills/clean-code/` | Global patterns |
| `testing-patterns` | `.agent/skills/testing-patterns/` | Testing |
| `vulnerability-scanner` | `.agent/skills/vulnerability-scanner/` | Security |
| `seo-fundamentals` | `.agent/skills/seo-fundamentals/` | Store SEO |

### Complete Skill List by Category

**Frontend & UI:** `nextjs-react-expert`, `tailwind-patterns`, `frontend-design`, `web-design-guidelines`
**Backend & API:** `api-patterns`, `nodejs-best-practices`
**Database:** `database-design`
**Testing:** `testing-patterns`, `webapp-testing`, `tdd-workflow`, `code-review-checklist`, `lint-and-validate`
**Security:** `vulnerability-scanner`, `red-team-tactics`
**Architecture:** `app-builder`, `architecture`, `plan-writing`, `brainstorming`
**SEO & Growth:** `seo-fundamentals`, `geo-fundamentals`
**Mobile:** `mobile-design`
**Game Dev:** `game-development`
**DevOps:** `deployment-procedures`, `server-management`, `performance-profiling`
**Shell/CLI:** `bash-linux`, `powershell-windows`
**Other:** `clean-code`, `behavioral-modes`, `parallel-agents`, `intelligent-routing`, `mcp-builder`, `documentation-templates`, `i18n-localization`, `systematic-debugging`, `python-patterns`, `rust-pro`

---

## Workflows / Slash Commands (12)

Workflows in `.agent/workflows/`. Invoked via `/command`.

| Command | File | Description |
|---|---|---|
| `/brainstorm` | `brainstorm.md` | Socratic Discovery -- explore options before implementing |
| `/create` | `create.md` | Create new application or feature |
| `/debug` | `debug.md` | Systematic bug investigation |
| `/deploy` | `deploy.md` | Deploy to production with pre-flight checks |
| `/enhance` | `enhance.md` | Add/improve existing features |
| `/orchestrate` | `orchestrate.md` | Coordinate multiple agents for complex tasks |
| `/plan` | `plan.md` | Create implementation plan (no code) |
| `/preview` | `preview.md` | Start/stop preview server |
| `/status` | `status.md` | Check project status and progress |
| `/test` | `test.md` | Generate and run tests |
| `/ui-ux-pro-max` | `ui-ux-pro-max.md` | Advanced design with 50 styles |
| `/caveman` | `caveman.md` | Concise mode, save tokens |

---

## Validation Scripts

Scripts in `.agent/scripts/` for auditing and validation:

```bash
# Quick audit during development
python .agent/scripts/checklist.py .

# Full verification before deploy
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

---

## References

- **Project:** [README.md](./README.md) -- Complete Rei do Picadão documentation
- **AI Rules:** [GEMINI.md](./GEMINI.md) -- Global rules for all AI tools
- **Claude Code:** [CLAUDE.md](./CLAUDE.md) -- Specific instructions for Claude Code
- **Kit Architecture:** [.agent/ARCHITECTURE.md](./.agent/ARCHITECTURE.md) -- Internal agent kit documentation
