import { makeHero } from '../../testing/heroes';
import { isHero, isHeroList, isNewHero } from './hero-guards';

describe('hero-guards', () => {
  it('accepts complete heroes', () => {
    const hero = makeHero({ id: 1, name: 'Batman' });
    const { id: _id, ...newHero } = hero;

    expect(isHero(hero)).toBe(true);
    expect(isNewHero(newHero)).toBe(true);
    expect(isHero(newHero)).toBe(false);
    expect(isHeroList([hero])).toBe(true);
  });

  it('rejects records missing fields the app reads', () => {
    const hero = makeHero({ id: 1, name: 'Batman' });

    expect(isHero({ ...hero, powerstats: { ...hero.powerstats, speed: '10' } })).toBe(false);
    expect(isHero({ ...hero, images: {} })).toBe(false);
    expect(isHero({ ...hero, biography: null })).toBe(false);
    expect(isHeroList({ heroes: [hero] })).toBe(false);
  });
});
