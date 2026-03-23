---
name: context7-research
description: Use when initializing a new project, choosing a tech stack, or adding a library — automatically fetches the latest docs and versions via Context7 MCP before writing any install commands or config files.
---

# Context7 Research

## When to Activate

- `/haki:new-project` — during the Research phase (step 4)
- `/haki:plan` — during the Research step (step 2)
- Any time the user says: "init project", "add library", "set up \<framework\>", "upgrade dependencies", "what's the latest version of X"
- Before writing `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or any dependency file from scratch

**Announce at start:** "I'm using the context7-research skill to look up the latest library documentation."

## Why This Exists

LLMs hallucinate versions. `react@19.1.0` might not exist. `next@15` API may have changed. This skill enforces a **research-before-write** discipline: every dependency in a new project must be verified against live documentation via Context7 MCP.

## Protocol

### Step 1: Identify Libraries

From the user's request or the chosen tech stack, extract a list of libraries/packages that need to be installed.

Example input: "Create a Next.js app with Prisma and NextAuth"
→ Libraries: `next`, `prisma`, `next-auth`

### Step 2: Resolve Library IDs

For **each** library, call Context7 MCP to resolve the exact library ID:

```
mcp_context7_resolve-library-id
  libraryName: "next.js"
  query: "latest version and setup instructions"
```

**Selection criteria** (from the results):

1. Name match (exact > partial)
2. Source reputation (High > Medium)
3. Code snippet count (more = better coverage)
4. Benchmark score (higher = better)

Record the selected `libraryId` for each library.

### Step 3: Query Documentation

For each resolved library, query the specific information needed:

```
mcp_context7_query-docs
  libraryId: "/vercel/next.js"
  query: "how to create a new project, latest installation and configuration"
```

**What to extract:**

- ✅ Latest stable version number
- ✅ Correct `init` / `create` command (e.g., `npx create-next-app@latest`)
- ✅ Required peer dependencies and their versions
- ✅ Breaking changes from recent versions
- ✅ Recommended project structure
- ✅ Configuration file format (`next.config.ts` vs `next.config.js`)

### Step 4: Cross-Reference Dependencies

After querying all libraries individually, check for compatibility:

- Do library A and B have conflicting peer dependencies?
- Does the framework version dictate the ORM/auth version?
- Are there known integration guides (e.g., "Prisma with Next.js App Router")?

Query Context7 for integration-specific docs if needed:

```
mcp_context7_query-docs
  libraryId: "/prisma/prisma"
  query: "integration with Next.js App Router and setup"
```

### Step 5: Produce Research Output

Write a structured research summary. This becomes input for PROJECT.md, STACK.md, or the implementation plan.

```markdown
## Tech Stack Research (Context7-verified)

### [Library Name] — v[X.Y.Z]

- **Source:** Context7 `/org/project`
- **Install:** `bun add library@^X.Y.Z`
- **Init command:** `npx create-xxx@latest ./`
- **Key config:** [file name and format]
- **Breaking changes:** [if any from recent version]
- **Peer deps:** [list with versions]
```

## Rules

1. **Never guess versions.** If Context7 returns no result → tell the user and ask them to confirm the version manually.
2. **3-call limit per library.** `resolve-library-id` (1) + `query-docs` (max 2). Don't burn tokens on repeated queries.
3. **Cache within session.** If you already queried `next.js` docs earlier in the conversation, don't query again.
4. **Bun is the package manager** for JS/TS projects (per GEMINI.md rules). All install commands use `bun add`, not `npm install`.
5. **Don't block on failure.** If Context7 is down or returns empty, log it and fall back to your training data — but add a ⚠️ warning that the version is unverified.

## Integration with Workflows

### In `/haki:new-project` (step 4 — Research)

The STACK.md research agent MUST use this skill:

```
Agent 1 → .haki/research/STACK.md
  1. Read this skill
  2. Extract libraries from user requirements
  3. Run Context7 resolve + query for each
  4. Write verified stack to STACK.md
```

### In `/haki:plan` (step 2 — Research)

Before writing any installation steps in the task plan:

```
1. Identify new dependencies this task introduces
2. Run Context7 lookup for each
3. Use verified versions in the plan's install commands
```

## Anti-Patterns

| ❌ Don't                                  | ✅ Do                                                   |
| ----------------------------------------- | ------------------------------------------------------- |
| `bun add next` (no version)               | `bun add next@^15.2.4` (Context7-verified)              |
| Guess config format                       | Query Context7 for current config structure             |
| Write `pages/` router code for Next.js 15 | Verify App Router is the default                        |
| Skip research for "obvious" libraries     | Every library gets at least a `resolve-library-id` call |
| Use `npm install`                         | Use `bun add` (GEMINI.md rule)                          |
