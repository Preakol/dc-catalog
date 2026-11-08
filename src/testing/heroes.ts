import { Hero, PowerStats } from '../app/heroes/hero.model';

const BASE_STATS: PowerStats = {
  intelligence: 50,
  strength: 50,
  speed: 50,
  durability: 50,
  power: 50,
  combat: 50,
};

export interface HeroSeed {
  id: number;
  name: string;
  alignment?: string;
  fullName?: string;
  externalId?: number | null;
  stats?: Partial<PowerStats>;
}

/** A complete hero record with sensible defaults for tests. */
export function makeHero({
  id,
  name,
  alignment = 'good',
  fullName = '',
  externalId = null,
  stats = {},
}: HeroSeed): Hero {
  const image = `https://example.com/${id}.jpg`;

  return {
    id,
    externalId,
    name,
    slug: name.toLowerCase(),
    powerstats: { ...BASE_STATS, ...stats },
    appearance: { gender: '', race: null, height: [], weight: [], eyeColor: '', hairColor: '' },
    biography: {
      fullName,
      alterEgos: '',
      aliases: [],
      placeOfBirth: '',
      firstAppearance: '',
      publisher: 'DC Comics',
      alignment,
    },
    work: { occupation: '', base: '' },
    connections: { groupAffiliation: '', relatives: '' },
    images: { xs: image, sm: image, md: image, lg: image },
  };
}
