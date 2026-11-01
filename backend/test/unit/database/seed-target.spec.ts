import { validateSeedTarget } from '../../../tools/seed-target';

describe('demo seed target guard', () => {
  const safeTarget = {
    NODE_ENV: 'development',
    DATABASE_HOST: 'localhost',
    DATABASE_NAME: 'internship_management_dev',
    DATABASE_SSL: 'false',
  };

  it('allows a clearly named local development database', () => {
    expect(validateSeedTarget(safeTarget)).toEqual({
      host: 'localhost',
      database: 'internship_management_dev',
    });
  });

  it.each([
    [{ ...safeTarget, NODE_ENV: 'production' }, /development or test/],
    [{ ...safeTarget, DATABASE_HOST: 'db.example.test' }, /loopback/],
    [{ ...safeTarget, DATABASE_NAME: 'customer_database' }, /must end with/],
    [{ ...safeTarget, DATABASE_NAME: 'customer_production_dev' }, /production-named/],
    [{ ...safeTarget, DATABASE_SSL: 'true' }, /SSL enabled/],
  ])('rejects unsafe target configuration %#', (target, expectedError) => {
    expect(() => validateSeedTarget(target)).toThrow(expectedError);
  });
});
