import { CompareEntry } from './compare.model';

const COMPARE_KEY = 'dc-catalog.compare';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isCompareEntry(value: unknown): value is CompareEntry {
  return (
    isRecord(value) &&
    typeof value.heroId === 'number' &&
    typeof value.name === 'string' &&
    typeof value.imageUrl === 'string'
  );
}

export function loadCompare(): CompareEntry[] {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return isUnknownArray(parsed) ? parsed.filter(isCompareEntry) : [];
  } catch {
    return [];
  }
}

export function saveCompare(entries: CompareEntry[]): boolean {
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
