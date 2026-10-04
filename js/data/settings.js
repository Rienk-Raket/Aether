// App settings that belong to this device (not to a person). Stored in localStorage.

const KEY = 'aether.settings';

export const DEFAULT_SETTINGS = {
  showCo2: true, // show the CO₂ comparison in results
  reduceMotion: false, // switch off animations
  simulateOffline: false, // demo: pretend there is no internet
};

export function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSetting(name, value) {
  const settings = { ...getSettings(), [name]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage full or blocked: the setting simply is not remembered
  }
  applySettings();
  document.dispatchEvent(new CustomEvent('aether:settings', { detail: { name, value } }));
  return settings;
}

// Applies settings that change how the whole page looks.
export function applySettings() {
  document.documentElement.classList.toggle('reduce-motion', getSettings().reduceMotion);
}
