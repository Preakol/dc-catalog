import { Hero } from '../heroes/hero.model';
import { PLACEHOLDER_IMAGE, STAT_FIELDS, priceOf } from '../heroes/hero.utils';
import {
  COMPARE_LIMIT,
  CompareButtonState,
  CompareCell,
  CompareEntry,
  CompareRow,
} from './compare.model';

export function parseIds(raw: string | null): number[] {
  if (raw === null) {
    return [];
  }

  const parsed = raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  return unique(parsed).slice(0, COMPARE_LIMIT);
}

export function formatIds(ids: number[]): string {
  return ids.join(',');
}

export function toCompareButtonState(selected: boolean, full: boolean): CompareButtonState {
  if (selected) {
    return 'selected';
  }

  return full ? 'full' : 'add';
}

export function toCompareEntry(hero: Hero): CompareEntry {
  return {
    heroId: hero.id,
    name: hero.name,
    imageUrl: hero.images?.md || PLACEHOLDER_IMAGE,
  };
}

export function sortByRequestedIds(heroes: Hero[], ids: number[]): Hero[] {
  return ids
    .map((id) => heroes.find((hero) => hero.id === id))
    .filter((hero): hero is Hero => hero !== undefined);
}

export function missingIds(heroes: Hero[], ids: number[]): number[] {
  const found = new Set(heroes.map((hero) => hero.id));
  return ids.filter((id) => !found.has(id));
}

export function buildRows(heroes: Hero[]): CompareRow[] {
  const statRows = STAT_FIELDS.map(({ key, label }) =>
    toRow(
      label,
      heroes.map((hero) => hero.powerstats[key]),
      Math.max
    )
  );

  return [
    ...statRows,
    toRow('Price', heroes.map(priceOf), Math.min),
  ];
}

function toRow(
  label: string,
  values: number[],
  pick: (...numbers: number[]) => number
): CompareRow {
  const best = values.length > 0 ? pick(...values) : null;
  const cells: CompareCell[] = values.map((value) => ({
    value,
    best: value === best,
  }));

  return { label, cells };
}

function unique(ids: number[]): number[] {
  return ids.filter((id, index) => ids.indexOf(id) === index);
}
