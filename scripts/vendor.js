// Copies browser builds of runtime dependencies from node_modules into /vendor,
// so the app loads them locally (offline) without a bundler. Run: npm run vendor
import { copyFileSync, mkdirSync } from 'node:fs';

const files = [['node_modules/idb/build/index.js', 'vendor/idb.js']];

mkdirSync('vendor', { recursive: true });
for (const [from, to] of files) {
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
}
