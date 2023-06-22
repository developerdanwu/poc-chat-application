import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type Kysely, sql } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import {
  ChatroomStatus,
  type DB,
  type Role,
} from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';

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
    .selectFrom('chatroom')
    .select((eb) => [
      'id',
      sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
        'user_count'
      ),
      sql<
        {
          author_id: number;
          first_name: string;
          last_name: string;
          user_id: string;
          role: (typeof Role)[keyof typeof Role];
        }[]
      >`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id, 'role', author.role))`.as(
        'authors'
      ),
      jsonObjectFrom(
        eb
          .selectFrom('ai_settings')
          .selectAll()
          .where(({ cmpr }) =>
            cmpr('ai_settings.chatroom_id', '=', input.chatroomId)
          )
      ).as('ai_settings'),
      jsonArrayFrom(
        eb
          .selectFrom('chatroom as branch')
          .selectAll()
          .where(({ cmpr, and }) =>
            and([
              cmpr('branch.chatroom_branch_id', '=', input.chatroomId),
              ...(input.includeDeletedBranches
                ? []
                : [cmpr('branch.status', '=', ChatroomStatus.ACTIVE)]),
            ])
          )
      ).as('branches'),
      'chatroom.type',
      'chatroom.subtype',
    ])
    .innerJoin(
      '_authors_on_chatrooms',
      '_authors_on_chatrooms.chatroom_id',
      'chatroom.id'
    )
    .innerJoin('author', 'author.author_id', '_authors_on_chatrooms.author_id')
    .where(({ cmpr }) => cmpr('id', '=', input.chatroomId))
    .groupBy('id')
    .executeTakeFirstOrThrow();

  return chatroom;
};

const getChatroom = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      return getChatroomMethod({ ctx, input });
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error retrieving chatroom',
        cause: e,
      });
    }
  });

export default getChatroom;
