import {
  ExternalHero,
  Hero,
  HeroDetailReady,
  HeroFormValue,
} from './hero.model';
import { imagesFrom, isExternal, nameToSlug, toAlignment } from './hero.utils';

const OUR_PUBLISHER = 'DC Comics';

export function buildNewHero(input: HeroFormValue): Omit<Hero, 'id'> {
  return {
    externalId: null,
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
      publisher: OUR_PUBLISHER,
      alignment: input.alignment,
    },
    work: { occupation: '', base: '' },
    connections: { groupAffiliation: '', relatives: '' },
    images: imagesFrom(input.imageUrl),
  };
}

export function toHeroDetail(
  hero: Hero,
  external: ExternalHero | null
): HeroDetailReady {
  if (!isExternal(hero)) {
    return { status: 'ready', hero, external: null, source: 'local-only' };
  }

  return {
    status: 'ready',
    hero,
    external,
    source: external === null ? 'external-unavailable' : 'enriched',
  };
}

export function toFormValue(hero: Hero): HeroFormValue {
  return {
    name: hero.name,
    fullName: hero.biography?.fullName ?? '',
    alignment: toAlignment(hero.biography?.alignment),
    imageUrl: hero.images?.md ?? '',
    powerstats: hero.powerstats,
  };
}

export function applyFormValue(hero: Hero, input: HeroFormValue): Hero {
  return {
    ...hero,
    name: input.name,
    slug: nameToSlug(input.name),
    powerstats: input.powerstats,
    biography: {
      ...hero.biography,
      fullName: input.fullName,
      alignment: input.alignment,
    },
    images: imagesFrom(input.imageUrl),
  };
}
