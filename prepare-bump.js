const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, {stdio: 'inherit'});
}

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const bump = process.argv[2];
const [major, minor, patch] = pkg.version.split('.').map(Number);

let nextVersion;

if (bump === 'major') {
  nextVersion = `${major + 1}.0.0`;
} else if (bump === 'minor') {
  nextVersion = `${major}.${minor + 1}.0`;
} else if (bump === 'patch') {
  nextVersion = `${major}.${minor}.${patch + 1}`;
} else {
  console.error(`Usage: node prepare-bump.js <major|minor|patch>`);
  process.exit(1);
}

console.log(`Version: ${pkg.version} → ${nextVersion}`);

pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('\nStaging changes...');
run('git add package.json');

console.log(`\nCommitting version bump: ${nextVersion}`);
run(`git commit -m "chore(release): bump version to ${nextVersion}"`);

console.log(`\nDone. Ready to push — git push origin <branch>`);
