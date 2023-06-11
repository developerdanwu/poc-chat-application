import { protectedProcedure } from '@/server/api/trpc';
import { type Kysely, sql } from 'kysely';
import { z } from 'zod';
import { type DB } from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export const authorsInputSchema = z.array(
  z.object({
    author_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.string(),
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
        .select(['chatroom.id'])
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
        .as('c')
    )
    .select((eb) => [
      'id',
      sql<number>`count(distinct _authors_on_chatrooms.author_id)`.as(
        'no_of_users'
      ),
      jsonArrayFrom(
        eb
          .selectFrom('author')
          .select([
            'author.author_id',
            'author.first_name',
            'author.last_name',
            'author.user_id',
          ])
          .innerJoin(
            '_authors_on_chatrooms',
            '_authors_on_chatrooms.author_id',
            'author.author_id'
          )
          .innerJoin(
            'chatroom',
            'chatroom.id',
            '_authors_on_chatrooms.chatroom_id'
          )
          .where(sql`c.id = chatroom.id`)
      ).as('authors'),
    ])
    .innerJoin(
      '_authors_on_chatrooms',
      '_authors_on_chatrooms.chatroom_id',
      'c.id'
    )
    .innerJoin('author', 'author.author_id', '_authors_on_chatrooms.author_id')
    .groupBy(['id'])
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
