#!/usr/bin/env node

/**
 * Haki Tools — CLI utility for haki workflow operations
 *
 * Lean CLI inspired by gsd-tools.cjs but focused on 4 core concerns:
 * - config: .haki/config.json CRUD
 * - roadmap: ROADMAP.md parsing and status updates
 * - state: Project state detection for /haki:next routing
 * - core: Shared path resolution and utilities
 *
 * Usage:
 *   node haki-tools.cjs <command> [args]
 *
 * Config Operations:
 *   config init [choices-json]         Initialize config.json
 *   config get <key.path>              Get config value
 *   config set <key.path> <value>      Set config value
 *
 * Roadmap Operations:
 *   roadmap analyze                    Full roadmap parse with stats
 *   roadmap next-task                  Find next actionable task
 *   roadmap update-status <id> <status> Update task status
 *
 * State Operations:
 *   state detect                       Full state detection (JSON)
 *   state json                         Compact state for /haki:next
 */

const fs = require("fs");
const path = require("path");
const { findProjectRoot, error, output } = require("./lib/core.cjs");
const {
  cmdConfigInit,
  cmdConfigGet,
  cmdConfigSet,
} = require("./lib/config.cjs");
const {
  cmdRoadmapAnalyze,
  cmdRoadmapNextTask,
  cmdRoadmapUpdateStatus,
} = require("./lib/roadmap.cjs");
const { cmdStateDetect, cmdStateJson } = require("./lib/state.cjs");

function main() {
  const args = process.argv.slice(2);
  const raw = args.includes("--raw");
  const filteredArgs = args.filter((a) => a !== "--raw");

  if (filteredArgs.length === 0) {
    error(
      "Usage: haki-tools <command> [args]\n\nCommands:\n  config init|get|set\n  roadmap analyze|next-task|update-status\n  state detect|json",
    );
  }

  const cwd = findProjectRoot(process.cwd());
  const command = filteredArgs[0];
  const subCommand = filteredArgs[1];
  const restArgs = filteredArgs.slice(2);

  switch (command) {
    // ─── Config ────────────────────────────────────────────────────────
    case "config":
    case "config-init":
    case "config-get":
    case "config-set": {
      const sub = command === "config" ? subCommand : command.split("-")[1];

      switch (sub) {
        case "init":
          cmdConfigInit(cwd, restArgs[0] || filteredArgs[2], raw);
          break;
        case "get":
          cmdConfigGet(cwd, restArgs[0] || filteredArgs[2], raw);
          break;
        case "set":
          cmdConfigSet(
            cwd,
            restArgs[0] || filteredArgs[2],
            restArgs[1] || filteredArgs[3],
            raw,
          );
          break;
        default:
          error("Usage: config <init|get|set> [args]");
      }
      break;
    }

    // ─── Roadmap ──────────────────────────────────────────────────────
    case "roadmap": {
      switch (subCommand) {
        case "analyze":
          cmdRoadmapAnalyze(cwd, raw);
          break;
        case "next-task":
          cmdRoadmapNextTask(cwd, raw);
          break;
        case "update-status":
          cmdRoadmapUpdateStatus(cwd, restArgs[0], restArgs[1], raw);
          break;
        default:
          error("Usage: roadmap <analyze|next-task|update-status> [args]");
      }
      break;
    }

    // ─── State ────────────────────────────────────────────────────────
    case "state": {
      switch (subCommand) {
        case "detect":
          cmdStateDetect(cwd, raw);
          break;
        case "json":
          cmdStateJson(cwd, raw);
          break;
        default:
          error("Usage: state <detect|json>");
      }
      break;
    }

    default:
      error(
        `Unknown command: ${command}\n\nValid commands: config, roadmap, state`,
      );
  }
}

main();
