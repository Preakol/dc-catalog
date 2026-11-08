import { EnvironmentProviders, Provider } from '@angular/core';
import { of } from 'rxjs';

import { provideAppRouter } from '../app/app.config';
import { DATA_SOURCE } from '../app/heroes/data/data-source';
import { ExternalHeroes, HEROES_API_URL } from '../app/heroes/data/external-heroes';
import { HeroApi } from '../app/heroes/data/hero-api';
import { ExternalHero } from '../app/heroes/hero.model';
import { FakeHeroApi } from './fake-hero-api';

export interface TestAppOptions {
  api: FakeHeroApi;
  external?: ExternalHero | null;
}

/** App-like providers with in-memory data and a stubbed external API. */
export function provideTestApp({
  api,
  external = null,
}: TestAppOptions): (Provider | EnvironmentProviders)[] {
  return [
    provideAppRouter(),
    { provide: HeroApi, useValue: api },
    { provide: DATA_SOURCE, useValue: 'api' },
    { provide: ExternalHeroes, useValue: { random: () => of(external), get: () => of(external) } },
  ];
}

/** External API stub for tests that use the real HeroApi adapters. */
export function provideNoExternalHeroes(): Provider[] {
  return [
    { provide: HEROES_API_URL, useValue: 'https://external.test' },
    { provide: ExternalHeroes, useValue: { random: () => of(null), get: () => of(null) } },
  ];
}
