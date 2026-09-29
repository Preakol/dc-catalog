const fs = require('fs');
const path = require('path');

const REQUIRED_NODE_MAJOR = 16;

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major === REQUIRED_NODE_MAJOR) {
    return;
  }

  console.error('');
  console.error('  x  Wrong Node version.');
  console.error('');
  console.error(`     current:   v${process.versions.node}`);
  console.error(`     required:  v${REQUIRED_NODE_MAJOR}.x  (see .nvmrc)`);
  console.error('');
  console.error('     Angular 12 cannot build on Node 17+: OpenSSL 3 removed the');
  console.error('     MD4 hash that webpack 5 relies on.');
  console.error('');
  console.error('     Fix — run this in THIS terminal:');
  console.error('');
  console.error('         nvm use');
  console.error('');
  console.error('     nvm use only affects the current terminal.');
  console.error('');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const OUT_DIR = path.join(ROOT, 'apps', 'dc-catalog', 'src', 'environments');

/** Defaults, so the project still runs without a .env file. */
const DEFAULTS = {
  API_URL: 'http://localhost:3000',
  HEROES_API_URL: 'https://akabab.github.io/superhero-api/api',
};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .reduce((acc, line) => {
      const eq = line.indexOf('=');
      if (eq === -1) {
        return acc;
      }
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      acc[key] = value;
      return acc;
    }, {});
}

function build(production, vars) {
  return `// GENERATED from .env by tools/set-env.js — do not edit by hand.

export const environment = {
  production: ${production},
  apiUrl: '${vars.API_URL}',
  heroesApiUrl: '${vars.HEROES_API_URL}',
};
`;
}

function main() {
  checkNodeVersion();

  const fromFile = parseEnvFile(ENV_FILE);
  const vars = { ...DEFAULTS, ...fromFile };

  const missing = Object.keys(DEFAULTS).filter((key) => !fromFile[key]);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'environment.ts'), build(false, vars));
  fs.writeFileSync(path.join(OUT_DIR, 'environment.prod.ts'), build(true, vars));

  if (!fs.existsSync(ENV_FILE)) {
    console.log('set-env: no .env found, using defaults.');
    console.log('set-env: copy .env.example to .env to override them.');
  } else if (missing.length > 0) {
    console.log(`set-env: .env has no ${missing.join(', ')}, using defaults.`);
  }

  console.log(`set-env: apiUrl        = ${vars.API_URL}`);
  console.log(`set-env: heroesApiUrl  = ${vars.HEROES_API_URL}`);
}

main();
