/**
 * Config — .haki/config.json CRUD operations
 */

const fs = require("fs");
const path = require("path");
const { output, error, hakiPaths, ensureDir } = require("./core.cjs");

const DEFAULT_CONFIG = {
  project: {
    name: "",
    created: "",
  },
  ui_design_skill: "ui-ux-pro-max",
  ui_design_variant: null,
  workflow: {
    auto_research: true,
    auto_commit: true,
    tdd_first: true,
    plan_review_loops: 3,
    parallelization: true,
  },
};

/**
 * Build a config for a new project, merging defaults with user choices.
 */
function buildNewProjectConfig(userChoices = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...userChoices,
    project: {
      ...DEFAULT_CONFIG.project,
      ...(userChoices.project || {}),
      created: userChoices.project?.created || new Date().toISOString(),
    },
    workflow: {
      ...DEFAULT_CONFIG.workflow,
      ...(userChoices.workflow || {}),
    },
  };
}

/**
 * Initialize config.json for a new project.
 * Idempotent: returns existing if already present.
 */
function cmdConfigInit(cwd, choicesJson, raw) {
  const paths = hakiPaths(cwd);
  const configPath = paths.config;

  if (fs.existsSync(configPath)) {
    output({ created: false, reason: "already_exists" }, raw, "exists");
    return;
  }

  let userChoices = {};
  if (choicesJson && choicesJson.trim() !== "") {
    try {
      userChoices = JSON.parse(choicesJson);
    } catch (err) {
      error("Invalid JSON for config init: " + err.message);
    }
  }

  ensureDir(paths.haki);
  const config = buildNewProjectConfig(userChoices);

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    output({ created: true, path: ".haki/config.json" }, raw, "created");
  } catch (err) {
    error("Failed to write config.json: " + err.message);
  }
}

/**
 * Get a config value using dot-notation path.
 */
function cmdConfigGet(cwd, keyPath, raw) {
  const configPath = hakiPaths(cwd).config;

  if (!keyPath) error("Usage: config get <key.path>");

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } else {
      error("No config.json found");
    }
  } catch (err) {
    if (err.message.startsWith("No config")) throw err;
    error("Failed to read config.json: " + err.message);
  }

  const keys = keyPath.split(".");
  let current = config;
  for (const key of keys) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== "object"
    ) {
      error("Key not found: " + keyPath);
    }
    current = current[key];
  }

  if (current === undefined) error("Key not found: " + keyPath);
  output(current, raw, String(current));
}

/**
 * Set a config value using dot-notation path.
 */
function cmdConfigSet(cwd, keyPath, value, raw) {
  if (!keyPath) error("Usage: config set <key.path> <value>");

  const configPath = hakiPaths(cwd).config;

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (err) {
    error("Failed to read config.json: " + err.message);
  }

  // Parse value
  let parsedValue = value;
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;
  else if (value === "null") parsedValue = null;
  else if (!isNaN(value) && value !== "") parsedValue = Number(value);

  // Set nested value
  const keys = keyPath.split(".");
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (
      current[keys[i]] === undefined ||
      typeof current[keys[i]] !== "object"
    ) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = parsedValue;

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    output(
      { updated: true, key: keyPath, value: parsedValue },
      raw,
      `${keyPath}=${parsedValue}`,
    );
  } catch (err) {
    error("Failed to write config.json: " + err.message);
  }
}

module.exports = {
  DEFAULT_CONFIG,
  buildNewProjectConfig,
  cmdConfigInit,
  cmdConfigGet,
  cmdConfigSet,
};
