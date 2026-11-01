export interface SeedTargetEnvironment {
  NODE_ENV?: string;
  DATABASE_HOST?: string;
  DATABASE_NAME?: string;
  DATABASE_SSL?: string;
}

/** Require a clearly named local/test database before the seed opens a connection. */
export function validateSeedTarget(env: SeedTargetEnvironment) {
  const environment = env.NODE_ENV?.trim().toLowerCase();
  const host = env.DATABASE_HOST?.trim().toLowerCase();
  const database = env.DATABASE_NAME?.trim();
  if (!['development', 'test'].includes(environment ?? '')) {
    throw new Error('Demo seed only runs when NODE_ENV is explicitly development or test');
  }
  if (!host || !['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('Demo seed only runs against a loopback DATABASE_HOST');
  }
  if (!database || !/[_-](dev|development|test)$/i.test(database)) {
    throw new Error('DATABASE_NAME must end with _dev, _development, _test, -dev or -test');
  }
  if (/prod|production/i.test(database)) {
    throw new Error('Demo seed refuses a production-named database');
  }
  if (env.DATABASE_SSL?.trim().toLowerCase() === 'true') {
    throw new Error('Demo seed refuses a database connection with SSL enabled');
  }
  return { host, database };
}
