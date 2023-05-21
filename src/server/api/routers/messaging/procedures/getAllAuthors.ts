import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';

const getAllAuthors = protectedProcedure
  .input(
    z.object({
      searchKeyword: z.string().optional(),
    })
  )
  .query(async ({ ctx }) => {
    const results = await ctx.db
      .selectFrom('author')
      .select(['author.author_id', 'author.first_name', 'author.last_name'])
      .where('author.user_id', '!=', ctx.auth.userId)
      .execute();

    return results;
  });

export default getAllAuthors;
