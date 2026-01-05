import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const athletes = await prisma.athlete.count();
  const coaches = await prisma.coach.count();
  const chatSessions = await prisma.chatSession.count();
  const messages = await prisma.message.count();
  const moodLogs = await prisma.moodLog.count();
  const performanceMetrics = await prisma.performanceMetric.count();
  const goals = await prisma.goal.count();

  console.log('Current Database Status:');
  console.log('=======================');
  console.log(`Users: ${users}`);
  console.log(`Athletes: ${athletes}`);
  console.log(`Coaches: ${coaches}`);
  console.log(`Chat Sessions: ${chatSessions}`);
  console.log(`Messages: ${messages}`);
  console.log(`Mood Logs: ${moodLogs}`);
  console.log(`Performance Metrics: ${performanceMetrics}`);
  console.log(`Goals: ${goals}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
