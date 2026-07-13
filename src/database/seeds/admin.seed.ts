import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRoleENUM } from 'src/common/enums';
import { User } from 'src/modules/users/entities/user.entity';

/** Seeds a default admin user if one does not already exist. */
export const seedAdmin = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(User);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const existing = await userRepository.findOne({
    where: { email },
    select: ['id'],
  });
  if (existing) {
    console.log(`[seed] Admin user already exists: ${email}`);
    return;
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const admin = userRepository.create({
    fullname: 'Super Admin',
    email,
    password: await bcrypt.hash(password, rounds),
    role: UserRoleENUM.SUPER_ADMIN,
  });
  await userRepository.save(admin);
  console.log(`[seed] Created admin user: ${email} (password: ${password})`);
};
