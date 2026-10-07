export const COMPARE_LIMIT = 3;

export interface CompareEntry {
  heroId: number;
  name: string;
  imageUrl: string;
}

export type CompareButtonState = 'add' | 'selected' | 'full';

export interface CompareCell {
  value: number;
  best: boolean;
}

export interface CompareRow {
  label: string;
  cells: CompareCell[];
}
