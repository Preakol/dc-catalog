const SEARCH_FIELDS = [
  'name',
  'biography.fullName',
  'biography.alterEgos',
  'biography.aliases',
  'biography.firstAppearance',
  'biography.publisher',
  'connections.groupAffiliation',
  'connections.relatives',
  'work.occupation',
];

const LETTERLESS_SEARCH_FIELDS = ['name'];

const HAS_LETTER = /\p{L}/u;

const PLACEHOLDERS = ['-', 'No alter egos found.'];

const NO_MATCH_ID = '-1';

function valueAt(source, path) {
  return path
    .split('.')
    .reduce(
      (value, key) => (value === null || value === undefined ? undefined : value[key]),
      source
    );
}

function textsAt(hero, path) {
  const value = valueAt(hero, path);

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string');
  }

  return [];
}

function matches(hero, fields, needle) {
  return fields.some((path) =>
    textsAt(hero, path).some(
      (text) => !PLACEHOLDERS.includes(text) && text.toLowerCase().includes(needle)
    )
  );
}

module.exports = (req, res, next) => {
  if (req.method !== 'GET' || req.path !== '/heroes') {
    return next();
  }

  const raw = [].concat(req.query.search)[0];
  const term = typeof raw === 'string' ? raw.trim() : '';

  delete req.query.search;

  if (term === '') {
    return next();
  }

  const fields = HAS_LETTER.test(term) ? SEARCH_FIELDS : LETTERLESS_SEARCH_FIELDS;
  const needle = term.toLowerCase();

  const ids = req.app.db
    .get('heroes')
    .value()
    .filter((hero) => matches(hero, fields, needle))
    .map((hero) => String(hero.id));

  req.query.id = ids.length > 0 ? ids : [NO_MATCH_ID];

  next();
};