import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const src = path.join(projectRoot, 'src', 'graphql', 'schema.graphql');
const destDir = path.join(projectRoot, 'dist', 'graphql');
const dest = path.join(destDir, 'schema.graphql');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);

console.log(`Copied ${src} -> ${dest}`);
