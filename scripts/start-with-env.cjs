/**
 * Cross-platform env + expo start (Windows-friendly; no cross-env needed).
 * Usage: node scripts/start-with-env.cjs STORYBOOK_ENABLED=1 -- --go --clear
 */
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const envAssignments = [];
const expoArgs = [];
let seenSeparator = false;

for (const arg of args) {
  if (arg === '--') {
    seenSeparator = true;
    continue;
  }
  if (!seenSeparator && /^[A-Z_][A-Z0-9_]*=/.test(arg)) {
    envAssignments.push(arg);
  } else {
    expoArgs.push(arg);
  }
}

const env = { ...process.env };
for (const assignment of envAssignments) {
  const eq = assignment.indexOf('=');
  env[assignment.slice(0, eq)] = assignment.slice(eq + 1);
}

const child = spawn('npx', ['expo', 'start', ...expoArgs], {
  stdio: 'inherit',
  shell: true,
  env,
  cwd: require('path').resolve(__dirname, '..'),
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
