---
description: Initialize a new project with deep context gathering, research, and roadmap generation
---

# /haki:new-project

Full initialization: questions → UI skill choice → research → PROJECT.md → ROADMAP.md

## Steps

1. Run state detection:
   // turbo

```bash
node .agent/bin/haki-tools.cjs state detect --raw
```

If `initialized: true` and has project, warn user and confirm reinitialize.

2. **Socratic Questioning (Dream Extraction)**
   - Read: `.agent/references/questioning.md`
   - Start open — let user dump their mental model
   - Follow energy, challenge vagueness, make abstract concrete
   - Background checklist: What, Why, Who, Done
   - One question at a time until clear enough for PROJECT.md

3. **UI Skill Choice**
   - Ask: "Which UI design approach?"
     1. **ui-ux-pro-max** — Design intelligence with 50 styles, 21 palettes, 50 font pairings
     2. **taste-skill** — Opinionated design variants
   - If taste-skill → follow-up variant selection:
     - brutalist / minimalist / soft / stitch / taste / redesign / output
   - Initialize config:

   ```bash
   node .agent/bin/haki-tools.cjs config init --raw
   ```

   Then set UI choice:

   ```bash
   node .agent/bin/haki-tools.cjs config set ui_design_skill <choice> --raw
   node .agent/bin/haki-tools.cjs config set ui_design_variant <variant_or_null> --raw
   ```

4. **Research (4 parallel subagents)**
   - Agent 1 → `.haki/research/STACK.md` (tech options, trade-offs)
   - Agent 2 → `.haki/research/FEATURES.md` (feature analysis, must vs nice-to-have)
   - Agent 3 → `.haki/research/ARCHITECTURE.md` (system design, data flow)
   - Agent 4 → `.haki/research/PITFALLS.md` (anti-patterns, known issues)

5. **Generate PROJECT.md**
   - Read template: `.agent/templates/project.md`
   - Fill placeholders from questioning + research
   - Save to `.haki/PROJECT.md`

6. **Generate ROADMAP.md**
   - Read template: `.agent/templates/roadmap.md`
   - Create task breakdown with status/priority/dependencies
   - Save to `.haki/ROADMAP.md`
   - Create `.haki/tasks/` directory

7. **Show next steps:**
   ```
   🚀 Project Initialized
   ▶ Next: /haki:discuss [first-task-id]
   ```
