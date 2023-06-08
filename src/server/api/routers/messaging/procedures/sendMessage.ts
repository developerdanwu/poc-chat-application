import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  MessageStatus,
  MessageType,
  MessageVisibility,
  type Role,
} from '../../../../../../prisma/generated/types';
import dayjs from 'dayjs';

import { sql } from 'kysely';
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
          'message.created_at',
          'message.updated_at',
          'content',
          sql<{
            first_name: string;
            last_name: string;
            author_id: number;
            user_id: string;
            role: (typeof Role)[keyof typeof Role];
          }>`JSON_BUILD_OBJECT('first_name',author.first_name, 'last_name', author.last_name, 'email', author.email, 'author_id', author.author_id, 'role', author.role, 'user_id', author.user_id, 'role', author.role)`.as(
            'author'
          ),
        ])
        .innerJoin('author', 'author.author_id', 'message.author_id')
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
