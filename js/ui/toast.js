// Small notification at the bottom of the screen, optionally with one action button.

let current = null;

export function showToast(message, { actionLabel, onAction, duration = 3500 } = {}) {
  current?.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  el.append(text);

  if (actionLabel) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      el.remove();
      onAction?.();
    });
    el.append(btn);
  }

  document.body.append(el);
  current = el;

  // Toasts with an action stay until the user responds.
  if (!actionLabel) {
    setTimeout(() => el.remove(), duration);
  }
}
