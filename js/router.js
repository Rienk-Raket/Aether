// Hash-based router: "#/groepen/abc" shows the group detail screen with params { id: 'abc' }.
// We use the part after "#" because GitHub Pages cannot redirect other URLs to index.html.

// routes: { '/groepen/:id': render, ... } — render(container, params, query)
export function createRouter({ routes, fallback, onChange }) {
  const compiled = Object.entries(routes).map(([pattern, render]) => ({
    render,
    keys: [...pattern.matchAll(/:(\w+)/g)].map((m) => m[1]),
    regex: new RegExp(`^${pattern.replace(/:(\w+)/g, '([^/]+)')}$`),
  }));

  function resolve() {
    const [rawPath, rawQuery = ''] = location.hash.slice(1).split('?');
    const path = rawPath || fallback;

    for (const route of compiled) {
      const match = path.match(route.regex);
      if (match) {
        const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
        onChange(path, route.render, params, new URLSearchParams(rawQuery));
        return;
      }
    }
    location.replace(`#${fallback}`);
  }

  window.addEventListener('hashchange', resolve);

  return { start: resolve, refresh: resolve };
}

export function navigate(path) {
  location.hash = path;
}
