// Copies browser builds of runtime dependencies from node_modules into /vendor,
// so the app loads them locally (offline) without a bundler. Run: npm run vendor
import { copyFileSync, mkdirSync } from 'node:fs';

const files = [
  ['node_modules/idb/build/index.js', 'vendor/idb.js'],
  ['node_modules/qrcode-generator/dist/qrcode.mjs', 'vendor/qrcode.js'],
  // Three.js is split in two files that import each other; keep both names as they are.
  ['node_modules/three/build/three.module.js', 'vendor/three.module.js'],
  ['node_modules/three/build/three.core.js', 'vendor/three.core.js'],
];

mkdirSync('vendor', { recursive: true });
for (const [from, to] of files) {
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
}
