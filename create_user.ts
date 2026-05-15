import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'User';

  if (!email || !password) {
    console.error('Usage: npx tsx create_user.ts <email> <password> [name]');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    console.log('✅ User created successfully!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
  } catch (e: any) {
    if (e.code === 'P2002') {
      console.error('❌ Error: User with that email already exists.');
    } else {
      console.error('❌ Error creating user:', e);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
