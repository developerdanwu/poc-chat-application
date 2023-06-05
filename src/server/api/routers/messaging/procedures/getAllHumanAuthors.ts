import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';

const getAllHumanAuthors = protectedProcedure
  .input(
    z.object({
      searchKeyword: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const results = await ctx.db
      .selectFrom('author')
      .select(['author.author_id', 'author.first_name', 'author.last_name'])
      .where(({ and, cmpr, or }) =>
        and([
          cmpr('author.user_id', '!=', ctx.auth.userId),
          or([
            cmpr('author.first_name', 'ilike', `%${input.searchKeyword}%`),
            cmpr('author.last_name', 'ilike', `%${input.searchKeyword}%`),
          ]),
        ])
      )
      .execute();

    return results || [];
  });

export default getAllHumanAuthors;
