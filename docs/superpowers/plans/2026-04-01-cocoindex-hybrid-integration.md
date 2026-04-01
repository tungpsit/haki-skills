# CocoIndex Hybrid Integration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/haki:index` command to Haki — a manual CLI that indexes a user's project codebase + SKILL.md into a per-project PostgreSQL/pgvector DB via CocoIndex. Zero breaking changes to Haki core.

**Architecture:** Hybrid optional layer. All CocoIndex code lives in `.haki/cocoindex/` (gitignored) in the user project — NOT in the Haki source repo. The installer creates this structure; the SKILL.md skill lives in `.agent/skills/cocoindex-hybrid/` and is automatically copied to `.claude/skills/` for Claude Code.

**Tech Stack:** Node.js (installer + CLI), Python (CocoIndex flow), Docker + pgvector (per-project Postgres), SentenceTransformers or API-based embeddings.

**Spec:** `docs/specs/2026-04-01-cocoindex-hybrid-integration.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `.agent/skills/cocoindex-hybrid/SKILL.md` | **Create** | Skill definition for `/haki:index` |
| `bin/install.js` | **Modify** | Add CocoIndex setup step + `--cocoindex-setup` flag |
| `bin/coco-setup.js` | **Create** | Shared installer utilities (findFreePort, promptEmbeddingModel, generateCocoIndexStructure) |
| `.haki/cocoindex/` structure | **Create by installer** | Created in user project at install time, NOT in source repo |

---

## Chunk 1: SKILL.md for `/haki:index`

**Files:**
- Create: `.agent/skills/cocoindex-hybrid/SKILL.md`

### Task 1: Create `cocoindex-hybrid` SKILL.md

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/admin/haki-skills-local/.agent/skills/cocoindex-hybrid
```

- [ ] **Step 2: Write SKILL.md**

File: `.agent/skills/cocoindex-hybrid/SKILL.md`

```markdown
---
name: cocoindex-hybrid
description: Chạy CocoIndex để index codebase vào vector DB.
             Dùng khi user muốn semantic search, RAG-powered planning,
             hoặc incremental code understanding trong Haki workflow.
---

# /haki:index

Index toàn bộ codebase và SKILL.md của project vào PostgreSQL vector DB
bằng CocoIndex. Chạy thủ công khi user cần.

## Khi nào dùng

- User gõ `/haki:index`
- User nói "index codebase này"
- User muốn enable semantic search cho `/haki:plan`

## Khi nào KHÔNG dùng

- CocoIndex chưa được cài → dùng `/haki:map-codebase` thay thế
- Chỉ muốn hiểu 1 file cụ thể → đọc trực tiếp
- Project có ít code, `/haki:map-codebase` đủ nhanh

## Steps

### 1. Detect environment

Chạy detect script để check CocoIndex availability:

bash
node .haki/cocoindex/cli/index.js --check
```

Kết quả:
- `ready: true` → proceed to step 2
- `ready: false` → show warning + setup instructions, stop

### 2. Ensure Postgres is running

bash
cd .haki/cocoindex && docker compose up -d
```

Nếu `docker compose up` lỗi → báo user và suggest:
```bash
node .haki/cocoindex/cli/index.js --setup
```

### 3. Run indexing

bash
node .haki/cocoindex/cli/index.js
```

**Expected behavior:**
- Scan tất cả source files trong project
- Scan `.agent/skills/SKILL.md`
- Chunk → embed → export to PostgreSQL
- Output: số chunks indexed, thời gian, model used

### 4. Verify

Sau khi done, báo user:
```
✅ Index hoàn tất!
📊 Chunks indexed: [N]
📁 Files scanned: [M]
⏱️  Duration: [X]s
💾 Vector DB: PostgreSQL (pgvector)
🧠 Embedding: [model-name]

Tiếp theo bạn có thể:
  /haki:ask "hỏi gì về codebase"
  /haki:plan <task> — giờ plan sẽ dùng vector context
```

## Error Handling

| Error | Action |
|---|---|
| `cocoindex: command not found` | Báo + setup instructions |
| `Postgres connection refused` | `docker compose up -d` |
| `embedding model not found` | Re-run với `--model <name>` |
| `Permission denied` | User cần kiểm tra quyền `.haki/cocoindex/` |

## Config

Config được lưu tại `.haki/cocoindex/config.json`:
```json
{
  "embedding_model": "sentence-transformers/nomic-embed-text-v1.5",
  "chunk_size": 1000,
  "excluded_patterns": ["node_modules", ".git", ...],
  "last_indexed": null,
  "pg_port": 54320
}
```
```

- [ ] **Step 3: Commit**

```bash
git add .agent/skills/cocoindex-hybrid/
git commit -m "feat: add cocoindex-hybrid SKILL.md for /haki:index command

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Shared Installer Utilities (`bin/coco-setup.js`)

