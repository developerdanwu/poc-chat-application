import { protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db';
import { Role } from '@prisma-generated/generated/types';
import dayjs from 'dayjs';
import { clerkClient } from '@clerk/clerk-sdk-node';

const seedAuthor = protectedProcedure.mutation(async ({ ctx }) => {
  await db.transaction().execute(async (trx) => {
    const loggedInUser = await clerkClient.users.getUser(ctx.auth.userId);
    return await trx
      .insertInto('author')
      .values({
        user_id: ctx.auth.userId,
        first_name: loggedInUser?.firstName || '',
        last_name: loggedInUser?.lastName || '',
        email: loggedInUser?.emailAddresses[0]?.emailAddress || '',
        role: Role.USER,
        updated_at: dayjs.utc().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  });
});

export default seedAuthor;
