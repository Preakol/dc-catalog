import { InjectionToken, Provider } from '@angular/core';

import { DataSource, Environment } from '../../../environments/environment.model';
import { BrowserHeroApi } from './browser-hero-api';
import { HEROES_API_URL } from './external-heroes';
import { HeroApi } from './hero-api';
import { API_URL, HttpHeroApi } from './http-hero-api';

export const DATA_SOURCE = new InjectionToken<DataSource>('DATA_SOURCE');

/** Wires HeroApi to the mock REST API or to localStorage, as configured at build time. */
export function provideHeroData(environment: Environment): Provider[] {
  return [
    { provide: DATA_SOURCE, useValue: environment.dataSource },
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: HEROES_API_URL, useValue: environment.heroesApiUrl },
    environment.dataSource === 'browser'
      ? [BrowserHeroApi, { provide: HeroApi, useExisting: BrowserHeroApi }]
      : [HttpHeroApi, { provide: HeroApi, useExisting: HttpHeroApi }],
  ];
}
