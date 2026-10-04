// Simulated traffic: rush hours make trips by car and public transport slower.
// Used by the (fictional) routing service Routara. Only weekdays have rush hours.

// How "rush-hour-ish" a moment is, from 0 (quiet) to 1 (peak): a morning peak around 08:00
// and an evening peak around 17:15, built from two triangles.
export function rushLevel(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return 0;
  const hour = date.getHours() + date.getMinutes() / 60;
  const triangle = (from, peak, to) => (hour <= from || hour >= to ? 0 : hour <= peak ? (hour - from) / (peak - from) : (to - hour) / (to - peak));
  return Math.max(triangle(7, 8, 9.5), triangle(15.75, 17.25, 19));
}

const isLateNight = (date) => {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 22.5 || hour < 5.5;
};

// Multiplier for the travel time of one mode at one moment (1 = no change).
export function trafficFactor(mode, date) {
  const rush = rushLevel(date);
  if (mode === 'car') return (1 + 0.4 * rush) * (isLateNight(date) ? 0.92 : 1);
  if (mode === 'transit') return (1 + 0.2 * rush) * (isLateNight(date) ? 1.25 : 1); // fewer connections at night
  return 1;
}

// Word for the traffic situation, for badges.
export function trafficLabel(date) {
  const rush = rushLevel(date);
  if (rush >= 0.6) return 'spits';
  if (rush >= 0.2) return 'druk';
  return 'rustig';
}
