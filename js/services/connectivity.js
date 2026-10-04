// Are we "online"? In demo mode the user can pretend to be offline (Instellingen → Verbindingen)
// to see how the app behaves without internet. A really missing connection counts too.

import { getSettings } from '../data/settings.js';

export const isOffline = () => getSettings().simulateOffline || navigator.onLine === false;

// Calls callback() whenever the situation may have changed. Returns a function to stop listening.
export function onConnectivityChange(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  document.addEventListener('aether:settings', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
    document.removeEventListener('aether:settings', callback);
  };
}
