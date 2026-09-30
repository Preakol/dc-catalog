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

export interface HeroAppearance {
  gender: string;
  race: string | null;
  height: string[];
  weight: string[];
  eyeColor: string;
  hairColor: string;
}

export interface HeroBiography {
  fullName: string;
  alterEgos: string;
  aliases: string[];
  placeOfBirth: string;
  firstAppearance: string;
  publisher?: string;
  alignment: string;
}

export interface HeroWork {
  occupation: string;
  base: string;
}

export interface HeroConnections {
  groupAffiliation: string;
  relatives: string;
}

export interface Hero {
  id: number;
  externalId: number | null;
  name: string;
  slug: string;
  powerstats: PowerStats;
  appearance: HeroAppearance;
  biography: HeroBiography;
  work: HeroWork;
  connections: HeroConnections;
  images: HeroImages;
}

export type ExternalHero = Omit<Hero, 'externalId'>;

export type Alignment = 'good' | 'bad' | 'neutral';

export type AlignmentFilter = Alignment | 'all';

export const ALIGNMENTS: Alignment[] = ['good', 'bad', 'neutral'];

export const ALIGNMENT_FILTERS: AlignmentFilter[] = ['all', ...ALIGNMENTS];

export interface HeroFormValue {
  name: string;
  fullName: string;
  alignment: Alignment;
  imageUrl: string;
  powerstats: PowerStats;
}

export type DetailSource = 'local-only' | 'enriched' | 'external-unavailable';

export interface HeroDetailReady {
  status: 'ready';
  hero: Hero;
  external: ExternalHero | null;
  source: DetailSource;
}

export type HeroDetail =
  | { status: 'loading' }
  | { status: 'missing' }
  | HeroDetailReady;

export interface StatEntry {
  label: string;
  value: number;
}

export interface StatComparison {
  label: string;
  value: number;
  canon: number;
}
