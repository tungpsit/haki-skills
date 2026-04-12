/**
 * .agent/bin/lib/skill.cjs
 *
 * Skill-related commands for haki-tools.
 * - list:    List all skills with name and description
 * - info:    Show single skill details
 * - invoke:  Print skill SKILL.md content to stdout
 * - registry: Generate .agent/registry.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// __dirname = .agent/bin/lib/
// Resolve skills relative to this file: lib/ → bin/ → .agent/ → skills
const THIS_DIR  = __dirname;                                   // e.g. D:\...\haki-skills\.agent\bin\lib
const UP_TO_BIN = path.resolve(THIS_DIR, '..');               // .agent/bin
const UP_TO_AGENT = path.resolve(UP_TO_BIN, '..');             // .agent
const SKILLS_DIR  = path.join(UP_TO_AGENT, 'skills');
const REGISTRY    = path.join(UP_TO_AGENT, 'registry.json');

// ── Frontmatter parser ────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const raw  = match[1];
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

// ── Load all skills ────────────────────────────────────────────────────

function loadAllSkills() {
  const dirs = fs.readdirSync(SKILLS_DIR).filter(function(f) {
    return fs.statSync(path.join(SKILLS_DIR, f)).isDirectory();
  });

  return dirs.map(function(dir) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    const exists   = fs.existsSync(skillPath);

    // Collect templates and scripts
    const skillDir   = path.join(SKILLS_DIR, dir);
    const templates  = [];
    const scripts    = [];
    try {
      fs.readdirSync(path.join(skillDir, 'templates')).forEach(function(f) {
        templates.push('templates/' + f);
      });
    } catch (e) { /* no templates dir */ }
    try {
      fs.readdirSync(path.join(skillDir, 'scripts')).forEach(function(f) {
        scripts.push('scripts/' + f);
      });
    } catch (e) { /* no scripts dir */ }

    if (!exists) {
      return {
        name:        null,
        description: null,
        path:        dir + '/SKILL.md',
        templates:   templates,
        scripts:     scripts,
        exists:      false,
        raw:         null,
      };
    }

    const content = fs.readFileSync(skillPath, 'utf8');
    const parsed  = parseFrontmatter(content);

    return {
      name:        parsed ? (parsed.attrs.name || dir) : dir,
      description: parsed ? (parsed.attrs.description || '') : '',
      path:        dir + '/SKILL.md',
      templates:   templates,
      scripts:     scripts,
      exists:      true,
      raw:         content,
    };
  });
}

// ── Commands ───────────────────────────────────────────────────────────

function cmdSkillList() {
  const skills = loadAllSkills();

  console.log('\nAvailable skills (' + skills.length + '):\n');
  skills.forEach(function(s) {
    const mark = s.exists ? '' : ' [MISSING SKILL.md]';
    const desc = s.description
      ? ' — ' + s.description.slice(0, 70) + (s.description.length > 70 ? '...' : '')
      : '';
    console.log('  ' + s.name + mark + desc);
  });
  console.log('');
}

function cmdSkillInfo(name) {
  const skills = loadAllSkills();
  const skill  = skills.find(function(s) { return s.name === name; });

  if (!skill) {
    const names = skills.map(function(s) { return s.name; }).join(', ');
    throw new Error('Unknown skill: ' + name + '\nAvailable: ' + names);
  }

  if (!skill.exists) {
    throw new Error('SKILL.md missing for: ' + skill.path);
  }

  console.log('\n=== ' + skill.name + ' ===');
  if (skill.description) console.log(skill.description + '\n');
  console.log('Path:       .agent/skills/' + skill.path);
  if (skill.templates.length) console.log('Templates:  ' + skill.templates.join(', '));
  if (skill.scripts.length)   console.log('Scripts:    ' + skill.scripts.join(', '));
  console.log('');
}

function cmdSkillInvoke(name) {
  const skills = loadAllSkills();
  const skill  = skills.find(function(s) { return s.name === name; });

  if (!skill) {
    const names = skills.map(function(s) { return s.name; }).join(', ');
    throw new Error('Unknown skill: ' + name + '\nAvailable: ' + names);
  }
  if (!skill.exists) {
    throw new Error('SKILL.md missing for: ' + skill.path);
  }

  process.stdout.write(skill.raw);
}

function cmdSkillRegistry() {
  const skills = loadAllSkills();
  const registry = {
    skills:    skills.map(function(s) {
      return {
        name:        s.name || s.path.replace('/SKILL.md', ''),
        description: s.description || '',
        path:        '.agent/skills/' + s.path,
        templates:   s.templates.map(function(t) { return '.agent/skills/' + s.path.replace('/SKILL.md', '/') + t; }),
        scripts:     s.scripts.map(function(t)  { return '.agent/skills/' + s.path.replace('/SKILL.md', '/') + t; }),
      };
    }),
    generated: new Date().toISOString(),
  };

  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2), 'utf8');
  console.log('Generated registry.json (' + registry.skills.length + ' skills)');
}

// ── Routing ────────────────────────────────────────────────────────────

function cmdSkill(subCmd, name) {
  switch (subCmd) {
    case 'list':
    case undefined:
      cmdSkillList();
      break;
    case 'info':
      if (!name) throw new Error('Usage: haki-tools skill info <name>');
      cmdSkillInfo(name);
      break;
    case 'invoke':
      if (!name) throw new Error('Usage: haki-tools skill invoke <name>');
      cmdSkillInvoke(name);
      break;
    case 'registry':
      cmdSkillRegistry();
      break;
    default:
      throw new Error('Usage: haki-tools skill <list|info|invoke|registry> [name]');
  }
}

module.exports = { cmdSkill, cmdSkillList, cmdSkillInfo, cmdSkillInvoke, cmdSkillRegistry };
