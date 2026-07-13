import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * Builds TypeORM connection options from environment variables.
 * Used both by the Nest TypeOrmModule and the standalone migration/seed CLI.
 */
export const buildDataSourceOptions = (): PostgresConnectionOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  const sslEnabled = process.env.DB_SSL === 'true' || isProd;
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA,
    entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '/migrations/*.{ts,js}')],
    subscribers: [join(__dirname, '/subscribers/**.subscriber.{ts,js}')],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    ...(sslEnabled && {
      ssl: {
        rejectUnauthorized,
      },
    }),
  };
};
