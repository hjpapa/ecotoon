// Verify Vercel's static allowlist with Git's ignore-pattern implementation.
// No packages or build step required. Run from any working directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const git = args => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const listed = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
assert.equal(listed.status, 0, listed.stderr || String(listed.error));
const files = [...new Set(listed.stdout.split('\0').filter(Boolean))];
const ignored = spawnSync('git', ['-c', 'core.excludesFile=' + path.join(root, '.vercelignore'),
  'check-ignore', '--no-index', '-z', '--stdin'], {
  cwd: root, encoding: 'utf8', input: files.join('\0') + '\0'
});
assert.ok(ignored.status === 0 || ignored.status === 1, ignored.stderr || String(ignored.error));
const excluded = new Set(ignored.stdout.split('\0').filter(Boolean));
const deployed = new Set(files.filter(file => !excluded.has(file)));
const required = new Set(['index.html', 'vercel.json']);
for (const match of read('index.html').matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (match[1] !== './' && !/^https?:/.test(match[1])) required.add(match[1]);
}
for (const file of [...required].filter(file => file.endsWith('.css'))) {
  for (const match of read(file).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    if (!/^https?:|^data:/.test(match[1])) required.add(match[1]);
  }
}
const stories = vm.runInNewContext(read('catalog.js') + ';STORIES');
for (const story of stories) required.add(story.illustration.src);
for (const file of required) {
  assert.ok(fs.existsSync(path.join(root, file)), 'Missing runtime file: ' + file);
  assert.ok(deployed.has(file), 'Runtime file excluded from deployment: ' + file);
}
for (const file of deployed) assert.ok(required.has(file), 'Unused deployment file: ' + file);
const bytes = list => [...list].reduce((sum, file) => sum + fs.statSync(path.join(root, file)).size, 0);
const mib = value => (value / 1024 / 1024).toFixed(2) + ' MiB';
console.log('Deployment allowlist passed: ' + deployed.size + ' required files, no unused files.');
console.log('Runtime payload: ' + mib(bytes(deployed)) + '; excluded source files: ' + mib(bytes(excluded)) + '.');
