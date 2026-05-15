import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com' // Change this to your email
  const password = 'admin-password-123' // Change this to your secure password
  const name = 'Admin User'

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name,
      password: hashedPassword,
    },
  })

  console.log({ user })
  console.log('Seeding completed. You can now login with:')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
