import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { root } from '../src/support/config.js';
import path from 'node:path';
async function check(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) await check(full);
    else if (item.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', full], { stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exitCode = 1;
    }
  }
}
for (const directory of ['src', 'scripts', 'tests']) await check(path.join(root, directory));
