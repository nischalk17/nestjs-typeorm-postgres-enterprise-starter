import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source.options';

dotenv.config();

/**
 * Standalone DataSource used by the TypeORM CLI for migrations and seeds.
 */
export default new DataSource(buildDataSourceOptions());
