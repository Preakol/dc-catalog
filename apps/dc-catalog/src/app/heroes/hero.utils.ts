import {
  Alignment,
  Hero,
  HeroImages,
  PowerStats,
  StatComparison,
  StatEntry,
} from './hero.model';

export const UNKNOWN_RACE = 'Unknown';

export const PLACEHOLDER_IMAGE =
  'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/no-portrait.jpg';

const STAT_LABELS: [keyof PowerStats, string][] = [
  ['intelligence', 'INT'],
  ['strength', 'STR'],
  ['speed', 'SPD'],
  ['durability', 'DUR'],
  ['power', 'PWR'],
  ['combat', 'CMB'],
];

export function toStatEntries(stats: PowerStats): StatEntry[] {
  return STAT_LABELS.map(([key, label]) => ({ label, value: stats[key] }));
}

export function isExternal(hero: Hero): hero is Hero & { externalId: number } {
  return hero.externalId !== null;
}

export function toStatComparison(
  ours: PowerStats,
  canon: PowerStats
): StatComparison[] {
  return STAT_LABELS.map(([key, label]) => ({
    label,
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

export function hasFullName(hero: Hero): boolean {
  return fullNameOf(hero).length > 0;
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
