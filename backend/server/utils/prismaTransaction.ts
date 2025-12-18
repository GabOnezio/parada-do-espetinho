import { Prisma, type PrismaClient } from '@prisma/client';

type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isWriteConflictOrDeadlock = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';

export async function prismaTransactionWithRetry<T>(
  prismaClient: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 50, isolationLevel } = options;

  let attempt = 0;
  // retries = maxRetries; attempts = maxRetries + 1
  while (true) {
    try {
      const txOptions = isolationLevel ? { isolationLevel } : undefined;
      return await prismaClient.$transaction((tx) => fn(tx), txOptions as any);
    } catch (err) {
      if (!isWriteConflictOrDeadlock(err) || attempt >= maxRetries) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * baseDelayMs);
      const delay = baseDelayMs * 2 ** attempt + jitter;
      attempt += 1;
      await sleep(delay);
    }
  }
}

