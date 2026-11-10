const fs = require('node:fs');
const path = require('node:path');

if (process.env.EAS_BUILD !== 'true') {
  console.log('Skipping EAS lockfile normalization outside EAS Build.');
  process.exit(0);
}

const lockfilePath = path.join(__dirname, '..', 'package-lock.json');
const lockfile = fs.readFileSync(lockfilePath, 'utf8');
const internalTarballUrl =
  /https?:\/\/package-firewall\.replit\.internal\/npm\//g;
const matches = lockfile.match(internalTarballUrl) || [];

if (matches.length === 0) {
  if (lockfile.includes('package-firewall.replit.internal')) {
    throw new Error('Found an unsupported internal npm URL in package-lock.json.');
  }

  console.log('No internal npm URLs found in package-lock.json.');
  process.exit(0);
}

const normalizedLockfile = lockfile.replace(
  internalTarballUrl,
  'https://registry.npmjs.org/',
);

if (normalizedLockfile.includes('package-firewall.replit.internal')) {
  throw new Error('Could not normalize every internal npm URL in package-lock.json.');
}

fs.writeFileSync(lockfilePath, normalizedLockfile);
console.log(
  `Normalized ${matches.length} locked npm tarball URLs for EAS Build; integrity hashes are unchanged.`,
);
