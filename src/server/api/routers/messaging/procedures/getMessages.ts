import {protectedProcedure} from '@/server/api/trpc';
import {z} from 'zod';
import {MESSAGES_PER_PAGE} from '@/pages/[chatroomId]/_components/main/main-content/ChatWindow/constants';
import {dbConfig} from '@/server/api/routers/helpers'; // implement a before and latest

// implement a before and latest

const getMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
      orderBy: z.enum(['asc', 'desc']).optional(),
      cursor: z.date().nullish(),
      skip: z.number().optional(),
      take: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const limit = input.take || MESSAGES_PER_PAGE;
    try {
      const messages = await ctx.db
        .selectFrom((eb) => {
          return eb
            .selectFrom(`message as ${dbConfig.tableAlias.message}`)
            .selectAll()
            .where((eb) => {
              return eb.and([
                eb('chatroom_id', '=', input.chatroomId),
                ...(input.cursor !== null && input.cursor !== undefined
                  ? [eb('created_at', '<', input.cursor)]
                  : []),
              ]);
            })
            .limit(limit)
            .orderBy('created_at', input.orderBy || 'desc')
            .as('message');
        })
        .selectAll()
        .execute();

      return {
        messages: messages || [],
      };
    } catch (e) {
      return {
        // TODO: should throw 500?
        messages: [],
      };
    }
  });

export default getMessages;
