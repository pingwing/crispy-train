import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app';
import type { MikroORM } from '@mikro-orm/postgresql';

let server: http.Server | null = null;
let urlBase = '';
let orm: MikroORM | null = null;
let disposeApp: (() => Promise<void>) | null = null;

before(async () => {
  // Boot the real app, but with a minimal mocked MikroORM instance (no DB).
  // This is sufficient for /health and { _health } which do not touch the database.
  const em: any = { fork: () => em };
  orm = {
    em,
    close: async () => {},
  } as unknown as MikroORM;

  const created = await createApp({ orm });
  disposeApp = created.dispose;

  server = http.createServer(created.app);
  await new Promise<void>((resolve) => server!.listen(0, resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string')
    throw new Error('Could not bind test server');
  urlBase = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
    server = null;
  }
  if (disposeApp) await disposeApp();
  disposeApp = null;
  if (orm) await orm.close(true);
  orm = null;
});

test('smoke: GET /health', async () => {
  const res = await fetch(`${urlBase}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('smoke: GraphQL { _health }', async () => {
  const res = await fetch(`${urlBase}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Apollo Server CSRF protection requires either a non-simple content-type or this header.
      'apollo-require-preflight': 'true',
    },
    body: JSON.stringify({ query: '{ _health }' }),
  });
  assert.equal(res.status, 200);
  const json = (await res.json()) as any;
  assert.deepEqual(json.errors, undefined);
  assert.equal(json.data?._health, 'ok');
});
