---
description: Research latest library docs and versions via Context7 MCP before initializing a project or adding dependencies
---

# /haki-research [library-or-stack]

Look up latest library documentation, versions, and setup instructions using Context7 MCP. Use before project init or when adding new dependencies.

## Usage

```
/haki-research next.js prisma next-auth     # Research specific libraries
/haki-research                              # Auto-detect from current project context
```

## Steps

1. **Parse input:**
   - If library names provided → use those
   - If no input → scan `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod` for existing deps
   - If no project files → ask user what they want to build

2. **Read the skill:**
   - Read: `.agent/skills/context7-research/SKILL.md`
   - Follow the protocol exactly

3. **For each library — Resolve ID:**

   Call Context7 to find the library:

   ```
   mcp_context7_resolve-library-id
     libraryName: "<library>"
     query: "latest version, installation, and setup"
   ```

   Pick the best match by: name accuracy → reputation → snippet count → benchmark score.

4. **For each library — Query docs:**

   ```
   mcp_context7_query-docs
     libraryId: "<resolved-id>"
     query: "how to install, configure, and get started with latest version"
   ```

   Extract: version, install command, init command, config format, peer deps, breaking changes.

5. **Cross-reference compatibility:**
   - Check peer dependency conflicts between libraries
   - If integration docs exist (e.g., "Prisma + Next.js"), query those too
   - Max 1 extra query per integration pair

6. **Output research summary:**

   Print a formatted summary to the user:

   ```markdown
   ## 📦 Tech Stack Research (Context7-verified)

   ### next — v15.2.4

   - **Install:** `bun add next@^15.2.4 react@^19.0.0 react-dom@^19.0.0`
   - **Init:** `bunx create-next-app@latest ./`
   - **Config:** `next.config.ts` (TypeScript default since v15)
   - **Notes:** App Router is default. Pages Router still supported.

   ### prisma — v6.4.1

   - **Install:** `bun add prisma@^6.4.1 @prisma/client@^6.4.1`
   - **Init:** `bunx prisma init`
   - **Config:** `prisma/schema.prisma`
   - **Notes:** TypedSQL support added in v6.

   ⚠️ Unverified: [library-name] — Context7 returned no results.
   ```

7. **Save to file (if in project context):**
   - If `.haki/` exists → save to `.haki/research/STACK.md`
   - Otherwise → print to terminal only

8. **Next steps:**
   - If part of `/haki:new-project` → return to that workflow
   - If standalone → ask: "Ready to initialize the project with these versions?"

## Rules

// turbo-all

- **Bun only** for JS/TS projects
- **Max 3 Context7 calls per library** (1 resolve + 2 query)
- **Never guess versions** — if Context7 fails, warn with ⚠️
- **Cache within session** — don't re-query libraries already researched
