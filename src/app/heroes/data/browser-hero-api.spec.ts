import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { makeHero } from '../../../testing/heroes';
import { initialQuery } from '../hero-query';
import { BrowserHeroApi, SNAPSHOT_URL } from './browser-hero-api';
import { loadHeroes } from './hero-storage';

const snapshot = [makeHero({ id: 1, name: 'Batman' }), makeHero({ id: 2, name: 'Robin' })];

describe('BrowserHeroApi', () => {
  let api: BrowserHeroApi;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [BrowserHeroApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BrowserHeroApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function loaded<T>(request: Promise<T>): Promise<T> {
    http.expectOne(SNAPSHOT_URL).flush({ heroes: snapshot });
    return request;
  }

  it('seeds itself from the snapshot once and stores it', async () => {
    const page = await loaded(firstValueFrom(api.list(initialQuery)));

    expect(page.total).toBe(2);
    expect(loadHeroes()?.map((hero) => hero.name)).toEqual(['Batman', 'Robin']);

    await firstValueFrom(api.get(2));
    http.expectNone(SNAPSHOT_URL);
  });

  it('persists create, update and delete in localStorage', async () => {
    const { id: _id, ...newHero } = makeHero({ id: 0, name: 'Nightwing' });
    const created = await loaded(firstValueFrom(api.create(newHero)));

    expect(created.id).toBe(3);

    await firstValueFrom(api.update({ ...created, name: 'Dick Grayson' }));
    await firstValueFrom(api.remove(1));

    expect(loadHeroes()?.map((hero) => hero.name)).toEqual(['Robin', 'Dick Grayson']);
    expect(await firstValueFrom(api.existsByExternalId(99))).toBe(false);
  });

  it('refuses to update a hero that does not exist', async () => {
    await expect(
      loaded(firstValueFrom(api.update(makeHero({ id: 42, name: 'Ghost' })))),
    ).rejects.toThrow('Hero 42 does not exist.');
  });

  it('reset drops local changes', async () => {
    await loaded(firstValueFrom(api.remove(1)));

    const reset = firstValueFrom(api.reset());
    await loaded(reset);

    expect(await firstValueFrom(api.getMany([1, 2]))).toHaveLength(2);
  });

  it('fails on a malformed snapshot instead of storing it', async () => {
    const request = firstValueFrom(api.list(initialQuery));
    http.expectOne(SNAPSHOT_URL).flush({ heroes: [{ id: 'one' }] });

    await expect(request).rejects.toThrow('The hero snapshot is malformed.');
    expect(loadHeroes()).toBeNull();
  });
});
