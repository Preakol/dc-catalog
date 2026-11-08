import {
  canReset,
  CatalogConfig,
  DEFAULT_CONFIG,
  fromQueryParams,
  resetConfig,
  toQueryParams,
} from './hero-url';

describe('hero-url', () => {
  it('leaves defaults out of the URL', () => {
    expect(toQueryParams(DEFAULT_CONFIG)).toEqual({});
  });

  it('round-trips a non-default config', () => {
    const config: CatalogConfig = {
      ...DEFAULT_CONFIG,
      search: 'flash',
      alignment: 'bad',
      page: 2,
      sort: 'strength-desc',
      ranges: { strength: { min: 10, max: null }, intelligence: { min: null, max: 80 } },
    };

    expect(fromQueryParams(toQueryParams(config))).toEqual(config);
  });

  it('drops the page in infinite mode and keeps the mode on reset', () => {
    const infinite: CatalogConfig = { ...DEFAULT_CONFIG, mode: 'infinite', page: 4, search: 'x' };

    expect(toQueryParams(infinite)).toEqual({ mode: 'infinite', search: 'x' });
    expect(resetConfig(infinite)).toEqual({ ...DEFAULT_CONFIG, mode: 'infinite' });
    expect(canReset(infinite)).toBe(true);
    expect(canReset(resetConfig(infinite))).toBe(false);
  });

  it('falls back to defaults for invalid values', () => {
    expect(
      fromQueryParams({ page: '0', sort: 'nope', alignment: ['bad', 'good'], strengthMin: '101' }),
    ).toEqual({ ...DEFAULT_CONFIG, alignment: 'bad' });
  });
});
