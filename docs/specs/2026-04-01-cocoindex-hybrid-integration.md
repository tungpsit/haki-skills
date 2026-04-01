# CocoIndex Hybrid Integration — Phase 1 Design

**Date:** 2026-04-01
**Status:** Draft
**Phase:** 1 of N (codebase indexing only)
**Author:** Brainstormed with user

---

## 1. Overview

Add CocoIndex as an **optional, zero-breaking-change layer** on top of Haki Skills. CocoIndex indexes the user's project codebase into a per-project PostgreSQL vector DB, enabling future semantic search and RAG-powered planning — without touching Haki's core JavaScript/Node.js architecture.

**Design principle:** Haki source stays pure Node.js. All CocoIndex code lives in `.haki/cocoindex/` (gitignored) and gets injected at install time.

---

## 2. What Phase 1 Delivers

| Feature | Status |
|---|---|
| `/haki:index` — manual CLI to index codebase + SKILL.md | Phase 1 |
| CocoIndex availability detection with graceful warning | Phase 1 |
| Docker Compose setup for per-project Postgres | Phase 1 |
| Installer integration (optional CocoIndex setup step) | Phase 1 |
| RAG query (`/haki:ask`) | Phase 2 |
| Knowledge Graph extraction | Future |
| Incremental index on git commit | Future |

---

## 3. Architecture

### 3.1 File Placement

```
HAKI SOURCE REPO (this repo)
─────────────────────────────────────────────────────────
.agent/skills/
└── cocoindex-hybrid/
    └── SKILL.md                          ← Skill for /haki:index

bin/
└── install.js                            ← Modified: add coco setup step

.haki/                                     ← (NOT in source repo)
    └── cocoindex/                        ← Created by installer in user project
        ├── config.json
        ├── docker-compose.yml
        ├── .env
        ├── flows/
        │   └── codebase-index.py
        ├── cli/
        │   └── index.js
        └── lib/
            ├── detect.js
            ├── config.js
            └── runner.js
```

**Agent → SKILL.md path mapping:**

| Agent | SKILL.md Source (in repo) | SKILL.md Destination (in user project) |
|---|---|---|
| claude | `.agent/skills/cocoindex-hybrid/SKILL.md` | `.claude/skills/cocoindex-hybrid/SKILL.md` |
| antigravity / gemini / codex / cursor | `.agent/skills/cocoindex-hybrid/SKILL.md` | `.agent/skills/cocoindex-hybrid/SKILL.md` |

The `createClaudeSkillWrappers()` function in `bin/install.js` already copies skill dirs from `.agent/skills/` to `.claude/skills/`. The `cocoindex-hybrid` skill follows this pattern automatically — no special handling needed.

**Key insight:** `.haki/cocoindex/` does not live in the Haki source repo. It is created by the installer (or a setup script) inside each user project. This preserves Haki's source repo as pure Node.js.

### 3.2 Design Principle: No Core Changes

| Haki Source File | Change? |
|---|---|
| `.agent/skills/*` (22 existing skills) | No |
| `.agent/workflows/*` (13 workflows) | No |
| `.agent/bin/haki-tools.cjs` | No |
| `.agent/templates/*` | No |
| `package.json` | No |
| `.gitignore` | Append only |
| `bin/install.js` | **Yes** — add CocoIndex setup step at the end |
| `README.md` | Update docs link |

### 3.3 `.gitignore` Additions

Append to project's `.gitignore`:

```
# CocoIndex vector DB data
.haki/cocoindex/*.db
.haki/cocoindex/postgres_data/
```

Note: Docker named volumes (e.g. `haki-cocoindex-myproject`) are managed by Docker, not the filesystem — they don't need `.gitignore` entries. The `postgres_data/` directory in `docker-compose.yml` is a named volume, not a bind mount.

### 3.4 Data Flow

