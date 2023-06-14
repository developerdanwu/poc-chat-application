import { protectedProcedure } from '@/server/api/trpc';
import { ChatroomType } from '@prisma-generated/generated/types';
import dayjs from 'dayjs';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const createNewChatBranch = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      // create new chatroom if no chatroom found
      const newChatroom = await ctx.db.transaction().execute(async (trx) => {
        const _newChatroom = await trx
          .insertInto('chatroom')
          .values({
            type: ChatroomType.CHATROOM_BRANCH,
            updated_at: dayjs.utc().toISOString(),
            chatroom_branch_id: input.chatroomId,
          })
          .returning('chatroom.id')
          .executeTakeFirstOrThrow();

        const parentAuthors = await ctx.db
          .selectFrom('_authors_on_chatrooms')
          .selectAll()
          .where(({ cmpr }) =>
            cmpr('_authors_on_chatrooms.chatroom_id', '=', input.chatroomId)
          )
          .execute();

        // add authors to chatroom
        await trx
          .insertInto('_authors_on_chatrooms')
          .values([
            ...parentAuthors.map((author) => ({
              author_id: author.author_id,
              chatroom_id: _newChatroom.id,
            })),
          ])
          .execute();

        return _newChatroom;
      });
      return newChatroom;
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error creating chatroom',
        cause: e,
      });
    }
  });

export default createNewChatBranch;
