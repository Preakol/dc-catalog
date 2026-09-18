export interface PowerStats {
  intelligence: number;
  strength: number;
  speed: number;
  durability: number;
  power: number;
  combat: number;
}

export interface HeroImages {
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

export interface Hero {
  id: number;
  name: string;
  slug: string;
  powerstats: PowerStats;
  appearance: {
    gender: string;
    race: string | null;
    height: string[];
    weight: string[];
    eyeColor: string;
    hairColor: string;
  };
  biography: {
    fullName: string;
    alterEgos: string;
    aliases: string[];
    placeOfBirth: string;
    firstAppearance: string;
    publisher?: string;
    alignment: string;
  };
  work: { occupation: string; base: string };
  connections: { groupAffiliation: string; relatives: string };
  images: HeroImages;
}

export const UNKNOWN_PUBLISHER = 'Unknown publisher';

export function publisherOf(hero: Hero): string {
  const publisher = hero.biography.publisher;
  return publisher && publisher.trim().length > 0 ? publisher : UNKNOWN_PUBLISHER;
}

export interface StatEntry {
  label: string;
  value: number;
}

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

export const UNKNOWN_RACE = 'Unknown';

export function raceOf(hero: Hero): string {
  return hero.appearance.race ?? UNKNOWN_RACE;
}

export function fullNameOf(hero: Hero): string {
  return hero.biography.fullName
}

export type Alignment = 'good' | 'bad' | 'neutral';
export type AlignmentFilter = Alignment | 'all';

export const ALIGNMENT_FILTERS: AlignmentFilter[] = [
  'all',
  'good',
  'bad',
  'neutral',
];

export function toAlignment(value: string): Alignment {
  return value === 'bad' || value === 'neutral' ? value : 'good';
}

export function filterHeroes(
  heroes: Hero[],
  term: string,
  alignment: AlignmentFilter
): Hero[] {
  const needle = term.trim().toLowerCase();

  return heroes.filter((hero) => {
    const matchesAlignment =
      alignment === 'all' || hero.biography?.alignment === alignment;

    const matchesTerm =
      needle.length === 0 ||
      hero.name.toLowerCase().includes(needle) ||
      hero.biography?.fullName.toLowerCase().includes(needle);

    return matchesAlignment && matchesTerm;
  });
}

export interface HeroFormValue {
  name: string;
  fullName: string;
  alignment: Alignment;
  imageUrl: string;
  powerstats: PowerStats;
}

export const PLACEHOLDER_IMAGE =
  'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/no-portrait.jpg';

export function buildNewHero(input: HeroFormValue): Omit<Hero, 'id'> {
  return {
    name: input.name,
    slug: nameToSlug(input.name),
    powerstats: input.powerstats,
    appearance: {
      gender: '',
      race: null,
      height: [],
      weight: [],
      eyeColor: '',
      hairColor: '',
    },
    biography: {
      fullName: input.fullName,
      alterEgos: '',
      aliases: [],
      placeOfBirth: '',
      firstAppearance: '',
      publisher: 'DC Comics',
      alignment: input.alignment,
    },
    work: { occupation: '', base: '' },
    connections: { groupAffiliation: '', relatives: '' },
    images: imagesFrom(input.imageUrl),
  };
}

export function toFormValue(hero: Hero): HeroFormValue {
  return {
    name: hero.name,
    fullName: hero.biography.fullName,
    alignment: toAlignment(hero.biography.alignment),
    imageUrl: hero.images.md,
    powerstats: hero.powerstats,
  };
}

export function applyFormValue(hero: Hero, input: HeroFormValue): Hero {
  return {
    ...hero,
    name: input.name,
    slug: nameToSlug(input.name),
    biography: {
      ...hero.biography,
      fullName: input.fullName,
      alignment: input.alignment
    },
    powerstats: input.powerstats,
    images: imagesFrom(input.imageUrl)
  }
}

function imagesFrom(imageUrl: string): HeroImages {
  const image = imageUrl.trim() || PLACEHOLDER_IMAGE;
  return { xs: image, sm: image, md: image, lg: image };
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}