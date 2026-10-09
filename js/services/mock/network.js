// Helpers that make the fictional services feel like real online services.

// Waits like a network round trip would (200–600 ms by default).
export function simulateLatency(min = 200, max = 600) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

// Loads a bundled text file (for example the example guide in data/).
export async function loadBundledText(path) {
  const response = await fetch(new URL(`../../../${path}`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

// Loads a bundled JSON file once and keeps it in memory.
const jsonCache = new Map();

export function loadBundledJson(path) {
  if (!jsonCache.has(path)) {
    const url = new URL(`../../../${path}`, import.meta.url);
    jsonCache.set(
      path,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(path);
}
