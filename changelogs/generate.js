const fs = require('fs');
const path = require('path');
const {Command} = require('commander');

const program = new Command();

// Scope labels (internal mapping)
const SCOPE_LABELS = {
  chat: 'Chat',
  directory: 'Directory',
  events: 'Events',
  forum: 'Forum',
  invoices: 'Invoices',
  news: 'News',
  orders: 'Orders',
  quotations: 'Quotations',
  resources: 'Documents',
  shop: 'E-Shop',
  survey: 'Forms',
  ticketing: 'Helpdesk',
  website: 'Content',
  core: 'Core Platform',
  users: 'User Accounts',
};

// Type labels (for top-level changelog sections)
const TYPE_LABELS = {
  feature: 'Features',
  fix: 'Fixes',
  change: 'Changes',
  deprecate: 'Deprecations',
  remove: 'Removals',
  security: 'Security',
};

// CLI options
program
  .option(
    '--keep',
    'Keep changelog JSON files after processing (default: true)',
    true,
  )
  .option('--dry-run', 'Show output only, do not write or delete files')
  .option('--stdout', 'Print changelog to console instead of writing to file')
  .option('--version <version>', 'Override version number from package.json')
  .option('--root <dir>', 'Root project directory', '.')
  .option(
    '--changelog-dir <dir>',
    'Directory containing changelog JSON files',
    'changelogs/unreleased',
  )
  .option(
    '--package <file>',
    'Path to package.json (relative to root)',
    'package.json',
  )
  .option(
    '--output <file>',
    'Output path for CHANGELOG.md (relative to root)',
    'CHANGELOG.md',
  );

program.parse(process.argv);
const opts = program.opts();

// Paths (resolve everything relative to root)
const ROOT = path.resolve(opts.root);
const UNRELEASED_DIR = path.resolve(ROOT, opts.changelogDir);
const PACKAGE_JSON = path.resolve(ROOT, opts.package);
const OUTPUT_FILE = path.resolve(ROOT, opts.output);

function getVersionFromPackage() {
  if (opts.version) return opts.version;

  if (!fs.existsSync(PACKAGE_JSON)) {
    console.error(`❌ package.json not found at ${PACKAGE_JSON}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  return pkg.version || 'Unreleased';
}

function loadChangelogEntries() {
  if (!fs.existsSync(UNRELEASED_DIR)) {
    console.log(`ℹ️ No changelog directory found at '${UNRELEASED_DIR}'`);
    return [];
  }

  const files = fs.readdirSync(UNRELEASED_DIR).filter(f => f.endsWith('.json'));
  const entries = [];

  for (const file of files) {
    const fullPath = path.join(UNRELEASED_DIR, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const json = JSON.parse(content);
      entries.push({...json, file});
    } catch (err) {
      console.error(`❌ Error parsing ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  return entries;
}

function groupByTypeAndScope(entries) {
  const grouped = {};

  for (const entry of entries) {
    const {type, scope = []} = entry;
    if (!grouped[type]) grouped[type] = {};

    scope.forEach(s => {
      if (!grouped[type][s]) grouped[type][s] = [];
      grouped[type][s].push(entry);
    });
  }

  return grouped;
}

function formatGroupedEntries(grouped, version) {
  const date = new Date().toISOString().split('T')[0];
  let markdown = `\n\n# ${version} (${date})\n`;

  for (const type of Object.keys(TYPE_LABELS)) {
    const scopes = grouped[type];
    if (!scopes || Object.keys(scopes).length === 0) continue;

    markdown += `\n\n## ${TYPE_LABELS[type]}\n`;

    const sortedScopes = Object.keys(scopes).sort();

    for (const scopeKey of sortedScopes) {
      const scopeLabel = SCOPE_LABELS[scopeKey] || scopeKey;
      markdown += `\n\n### ${scopeLabel}\n`;

      for (const entry of scopes[scopeKey].sort((a, b) =>
        a.title.localeCompare(b.title),
      )) {
        const id = path.basename(entry.file, '.json');
        markdown += `\n- ${entry.title} – #${id}`;

        if (entry.description) {
          const escaped = entry.description
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          markdown += `  \n  <details>\n    <summary>Details</summary>\n\n    ${escaped}\n  </details>`;
        }
      }
    }
  }

  return markdown.trim() + '\n';
}

function appendToChangelog(content) {
  if (opts.stdout || opts.dryRun) {
    console.log('\n--- CHANGELOG OUTPUT START ---\n');
    console.log(content);
    console.log('\n--- CHANGELOG OUTPUT END ---\n');
    return;
  }

  let existing = '';
  if (fs.existsSync(OUTPUT_FILE)) {
    existing = fs.readFileSync(OUTPUT_FILE, 'utf-8').trim();
  }

  const final = content + '\n\n' + existing;
  fs.writeFileSync(OUTPUT_FILE, final.trim() + '\n', 'utf-8');
  console.log(`✅ Changelog written to ${OUTPUT_FILE}`);
}

function deleteProcessedFiles(entries) {
  if (opts.keep || opts.dryRun) {
    console.log(
      `📝 Skipping deletion of JSON files (${opts.dryRun ? 'dry-run' : '--keep'})`,
    );
    return;
  }

  for (const {file} of entries) {
    const filePath = path.join(UNRELEASED_DIR, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    } catch (err) {
      console.warn(`⚠️  Could not delete ${file}: ${err.message}`);
    }
  }
}

function main() {
  const entries = loadChangelogEntries();
  if (entries.length === 0) {
    console.log('ℹ️ No changelog entries to process.');
    return;
  }

  const version = getVersionFromPackage();
  const grouped = groupByTypeAndScope(entries);
  const markdown = formatGroupedEntries(grouped, version);

  appendToChangelog(markdown);
  deleteProcessedFiles(entries);
}

main();
