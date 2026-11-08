import { isHeroList } from '../hero-guards';
import { Hero } from '../hero.model';

const HEROES_KEY = 'dc-catalog.heroes';

/** The stored catalogue, or null when nothing (valid) is stored yet. */
export function loadHeroes(): Hero[] | null {
  try {
    const raw = localStorage.getItem(HEROES_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return isHeroList(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHeroes(heroes: Hero[]): boolean {
  try {
    localStorage.setItem(HEROES_KEY, JSON.stringify(heroes));
    return true;
  } catch {
    return false;
  }
}
