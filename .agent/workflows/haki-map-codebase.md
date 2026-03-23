---
description: Analyze existing codebase with parallel mapper agents
---

# /haki:map-codebase

Analyze existing codebase using 4 parallel subagents. For brownfield projects.

## Steps

1. Check if `.haki/codebase/` already exists — offer refresh or skip.

2. **Spawn 4 parallel mapper subagents:**

   | Agent        | Output                           | Content                                          |
   | ------------ | -------------------------------- | ------------------------------------------------ |
   | Stack        | `.haki/codebase/STACK.md`        | Languages, frameworks, build tools, dependencies |
   | Architecture | `.haki/codebase/ARCHITECTURE.md` | System patterns, data flow, API design           |
   | Conventions  | `.haki/codebase/CONVENTIONS.md`  | Code style, naming, testing, documentation       |
   | Structure    | `.haki/codebase/STRUCTURE.md`    | Directory tree, entry points, config files       |

3. **Verify** all 4 documents created.

4. **Show next step:** `/haki:new-project`

## When to Use

- **Before** `/haki:new-project` for brownfield projects
- **Anytime** to refresh codebase understanding
- **Before** major refactoring