```
User types /haki:index
         │
         ▼
   SKILL.md (Claude Code reads this skill)
         │
   node .haki/cocoindex/cli/index.js
         │
         ├── detect.js   → check cocoindex availability
         ├── config.js   → load config.json
         └── runner.js   → spawn cocoindex CLI
         │
         ▼
   cocoindex update codebase-index.py
   (env: COCOINDEX_DATABASE_URL, HAKI_EMBEDDING_MODEL, HAKI_PROJECT_ROOT)
         │
         ▼
   CocoIndex Rust Engine
   ├── LocalFile source (code + SKILL.md)
   ├── SplitRecursively (chunking)
   ├── SentenceTransformerEmbed (or API model)
   └── Postgres export (upsert)
         │
         ▼
   PostgreSQL/pgvector
   ├── haki_code_chunks  (file, language, location, content, embedding)
   └── haki_skill_chunks (skill_file, content, location, embedding)
```

---

## 4. Component Specifications

### 4.0 `.haki/cocoindex/lib/config.js`

Loads and saves `.haki/cocoindex/config.json`.

```javascript
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    // Return defaults if file doesn't exist
    return {
      embedding_model: 'sentence-transformers/nomic-embed-text-v1.5',
      chunk_size: 1000,
      chunk_overlap: 200,
      excluded_patterns: [/* defaults */],
      last_indexed: null,
      pg_port: 54320,
    };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

module.exports = { loadConfig, saveConfig };
```

- `loadConfig()` never throws — returns defaults on error
- `saveConfig()` writes atomically (write-then-rename)
- Config path resolves relative to `__dirname` (CLI is always run from project root)

### 4.1 `.haki/cocoindex/config.json`

```json
{
  "embedding_model": "sentence-transformers/nomic-embed-text-v1.5",
  "chunk_size": 1000,
  "chunk_overlap": 200,
  "excluded_patterns": [
    "node_modules", ".git", ".venv", "venv",
    ".haki", ".agent", "target", "dist", "build",
    ".next", ".nuxt", "__pycache__", ".env*",
    "*.lock", "*.log", ".DS_Store"
  ],
  "last_indexed": null,
  "pg_port": 54320
}
```

User can override any field. Installer pre-fills with defaults.

### 4.2 `.haki/cocoindex/docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: haki-cocoindex-pg
    environment:
      POSTGRES_USER: cocoindex
      POSTGRES_PASSWORD: cocoindex
      POSTGRES_DB: cocoindex
    ports:
      - "54320:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cocoindex"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    name: haki-cocoindex-${PROJECT_SLUG:-project}
```

**Port strategy:** Installer finds a free port starting at 54320, trying up to 54329. If all are in use, the setup step fails with a clear message telling the user to stop one of the running containers or specify a port manually.

```javascript
async function findFreePort(start = 54320, maxAttempts = 10) {
  for (let port = start; port < start + maxAttempts; port++) {
    const free = await isPortFree(port);
    if (free) return port;
  }
  throw new Error(
    `No free port in range ${start}–${start + maxAttempts - 1}. ` +
    `Stop a running container: docker ps | grep haki-cocoindex`
  );
}

