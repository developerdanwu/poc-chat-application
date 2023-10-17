import {protectedProcedure} from '@/server/api/trpc';
import {z} from 'zod';
import {MessageStatus} from '@prisma-generated/generated/types';
import {dbConfig, withAuthors} from '@/server/api/routers/helpers'; // TODO: read all messages

// TODO: read all messages
const readAllMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    ctx.db
      .updateTable('message')
      .set((eb) => ({
        status: MessageStatus.READ,
      }))
      .where((eb) =>
        eb.and([
          eb('chatroom_id', '=', input.chatroomId),
          eb('status', '=', MessageStatus.DELIVERED),
        ])
      )
      .execute();

    const chatroom = await ctx.db
      .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
      .select((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
      .where((eb) =>
        eb(`${dbConfig.tableAlias.chatroom}.id`, '=', input.chatroomId)
      )
      .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
      .executeTakeFirstOrThrow();
  });

export default readAllMessages;
