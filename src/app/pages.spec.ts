import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { FakeHeroApi } from '../testing/fake-hero-api';
import { makeHero } from '../testing/heroes';
import { provideTestApp } from '../testing/providers';
import { CartStore } from './cart/cart.store';
import { CompareStore } from './compare/compare.store';
import { ExternalHero } from './heroes/hero.model';
import { HeroStore } from './heroes/hero.store';

const batman = makeHero({ id: 1, name: 'Batman', fullName: 'Bruce Wayne', externalId: 70 });
const joker = makeHero({ id: 2, name: 'Joker', alignment: 'bad' });
const original = makeHero({ id: 3, name: 'Original Hero' });

async function open(
  url: string,
  api = new FakeHeroApi([batman, joker, original]),
  external: ExternalHero | null = null,
  before: () => void = () => undefined,
) {
  localStorage.clear();
  TestBed.configureTestingModule({ providers: provideTestApp({ api, external }) });
  before();
  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  return {
    harness,
    api,
    text: () => harness.routeNativeElement?.textContent ?? '',
    root: () => harness.routeNativeElement,
  };
}

describe('pages', () => {
  it('catalogue lists heroes and filters them by alignment from the URL', async () => {
    const page = await open('/?alignment=bad');

    expect(page.root()?.querySelectorAll('dc-hero-card')).toHaveLength(1);
    expect(page.text()).toContain('Joker');
    expect(page.text()).not.toContain('Batman');
  });

  it('catalogue shows the empty and the error state', async () => {
    const empty = await open('/?search=zzz');
    expect(empty.text()).toContain('Nothing found.');

    TestBed.resetTestingModule();
    const api = new FakeHeroApi([batman]);
    api.failing = true;
    const failed = await open('/', api);
    expect(failed.text()).toContain('The catalog failed to load.');
  });

  it('catalogue offers to import the discovered external hero', async () => {
    const { id, ...rest } = makeHero({ id: 644, name: 'Superman' });
    const external: ExternalHero = { ...rest, id };
    const page = await open('/', undefined, external);

    const button = Array.from(page.root()?.querySelectorAll('button') ?? []).find((b) =>
      b.textContent?.includes('Add to catalog'),
    );
    button?.click();
    await page.harness.fixture.whenStable();

    expect(page.api.heroes.some((hero) => hero.externalId === 644)).toBe(true);
    expect(page.text()).toContain('In catalog');
  });

  it('detail page shows a stored hero and a missing one', async () => {
    const page = await open('/heroes/3');
    expect(page.text()).toContain('Original Hero');
    expect(page.text()).toContain('Created here');

    await page.harness.navigateByUrl('/heroes/999');
    await page.harness.fixture.whenStable();
    expect(page.text()).toContain('Hero not found.');
  });

  it('edit page saves the form and returns to the catalogue', async () => {
    const page = await open('/heroes/1/edit');
    const name = page.root()?.querySelector<HTMLInputElement>('input[formcontrolname="name"]');

    expect(name?.value).toBe('Batman');

    if (name) {
      name.value = 'The Batman';
      name.dispatchEvent(new Event('input'));
    }
    page.root()?.querySelector('form')?.dispatchEvent(new Event('submit'));
    await page.harness.fixture.whenStable();

    expect(page.api.heroes.find((hero) => hero.id === 1)?.name).toBe('The Batman');
    expect(TestBed.inject(HeroStore).status()).toBe('loaded');
  });

  it('cart page lists the items and explains that checkout needs a Stripe key', async () => {
    const empty = await open('/cart');
    expect(empty.text()).toContain('The cart is empty.');

    TestBed.resetTestingModule();
    const page = await open('/cart', undefined, null, () => TestBed.inject(CartStore).add(batman));
    expect(page.text()).toContain('Batman');
    expect(page.text()).toContain('Checkout is disabled');
  });

  it('my heroes page starts empty', async () => {
    const page = await open('/my-heroes');
    expect(page.text()).toContain('Nothing bought yet.');
  });

  it('compare page lines up the selected heroes', async () => {
    const page = await open('/compare?ids=1,2');

    expect(page.text()).toContain('Batman');
    expect(page.text()).toContain('Joker');
    expect(TestBed.inject(CompareStore).ids()).toEqual([1, 2]);

    await page.harness.navigateByUrl('/compare');
    await page.harness.fixture.whenStable();
    expect(page.text()).toContain('No heroes selected.');
  });
});
