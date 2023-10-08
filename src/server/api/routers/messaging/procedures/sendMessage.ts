import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '@prisma-generated/generated/types';
import dayjs from 'dayjs';
import { ablyChannelKeyStore } from '@/lib/ably';
import { TRPCError } from '@trpc/server';

const sendMessage = protectedProcedure
  .input(
    z.object({
      text: z.string().min(1),
      chatroomId: z.string().min(1),
      content: z.string(),
      // TODO: add Ai model
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const insertedMessage = await ctx.db
        .insertInto('message')
        .values((eb) => ({
          text: input.text,
          type: MessageType.MESSAGE,
          status: MessageStatus.SENT,
          visibility: MessageVisibility.ALL,
          content: input.content,
          author_id: eb
            .selectFrom('author')
            .select('author_id')
            .where('author.user_id', '=', ctx.auth.userId),
          chatroom_id: input.chatroomId,
          updated_at: dayjs.utc().toISOString(),
        }))
        .returning('client_message_id')
        .executeTakeFirstOrThrow();

      const message = await ctx.db
        .selectFrom('message')
        .select([
          'client_message_id',
          'text',
          'content',
          'is_edited',
          'created_at',
          'updated_at',
          'author_id',
        ])
        .where('client_message_id', '=', insertedMessage.client_message_id)
        .executeTakeFirstOrThrow();

      await ablyRest.channels
        .get(ablyChannelKeyStore.chatroom(input.chatroomId))
        .publish('message', message);

      return message;
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error retrieving message',
        cause: e,
      });
    }
  });

export default sendMessage;
