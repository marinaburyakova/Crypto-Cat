// app/api/clicks/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@lib/redis';
import { prisma } from '@lib/prisma';

const BATCH_INTERVAL_SECONDS = 3;
const MAX_CLICKS_PER_SECOND = 20; 
const MAX_ALLOWED_CLICKS = BATCH_INTERVAL_SECONDS * MAX_CLICKS_PER_SECOND;

export async function POST(req: Request) {
  try {
    const { userId, clicks } = await req.json();

    if (!userId || typeof clicks !== 'number' || clicks < 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (clicks > MAX_ALLOWED_CLICKS) {
      await redis.hset(`user:${userId}:flags`, 'suspicious_activity', 'true');
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const redisUserKey = `user:${userId}:state`;
    const pointsToAdd = clicks * 10;
    const exists = await redis.exists(redisUserKey);
    let currentPoints = 0;

    if (!exists) {
      const dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          points: 0,
          unclaimedPoints: 0,
          level: 1,
          passiveRate: 0
        }
      });

      currentPoints = Number(dbUser.points) + pointsToAdd;
      await redis.hmset(redisUserKey, {
        points: currentPoints.toString(),
        uncommitted_points: pointsToAdd.toString()
      });
    } else {
      currentPoints = await redis.hincrby(redisUserKey, 'points', pointsToAdd);
      await redis.hincrby(redisUserKey, 'uncommitted_points', pointsToAdd);
    }

    if (clicks > 0) {
      await redis.sadd('users:pending_sync', userId);
    }

    return NextResponse.json({ success: true, points: currentPoints });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
