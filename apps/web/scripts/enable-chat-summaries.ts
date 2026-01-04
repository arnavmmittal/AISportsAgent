import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableChatSummaries() {
  try {
    console.log('Enabling consentChatSummaries for all athletes...');
    
    const result = await prisma.athlete.updateMany({
      where: {},
      data: {
        consentChatSummaries: true,
      },
    });

    console.log(`✅ Updated ${result.count} athletes`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enableChatSummaries();
