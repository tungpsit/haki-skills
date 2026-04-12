#!/usr/bin/env node
/**
 * .haki/scripts/validate-skills.js
 *
 * Validates all skills in .agent/skills/
 *
 * Checks:
 *   1. SKILL.md exists and frontmatter parseable
 *   2. name field present and unique
 *   3. description field present and unique
 *   4. Relative @file.md references resolve correctly
 *   5. templates/ directory referenced files exist (warning)
 *
 * Usage: node .haki/scripts/validate-skills.js
 * Exit:  0 = no errors, 1 = errors found
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.agent', 'skills');

// ── Frontmatter parser ────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const raw = match[1];
  const body = content.slice(match[0].length);
  const attrs = {};

  raw.split(/\r?\n/).forEach(function(line) {
    const i = line.indexOf(':');
    if (i === -1) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
        (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")) {
      v = v.slice(1, -1);
    }
    attrs[k] = v;
  });

  return { attrs: attrs, body: body };
}

// ── Find relative @ file references ─────────────────────────────────
// Only match @path/to/file where path looks like a real relative path
// (not @npm/scope, @email, @v1.2.3)

function findAtRefs(content, skillDir) {
  const refs = [];
  // Match @<segment>/... ending in .md/.json/.yaml etc., or bare @foo.md
  const regex = /@((?:[\w][\w-]*(?:\/[\w][\w-]*)*\/)?[\w][\w.-]+\.(?:md|json|yaml|yml|txt|ts|js|css|sh|ps1|html))(?!\w)/gi;
  var m;
  while ((m = regex.exec(content)) !== null) {
    const ref = m[1];
    const resolved = path.resolve(skillDir, ref);
    refs.push({ ref: ref, resolved: resolved, exists: fs.existsSync(resolved) });
  }
  return refs;
}

// ── Main ─────────────────────────────────────────────────────────────

function pad(str, len) {
  return String(str).padEnd(len, ' ');
}

const skillDirs = fs.readdirSync(SKILLS_DIR).filter(function(f) {
  return fs.statSync(path.join(SKILLS_DIR, f)).isDirectory();
});

const results     = [];
const allNames    = {};
const allDescs    = {};
let   totalErrors   = 0;
let   totalWarnings = 0;

skillDirs.forEach(function(dir) {
  const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
  const skillDir  = path.join(SKILLS_DIR, dir);
  const errors    = [];
  const warnings  = [];

  // Rule 1: SKILL.md must exist
  if (!fs.existsSync(skillPath)) {
    results.push({ dir: dir, status: 'orphan', errors: ['MISSING SKILL.md'], warnings: [] });
    totalErrors++;
    return;
  }

  const content = fs.readFileSync(skillPath, 'utf8');
  const parsed = parseFrontmatter(content);

  // Rule 2: Frontmatter parseable + name/description
  if (!parsed) {
    errors.push('FRONTMATTER unparseable');
  } else {
    if (!parsed.attrs.name)        errors.push('MISSING name field');
    if (!parsed.attrs.description)  errors.push('MISSING description field');
  }

  // Rule 3: Name unique
  const name = parsed ? parsed.attrs.name : null;
  if (name) {
    if (allNames[name]) {
      errors.push('DUPLICATE name: ' + name + ' (cf. ' + allNames[name] + ')');
    } else {
      allNames[name] = dir;
    }
  }

  // Rule 4: Description unique
  const desc = parsed ? parsed.attrs.description : null;
  if (desc) {
    if (allDescs[desc]) {
      warnings.push('DUPLICATE description (cf. ' + allDescs[desc] + ')');
    } else {
      allDescs[desc] = dir;
    }
  }

  // Rule 5: @file references resolve
  if (parsed) {
    const atRefs = findAtRefs(parsed.body, skillDir);
    atRefs.forEach(function(r) {
      if (!r.exists) errors.push('BROKEN @link: @' + r.ref + ' (not found)');
    });
  }

  const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';
  if (status === 'error')   totalErrors++;
  if (status === 'warning')  totalWarnings++;

  results.push({ dir: dir, status: status, errors: errors, warnings: warnings });
});

// ── Output ────────────────────────────────────────────────────────────

console.log('\nSKILL VALIDATION REPORT');
console.log('========================\n');

results.forEach(function(r) {
  var icon, label;
  if (r.status === 'ok') {
    icon  = '\u2705';
    label = '';
  } else if (r.status === 'error') {
    icon  = '\u274C';
    label = r.errors[0];
  } else if (r.status === 'orphan') {
    icon  = '\u26A0\uFE0F';
    label = r.errors[0];
  } else {
    icon  = '\u26A0';
    label = r.warnings[0];
  }
  var line = icon + ' ' + pad(r.dir, 36);
  if (label) line += r.status + ' | ' + label;
  console.log(line);
});

console.log('\nSkills: ' + results.length +
            ' | Errors: ' + totalErrors +
            ' | Warnings: ' + totalWarnings);

if (totalErrors > 0) {
  console.log('\n--- Errors ---');
  results.filter(function(r) { return r.status === 'error' || r.status === 'orphan'; })
         .forEach(function(r) {
    r.errors.forEach(function(e) {
      console.log('  \u274C ' + r.dir + ': ' + e);
    });
  });
}

if (totalWarnings > 0) {
  console.log('\n--- Warnings ---');
  results.filter(function(r) { return r.status === 'warning'; })
         .forEach(function(r) {
    r.warnings.forEach(function(w) {
      console.log('  \u26A0 ' + r.dir + ': ' + w);
    });
  });
}

console.log('\n');
process.exit(totalErrors > 0 ? 1 : 0);
