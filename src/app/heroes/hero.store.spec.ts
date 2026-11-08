import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FakeHeroApi } from '../../testing/fake-hero-api';
import { makeHero } from '../../testing/heroes';
import { HeroApi } from './data/hero-api';
import { ExternalHeroes } from './data/external-heroes';
import { HeroStore } from './hero.store';
import { DEFAULT_CONFIG } from './hero-url';

const heroes = Array.from({ length: 30 }, (_, index) =>
  makeHero({ id: index + 1, name: `Hero ${String(index + 1).padStart(2, '0')}` }),
);

describe('HeroStore', () => {
  let api: FakeHeroApi;
  let store: HeroStore;

  beforeEach(() => {
    api = new FakeHeroApi(heroes);
    TestBed.configureTestingModule({
      providers: [
        { provide: HeroApi, useValue: api },
        { provide: ExternalHeroes, useValue: { random: () => of(null), get: () => of(null) } },
      ],
    });
    store = TestBed.inject(HeroStore);
  });

  it('loads the page described by the URL config', () => {
    store.applyConfig({ ...DEFAULT_CONFIG, page: 2 });

    expect(store.status()).toBe('loaded');
    expect(store.total()).toBe(30);
    expect(store.totalPages()).toBe(3);
    expect(store.heroes()[0].name).toBe('Hero 13');
  });

  it('does not refetch when the config is unchanged', () => {
    store.applyConfig(DEFAULT_CONFIG);
    store.applyConfig(DEFAULT_CONFIG);

    expect(api.queries).toHaveLength(1);
  });

  it('appends pages in infinite mode until everything is loaded', () => {
    store.applyConfig({ ...DEFAULT_CONFIG, mode: 'infinite' });
    store.loadMore();
    store.loadMore();

    expect(store.heroes()).toHaveLength(30);
    expect(store.canLoadMore()).toBe(false);
  });

  it('reports a failed load and recovers on reload', () => {
    api.failing = true;
    store.applyConfig(DEFAULT_CONFIG);

    expect(store.status()).toBe('error');
    expect(store.error()).toBe('Could not load heroes.');

    api.failing = false;
    store.reload();

    expect(store.status()).toBe('loaded');
    expect(store.error()).toBeNull();
  });

  it('keeps already loaded heroes when loading more fails', () => {
    store.applyConfig({ ...DEFAULT_CONFIG, mode: 'infinite' });
    api.failing = true;
    store.loadMore();

    expect(store.heroes()).toHaveLength(12);
    expect(store.loadMoreError()).toBe('Could not load more heroes.');
  });

  it('creates and deletes heroes, reloading the list', () => {
    store.applyConfig({ ...DEFAULT_CONFIG, search: 'Zatanna' });
    store.create({
      name: 'Zatanna',
      fullName: 'Zatanna Zatara',
      alignment: 'good',
      imageUrl: '',
      powerstats: heroes[0].powerstats,
    });

    expect(store.heroes().map((hero) => hero.name)).toEqual(['Zatanna']);

    store.remove(store.heroes()[0].id);
    expect(store.total()).toBe(0);
  });

  it('shows a write error without dropping the list', () => {
    store.applyConfig(DEFAULT_CONFIG);
    api.failing = true;
    store.remove(1);

    expect(store.error()).toBe('Could not delete hero.');
    expect(store.heroes()).toHaveLength(12);
  });
});
