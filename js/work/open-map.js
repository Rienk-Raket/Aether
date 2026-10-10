// Opens the Kaart with the filters that belong to the work profile.

import { mapFiltersFor } from '../core/work-match.js';
import { saveFilters } from '../core/map-filters-store.js';
import { showToast } from '../ui/toast.js';
import { t } from '../i18n/nl.js';

export function openMapWithWork(work) {
  saveFilters(mapFiltersFor(work));
  showToast(t.work.mapOpened);
}
