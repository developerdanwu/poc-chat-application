import dayjs from 'dayjs';

import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  authorsInputSchema,
  guessChatroomFromAuthorsMethod,
} from '@/server/api/routers/chatroom/procedures/guessChatroomFromAuthors';
import { ChatroomType } from '@prisma-generated/generated/types';
import { getChatroomMethod } from '@/server/api/routers/chatroom/procedures/getChatroom';
import { dbConfig, withAuthors } from '@/server/api/routers/helpers';
import { sendMessageMethod } from '@/server/api/routers/messaging/procedures/sendMessage';
import { getOwhAuthorMethod } from '@/server/api/routers/chatroom/procedures/getOwnAuthor';

const startNewChat = protectedProcedure
  .input(
    z.object({
      authors: authorsInputSchema,
      text: z.string().min(1),
      content: z.any(),
      message_checksum: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // get chatroom

    const chatroom = await guessChatroomFromAuthorsMethod({
      input: {
        authors: input.authors,
      },
      ctx,
    });

    // if there is 1 element return the chatroom
    if (chatroom) {
      await ctx.db.transaction().execute(async (trx) => {
        // create new message
        await sendMessageMethod({
          input: {
            messageChecksum: input.message_checksum,
            text: input.text,
            chatroomId: chatroom.id,
            content: input.content,
            authors: chatroom.authors,
          },
          ctx: {
            db: trx,
            auth: ctx.auth,
          },
        });
      });

      return chatroom;
    }

    const ownAuthor = await getOwhAuthorMethod({ ctx });
    // create new chatroom if no chatroom found
    const newChatroom = await ctx.db.transaction().execute(async (trx) => {
      const _newChatroom = await trx
        .insertInto('chatroom')
        .values({
          type: ChatroomType.HUMAN_CHATROOM,
          updated_at: dayjs.utc().toISOString(),
        })
        .returning((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
        .executeTakeFirstOrThrow();

      // add authors to chatroom
      await trx
        .insertInto('_authors_on_chatrooms')
        .values((eb) => [
          {
            author_id: ownAuthor.author_id,
            chatroom_id: _newChatroom.id,
          },
          ...input.authors.map((author) => ({
            author_id: author.author_id,
            chatroom_id: _newChatroom.id,
          })),
        ])
        .execute();

      // create new message
      await sendMessageMethod({
        input: {
          messageChecksum: input.message_checksum,
          text: input.text,
          chatroomId: _newChatroom.id,
          content: input.content,
          authors: _newChatroom.authors,
        },
        ctx: {
          db: trx,
          auth: ctx.auth,
        },
      });

      return _newChatroom;
    });

    // id is unique so must only return 1
    // get chatrooms
    const resultChatroom = await getChatroomMethod({
      input: {
        chatroomId: newChatroom.id,
        authorId: ownAuthor.author_id,
      },
      ctx,
    });

    return resultChatroom;
  });
export default startNewChat;