async function isPortFree(port) {
  try {
    await new Promise((res, rej) => {
      const s = require('net').createServer();
      s.once('error', () => rej('in use'));
      s.once('listening', () => { s.close(); res(); });
      s.listen(port);
    });
    return true;
  } catch {
    return false;
  }
}
```

### 4.3 `.haki/cocoindex/.env`

Generated by installer:

```
PROJECT_SLUG=my-project
COCOINDEX_DATABASE_URL=postgresql://cocoindex:cocoindex@localhost:54320/cocoindex
HAKI_EMBEDDING_MODEL=sentence-transformers/nomic-embed-text-v1.5
HAKI_PROJECT_ROOT=../..
```

### 4.4 `.haki/cocoindex/flows/codebase-index.py`

Python CocoIndex flow that:

1. Reads all source files matching patterns (`.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.cjs`, `.mjs`, `.rs`, `.go`, `.java`, `.toml`, `.json`, `.yaml`, `.yml`, `.md`, `.mdx`, `.sh`, `.sql`)
2. Reads all `SKILL.md` files from `.agent/skills/`
3. Chunks each file using `SplitRecursively` with language detection
4. Embeds each chunk using the configured model
5. Upserts to `haki_code_chunks` table in PostgreSQL
6. Upserts to `haki_skill_chunks` table in PostgreSQL

Environment variables drive the config (no hardcoding).

### 4.5 `.haki/cocoindex/cli/index.js`

Node.js CLI entry point (not Python — stays in JS ecosystem for Haki's Node.js nature).

Commands:

| Command | Description |
|---|---|
| `node .haki/cocoindex/cli/index.js` | Full re-index |
| `node .haki/cocoindex/cli/index.js --diff` | Incremental (changed files only) |
| `node .haki/cocoindex/cli/index.js --status` | Show index stats |
| `node .haki/cocoindex/cli/index.js --check` | Detect cocoindex availability |
| `node .haki/cocoindex/cli/index.js --setup` | Interactive setup (create docker-compose, .env) |
| `node .haki/cocoindex/cli/index.js --model <name>` | Override embedding model |

Output is **machine-readable JSON** so Claude can parse it:

```json
{
  "status": "ok",
  "chunks_indexed": 342,
  "files_scanned": 47,
  "duration_ms": 12400,
  "vector_db": "PostgreSQL",
  "embedding_model": "sentence-transformers/nomic-embed-text-v1.5"
}
```

### 4.6 `.haki/cocoindex/lib/detect.js`

Checks availability in order. Uses `pg_isready` against the configured port — the definitive check for whether Postgres is accepting connections.

```javascript
async function detect(config) {
  const port = config?.pg_port || 54320;
  const checks = {
    python:     await run('python3 --version').then(() => true).catch(() => false),
    cocoindex:  await run('pip show cocoindex').then(() => true).catch(() => false),
    embeddings: await run('pip show sentence-transformers').then(() => true).catch(() => false),
    docker:     await run('docker --version').then(() => true).catch(() => false),
    postgres:   await run(`pg_isready -h localhost -p ${port} -U cocoindex`)
                   .then(() => true).catch(() => false),
  };
  const ready = checks.python && checks.cocoindex && checks.postgres;
  return { ready, checks };
}
```

Note: `docker` check only confirms Docker CLI is available — it does not check if the container is running. The `postgres` check (via `pg_isready`) is the definitive "is vector DB accessible?" signal.

### 4.7 `.haki/cocoindex/lib/runner.js`

Spawns the CocoIndex CLI:

```javascript
function runCocoindex(flowPath, env) {
  return new Promise((resolve, reject) => {
    const child = spawn('cocoindex', ['update', flowPath], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);

    child.on('close', code => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          // cocoindex succeeded but output is not JSON — surface partial stdout for debugging
          const snippet = stdout.slice(0, 500);
          reject(new Error(
            `cocoindex succeeded but output is not JSON.\n` +
            `stdout (first 500 chars): ${snippet}\n` +
            `stderr: ${stderr}`
          ));
        }
      } else {
        reject(new Error(stderr || `cocoindex exited with code ${code}`));
      }
    });
  });
}
```

Key behavior: if `cocoindex` exits 0 but stdout isn't JSON, surface the raw output in the error rather than crashing silently.

### 4.9 PostgreSQL Table Schemas

CocoIndex auto-creates tables on first run. Schema is documented for reference only.

```sql
-- haki_code_chunks
CREATE TABLE haki_code_chunks (
  id         SERIAL PRIMARY KEY,
  file       TEXT NOT NULL,
  language   TEXT,
  location   TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(384),   -- 384-dim for nomic-embed / all-MiniLM-L6-v2
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file, location)
);

CREATE INDEX ON haki_code_chunks USING ivfflat (embedding cosine_ops);

-- haki_skill_chunks
CREATE TABLE haki_skill_chunks (
  id         SERIAL PRIMARY KEY,
  skill_file TEXT NOT NULL,
  location   TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_file, location)
);

