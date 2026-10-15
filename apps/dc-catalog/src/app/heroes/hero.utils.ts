import {
  Alignment,
  Hero,
  HeroImages,
  PowerStats,
  StatComparison,
  StatEntry,
} from './hero.model';

export const UNKNOWN = 'Unknown';
export const UNKNOWN_RACE = UNKNOWN;

const NO_ALTER_EGOS = 'No alter egos found.';
const NO_ALIASES = 'No aliases found.';

export const PLACEHOLDER_IMAGE =
  'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/no-portrait.jpg';

export interface StatField {
  key: keyof PowerStats;
  short: string;
  label: string;
}

export const STAT_FIELDS: StatField[] = [
  { key: 'intelligence', short: 'INT', label: 'Intelligence' },
  { key: 'strength', short: 'STR', label: 'Strength' },
  { key: 'speed', short: 'SPD', label: 'Speed' },
  { key: 'durability', short: 'DUR', label: 'Durability' },
  { key: 'power', short: 'PWR', label: 'Power' },
  { key: 'combat', short: 'CMB', label: 'Combat' },
];

export function toStatEntries(stats: PowerStats): StatEntry[] {
  return STAT_FIELDS.map(({ key, short }) => ({ label: short, value: stats[key] }));
}

export function isExternal(hero: Hero): hero is Hero & { externalId: number } {
  return hero.externalId !== null;
}

export function toStatComparison(
  ours: PowerStats,
  canon: PowerStats
): StatComparison[] {
  return STAT_FIELDS.map(({ key, short }) => ({
    label: short,
    value: ours[key],
    canon: canon[key],
  }));
}

export function priceOf(hero: Hero): number {
  const stats = hero.powerstats;

  return (
    (stats.intelligence +
      stats.strength +
      stats.speed +
      stats.durability +
      stats.power +
      stats.combat) *
    2
  );
}

export function raceOf(hero: Hero): string {
  return hero.appearance?.race ?? UNKNOWN_RACE;
}

export function fullNameOf(hero: Hero): string {
  return hero.biography?.fullName?.trim() ?? '';
}

export function toAlignment(value: string | undefined): Alignment {
  return value === 'bad' || value === 'neutral' ? value : 'good';
}

export function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

export function imagesFrom(imageUrl: string): HeroImages {
  const image = imageUrl.trim() || PLACEHOLDER_IMAGE;
  return { xs: image, sm: image, md: image, lg: image };
}

export function orUnknown(value: string | null | undefined, replacer: string): string {
  const text = value?.trim() ?? '';

  return text === '' || text === '-' ? replacer : text;
}

export function alterEgosOf(hero: Hero): string {
  const text = hero.biography?.alterEgos?.trim() ?? '';

  return text || NO_ALTER_EGOS;
}

export function aliasesOf(hero: Hero): string {
  const aliases = hero.biography?.aliases ?? [];

  return aliases.length === 0 ? NO_ALIASES : aliases.join(', ');
}
