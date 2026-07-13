import dataSource from '../typeorm.config';
import { seedAdmin } from './admin.seed';

/** Entry point for `npm run db:seed`. */
async function runSeeds(): Promise<void> {
  await dataSource.initialize();
  console.log('[seed] Data source initialized');

  try {
    await seedAdmin(dataSource);
    console.log('[seed] All seeds completed');
  } catch (error) {
    console.error('[seed] Seeding failed', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

void runSeeds();
