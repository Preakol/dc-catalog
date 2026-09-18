/*
 * Seeds db.json for json-server from the akabab superhero API.
 * Uses node:https directly so it works on Node 16, which has no global fetch.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCE_URL = 'https://akabab.github.io/superhero-api/api/all.json';
const PUBLISHER = 'DC Comics';
const OUT_FILE = path.join(__dirname, '..', 'db.json');
const force = process.argv.includes('--force');

function get(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const { statusCode, headers } = res;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          res.resume();
          if (redirectsLeft === 0) {
            reject(new Error(`Too many redirects from ${SOURCE_URL}`));
            return;
          }
          resolve(get(headers.location, redirectsLeft - 1));
          return;
        }

        if (statusCode !== 200) {
          res.resume();
          reject(new Error(`${url} responded ${statusCode}`));
          return;
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

async function main() {
  if (fs.existsSync(OUT_FILE) && !force) {
    console.log('db.json already exists — leaving it alone.');
    console.log('Run "npm run seed:reset" to overwrite it with fresh data.');
    return;
  }

  console.log(`Fetching ${SOURCE_URL} ...`);
  const raw = await get(SOURCE_URL);

  const all = JSON.parse(raw);
  if (!Array.isArray(all)) {
    throw new Error('Expected the API to return an array of heroes');
  }

  const heroes = all.filter((hero) => hero.biography?.publisher === PUBLISHER);
  if (heroes.length === 0) {
    throw new Error(`No heroes found for publisher "${PUBLISHER}"`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify({ heroes }, null, 2));
  console.log(`Wrote ${heroes.length} ${PUBLISHER} heroes to db.json`);
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
