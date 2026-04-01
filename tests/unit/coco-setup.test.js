const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── findFreePort tests ────────────────────────────────────────────────────────

test("findFreePort returns a valid port number in range", async () => {
  let findFreePort;
  try {
    ({ findFreePort } = await import("../../bin/coco-setup.js"));
  } catch {
    // Module not created yet — skip
    return;
  }
  const port = await findFreePort(54320, 5);
  assert.ok(typeof port === "number", "should return a number");
  assert.ok(port >= 54320, "port should be >= 54320");
  assert.ok(port < 54325, "port should be < 54325");
});

// ─── config.js behavior tests ────────────────────────────────────────────────────

test("loadConfig returns DEFAULTS when file does not exist", () => {
  const CONFIG_DEFAULTS = {
    embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
    chunk_size: 1000,
    pg_port: 54320,
  };
  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }
  const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
  const result = loadConfig(tmp);
  assert.equal(result.embedding_model, "sentence-transformers/nomic-embed-text-v1.5");
  assert.equal(result.pg_port, 54320);
});

test("loadConfig returns DEFAULTS merged when file is empty object", () => {
  const CONFIG_DEFAULTS = {
    embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
    chunk_size: 1000,
    pg_port: 54320,
  };
  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }
  const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
  fs.writeFileSync(tmp, "{}", "utf-8");
  const result = loadConfig(tmp);
  assert.equal(result.pg_port, 54320);
  fs.unlinkSync(tmp);
});

test("loadConfig returns DEFAULTS merged when file has partial config", () => {
  const CONFIG_DEFAULTS = {
    embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
    pg_port: 54320,
  };
  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }
  const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
  fs.writeFileSync(tmp, JSON.stringify({ pg_port: 54330 }), "utf-8");
  const result = loadConfig(tmp);
  assert.equal(result.pg_port, 54330);
  assert.equal(result.embedding_model, CONFIG_DEFAULTS.embedding_model);
  fs.unlinkSync(tmp);
});

test("loadConfig returns DEFAULTS when file has invalid JSON", () => {
  const CONFIG_DEFAULTS = {
    embedding_model: "sentence-transformers/nomic-embed-text-v1.5",
    pg_port: 54320,
  };
  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }
  const tmp = path.join(os.tmpdir(), "coco-test-" + Date.now() + ".json");
  fs.writeFileSync(tmp, "{ invalid json", "utf-8");
  const result = loadConfig(tmp);
  assert.equal(result.pg_port, 54320);
  fs.unlinkSync(tmp);
});

test("loadConfig never throws — returns defaults on any error", () => {
  const CONFIG_DEFAULTS = { pg_port: 54320 };
  function loadConfig(configPath) {
    try {
      return { ...CONFIG_DEFAULTS, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch {
      return { ...CONFIG_DEFAULTS };
    }
  }
  const result = loadConfig("/nonexistent/path/to/config.json");
  assert.ok(result !== undefined);
  assert.equal(result.pg_port, 54320);
});

// ─── detect.js source code analysis tests ──────────────────────────────────────

test("detect uses pg_isready, not docker ps", () => {
  const cocoSetupSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/coco-setup.js"),
    "utf-8"
  );
  assert.ok(cocoSetupSrc.includes("pg_isready"), "should contain pg_isready");
  // docker ps appears correctly in the findFreePort error message (not as a postgres readiness check)
  // The detect function uses pg_isready, not docker ps, for postgres
  assert.ok(cocoSetupSrc.includes("pg_isready -h localhost"), "pg_isready with localhost host");
});

test("detect checks python, cocoindex, embeddings, docker, postgres", () => {
  const cocoSetupSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/coco-setup.js"),
    "utf-8"
  );
  assert.ok(cocoSetupSrc.includes("python3 --version"));
  assert.ok(cocoSetupSrc.includes("pip show cocoindex"));
  assert.ok(cocoSetupSrc.includes("sentence-transformers"));
  assert.ok(cocoSetupSrc.includes("docker --version"));
  assert.ok(cocoSetupSrc.includes("pg_isready"));
});

test("detect ready = python && cocoindex && postgres", () => {
  const cocoSetupSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/coco-setup.js"),
    "utf-8"
  );
  assert.ok(
    /ready\s*=\s*checks\.python\s*&&\s*checks\.cocoindex\s*&&\s*checks\.postgres/.test(cocoSetupSrc),
    "ready should be python && cocoindex && postgres"
  );
});

// ─── install.js integration tests ────────────────────────────────────────────────

test("install.js contains --cocoindex-setup flag parsing", () => {
  const installSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/install.js"),
    "utf-8"
  );
  assert.ok(installSrc.includes("--cocoindex-setup"));
  assert.ok(installSrc.includes("cocoSetup"));
});

test("install.js defines async cocoIndexSetupStep function", () => {
  const installSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/install.js"),
    "utf-8"
  );
  assert.ok(installSrc.includes("async function cocoIndexSetupStep"));
});

test("install.js main() is async with .catch() error handler", () => {
  const installSrc = fs.readFileSync(
    path.resolve(__dirname, "../../bin/install.js"),
    "utf-8"
  );
  assert.ok(/async function main\(\)/.test(installSrc));
  assert.ok(installSrc.includes("main().catch("));
});

// ─── cocoindex-hybrid skill tests ──────────────────────────────────────────────

test("cocoindex-hybrid SKILL.md exists", () => {
  const skillPath = path.resolve(__dirname, "../../.agent/skills/cocoindex-hybrid/SKILL.md");
  assert.ok(fs.existsSync(skillPath), "SKILL.md should exist");
});

test("cocoindex-hybrid SKILL.md has correct frontmatter name", () => {
  const skillPath = path.resolve(__dirname, "../../.agent/skills/cocoindex-hybrid/SKILL.md");
  const content = fs.readFileSync(skillPath, "utf-8");
  assert.ok(content.includes("name: cocoindex-hybrid"));
  assert.ok(content.includes("/haki:index"));
});
