#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────────────
const PKG = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);
const VERSION = PKG.version;
const NAME = PKG.name;
const SCHEMA_DIR = 'openspec/schemas/graphify-augmented';

// ── Helpers ─────────────────────────────────────────────────────────────────

function color(code, s) {
  // Skip color if piped or NO_COLOR
  if (!process.stdout.isTTY || process.env.NO_COLOR) return s;
  return `\x1b[${code}m${s}\x1b[0m`;
}
const green  = s => color('32', s);
const red    = s => color('31', s);
const yellow = s => color('33', s);
const dim    = s => color('90', s);
const bold   = s => color('1', s);

function which(name) {
  // `which` on Unix, `where` on Windows
  const cmd = os.platform() === 'win32' ? 'where' : 'which';
  try {
    const out = execSync(`${cmd} ${name}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return out.split('\n')[0]; // first match
  } catch {
    return null;
  }
}

function execVersion(name, args = ['--version']) {
  try {
    return execSync(`${name} ${args.join(' ')}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function resolveTarget(targetPath) {
  return targetPath ? path.resolve(targetPath) : process.cwd();
}

// ── Check logic ─────────────────────────────────────────────────────────────

function checkRuntime() {
  const v = process.versions.node;
  const major = parseInt(v.split('.')[0], 10);
  const ok = major >= 16;
  return { name: 'Node.js', version: `v${v}`, ok };
}

function checkTool(name) {
  const loc = which(name);
  if (!loc) return { name, ok: false, version: null, path: null };
  let version = null;
  try {
    version = execVersion(name);
  } catch { /* ignore */ }
  return { name, ok: true, version: version || '?', path: loc };
}

function checkProject(targetPath) {
  const results = [];

  // config.yaml
  const configPath = path.join(targetPath, 'openspec', 'config.yaml');
  const hasConfig = fs.existsSync(configPath);
  results.push({
    label: 'openspec/config.yaml',
    ok: hasConfig,
    detail: hasConfig ? 'exists' : 'missing — run openspec init'
  });

  // Schema installed
  const schemaPath = path.join(targetPath, 'openspec', 'schemas', 'graphify-augmented', 'schema.yaml');
  const hasSchema = fs.existsSync(schemaPath);
  const templatesDir = path.join(targetPath, 'openspec', 'schemas', 'graphify-augmented', 'templates');
  const templateCount = fs.existsSync(templatesDir)
    ? fs.readdirSync(templatesDir).filter(f => f.endsWith('.md')).length
    : 0;
  results.push({
    label: `openspec/schemas/graphify-augmented/`,
    ok: hasSchema && templateCount === 5,
    detail: hasSchema
      ? `schema.yaml + ${templateCount} templates`
      : 'schema not installed'
  });

  // graphify-out/graph.json
  const graphPath = path.join(targetPath, 'graphify-out', 'graph.json');
  const hasGraph = fs.existsSync(graphPath);
  let graphDetail = 'not found — run /graphify .';
  if (hasGraph) {
    try {
      const g = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
      const nodes = g.nodes ? g.nodes.length : '?';
      const edges = g.links ? g.links.length : '?';
      graphDetail = `${nodes} nodes, ${edges} edges`;
    } catch {
      graphDetail = 'exists (parse error)';
    }
  }
  results.push({
    label: 'graphify-out/graph.json',
    ok: hasGraph,
    detail: graphDetail
  });

  return results;
}

// ── Commands ────────────────────────────────────────────────────────────────

function cmdCheck(argv) {
  const target = resolveTarget(argv[0]);

  console.log('');
  console.log(bold(`${NAME} v${VERSION} — check`));
  console.log('');

  // Runtime
  const rt = checkRuntime();
  console.log(`  ${bold('Runtime')}`);
  console.log(`    ${rt.ok ? green('✓') : red('✗')} ${rt.name} ${dim(rt.version)}`);
  console.log('');

  // Dependencies
  console.log(`  ${bold('Dependencies')}`);
  const deps = ['openspec', 'graphify'].map(checkTool);
  for (const d of deps) {
    const icon = d.ok ? green('✓') : red('✗');
    const hint = d.ok ? dim(d.path) : dim(`install: ${d.name === 'graphify' ? 'pipx install graphifyy' : 'npm install -g @fission-ai/openspec'}`);
    console.log(`    ${icon} ${d.name} ${d.version ? dim(d.version) : ''}  ${hint}`);
  }
  console.log('');

  // Project
  const projectExists = fs.existsSync(path.join(target, 'openspec'));
  if (projectExists) {
    console.log(`  ${bold('Project')} ${dim(target)}`);
    const checks = checkProject(target);
    for (const c of checks) {
      const icon = c.ok ? green('✓') : red('✗');
      console.log(`    ${icon} ${c.label} ${dim(c.detail)}`);
    }
  } else {
    console.log(`  ${yellow('⚠')} ${bold('Project')} ${dim(target)}`);
    console.log(`    ${dim('not an OpenSpec project — run openspec init')}`);
  }

  // Summary
  const allOk = rt.ok && deps.every(d => d.ok) && projectExists && checkProject(target).every(c => c.ok);
  console.log('');
  console.log(allOk ? green('Status: Ready') : yellow('Status: Needs attention'));
  console.log('');
  process.exit(allOk ? 0 : 1);
}

function cmdInstall(argv) {
  const target = resolveTarget(argv[0]);
  const withConfig = argv.includes('--with-config');

  console.log('');
  console.log(bold(`${NAME} v${VERSION} — install`));
  console.log(`  ${dim('Target: ' + target)}`);
  console.log('');

  // Source schema directory (within this package)
  const srcSchema = path.join(__dirname, '..', SCHEMA_DIR);
  const dstSchema = path.join(target, 'openspec', 'schemas', 'graphify-augmented');

  if (!fs.existsSync(srcSchema)) {
    console.log(`  ${red('✗')} Schema source not found: ${srcSchema}`);
    console.log('');
    process.exit(1);
  }

  // Create target directory
  fs.mkdirSync(dstSchema, { recursive: true });
  fs.mkdirSync(path.join(dstSchema, 'templates'), { recursive: true });

  // Copy schema.yaml
  try {
    fs.copyFileSync(
      path.join(srcSchema, 'schema.yaml'),
      path.join(dstSchema, 'schema.yaml')
    );
  } catch (e) {
    console.log(`  ${red('✗')} Failed to copy schema.yaml: ${e.message}`);
    process.exit(1);
  }

  // Copy templates
  const srcTemplates = path.join(srcSchema, 'templates');
  const dstTemplates = path.join(dstSchema, 'templates');
  const templates = fs.readdirSync(srcTemplates).filter(f => f.endsWith('.md'));
  let copied = 1; // schema.yaml
  for (const t of templates) {
    try {
      fs.copyFileSync(path.join(srcTemplates, t), path.join(dstTemplates, t));
      copied++;
    } catch (e) {
      console.log(`  ${yellow('⚠')} Failed to copy ${t}: ${e.message}`);
    }
  }

  console.log(`  ${green('✓')} Schema files copied (${copied} files)`);
  console.log(`    ${dim(dstSchema)}`);
  console.log('');

  // --with-config
  if (withConfig) {
    const configPath = path.join(target, 'openspec', 'config.yaml');

    // Backup existing
    if (fs.existsSync(configPath)) {
      const bak = configPath + '.bak';
      try {
        fs.copyFileSync(configPath, bak);
        console.log(`  ${green('✓')} Backup: config.yaml → config.yaml.bak`);
      } catch (e) {
        console.log(`  ${yellow('⚠')} Backup failed: ${e.message}`);
      }
    }

    const contextBlock = `context: |
  This project uses graphify knowledge graph for codebase awareness.
  Graph file: graphify-out/graph.json
  GRAPH_REPORT.md: graphify-out/GRAPH_REPORT.md
  Interactive viz: graphify-out/graph.html

  Commands:
    graphify query "<question>"  - BFS traversal, broad context
    graphify path "<A>" "<B>"    - shortest path between concepts
    graphify explain "<node>"    - deep-dive on a node

rules:
  proposal:
    - Run \`graphify query "<domain>"\` BEFORE writing proposal
    - Include Graph Context section with god nodes and communities
  explore:
    - Run ALL three: graphify query, graphify path, graphify explain
    - Document confidence tags for each edge
  specs:
    - Reference exploration.md findings when defining requirements
  design:
    - Run \`graphify path\` to verify architectural connections
  tasks:
    - Annotate tasks with graph nodes: [Node: NodeName]
`;

    // Check if config exists and has schema line
    const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
    const hasSchemaLine = configContent.includes('schema:');

    let newConfig = '';
    if (hasSchemaLine) {
      // Replace schema line, append context
      newConfig = configContent.replace(/^schema:.*$/m, 'schema: graphify-augmented');
      // Append context if not already there
      if (!configContent.includes('graphify knowledge graph')) {
        newConfig += '\n' + contextBlock;
      }
    } else {
      newConfig = 'schema: graphify-augmented\n\n' + contextBlock;
    }

    try {
      fs.writeFileSync(configPath, newConfig, 'utf8');
      console.log(`  ${green('✓')} config.yaml updated (schema: graphify-augmented + context + rules)`);
    } catch (e) {
      console.log(`  ${red('✗')} Failed to update config.yaml: ${e.message}`);
    }
    console.log('');
  }

  // Summary
  console.log(`  ${green('✓')} Install complete`);
  console.log('');
  console.log(`  ${bold('Next steps:')}`);
  console.log(`    openspec schema validate graphify-augmented`);
  console.log(`    openspec new change <name> --schema graphify-augmented`);
  console.log('');
}

function cmdValidate() {
  console.log('');
  console.log(bold(`${NAME} v${VERSION} — validate`));
  console.log('');

  const openspecPath = which('openspec');
  if (!openspecPath) {
    console.log(`  ${red('✗')} OpenSpec CLI not found`);
    console.log(`  ${dim('Install: npm install -g @fission-ai/openspec')}`);
    console.log('');
    process.exit(1);
  }

  try {
    const out = execSync('openspec schema validate graphify-augmented', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(out.trim());
    console.log('');
    console.log(`  ${green('✓')} Schema is valid`);
    console.log('');
  } catch (e) {
    console.log(`  ${red('✗')} Validation failed:`);
    console.log(`  ${dim(e.stderr ? e.stderr.trim() : e.message)}`);
    console.log('');
    process.exit(1);
  }
}

function cmdHelp() {
  console.log(`
${bold(NAME)} v${VERSION}

Bridge between OpenSpec and Graphify — codebase-aware OpenSpec workflow.

${bold('Usage:')}
  ${dim('graphify-openspec-bridge')} ${green('<command>')} ${yellow('[options]')}
  ${dim('gob')} ${green('<command>')} ${yellow('[options]')}

${bold('Commands:')}
  ${green('check')}    ${yellow('[path]')}         Check runtime, deps, and project state
  ${green('install')}  ${yellow('[path]')} ${yellow('[--with-config]')}  Install schema to project
  ${green('validate')}                Validate schema installation
  ${green('version')}                 Show version
  ${green('help')}                    Show this help

${bold('Examples:')}
  ${dim('# Check current project')}
  gob check

  ${dim('# Check specific project')}
  gob check ~/my-project

  ${dim('# Install schema')}
  gob install ~/my-project

  ${dim('# Install with config update')}
  gob install ~/my-project --with-config

  ${dim('# Validate schema')}
  gob validate

${bold('Docs:')} https://github.com/klc/graphify-openspec-bridge
`);
}

function cmdVersion() {
  console.log(`${NAME} v${VERSION}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0] || 'help';

switch (cmd) {
  case 'check':
    cmdCheck(args.slice(1));
    break;
  case 'install':
    cmdInstall(args.slice(1));
    break;
  case 'validate':
    cmdValidate();
    break;
  case 'version':
  case '--version':
  case '-v':
    cmdVersion();
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    cmdHelp();
    break;
}
