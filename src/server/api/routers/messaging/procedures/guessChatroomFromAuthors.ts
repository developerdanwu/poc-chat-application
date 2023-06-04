import { protectedProcedure } from '@/server/api/trpc';
import { type Kysely, sql } from 'kysely';
import { z } from 'zod';
import { type DB } from '../../../../../../prisma/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';

export const authorsInputSchema = z.array(
  z.object({
    author_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
  })
);
type AuthorsInputSchema = z.infer<typeof authorsInputSchema>;

export const guessChatroomFromAuthorsMethod = async ({
  input,
  ctx,
}: {
  input: {
    authors: AuthorsInputSchema;
  };
  ctx: { db: Kysely<DB>; auth: SignedInAuthObject };
}) => {
  const chatroom = await ctx.db
    .selectFrom((eb) =>
      eb
        .selectFrom('author')
        .select(['chatroom.no_of_users', 'chatroom.id'])
        .where(({ cmpr }) => cmpr('author.user_id', '=', ctx.auth.userId))
        .innerJoin(
          '_authors_on_chatrooms',
          '_authors_on_chatrooms.author_id',
          'author.author_id'
        )
        .innerJoin(
          'chatroom',
          'author.author_id',
          '_authors_on_chatrooms.author_id'
        )
        .groupBy('chatroom.id')
        .as('chatroom')
    )
    .select([
      'id',
      sql<number>`count(distinct _authors_on_chatrooms.author_id)`.as(
        'no_of_users'
      ),
      sql<
        { author_id: number }[]
      >`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
        'authors'
      ),
    ])
    .innerJoin(
      '_authors_on_chatrooms',
      '_authors_on_chatrooms.chatroom_id',
      'chatroom.id'
    )
    .innerJoin('author', 'author.author_id', '_authors_on_chatrooms.author_id')
    .groupBy(['id', 'no_of_users'])
    .having((eb) =>
      eb.and([
        eb.cmpr(
          sql`count(distinct _authors_on_chatrooms.author_id)`,
          '=',
          input.authors.length + 1
        ),
        // TODO: fix interpolation to prevent sql injection
        ...input.authors.map((author) =>
          eb.cmpr(
            sql`count(case when "author"."author_id" = ${author.author_id} then 1 end)`,
            '=',
            1
          )
        ),
      ])
    )
    .executeTakeFirst();

  return chatroom;
};

const guessChatroomFromAuthors = protectedProcedure
  .input(
    z.object({
      authors: authorsInputSchema,
    })
  )
  .query(async ({ ctx, input }) => {
    return guessChatroomFromAuthorsMethod({ input, ctx });
  });

export default guessChatroomFromAuthors;
