import fs from 'node:fs';
import path from 'node:path';

export function loadSchemaSDL(): string {
  // Works in both TS (src) and compiled JS (dist) layouts.
  const candidates = [
    path.join(process.cwd(), 'src', 'graphql', 'schema.graphql'),
    path.join(process.cwd(), 'dist', 'graphql', 'schema.graphql'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }

  throw new Error(`Could not find GraphQL schema file. Looked in: ${candidates.join(', ')}`);
}


