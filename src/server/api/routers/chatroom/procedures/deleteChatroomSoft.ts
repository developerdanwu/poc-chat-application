import { protectedProcedure } from '@/server/api/trpc';
import z from 'zod';
import { ChatroomStatus } from '@prisma-generated/generated/types';
import { TRPCError } from '@trpc/server';

const deleteChatroomSoft = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      return await ctx.db
        .updateTable('chatroom')
        .set({
          status: ChatroomStatus.DELETED,
        })
        .where(({ cmpr }) => cmpr('id', '=', input.chatroomId))
        .execute();
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error deleting chatroom',
        cause: e,
      });
    }
  });

export default deleteChatroomSoft;
