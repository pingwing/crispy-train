import { initOrm } from '../initOrm';
import { ensureSeedData } from './seed';

async function main() {
  const orm = await initOrm();
  try {
    await ensureSeedData(orm.em.fork());
  } finally {
    await orm.close(true);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
