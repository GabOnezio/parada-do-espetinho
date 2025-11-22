import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

dotenv.config({ path: '../.env', override: true });
dotenv.config({ path: './.env', override: true });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@paradadoespetinho.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'parada123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Usuário admin já existe (${email}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      name: 'Administrador',
      isActive: true
    }
  });

  console.log(`[seed] Usuário admin criado com email ${email} / senha ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
