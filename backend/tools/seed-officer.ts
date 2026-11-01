import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import dataSource from '../src/database/data-source';
import { AccountStatus, Officer, User, UserRole } from '../src/database/entities.entity';
import { validateSeedTarget } from './seed-target';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function seedOfficer() {
  validateSeedTarget(process.env);
  const email = process.env.OFFICER_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.OFFICER_BOOTSTRAP_PASSWORD;
  const fullName = process.env.OFFICER_BOOTSTRAP_NAME?.trim();
  if (!email || !password || !fullName || password.length < 12 || password.length > 128) {
    throw new Error(
      'Set OFFICER_BOOTSTRAP_EMAIL, OFFICER_BOOTSTRAP_NAME and a 12-128 character OFFICER_BOOTSTRAP_PASSWORD',
    );
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      if (await manager.findOne(User, { where: { email } })) {
        throw new Error('Bootstrap email already exists; seed will not modify an existing account');
      }
      const user = await manager.save(
        User,
        manager.create(User, {
          email,
          passwordHash: await hashPassword(password),
          role: UserRole.OFFICER,
          status: AccountStatus.ACTIVE,
          refreshTokenHash: null,
        }),
      );
      await manager.save(Officer, manager.create(Officer, { userId: user.id, fullName }));
    });
  } finally {
    await dataSource.destroy();
  }
}

seedOfficer().then(
  () => process.stdout.write('Bootstrap officer created.\n'),
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Officer seed failed'}\n`);
    process.exitCode = 1;
  },
);
