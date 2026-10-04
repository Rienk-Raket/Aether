// Address → coordinates. The screens only talk to this file.
// Demo mode: backed by the fictional address book. A real geocoder can be swapped in here later.

import * as provider from './mock/geocode-mock.js';

export const PROVIDER_NAME = 'Adreszoeker (demo)';

// Returns [{ id, address, city, lat, lng, kind }]
export const searchAddress = (query) => provider.search(query);

// Nearest known address to a GPS position.
export const nearestAddress = (point) => provider.reverse(point);

export const listCities = () => provider.cities();
