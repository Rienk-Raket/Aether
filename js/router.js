// Hash-based router: "#/groepen" shows the groups screen.
// We use the part after "#" because GitHub Pages cannot redirect other URLs to index.html.

export function createRouter({ routes, fallback, onChange }) {
  function currentPath() {
    const path = location.hash.slice(1).split('?')[0];
    return path || fallback;
  }

  function resolve() {
    const path = currentPath();
    const render = routes[path];
    if (!render) {
      location.replace(`#${fallback}`);
      return;
    }
    onChange(path, render);
  }

  window.addEventListener('hashchange', resolve);

  return { start: resolve };
}