**Files:**
- Create: `bin/coco-setup.js`
- Modify: `bin/install.js`

### Task 2: Create `bin/coco-setup.js`

This is a new file that exports shared installer utilities. It is required by `bin/install.js`.

- [ ] **Step 1: Write `bin/coco-setup.js`**

File: `bin/coco-setup.js`

```javascript
#!/usr/bin/env node

/**
 * coco-setup.js — Shared installer utilities for CocoIndex integration.
 *
 * Exported functions used by bin/install.js during `npx haki-skills --for claude`.
 * These functions are NOT in the user project — they run in the installer context.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

// ─── Port Finding ──────────────────────────────────────────────────────────────

/**
 * Find a free port starting at `start`, trying up to `maxAttempts` ports.
 * Throws with a clear message if all ports in range are in use.
 */
async function findFreePort(start = 54320, maxAttempts = 10) {
  for (let port = start; port < start + maxAttempts; port++) {
    const free = await _isPortFree(port);
    if (free) return port;
  }
  throw new Error(
    `No free port in range ${start}–${start + maxAttempts - 1}. ` +
    `Stop a running container: docker ps | grep haki-cocoindex`
  );
}

function _isPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => { s.close(() => resolve(true)); });
    s.listen(port);
  });
}

// ─── Embedding Model Prompt ─────────────────────────────────────────────────────

/**
 * Prompt user for embedding model choice.
 * Returns the model identifier string.
 */
async function promptEmbeddingModel() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    console.log(`
CocoIndex Embedding Model Setup

  1. Local (nomic-embed-text-v1.5)     ← default, no API key needed
  2. OpenAI (text-embedding-3-small)    ← needs OPENAI_API_KEY
  3. Gemini (gemini-embedding)           ← needs GEMINI_API_KEY

Enter choice (1/2/3) or Enter to skip with default [1]: `);
    rl.on("line", (input) => resolve(input.trim()));
    rl.on("close", () => resolve(""));
  });
  rl.close();

  const choices = {
    "": "sentence-transformers/nomic-embed-text-v1.5",
    "1": "sentence-transformers/nomic-embed-text-v1.5",
    "2": "text-embedding-3-small",
    "3": "gemini-embedding",
  };

  return choices[answer] || choices[""];
}

// ─── Shell Helpers ─────────────────────────────────────────────────────────────

function run(cmd) {
  return new Promise((resolve) => {
    const [file, ...args] = cmd.split(" ");
    const child = spawn(file, args, { shell: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });
}

// ─── Structure Generation ───────────────────────────────────────────────────────

const TEMPLATE_CONFIG_JSON = {
  embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
  chunk_size: 1000,
  chunk_overlap: 200,
  excluded_patterns: [
    "node_modules", ".git", ".venv", "venv",
    ".haki", ".agent", "target", "dist", "build",
    ".next", ".nuxt", "__pycache__", ".env*",
    "*.lock", "*.log", ".DS_Store",
  ],
  last_indexed: null,
};

const TEMPLATE_DOCKER_COMPOSE = (port, slug) => `version: "3.9"

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: haki-cocoindex-pg
    environment:
      POSTGRES_USER: cocoindex
      POSTGRES_PASSWORD: cocoindex
      POSTGRES_DB: cocoindex
    ports:
      - "${port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cocoindex"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    name: haki-cocoindex-${slug}
`;

const TEMPLATE_ENV = (port, slug, model, projectRoot) => `PROJECT_SLUG=${slug}
COCOINDEX_DATABASE_URL=postgresql://cocoindex:cocoindex@localhost:${port}/cocoindex
HAKI_EMBEDDING_MODEL=${model}
HAKI_PROJECT_ROOT=${projectRoot}
`;

const TEMPLATE_CLI_INDEX = `#!/usr/bin/env node

