import { describe, it, expect } from 'vitest';
import { DECKS, deckFor, applyPersonalAnswers, businessProfileFrom, answeredCount } from '../js/core/profile-deck.js';
import { t } from '../js/i18n/nl.js';
import { DEFAULT_PREFERENCES } from '../js/data/people.js';

describe('profile cards', () => {
  it('has a text for every card and every option', () => {
    for (const [kind, deck] of Object.entries(DECKS)) {
      const ids = new Set();
      for (const card of deck) {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);
        const text = t.deck.cards[card.id];
        expect(text, `${kind}.${card.id}`).toBeDefined();
        if (card.type === 'statement') expect(text[kind], `${kind}.${card.id}`).toBeTruthy();
        else {
          expect(text.title).toBeTruthy();
          for (const option of card.options) expect(text.options[option], `${card.id}.${option}`).toBeTruthy();
        }
      }
    }
  });

  it('falls back to the personal deck for unknown kinds', () => expect(deckFor('???')).toBe(DECKS.personal));

  it('turns statements into wishes: yes = prefer, no = not important', () => {
    const prefs = applyPersonalAnswers({ terrace: 'yes', quiet: 'no', vegetarian: 'yes', parking: 'yes', rush: 'yes' }, DEFAULT_PREFERENCES);
    expect(prefs.dining.terrace).toBe('prefer');
    expect(prefs.dining.quiet).toBe('no');
    expect(prefs.dining.diets).toContain('vegetarian');
    expect(prefs.travel.needs_parking).toBe(true);
    expect(prefs.travel.avoid_rush_hour).toBe(true);
  });

  it('turns choices into settings and ignores nonsense', () => {
    const prefs = applyPersonalAnswers({ transport: 'bike', max_minutes: '30', budget: '3', place: 'bar', fair: 'yes' }, null);
    expect(prefs).toMatchObject({ default_transport: 'bike', budget_level: 3, preferred_types: ['bar'], fairness_priority: 0.85 });
    expect(prefs.travel.max_minutes).toBe(30);
    const odd = applyPersonalAnswers({ transport: 'rocket', budget: '9', place: 'zoo' }, DEFAULT_PREFERENCES);
    expect(odd.default_transport).toBe(DEFAULT_PREFERENCES.default_transport);
    expect(odd.budget_level).toBe(DEFAULT_PREFERENCES.budget_level);
    expect(odd.preferred_types).toEqual(DEFAULT_PREFERENCES.preferred_types);
  });

  it('leaves skipped cards alone and can undo a vegetarian choice', () => {
    const base = applyPersonalAnswers({ vegetarian: 'yes' }, DEFAULT_PREFERENCES);
    expect(applyPersonalAnswers({}, base).dining.diets).toContain('vegetarian');
    expect(applyPersonalAnswers({ vegetarian: 'no' }, base).dining.diets).not.toContain('vegetarian');
    expect(applyPersonalAnswers({ fair: 'no' }, DEFAULT_PREFERENCES).fairness_priority).toBe(0.35);
    expect(applyPersonalAnswers({}, DEFAULT_PREFERENCES).fairness_priority).toBe(DEFAULT_PREFERENCES.fairness_priority);
  });

  it('describes a business from its answers', () => {
    expect(businessProfileFrom({ venue_type: 'hotel', size: 'large', guest_budget: '3', plan: 'growth', groups: 'yes', terrace: 'no', evening: undefined })).toEqual({
      venue_type: 'hotel', size: 'large', guest_budget: 3, plan_interest: 'growth', traits: { groups: true, terrace: false },
    });
    expect(businessProfileFrom({})).toEqual({ venue_type: null, size: null, guest_budget: null, plan_interest: null, traits: {} });
  });

  it('counts answered cards', () => expect(answeredCount({ a: 'yes', b: undefined, c: '30' })).toBe(2));
});
