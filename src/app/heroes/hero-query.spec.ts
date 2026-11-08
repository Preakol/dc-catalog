import { makeHero } from '../../testing/heroes';
import {
  fromApiParams,
  HeroQuery,
  initialQuery,
  matchesTerm,
  nextId,
  queryHeroes,
  toApiParams,
} from './hero-query';

const heroes = [
  makeHero({
    id: 1,
    name: 'Batman',
    fullName: 'Bruce Wayne',
    stats: { strength: 26, intelligence: 100 },
  }),
  makeHero({
    id: 2,
    name: 'Superman',
    fullName: 'Clark Kent',
    stats: { strength: 100, intelligence: 94 },
  }),
  makeHero({ id: 3, name: 'Joker', alignment: 'bad', stats: { strength: 10, intelligence: 100 } }),
  makeHero({ id: 4, name: 'Atom 3', alignment: 'neutral', stats: { strength: 40 } }),
];

function query(changes: Partial<HeroQuery>): HeroQuery {
  return { ...initialQuery, ...changes };
}

function names(changes: Partial<HeroQuery>): string[] {
  return queryHeroes(heroes, query(changes)).heroes.map((hero) => hero.name);
}

describe('hero-query', () => {
  it('searches names and biography text case-insensitively', () => {
    expect(matchesTerm(heroes[0], 'wayne')).toBe(true);
    expect(matchesTerm(heroes[1], 'BRUCE')).toBe(false);
    expect(matchesTerm(heroes[0], '   ')).toBe(true);
  });

  it('searches only names when the term has no letters', () => {
    const numbered = makeHero({ id: 9, name: 'Nameless', fullName: 'Agent 3' });

    expect(matchesTerm(numbered, '3')).toBe(false);
    expect(matchesTerm(heroes[3], '3')).toBe(true);
  });

  it('filters by alignment and stat ranges', () => {
    expect(names({ alignment: 'bad' })).toEqual(['Joker']);
    expect(
      names({ ranges: { strength: { min: 20, max: 50 }, intelligence: { min: null, max: null } } }),
    ).toEqual(['Atom 3', 'Batman']);
  });

  it('sorts with name and id as tie-breakers', () => {
    expect(names({ sort: 'name-desc' })).toEqual(['Superman', 'Joker', 'Batman', 'Atom 3']);
    expect(names({ sort: 'intelligence-desc' })).toEqual(['Batman', 'Joker', 'Superman', 'Atom 3']);
  });

  it('pages the matches and reports the total', () => {
    const page = queryHeroes(heroes, query({ page: 2, pageSize: 3 }));

    expect(page.total).toBe(4);
    expect(page.heroes.map((hero) => hero.name)).toEqual(['Superman']);
  });

  it('round-trips through the API query string and rejects junk', () => {
    const original = query({
      term: 'bat',
      alignment: 'good',
      page: 3,
      sort: 'strength-desc',
      ranges: { strength: { min: 10, max: 90 }, intelligence: { min: null, max: 70 } },
    });
    const params = toApiParams(original);

    expect(fromApiParams((name) => params[name])).toEqual(original);

    const junk: Record<string, string> = {
      page: '-1',
      pageSize: '5000',
      sort: 'drop table',
      alignment: 'evil',
      strengthMin: '80',
      strengthMax: '20',
    };

    expect(fromApiParams((name) => junk[name])).toEqual({ ...initialQuery, pageSize: 100 });
  });

  it('gives new heroes the next free id', () => {
    expect(nextId(heroes)).toBe(5);
    expect(nextId([])).toBe(1);
  });
});
