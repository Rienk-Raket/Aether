// Guards offline support: every app file must be in the service worker's precache list.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const swSource = readFileSync(join(root, 'sw.js'), 'utf8');
const shell = [...swSource.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [relative(root, full).replaceAll('\\', '/')];
  });
}

describe('service worker app shell', () => {
  it('only lists files that exist', () => {
    const missing = shell.filter((path) => !existsSync(join(root, path)));
    expect(missing).toEqual([]);
  });

  it('includes every app file needed offline', () => {
    const appFiles = ['css', 'js', 'assets', 'data', 'vendor', 'partners']
      .filter((dir) => existsSync(join(root, dir)))
      .flatMap((dir) => listFiles(join(root, dir)));
    const notCached = appFiles.filter((path) => !shell.includes(path));
    expect(notCached).toEqual([]);
  });
});
