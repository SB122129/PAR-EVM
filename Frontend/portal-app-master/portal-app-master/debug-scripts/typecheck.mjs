import { spawnSync } from 'node:child_process';

const result = spawnSync('tsc', ['--noEmit'], {
  shell: true,
  encoding: 'utf8',
});

const combined = `${result.stdout || ''}${result.stderr || ''}`;
const filtered = combined
  .split(/\r?\n/)
  .filter(line => line.includes('error TS') && !line.includes('node_modules'))
  .join('\n')
  .trim();

if (filtered.length > 0) {
  console.error(filtered);
  process.exit(1);
}

process.exit(0);
