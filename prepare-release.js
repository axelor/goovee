const {execSync} = require('child_process');
const {version} = require('./package.json');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, {stdio: 'inherit'});
}

console.log('Validating changelogs...');
run('pnpm changelogs:validate');

console.log('\nGenerating changelog...');
run('pnpm changelogs:generate');

console.log('\nRunning formatter...');
run('pnpm format');

console.log('\nStaging changes...');
run('git add CHANGELOG.md RELEASE_NOTES.md changelogs/unreleased');

console.log(`\nCommitting release: v${version}`);
run(`git commit -m "chore(release): v${version}"`);

console.log(`\nDone. Ready to push — git push origin <branch>`);
