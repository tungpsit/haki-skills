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

// ─── Template: docker-compose.yml ───────────────────────────────────────────────

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

// ─── Template: .env ─────────────────────────────────────────────────────────────

const TEMPLATE_ENV = (port, slug, model, projectRoot) => `PROJECT_SLUG=${slug}
COCOINDEX_DATABASE_URL=postgresql://cocoindex:cocoindex@localhost:${port}/cocoindex
HAKI_EMBEDDING_MODEL=${model}
HAKI_PROJECT_ROOT=${projectRoot}
`;

// ─── Template: cli/index.js ───────────────────────────────────────────────────

const TEMPLATE_CLI_INDEX = `#!/usr/bin/env node

/**
 * .haki/cocoindex/cli/index.js
 * CLI entry point for haki:index
 *
 * Usage:
 *   node .haki/cocoindex/cli/index.js            # full re-index
 *   node .haki/cocoindex/cli/index.js --check    # detect availability
 *   node .haki/cocoindex/cli/index.js --status   # show index stats
 *   node .haki/cocoindex/cli/index.js --setup    # interactive setup
 *   node .haki/cocoindex/cli/index.js --diff     # incremental index
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
            "cocoindex succeeded but output is not JSON.\\n" +
            "stdout (first 500 chars): " + snippet + "\\n" +
            "stderr: " + stderr
          ));
        }
      } else {
        reject(new Error(stderr || "cocoindex exited with code " + code));
      }
    });
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ status: "error", error: err.message }, null, 2));
  process.exit(1);
});
`;

// ─── Template: lib/detect.js ───────────────────────────────────────────────────

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

// ─── Template: lib/config.js ───────────────────────────────────────────────────

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

// ─── Template: flows/codebase-index.py ─────────────────────────────────────────

const TEMPLATE_FLOW = (model) => `import cocoindex
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
`;

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
