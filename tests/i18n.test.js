// Guards the Dutch strings: every `t.group.key` used in the code must exist in js/i18n.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { t } from '../js/i18n/nl.js';

const jsRoot = join(import.meta.dirname, '..', 'js');

function listJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'i18n' ? [] : listJs(full);
    return full.endsWith('.js') ? [full] : [];
  });
}

describe('Dutch strings', () => {
  it('has every text that the code asks for', () => {
    const missing = [];
    for (const file of listJs(jsRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\bt\.([a-zA-Z]+)\.([a-zA-Z0-9_]+)/g)) {
        const [, group, key] = match;
        if (t[group]?.[key] === undefined) missing.push(`${relative(jsRoot, file)}: t.${group}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has no empty texts', () => {
    const empty = [];
    const walk = (value, path) => {
      if (typeof value === 'string' && value.trim() === '') empty.push(path);
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`));
    };
    walk(t, 't');
    expect(empty).toEqual([]);
  });
});
