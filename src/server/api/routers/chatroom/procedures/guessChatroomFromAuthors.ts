import { protectedProcedure } from '@/server/api/trpc';
import { type Kysely } from 'kysely';
import { z } from 'zod';
import { type DB } from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { dbConfig, withAuthors } from '@/server/api/routers/helpers';
import { TRPCError } from '@trpc/server';

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
  const test = await ctx.db
    .selectFrom(`author as ${dbConfig.tableAlias.author}`)
    .where((eb) =>
      eb(`${dbConfig.tableAlias.author}.user_id`, '=', ctx.auth.userId)
    )
    .groupBy(`${dbConfig.tableAlias.author}.author_id`)
    .select((eb) => [
      ...dbConfig.selectFields.author,
      jsonArrayFrom(
        eb
          .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
          .innerJoin(
            `_authors_on_chatrooms as ${dbConfig.tableAlias._authors_on_chatrooms}`,
            `${dbConfig.tableAlias._authors_on_chatrooms}.chatroom_id`,
            `${dbConfig.tableAlias.chatroom}.id`
          )
          .select((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
          .whereRef(
            `${dbConfig.tableAlias._authors_on_chatrooms}.author_id`,
            '=',
            `${dbConfig.tableAlias.author}.author_id`
          )
      ).as('chatrooms'),
    ])
    .execute();

  if (test.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No author and chatroom not found',
    });
  }
  if (test.length > 1) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'More than one author found',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const resultChatroom = test[0]!;
  const targetAuthorIds = input.authors.map((author) => author.author_id);

  const guessedChatroom = resultChatroom.chatrooms.filter((c) => {
    const authorIds = c.authors.map((a) => a.author_id);
    return (
      targetAuthorIds.every((el) => {
        return authorIds.includes(el);
      }) && authorIds.length === targetAuthorIds.length + 1
    );
  });

  if (guessedChatroom.length === 0) {
    return null;
  }

  return guessedChatroom[0] || null;
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
