import { getOwhAuthorMethod } from '@/server/api/routers/chatroom/procedures/getOwnAuthor';
import { protectedProcedure } from '@/server/api/trpc';

const isUserInDatabase = protectedProcedure.query(async ({ ctx }) => {
  try {
    const ownAuthor = await getOwhAuthorMethod({ ctx });

    return ownAuthor;
  } catch (e: any) {
    if (e.message === 'no result') {
      return false;
    }

    throw e;
  }
});

export default isUserInDatabase;