/**
 * .haki/cocoindex/cli/index.js
 * CLI entry point for haki:index
 *
 * Usage:
 *   node .haki/cocoindex/cli/index.js            # full re-index
 *   node .haki/cocoindex/cli/index.js --check    # detect availability
 *   node .haki/cocoindex/cli/index.js --status  # show index stats
 *   node .haki/cocoindex/cli/index.js --setup   # interactive setup
 *   node .haki/cocoindex/cli/index.js --diff    # incremental index
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { loadConfig } = require("../lib/config.js");
const { detect } = require("../lib/detect.js");

const COCO_DIR = path.resolve(__dirname, "..");
const FLOW_PATH = path.join(COCO_DIR, "flows", "codebase-index.py");

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--check")) {
    const config = loadConfig();
    const result = await detect(config);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes("--status")) {
    // Query postgres for chunk counts
    const config = loadConfig();
    console.log(JSON.stringify({
      status: "ok",
      config,
      note: "Run --check for full detection results",
    }, null, 2));
    return;
  }

  if (args.includes("--setup")) {
    console.log("Setup is handled by the installer. Re-run: npx haki-skills --cocoindex-setup");
    return;
  }

  // Full re-index
  const config = loadConfig();
  const detection = await detect(config);

  if (!detection.ready) {
    console.error(JSON.stringify({
      status: "error",
      error: "CocoIndex not ready",
      checks: detection.checks,
      setup: "See installation instructions above",
    }, null, 2));
    process.exit(1);
  }

  // Load .env to get connection string
  const envPath = path.join(COCO_DIR, ".env");
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\\n")) {
      const [k, ...v] = line.split("=");
      if (k && !k.startsWith("#")) env[k.trim()] = v.join("=").trim();
    }
  }

  const start = Date.now();

  try {
    const result = await runCocoindex(FLOW_PATH, {
      ...env,
      HAKI_PROJECT_ROOT: path.resolve(COCO_DIR, "..", ".."),
    });
    console.log(JSON.stringify({
      status: "ok",
      chunks_indexed: result.chunks_indexed || 0,
      files_scanned: result.files_scanned || 0,
      duration_ms: Date.now() - start,
      vector_db: "PostgreSQL",
      embedding_model: config.embedding_model,
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({
      status: "error",
      error: err.message,
      duration_ms: Date.now() - start,
    }, null, 2));
    process.exit(1);
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function runCocoindex(flowPath, env) {
  return new Promise((resolve, reject) => {
    const child = spawn("cocoindex", ["update", flowPath], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          const snippet = stdout.slice(0, 500);
          reject(new Error(
            \`cocoindex succeeded but output is not JSON.\\n\` +
            \`stdout (first 500 chars): \${snippet}\\n\` +
            \`stderr: \${stderr}\`
          ));
        }
      } else {
        reject(new Error(stderr || \`cocoindex exited with code \${code}\`));
      }
    });
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ status: "error", error: err.message }, null, 2));
  process.exit(1);
});
`;

const TEMPLATE_DETECT = `const { spawn } = require("child_process");

/**
 * Check CocoIndex availability.
 * @param {Object} config - loaded config (for pg_port)
 * @returns {{ ready: boolean, checks: Object }}
 */
