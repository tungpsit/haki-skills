---
description: Initialize haki workflow system into current project (project-scoped setup)
---

# /haki:init

Install the haki workflow system into the current project.

// turbo-all

## Steps

1. Run the installer:

```bash
node bin/install.js .
```

To update existing installation:

```bash
node bin/install.js . --force
```

2. After installation, run `/haki:new-project` to start.

## What Gets Installed

| Location             | Contents                                  |
| -------------------- | ----------------------------------------- |
| `.agent/workflows/`  | 7 haki command files                      |
| `.agent/bin/`        | CLI tools (haki-tools.cjs + lib/)         |
| `.agent/skills/`     | 17 skill folders                          |
| `.agent/templates/`  | project, roadmap, task templates + config |
| `.agent/references/` | questioning.md, ui-brand.md               |
| `.haki/`             | Runtime data directory (gitignored)       |
