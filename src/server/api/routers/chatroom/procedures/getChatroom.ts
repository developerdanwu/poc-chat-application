import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type Kysely } from 'kysely';
import { type DB, MessageStatus } from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';
import { dbConfig, withAuthors } from '@/server/api/routers/helpers';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

const chatroomInputSchema = z.object({
  chatroomId: z.string().min(1),
  includeDeletedBranches: z.boolean().optional(),
});

type ChatroomInputSchema = z.infer<typeof chatroomInputSchema>;

export const getChatroomMethod = async ({
  input,
  ctx,
}: {
  input: {
    chatroomId: string;
    authorId: number;
  };
  ctx: { db: Kysely<DB>; auth: SignedInAuthObject };
}) => {
  const chatroom = await ctx.db
    .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
    .select((eb) => [
      ...dbConfig.selectFields.chatroom,
      'id',
      withAuthors(eb),
      jsonObjectFrom(
        eb
          .selectFrom(`message as ${dbConfig.tableAlias.message}`)

          .selectAll()
          .innerJoin(
            `message_recepient as ${dbConfig.tableAlias.message_recepient}`,
            `${dbConfig.tableAlias.message_recepient}.message_id`,
            `${dbConfig.tableAlias.message}.client_message_id`
          )
          .whereRef(
            `${dbConfig.tableAlias.chatroom}.id`,
            '=',
            `${dbConfig.tableAlias.message}.chatroom_id`
          )
          .where((eb) =>
            eb.and([
              eb(
                `${dbConfig.tableAlias.message_recepient}.status`,
                '=',
                MessageStatus.DELIVERED
              ),
              eb(
                `${dbConfig.tableAlias.message_recepient}.recepient_id`,
                '=',
                input.authorId
              ),
            ])
          )
          .orderBy(`${dbConfig.tableAlias.message}.created_at`, 'asc')
          .limit(1)
      ).as('first_unread_message'),
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return chatroom[0]!;
};

const getChatroom = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    const ownAuthor = await ctx.db
      .selectFrom('author')
      .select('author_id')
      .where('author.user_id', '=', ctx.auth.userId)
      .executeTakeFirstOrThrow();

    return getChatroomMethod({
      ctx,
      input: {
        chatroomId: input.chatroomId,
        authorId: ownAuthor.author_id,
      },
    });
  });

export default getChatroom;