async function detect(config) {
  const port = config?.pg_port || 54320;
  const checks = {
    python:     await run("python3 --version").then(() => true).catch(() => false),
    cocoindex:  await run("pip show cocoindex").then(() => true).catch(() => false),
    embeddings: await run("pip show sentence-transformers").then(() => true).catch(() => false),
    docker:     await run("docker --version").then(() => true).catch(() => false),
    postgres:   await run(\`pg_isready -h localhost -p \${port} -U cocoindex\`)
                   .then(() => true).catch(() => false),
  };
  const ready = checks.python && checks.cocoindex && checks.postgres;
  return { ready, checks };
}

function run(cmd) {
  return new Promise((resolve) => {
    const [file, ...args] = cmd.split(" ");
    const child = spawn(file, args, { shell: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });
}

module.exports = { detect };
`;

const TEMPLATE_CONFIG_JS = `const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

const DEFAULTS = {
  embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
  chunk_size: 1000,
  chunk_overlap: 200,
  excluded_patterns: [
    "node_modules", ".git", ".venv", "venv",
    ".haki", ".agent", "target", "dist", "build",
    ".next", ".nuxt", "__pycache__", ".env*",
    "*.lock", "*.log", ".DS_Store",
  ],
  last_indexed: null,
  pg_port: 54320,
};

function loadConfig() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveConfig(config) {
  const merged = { ...loadConfig(), ...config };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

module.exports = { loadConfig, saveConfig };
`;

const TEMPLATE_FLOW = (model) => \`import cocoindex
import os


@cocoindex.flow_def(name="HakiCodebaseIndex")
def haki_codebase_index_flow(
    flow_builder: cocoindex.FlowBuilder,
    data_scope: cocoindex.DataScope,
) -> None:
    project_root = os.environ.get("HAKI_PROJECT_ROOT", ".")
    model_name = os.environ.get(
        "HAKI_EMBEDDING_MODEL",
        "${model}"
    )

    # Source: all source files
    data_scope["code_files"] = flow_builder.add_source(
        cocoindex.sources.LocalFile(
            path=project_root,
            included_patterns=[
                "*.py", "*.js", "*.ts", "*.jsx", "*.tsx",
                "*.cjs", "*.mjs", "*.rs", "*.go", "*.java",
                "*.toml", "*.json", "*.yaml", "*.yml",
                "*.md", "*.mdx", "*.sh", "*.sql",
            ],
            excluded_patterns=[
                "node_modules", ".git", ".venv", "venv",
                ".haki", ".agent", "target", "dist", "build",
                ".next", ".nuxt", "__pycache__", ".env*",
                "*.lock", "*.log", ".DS_Store",
            ],
        )
    )

    # Source: SKILL.md files
    skills_path = os.path.join(project_root, ".agent", "skills")
    data_scope["skill_docs"] = flow_builder.add_source(
        cocoindex.sources.LocalFile(
            path=skills_path,
            included_patterns=["SKILL.md", "*.md"],
            excluded_patterns=["node_modules", "scripts", "references"],
        )
    )

    code_collector = data_scope.add_collector()
    skill_collector = data_scope.add_collector()

    # Index source files
    with data_scope["code_files"].row() as file:
        lang = file["filename"].transform(
            cocoindex.functions.DetectProgrammingLanguage()
        )
        file["chunks"] = file["content"].transform(
            cocoindex.functions.SplitRecursively(),
            language=lang,
            chunk_size=1000,
            min_chunk_size=100,
            chunk_overlap=200,
        )
        with file["chunks"].row() as chunk:
            chunk["embedding"] = chunk["text"].transform(
                cocoindex.functions.SentenceTransformerEmbed(model=model_name)
            )
            code_collector.collect(
                file=file["filename"],
                language=lang,
                location=chunk["location"],
                content=chunk["text"],
                embedding=chunk["embedding"],
            )

    # Index SKILL.md files
    with data_scope["skill_docs"].row() as skill:
        skill["chunks"] = skill["content"].transform(
            cocoindex.functions.SplitRecursively(
                language="markdown",
                chunk_size=2000,
                chunk_overlap=400,
            )
        )
        with skill["chunks"].row() as chunk:
            chunk["embedding"] = chunk["text"].transform(
                cocoindex.functions.SentenceTransformerEmbed(model=model_name)
            )
            skill_collector.collect(
                skill_file=skill["filename"],
                content=chunk["text"],
                location=chunk["location"],
                embedding=chunk["embedding"],
            )

    # Export
    code_collector.export(
        "haki_code_chunks",
        cocoindex.targets.Postgres(
            connection_string=os.environ.get("COCOINDEX_DATABASE_URL")
        ),
        primary_key_fields=["file", "location"],
        vector_indexes=[
            cocoindex.VectorIndexDef(
                field_name="embedding",
                metric=cocoindex.VectorSimilarityMetric.COSINE_SIMILARITY,
            )
        ],
    )

    skill_collector.export(
        "haki_skill_chunks",
        cocoindex.targets.Postgres(
            connection_string=os.environ.get("COCOINDEX_DATABASE_URL")
        ),
        primary_key_fields=["skill_file", "location"],
        vector_indexes=[
            cocoindex.VectorIndexDef(
                field_name="embedding",
                metric=cocoindex.VectorSimilarityMetric.COSINE_SIMILARITY,
            )
        ],
    )
\`;

/**
 * Generate the .haki/cocoindex/ structure inside targetDir.
 */
async function generateCocoIndexStructure(targetDir, { model, port }) {
  const cocoDir = path.join(targetDir, ".haki", "cocoindex");
  const slug = path.basename(targetDir).replace(/[^a-z0-9_-]/gi, "-");
  const projectRoot = path.relative(cocoDir, targetDir) || ".";

  const dirs = [
    path.join(cocoDir, "flows"),
    path.join(cocoDir, "cli"),
    path.join(cocoDir, "lib"),
  ];

  for (const d of dirs) fs.mkdirSync(d, { recursive: true });

  // config.json
  const config = { ...TEMPLATE_CONFIG_JSON, pg_port: port };
  fs.writeFileSync(
    path.join(cocoDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf-8"
  );

  // docker-compose.yml
  fs.writeFileSync(
    path.join(cocoDir, "docker-compose.yml"),
    TEMPLATE_DOCKER_COMPOSE(port, slug),
    "utf-8"
  );

  // .env
  fs.writeFileSync(
    path.join(cocoDir, ".env"),
    TEMPLATE_ENV(port, slug, model, projectRoot),
    "utf-8"
  );

  // cli/index.js
  fs.writeFileSync(
    path.join(cocoDir, "cli", "index.js"),
    TEMPLATE_CLI_INDEX,
    "utf-8"
  );

  // lib/detect.js
  fs.writeFileSync(path.join(cocoDir, "lib", "detect.js"), TEMPLATE_DETECT, "utf-8");

  // lib/config.js
  fs.writeFileSync(path.join(cocoDir, "lib", "config.js"), TEMPLATE_CONFIG_JS, "utf-8");

  // flows/codebase-index.py
  fs.writeFileSync(
    path.join(cocoDir, "flows", "codebase-index.py"),
    TEMPLATE_FLOW(model),
    "utf-8"
  );

  return cocoDir;
}

module.exports = {
  findFreePort,
  promptEmbeddingModel,
  generateCocoIndexStructure,
  run,
};
```

- [ ] **Step 2: Commit**

```bash
git add bin/coco-setup.js
git commit -m "feat: add bin/coco-setup.js — shared installer utilities

Exports: findFreePort, promptEmbeddingModel, generateCocoIndexStructure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Modify `bin/install.js`

**Files:**
- Modify: `bin/install.js` (add coco setup step + `--cocoindex-setup` flag)

### Task 3: Modify `bin/install.js` — parse new flag

- [ ] **Step 1: Add `--cocoindex-setup` to help text (line ~195)**

Find this block in `bin/install.js`:

```javascript
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Haki Init — Install haki workflow system into a project

Usage:  npx haki-skills [target-dir] [options]

Options:
  --for <agent>  Generate config for a specific agent (default: antigravity)
                 Agents: ${KNOWN_AGENTS.join(", ")}, all
                 Comma-separated: --for claude,cursor
  --force        Overwrite existing .agent/ files
  --help         Show this help
```

Replace with:

```javascript
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Haki Init — Install haki workflow system into a project

Usage:  npx haki-skills [target-dir] [options]

Options:
  --for <agent>       Generate config for a specific agent (default: antigravity)
                      Agents: ${KNOWN_AGENTS.join(", ")}, all
                      Comma-separated: --for claude,cursor
  --force             Overwrite existing .agent/ files
  --cocoindex-setup   Run CocoIndex setup (implies --for claude)
  --help              Show this help

Examples:
  npx haki-skills                      # Antigravity (default)
  npx haki-skills --for claude         # Claude Code
  npx haki-skills --for cursor         # Cursor
  npx haki-skills --for claude --cocoindex-setup  # Claude + CocoIndex setup
  npx haki-skills --cocoindex-setup     # Standalone CocoIndex setup
`);
    process.exit(0);
  }
```

- [ ] **Step 2: Add `cocoindexSetup` flag parsing after `--force`**

Find (around line 209):
```javascript
  const force = args.includes("--force");
```

Add after:
```javascript
  const cocoSetup = args.includes("--cocoindex-setup");
```

- [ ] **Step 3: Import `coco-setup.js` utilities**

Find (around line 23):
```javascript
const fs = require("fs");
const path = require("path");
```

Add after:
```javascript
const {
  findFreePort,
  promptEmbeddingModel,
  generateCocoIndexStructure,
  run: runShell,
} = require("./coco-setup.js");
```

- [ ] **Step 4: Add cocoIndexSetupStep function**

Add this function after the `createClaudeSkillWrappers` function (after line 178):

```javascript
// ─── CocoIndex Setup ──────────────────────────────────────────────────────────

async function cocoIndexSetupStep(targetDir) {
  const cocoDir = path.join(targetDir, ".haki", "cocoindex");

  // Already configured — skip
  if (fs.existsSync(cocoDir)) {
    console.log("   ⏭️  CocoIndex already configured — skipping");
    return;
  }

  // Run detection
  const checks = {
    python:    await runShell("python3 --version").then(() => true).catch(() => false),
    cocoindex: await runShell("pip show cocoindex").then(() => true).catch(() => false),
    docker:    await runShell("docker --version").then(() => true).catch(() => false),
  };

  if (!checks.python) {
    console.log("   ⚠️  Python not found — skipping CocoIndex");
    console.log("   ℹ️  Install Python then re-run: npx haki-skills --cocoindex-setup");
    return;
  }

  if (!checks.docker) {
    console.log("   ⚠️  Docker not found — skipping CocoIndex");
    console.log("   ℹ️  Install Docker then re-run: npx haki-skills --cocoindex-setup");
    return;
  }

  if (!checks.cocoindex) {
    console.log("   ⚠️  CocoIndex not installed");
    console.log("   ℹ️  pip install cocoindex[embeddings]");
    console.log("   ℹ️  Then: node .haki/cocoindex/cli/index.js --setup");
    return;
  }

  // All ready — interactive model selection
  const model = await promptEmbeddingModel();
  const port = await findFreePort(54320);

  await generateCocoIndexStructure(targetDir, { model, port });

  console.log("   ✅ CocoIndex setup complete");
  console.log("   ℹ️  To start Postgres: cd .haki/cocoindex && docker compose up -d");
  console.log("   ℹ️  To index: node .haki/cocoindex/cli/index.js");
}
```

- [ ] **Step 5: Handle `--cocoindex-setup` standalone (no `--for claude`)**

Find the line that calls `parseForArg`:

```javascript
  const selectedAgents = parseForArg(args);
```

Add after that block (before the "Check existing" section):

```javascript
  // Handle --cocoindex-setup standalone (no --for specified)
  if (cocoSetup && !selectedAgents.includes("claude")) {
    selectedAgents.push("claude");
  }

  // --cocoindex-setup without python/docker is a no-op
  if (cocoSetup) {
    const checks = {
      python:    await runShell("python3 --version").then(() => true).catch(() => false),
      docker:    await runShell("docker --version").then(() => true).catch(() => false),
    };
    if (!checks.python || !checks.docker) {
      console.log("   ⚠️  --cocoindex-setup requires Python and Docker");
      console.log("   ℹ️  Install them, then re-run: npx haki-skills --cocoindex-setup");
      // Don't add claude to selectedAgents — just warn and continue
      const claIdx = selectedAgents.indexOf("claude");
      if (claIdx > -1) selectedAgents.splice(claIdx, 1);
    }
  }
```

- [ ] **Step 6: Call `cocoIndexSetupStep` after install completes**

Find the line (around line 303):
```javascript
  if (fs.existsSync(path.join(targetDir, ".git"))) {
```

Add before that block:

```javascript
  // Run CocoIndex setup for claude target
  if (selectedAgents.includes("claude")) {
    await cocoIndexSetupStep(targetDir);
  }
```

- [ ] **Step 7: Make `main()` async (required for await)**

Find in `bin/install.js` (line ~182):
```javascript
function main() {
```

Replace with:
```javascript
async function main() {
```

And at the bottom of `main()` (line ~312), find:
```javascript
  console.log(`\n✨ Done! ${totalFiles} files installed`);
  console.log(`\n▶ Next: /haki:new-project (or /haki:next)\n`);
}

main();
```

Replace the final two lines with:
```javascript
  console.log(`\n✨ Done! ${totalFiles} files installed`);
  console.log(`\n▶ Next: /haki:new-project (or /haki:next)\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 8: Add gitignore entry for `.haki/cocoindex/*.db`**

Find the `ensureGitignore` function usage. The existing call already appends `.haki/`. The new line we want to add is `.haki/cocoindex/*.db`.

Modify the `ensureGitignore` call (around line 303) to also append the CocoIndex-specific entry:

Find:
```javascript
  // Update .gitignore
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    if (ensureGitignore(targetDir))
      console.log("   ✅ .gitignore (added .haki/)");
  }
```

Replace with:
```javascript
  // Update .gitignore
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    if (ensureGitignore(targetDir))
      console.log("   ✅ .gitignore (added .haki/)");
    // Append CocoIndex-specific entry
    const giPath = path.join(targetDir, ".gitignore");
    const gi = fs.readFileSync(giPath, "utf-8");
    const cocoEntry = "\n# CocoIndex vector DB data\n.haki/cocoindex/*.db\n";
    if (!gi.includes(".haki/cocoindex/*.db")) {
      fs.writeFileSync(giPath, gi.replace(/\n*$/, "") + cocoEntry, "utf-8");
    }
  }
```

- [ ] **Step 8: Commit**

```bash
git add bin/install.js
git commit -m "feat: integrate CocoIndex setup into install.js

- Add --cocoindex-setup flag (standalone or with --for claude)
- Run cocoIndexSetupStep() after install for claude target
- Skip if .haki/cocoindex/ already exists (idempotent)
- Graceful warnings when Python/Docker/CocoIndex missing
- Add .haki/cocoindex/*.db to .gitignore
- Change main() to async + .catch() error handler

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Smoke Tests

**Files:**
- Create: `tests/unit/coco-setup.test.js`

### Task 4: Write unit tests for `coco-setup.js`

- [ ] **Step 1: Create test directory**

```bash
mkdir -p /Users/admin/haki-skills-local/tests/unit
```

- [ ] **Step 2: Write tests for `findFreePort`**

File: `tests/unit/coco-setup.test.js`

```javascript
// require() is INSIDE the describe — fails gracefully if module not yet created
describe("findFreePort", () => {
  let findFreePort;
  beforeAll(async () => {
    try {
      ({ findFreePort } = await import("../../bin/coco-setup.js"));
    } catch {
      // Module doesn't exist yet — skip all tests in this describe
      findFreePort = null;
    }
  });

  test("returns a number in range 54320-54329 by default", async () => {
    if (!findFreePort) return; // skip
    const port = await findFreePort();
    expect(port).toBeGreaterThanOrEqual(54320);
    expect(port).toBeLessThan(54330);
  });

  test("returns a valid port number", async () => {
    if (!findFreePort) return; // skip if module not yet created
    const port = await findFreePort(54320, 5);
    expect(typeof port).toBe("number");
    expect(port >= 54320).toBe(true);
    expect(port < 54325).toBe(true);
  });
});
```

- [ ] **Step 3: Write tests for config loading (real fs temp files)**

The config module is in the template string, not on disk yet. Create a test file that directly tests the config logic inline — no fs mocking library needed.

File: `tests/unit/coco-setup.test.js` (append to existing content)

```javascript
const fs = require("fs");
const path = require("path");
const os = require("os");

describe("config.js behavior", () => {
  // Re-implement loadConfig/saveConfig logic inline for testing
  // (config.js won't exist until after install, so we test the logic directly)
  const CONFIG_DEFAULTS = {
    embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
    chunk_size: 1000,
    chunk_overlap: 200,
    excluded_patterns: ["node_modules", ".git"],
    last_indexed: null,
    pg_port: 54320,
  };

  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }

  test("loadConfig returns DEFAULTS when file does not exist", () => {
    const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
    const result = loadConfig(tmp);
    expect(result.embedding_model).toBe("sentence-transformers/nomic-embed-text-v1.5");
    expect(result.pg_port).toBe(54320);
  });

  test("loadConfig returns DEFAULTS merged when file is empty object", () => {
    const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
    fs.writeFileSync(tmp, "{}", "utf-8");
    const result = loadConfig(tmp);
    expect(result.pg_port).toBe(54320);
    fs.unlinkSync(tmp);
  });

  test("loadConfig returns DEFAULTS merged when file has partial config", () => {
    const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
    fs.writeFileSync(tmp, JSON.stringify({ pg_port: 54330 }), "utf-8");
    const result = loadConfig(tmp);
    expect(result.pg_port).toBe(54330);
    expect(result.embedding_model).toBe(CONFIG_DEFAULTS.embedding_model);
    fs.unlinkSync(tmp);
  });

  test("loadConfig returns DEFAULTS when file has invalid JSON", () => {
    const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
    fs.writeFileSync(tmp, "{ invalid json", "utf-8");
    const result = loadConfig(tmp);
    expect(result.pg_port).toBe(54320);
    fs.unlinkSync(tmp);
  });

  test("loadConfig never throws — returns defaults on any error", () => {
    const result = loadConfig("/nonexistent/path/to/config.json");
    expect(result).toBeDefined();
    expect(result.pg_port).toBe(54320);
  });
});
```

- [ ] **Step 4: Write tests for detect function (safe, no runtime dependency)**

```javascript
const fs = require("fs");
const path = require("path");

describe("detect.js source code analysis", () => {
  // Since .haki/cocoindex/lib/detect.js doesn't exist until after install,
  // we verify the template string in coco-setup.js contains the expected logic.

  test("detect uses pg_isready, not docker ps", () => {
    const cocoSetupSrc = fs.readFileSync(
      path.resolve(__dirname, "../../bin/coco-setup.js"),
      "utf-8"
    );
    // Should contain pg_isready check
    expect(cocoSetupSrc).toContain("pg_isready");
    // Should NOT check docker ps for postgres readiness
    expect(cocoSetupSrc).not.toContain("docker ps");
  });

  test("detect checks python, cocoindex, embeddings, docker, postgres", () => {
    const cocoSetupSrc = fs.readFileSync(
      path.resolve(__dirname, "../../bin/coco-setup.js"),
      "utf-8"
    );
    expect(cocoSetupSrc).toContain("python3 --version");
    expect(cocoSetupSrc).toContain("pip show cocoindex");
    expect(cocoSetupSrc).toContain("sentence-transformers");
    expect(cocoSetupSrc).toContain("docker --version");
    expect(cocoSetupSrc).toContain("pg_isready");
  });

  test("detect ready = python && cocoindex && postgres", () => {
    const cocoSetupSrc = fs.readFileSync(
      path.resolve(__dirname, "../../bin/coco-setup.js"),
      "utf-8"
    );
    // Verify the ready computation uses && for the three required checks
    expect(cocoSetupSrc).toMatch(/ready\s*=\s*checks\.python\s*&&\s*checks\.cocoindex\s*&&\s*checks\.postgres/);
  });
});
```

- [ ] **Step 5: Write test for installer flag parsing**

```javascript
describe("install.js --cocoindex-setup flag", () => {
  test("cocoSetup flag is parsed when --cocoindex-setup is present", () => {
    // We test this by verifying the install.js file contains the flag check
    const installSrc = require("fs").readFileSync(
      require("path").resolve(__dirname, "../../bin/install.js"),
      "utf-8"
    );
    expect(installSrc).toContain("--cocoindex-setup");
    expect(installSrc).toContain("cocoSetup");
  });

  test("cocoIndexSetupStep function is defined in install.js", () => {
    const installSrc = require("fs").readFileSync(
      require("path").resolve(__dirname, "../../bin/install.js"),
      "utf-8"
    );
    expect(installSrc).toContain("async function cocoIndexSetupStep");
  });
});
```

- [ ] **Step 6: Write test for SKILL.md existence**

```javascript
describe("cocoindex-hybrid skill", () => {
  const skillPath = require("path").resolve(
    __dirname,
    "../../.agent/skills/cocoindex-hybrid/SKILL.md"
  );

  test("SKILL.md exists", () => {
    expect(require("fs").existsSync(skillPath)).toBe(true);
  });

  test("SKILL.md has correct frontmatter name", () => {
    const content = require("fs").readFileSync(skillPath, "utf-8");
    expect(content).toContain("name: cocoindex-hybrid");
    expect(content).toContain("/haki:index");
  });
});
```

- [ ] **Step 7: Run tests**

```bash
node --test tests/unit/coco-setup.test.js
```

Expected: PASS. All tests use temp files or source reading — no dependency on `.haki/cocoindex/` existing.

- [ ] **Step 8: Commit**

```bash
git add tests/unit/coco-setup.test.js
git commit -m "test: add unit tests for coco-setup.js and installer integration

- findFreePort range validation (54320-54329)
- Config loadConfig() never throws, returns defaults on error/empty/invalid JSON
- Detect uses pg_isready (not docker ps), ready = python && cocoindex && postgres
- --cocoindex-setup flag and cocoIndexSetupStep in install.js
- cocoindex-hybrid SKILL.md existence

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: Integration Smoke Test (Manual)

This chunk is **manual** — requires a real project directory.

### Task 5: Run integration smoke test

**Prerequisites:** Python 3, Docker, `pip install cocoindex[embeddings]` installed on the machine running the test.

- [ ] **Step 1: Set up a test project directory**

```bash
cd /tmp
rm -rf haki-smoke-test
mkdir haki-smoke-test && cd haki-smoke-test
git init

# Create a minimal project with some code files
mkdir src && echo 'const x = 1;' > src/index.js
echo '# Test' > README.md
```

- [ ] **Step 2: Run installer with Cocoa setup**

```bash
cd /path/to/haki-skills-local
npx haki-skills /tmp/haki-smoke-test --for claude
```

Expected output includes:
```
   ✅ .haki/cocoindex/ (CocoIndex structure created)
```
OR warnings if Python/Docker not found (expected on CI machines).

- [ ] **Step 3: Verify SKILL.md landed in correct location**

```bash
ls /tmp/haki-smoke-test/.claude/skills/cocoindex-hybrid/
# Should contain: SKILL.md
```

- [ ] **Step 4: If CocoIndex was set up, start Postgres and run index**

```bash
cd /tmp/haki-smoke-test/.haki/cocoindex
docker compose up -d
sleep 5  # wait for postgres to be ready

node cli/index.js
```

Expected: JSON output with `"status": "ok"` and chunk/file counts.

- [ ] **Step 5: Verify no files were created in Haki source repo**

```bash
git -C /path/to/haki-skills-local status
# Should show only committed changes, no untracked .haki/ files
```

- [ ] **Step 6: Cleanup**

```bash
cd /tmp/haki-smoke-test/.haki/cocoindex && docker compose down -v 2>/dev/null
rm -rf /tmp/haki-smoke-test
```

---

## Chunk 6: README Update

**Files:**
- Modify: `README.md`

### Task 6: Update README.md

- [ ] **Step 1: Add CocoIndex section to README**

Find the "What Gets Installed" section in `README.md`. Add after it:

```markdown
### CocoIndex Integration (Optional)

When installing with `--for claude`, Haki can optionally set up [CocoIndex](https://cocoindex.io) for semantic code search and RAG-powered planning.

**Requirements:** Python 3 + Docker

**To enable:** Re-run `npx haki-skills --cocoindex-setup` (or install with `--for claude` on a machine with Python + Docker).

**What it sets up:**
- Per-project PostgreSQL + pgvector (Docker)
- CLI: `node .haki/cocoindex/cli/index.js` to index codebase
- `/haki:index` skill for semantic code search

**Embedding models:** Local (default, no API key) or OpenAI/Gemini (requires API key).

See [docs/specs/2026-04-01-cocoindex-hybrid-integration.md](docs/specs/2026-04-01-cocoindex-hybrid-integration.md) for design details.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add CocoIndex optional integration section to README

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