CREATE INDEX ON haki_skill_chunks USING ivfflat (embedding cosine_ops);
```

The embedding dimension (384) matches `nomic-embed-text-v1.5` and `all-MiniLM-L6-v2`. If the user selects OpenAI/Gemini (1536-dim), the vector column type must match. The Python flow handles this via `cocoindex.VectorIndexDef` configuration.

---

## 5. SKILL.md: `/haki:index` Skill

File: `.agent/skills/cocoindex-hybrid/SKILL.md`

Activated when user types `/haki:index`.

### Detection Flow

```
/haki:index
  │
  node .haki/cocoindex/cli/index.js --check
  │
  ├── ready: true  → proceed to step 2
  └── ready: false → show warning + setup instructions → STOP
```

### Setup Instructions (when not ready)

```
⚠️  CocoIndex chưa được cài đặt
Vector index features bị bỏ qua. Haki tiếp tục workflow bình thường.

Để bật index:
  1. pip install cocoindex[embeddings]
  2. cd .haki/cocoindex && docker compose up -d
  3. node .haki/cocoindex/cli/index.js
```

---

## 6. Installer Integration

File: `bin/install.js` — add a final step after the existing install completes.

**Agent scoping:** The CocoIndex setup step runs only when `--for claude` is among the selected agents. For other agents (antigravity, cursor, etc.), CocoIndex setup is skipped — users on those agents can still run `npx haki-skills --cocoindex-setup` later.

### Detection Logic (in installer)

`bin/install.js` does NOT duplicate `lib/detect.js`. Instead, if the installer detects that `.haki/cocoindex/` already exists in the target project, it skips the setup step (CocoIndex was already configured). If the directory does not exist and `--for claude` is selected, it runs the interactive setup.

```javascript
async function cocoIndexSetupStep(targetDir) {
  const cocoDir = path.join(targetDir, '.haki', 'cocoindex');

  // Already configured — skip
  if (fs.existsSync(cocoDir)) {
    console.log('   ⏭️  CocoIndex already configured — skipping');
    return;
  }

  // Run detect from the generated structure (not from source repo)
  const checks = {
    python:    await run('python3 --version').then(() => true).catch(() => false),
    cocoindex: await run('pip show cocoindex').then(() => true).catch(() => false),
    docker:    await run('docker --version').then(() => true).catch(() => false),
  };

  if (!checks.python) {
    console.log('   ⚠️  Python not found — skipping CocoIndex');
    console.log('   ℹ️  Install Python then re-run: npx haki-skills --cocoindex-setup');
    return;
  }

  if (!checks.docker) {
    console.log('   ⚠️  Docker not found — skipping CocoIndex');
    console.log('   ℹ️  Install Docker then re-run: npx haki-skills --cocoindex-setup');
    return;
  }

  if (!checks.cocoindex) {
    console.log('   ⚠️  CocoIndex not installed');
    console.log('   ℹ️  pip install cocoindex[embeddings]');
    console.log('   ℹ️  Then: node .haki/cocoindex/cli/index.js --setup');
    return;
  }

  // All ready — interactive model selection
  const model = await promptEmbeddingModel(); // 1: local, 2: openai, 3: gemini
  const port = await findFreePort(54320);

  // Generate .haki/cocoindex/ structure
  await generateCocoIndexStructure(targetDir, { model, port });
  await runCocoIndexSetup(targetDir, { model, port });

  console.log('   ✅ CocoIndex ready');
  console.log('   ℹ️  To index: node .haki/cocoindex/cli/index.js');
}
```

### New Installer Flag

```bash
npx haki-skills --cocoindex-setup          # Run only the CocoIndex setup step (claude target)
npx haki-skills --for claude --cocoindex-setup  # Equivalent, explicit
```

The `--cocoindex-setup` flag only takes effect when `--for claude` is also present (or implied). Running `--cocoindex-setup` alone is a no-op with a warning.

Append to project's `.gitignore`:

```
# CocoIndex SQLite files (if any local file-based DB is used)
.haki/cocoindex/*.db
```

Note: The Docker named volume for PostgreSQL data (defined as `postgres_data:` in `docker-compose.yml`) lives in Docker's managed storage, not the filesystem — no `.gitignore` entry needed.

---

## 7. Embedding Model Selection

At install time (or `--cocoindex-setup`), user chooses:

| Option | Model | Installer auto-installs | Runtime needs |
|---|---|---|---|
| 1 (default) | `sentence-transformers/nomic-embed-text-v1.5` | `pip install cocoindex[embeddings]` | Nothing |
| 2 | `text-embedding-3-small` (OpenAI) | Nothing extra | `OPENAI_API_KEY` env var |
| 3 | `gemini-embedding` (Gemini) | Nothing extra | `GEMINI_API_KEY` env var |

Default = Option 1 (local, no API key needed).

If user picks Option 2 or 3, the installer prints a message reminding them to set the API key in `.haki/cocoindex/.env`.

---

## 8. Graceful Degradation Map

| Missing component | Behavior | Message |
|---|---|---|
| Python | Haki works, `/haki:index` shows warning | "Python not found..." |
| CocoIndex pip package | Haki works, `/haki:index` shows warning | "CocoIndex not installed..." |
| Docker | Haki works, `/haki:index` shows warning | "Docker not running..." |
| Postgres container | Haki works, `/haki:index` errors with setup hint | "Postgres connection refused..." |

**Haki core workflows (`/haki:plan`, `/haki:exec`, etc.) are NEVER blocked by missing CocoIndex.**

---

## 9. Testing Strategy

### Unit tests (Node.js)

- `detect.js` — mock shell commands, test all ready/not-ready combinations
- `config.js` — read/write/config validation
- `cli/index.js` — parse args, output format

### Integration tests (manual / smoke)

- Fresh project → `npx haki-skills --for claude`
- Verify `cocoindex-hybrid` skill lands at `.claude/skills/cocoindex-hybrid/SKILL.md`
- `node .haki/cocoindex/cli/index.js --setup`
- `node .haki/cocoindex/cli/index.js`
- Verify PostgreSQL tables created with chunks

### CocoIndex flow tests (Python)

- Run `cocoindex update codebase-index.py` with sample project
- Verify chunk count, embedding dimensions, table schemas

---

## 10. Future Phases (Out of Scope for Phase 1)

- **Phase 2:** `/haki:ask` — RAG query on vector DB
- **Phase 3:** Knowledge Graph extraction (AST + LLM)
- **Phase 4:** Git hook for auto-incremental index
- **Phase 5:** `/haki:plan` enhanced with semantic context

---

## 11. Acceptance Criteria

### Implementation Requirements (what the code must satisfy)

- [ ] `cocoindex-hybrid` SKILL.md lands at `.claude/skills/cocoindex-hybrid/SKILL.md` for claude target (via existing `createClaudeSkillWrappers` pattern — no new path logic needed)
- [ ] `bin/install.js` does NOT duplicate `lib/detect.js` — uses skip-if-exists pattern instead
- [ ] `--cocoindex-setup` without `--for claude` is a no-op with a warning
- [ ] `pg_isready` is the definitive postgres check — not `docker ps`
- [ ] `runner.js` wraps `JSON.parse` in try/catch; surfaces raw stdout in error message
- [ ] `config.js` never throws — `loadConfig()` returns defaults on any error
- [ ] Port finder tries 54320–54329, errors with `docker ps` hint if all in use

### Runtime Behavior (what users must observe)

- [ ] `npx haki-skills --for claude` works identically for users without Python/Docker — CocoIndex step is skipped silently
- [ ] When CocoIndex is missing: `/haki:index` shows clear warning + setup instructions, Haki continues normally
- [ ] When CocoIndex is available: setup completes → `cocoindex update` runs → chunks indexed
- [ ] Vector DB is per-project (unique port per project, isolated containers)
- [ ] All files land in user project `.haki/cocoindex/`, none in Haki source repo
- [ ] Phase 1 delivers only: index + detection + docker setup. No RAG, no graph.
