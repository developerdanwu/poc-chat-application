import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type Kysely } from 'kysely';
import { type DB } from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';
import { TABLE_ALIAS, withAuthors } from '@/server/api/routers/helpers';

const chatroomInputSchema = z.object({
  chatroomId: z.string().min(1),
  includeDeletedBranches: z.boolean().optional(),
});

type ChatroomInputSchema = z.infer<typeof chatroomInputSchema>;

export const getChatroomMethod = async ({
  input,
  ctx,
}: {
  input: ChatroomInputSchema;
  ctx: { db: Kysely<DB>; auth: SignedInAuthObject };
}) => {
  const chatroom = await ctx.db
    .selectFrom(`chatroom as ${TABLE_ALIAS.chatroom}`)
    .select((eb) => [
      'id',
      withAuthors(eb),
      `${TABLE_ALIAS.chatroom}.type`,
      `${TABLE_ALIAS.chatroom}.subtype`,
    ])
    .where((eb) => eb('id', '=', input.chatroomId))
    .execute();

  if (chatroom.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Chatroom not found',
    });
  }
  if (chatroom.length > 1) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'More than one chatroom found',
    });
  }

  return chatroom[0];
};

const getChatroom = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    return getChatroomMethod({ ctx, input });
  });

export default getChatroom;
