import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  // Seed models
  await prisma.model.createMany({
    data: [
      {
        name: 'Ai-podcast',
        costPerUse: 0.10,
        tokenCost: 100000,
      },
      {
        name: 'Ai-musicgen',
        costPerUse: 0.15,
        tokenCost: 150000,
      },
      {
        name: 'Ai-mindmapgen',
        costPerUse: 0.02,
        tokenCost: 20000,
      },
      {
        name: 'Ai-textTOimage',
        costPerUse: 0.05,
        tokenCost: 50000,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });