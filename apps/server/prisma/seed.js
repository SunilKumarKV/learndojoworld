const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const users = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'Admin@12345',
    role: 'ADMIN',
  },
  {
    email: 'creator@example.com',
    name: 'Creator User',
    password: 'Creator@12345',
    role: 'CREATOR',
  },
  {
    email: 'learner@example.com',
    name: 'Learner User',
    password: 'Learner@12345',
    role: 'LEARNER',
  },
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    });

    console.log(`${user.role} created/updated: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });