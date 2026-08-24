/**
 * One-off maintainer script: extract en/es objects from LanguageContext.jsx → public/i18n/*.json
 * Run: node scripts/extract-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'src/context/LanguageContext.jsx');
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

const enBody = lines.slice(86, 1785).join('\n');
const esBody = lines.slice(1787, 3460).join('\n');

function parseLocale(body, label) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return ({${body}})`)();
  } catch (err) {
    console.error(`Failed to parse ${label}:`, err.message);
    process.exit(1);
  }
}

const en = parseLocale(enBody, 'en');
const es = parseLocale(esBody, 'es');

const outDir = path.join(root, 'public/i18n');
fs.mkdirSync(outDir, { recursive: true });

const enPath = path.join(outDir, 'en.json');
const esPath = path.join(outDir, 'es.json');
fs.writeFileSync(enPath, JSON.stringify(en));
fs.writeFileSync(esPath, JSON.stringify(es));

console.log('en.json', fs.statSync(enPath).size, 'bytes');
console.log('es.json', fs.statSync(esPath).size, 'bytes');
