import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prismaClientOptions = {
  log: [{ emit: 'event' as const, level: 'error' as const }],
};

type PrismaClientWithEvents = PrismaClient<typeof prismaClientOptions>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientWithEvents | undefined;
};

function createPrismaClient(): PrismaClientWithEvents {
  const client = new PrismaClient(prismaClientOptions);

  client.$on('error', (e: Prisma.LogEvent) => {
    logger.error('Prisma error', undefined, {
      'prisma.message': e.message,
      'prisma.timestamp': e.timestamp.toISOString(),
    });
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
