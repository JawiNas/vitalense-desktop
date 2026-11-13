// Copy a new website build into the desktop app.
// usage: npm run web -- ../vitalense-web      (the unzipped website folder)
import { cpSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(process.argv[2] || join(root, '..', 'vitalense-web'));
if (!existsSync(join(src, 'index.html'))) {
  console.error(`No index.html in ${src}. Pass the unzipped website folder: npm run web -- path/to/vitalense-web`);
  process.exit(1);
}
const dst = join(root, 'www');
rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
for (const f of ['index.html', 'privacy.html', 'manifest.webmanifest', 'icons', 'brand']) {
  if (existsSync(join(src, f))) cpSync(join(src, f), join(dst, f), { recursive: true });
}
console.log(`Copied the website from ${src} into www/. Bump "version" in package.json before you tag a release.`);
