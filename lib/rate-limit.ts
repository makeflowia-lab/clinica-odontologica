import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Checks if a request is within the rate limit.
 *
 * @param identifier Unique identifier for the user or IP
 * @param endpoint The endpoint being accessed
 * @param limit Max number of requests allowed
 * @param windowSeconds Time window in seconds
 * @returns true if request is allowed, false if limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000);

    // Count requests in the current window
    const count = await prisma.rateLimit.count({
      where: {
        identifier,
        endpoint,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    if (count >= limit) {
      return false;
    }

    // Log the new request
    await prisma.rateLimit.create({
      data: {
        identifier,
        endpoint,
      },
    });

    // Optional: Cleanup old records (could be moved to a cron job for better performance)
    // For now, we'll do it probabilistically (e.g., 1 in 10 requests) to avoid overhead
    if (Math.random() < 0.1) {
      cleanupOldRecords(endpoint, windowSeconds);
    }

    return true;
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open (allow request) if DB is down, to avoid blocking legitimate users during outages
    return true;
  }
}

async function cleanupOldRecords(endpoint: string, windowSeconds: number) {
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000);
    await prisma.rateLimit.deleteMany({
      where: {
        endpoint,
        timestamp: {
          lt: windowStart,
        },
      },
    });
  } catch (error) {
    console.error("Rate limit cleanup error:", error);
  }
}
