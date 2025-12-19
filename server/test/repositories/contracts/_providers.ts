import { after, afterEach, before, beforeEach, describe } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createMemoryDb } from '../../../src/repositories/testing/memoryDb';
import { MemoryInventoryRepository } from '../../../src/repositories/testing/MemoryInventoryRepository';
import { MemoryProductRepository } from '../../../src/repositories/testing/MemoryProductRepository';
import { MemoryStoreRepository } from '../../../src/repositories/testing/MemoryStoreRepository';
import { InventoryRepository } from '../../../src/repositories/InventoryRepository';
import { ProductRepository } from '../../../src/repositories/ProductRepository';
import { StoreRepository } from '../../../src/repositories/StoreRepository';
import { initOrm } from '../../../src/db/initOrm';

export type RepoProvider = {
  name: string;
  stores: StoreRepository | MemoryStoreRepository;
  products: ProductRepository | MemoryProductRepository;
  inventory: InventoryRepository | MemoryInventoryRepository;
};

export function createMemoryProvider(): {
  name: string;
  get: () => Promise<RepoProvider>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
} {
  const db = createMemoryDb();
  const stores = new MemoryStoreRepository(db);
  const products = new MemoryProductRepository(db);
  const inventory = new MemoryInventoryRepository(db);

  return {
    name: 'memory',
    async get() {
      return { name: 'memory', stores, products, inventory };
    },
    async reset() {
      db.stores.clear();
      db.products.clear();
      db.inventoryByStoreProduct.clear();
    },
    async close() {},
  };
}

export function createDbProvider(): {
  name: string;
  enabled: boolean;
  get: () => Promise<RepoProvider>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
} {
  const enabled = process.env.REPO_CONTRACT_DB === '1';
  const allowDestructive = process.env.REPO_CONTRACT_DB_ALLOW_DESTRUCTIVE === '1';
  let orm: Awaited<ReturnType<typeof initOrm>> | null = null;

  async function ensureOrm() {
    if (orm) return orm;
    orm = await initOrm();
    await orm.migrator.up();

    // Safety guard: DB-backed contract tests TRUNCATE tables.
    // Refuse to run unless we're clearly pointed at a test database, or the user explicitly opts in.
    const dbRow = (await orm.em
      .getConnection()
      .execute('select current_database() as db;', [], 'get')) as any;
    const dbName = String(dbRow?.db ?? '');
    const looksLikeTestDb = /_test$/i.test(dbName);
    if (!looksLikeTestDb && !allowDestructive) {
      const msg =
        `Refusing to run DB-backed repo contract tests against database "${dbName}". ` +
        `These tests TRUNCATE tables. Use a dedicated test DB (recommended: name ending with "_test") ` +
        `set the contract DB by exporting DB_NAME=always_open_shop_test.`;
        `or set REPO_CONTRACT_DB_ALLOW_DESTRUCTIVE=1 to override.`;
      await orm.close(true);
      orm = null;
      throw new Error(msg);
    }

    return orm;
  }

  return {
    name: 'postgres',
    enabled,
    async get() {
      if (!enabled) throw new Error('DB provider disabled');
      const o = await ensureOrm();
      const em = o.em.fork();
      return {
        name: 'postgres',
        stores: new StoreRepository(em),
        products: new ProductRepository(em),
        inventory: new InventoryRepository(em),
      };
    },
    async reset() {
      if (!enabled) return;
      const o = await ensureOrm();
      // Clean tables between tests. This assumes the migration has created these tables.
      await o.em
        .getConnection()
        .execute(
          'truncate table "inventory_item", "product", "store" restart identity cascade;',
        );
    },
    async close() {
      if (orm) await orm.close(true);
      orm = null;
    },
  };
}

type Mutex = {
  acquire: () => Promise<() => void>;
};

/**
 * Cross-process lock for DB-backed contract tests.
 * Node's test runner can execute multiple test files in parallel (often in separate processes),
 * and our DB reset uses TRUNCATE; without a lock tests can race and violate FK constraints.
 */
function getDbFileLock(): Mutex {
  const lockPath = path.join(os.tmpdir(), 'knostic-shop-repo-contract-db.lock');
  const staleMs = 10 * 60 * 1000;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  return {
    async acquire() {
      const started = Date.now();
      while (true) {
        try {
          await fs.writeFile(
            lockPath,
            JSON.stringify({
              pid: process.pid,
              startedAt: new Date().toISOString(),
            }),
            { flag: 'wx' },
          );
          // acquired
          return async () => {
            try {
              await fs.unlink(lockPath);
            } catch {
              // ignore
            }
          };
        } catch (e: any) {
          if (e?.code !== 'EEXIST') throw e;
          // Lock exists. Check for staleness.
          try {
            const stat = await fs.stat(lockPath);
            if (Date.now() - stat.mtimeMs > staleMs) {
              await fs.unlink(lockPath);
              continue;
            }
          } catch {
            // race - retry
          }
          // Backoff with jitter.
          const waited = Date.now() - started;
          if (waited > 60_000) {
            throw new Error(
              `Timed out waiting for DB contract lock at ${lockPath}`,
            );
          }
          await sleep(25 + Math.floor(Math.random() * 50));
        }
      }
    },
  };
}

/**
 * Helper that wires a provider into node:test lifecycle hooks.
 * It always runs the memory provider and conditionally runs the DB provider when enabled.
 */
export function withProviders(
  fn: (providerName: string, getProvider: () => Promise<RepoProvider>) => void,
) {
  const memory = createMemoryProvider();
  const db = createDbProvider();

  describe(memory.name, () => {
    beforeEach(async () => {
      await memory.reset();
    });
    after(async () => {
      await memory.close();
    });
    fn(memory.name, memory.get);
  });

  if (db.enabled) {
    const mutex = getDbFileLock();
    let release: (() => void) | null = null;

    describe(db.name, () => {
      before(async () => {
        // Eager init so DB connectivity/migrations issues show up clearly.
        // IMPORTANT: serialize initial DB bootstrap across processes.
        // Node's test runner can execute multiple test files in parallel, and initOrm()
        // may "check db exists -> create database -> migrate". Without a lock, workers can race
        // and attempt to connect/migrate before the DB is created.
        const unlock = await mutex.acquire();
        try {
          await db.get();
        } finally {
          await unlock();
        }
      });

      beforeEach(async () => {
        // Serialize all DB contract tests across files to avoid interleaving truncates/inserts.
        release = await mutex.acquire();
        await db.reset();
      });

      afterEach(async () => {
        release?.();
        release = null;
      });

      after(async () => {
        await db.close();
      });

      fn(db.name, db.get);
    });
  }
}
