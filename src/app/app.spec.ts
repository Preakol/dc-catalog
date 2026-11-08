import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { makeHero } from '../testing/heroes';
import { provideNoExternalHeroes } from '../testing/providers';
import { App } from './app';
import { BrowserHeroApi, SNAPSHOT_URL } from './heroes/data/browser-hero-api';
import { HeroApi } from './heroes/data/hero-api';
import { loadHeroes, saveHeroes } from './heroes/data/hero-storage';

describe('App shell in demo mode', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        BrowserHeroApi,
        { provide: HeroApi, useExisting: BrowserHeroApi },
        provideNoExternalHeroes(),
      ],
    });
  });

  it('shows the demo banner and resets local changes from the snapshot', async () => {
    saveHeroes([makeHero({ id: 7, name: 'Edited locally' })]);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Demo mode');

    const reset = Array.from(element.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reset demo data'),
    );
    reset?.click();
    TestBed.inject(HttpTestingController)
      .expectOne(SNAPSHOT_URL)
      .flush({ heroes: [makeHero({ id: 1, name: 'Batman' })] });
    await fixture.whenStable();

    expect(loadHeroes()?.map((hero) => hero.name)).toEqual(['Batman']);
  });
});
