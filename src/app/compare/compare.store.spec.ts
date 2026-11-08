import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { makeHero } from '../../testing/heroes';
import { CompareStore } from './compare.store';
import { buildRows, parseIds } from './compare.utils';

describe('CompareStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('holds at most three heroes and toggles selection', () => {
    const store = TestBed.inject(CompareStore);
    [1, 2, 3, 4].forEach((id) => store.add(makeHero({ id, name: `Hero ${id}` })));

    expect(store.ids()).toEqual([1, 2, 3]);
    expect(store.full()).toBe(true);

    store.toggle(makeHero({ id: 2, name: 'Hero 2' }));
    expect(store.ids()).toEqual([1, 3]);
    expect(store.full()).toBe(false);
  });
});

describe('compare utils', () => {
  it('parses unique positive ids, up to the limit', () => {
    expect(parseIds('3, 1,3,x,-2,7,9')).toEqual([3, 1, 7]);
    expect(parseIds(null)).toEqual([]);
  });

  it('marks the best value per row: highest stat, lowest price', () => {
    const rows = buildRows([
      makeHero({ id: 1, name: 'A', stats: { strength: 90 } }),
      makeHero({ id: 2, name: 'B', stats: { strength: 10 } }),
    ]);

    expect(rows.find((row) => row.label === 'Strength')?.cells.map((cell) => cell.best)).toEqual([
      true,
      false,
    ]);
    expect(rows.find((row) => row.label === 'Price')?.cells.map((cell) => cell.best)).toEqual([
      false,
      true,
    ]);
  });
});
