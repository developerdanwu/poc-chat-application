import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { AiModel, Role } from '../../../../../../prisma/generated/types';
import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';

const startAiChat = protectedProcedure
  .input(
    z.object({
      aiModel: z.literal(AiModel.OPENAI),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      console.log(ctx.auth.userId);
      // check if AI chatroom exists already
      const chatroom = await ctx.db
        .selectFrom('chatroom')
        .select(['chatroom.id', 'chatroom.type'])
        .innerJoin(
          '_authors_on_chatrooms as aoc',
          'aoc.chatroom_id',
          'chatroom.id'
        )
        .innerJoin('author', 'author.author_id', 'aoc.author_id')
        .innerJoin('ai_settings', 'ai_settings.author_id', 'author.author_id')
        .innerJoin(
          'open_ai_settings',
          'open_ai_settings.id',
          'ai_settings.open_ai_settings_id'
        )
        .innerJoin(
          '_authors_on_chatrooms as aoc2',
          'aoc2.chatroom_id',
          'chatroom.id'
        )
        .innerJoin('author as author2', 'author2.author_id', 'aoc2.author_id')
        .where(({ cmpr, and }) =>
          and([
            cmpr('author.role', '=', Role.AI),
            cmpr('ai_settings.model', '=', input.aiModel),
            cmpr('author2.user_id', '=', ctx.auth.userId),
          ])
        )
        .groupBy('chatroom.id')
        .having((eb) =>
          eb.cmpr(
            sql`COUNT(DISTINCT aoc.author_id) + COUNT(DISTINCT aoc2.author_id)`,
            '=',
            2
          )
        )
        .executeTakeFirst();

      if (chatroom) {
        return chatroom;
      }
      const self = await ctx.db
        .selectFrom('author')
        .select(['author_id'])
        .where(({ cmpr }) => cmpr('author.user_id', '=', ctx.auth.userId))
        .executeTakeFirstOrThrow();
      //
      // const humanAuthor = await ctx.db
      //   .selectFrom('author as a')
      //   .select((eb) => [
      //     'a.author_id',
      //     'a.first_name',
      //     'a.last_name',
      //     eb
      //       .selectFrom('author as ai')
      //       .select([
      //         sql<
      //           {
      //             author_id: number;
      //             first_name: string;
      //             last_name: string;
      //             ai_settings: {
      //               model: AiModel;
      //               openai_settings: {
      //                 temperature: number;
      //               };
      //             };
      //           }[]
      //         >`json_agg(json_build_object(
      //           'author_id', ai.author_id,
      //           'first_name', ai.first_name,
      //           'last_name', ai.last_name,
      //           'ai_settings', (
      //               SELECT
      //                   json_build_object(
      //                       'model', s.model,
      //                       'openai_settings', json_build_object(
      //                           'temperature', o.temperature
      //                       )
      //                   )
      //               FROM
      //                   ai_settings s
      //                   LEFT JOIN open_ai_settings o ON s.open_ai_settings_id = o.id
      //               WHERE
      //                   s.author_id = ai.author_id
      //           )
      //       ))`.as('ai_settings'),
      //       ])
      //       .where(sql`"a"."author_id" = "ai"."human_user_id"`)
      //       .as('ai_users'),
      //   ])
      //   .where(({ cmpr, and }) =>
      //     and([
      //       cmpr('a.user_id', '=', ctx.auth.userId),
      //       cmpr('a.role', '=', Role.USER),
      //     ])
      //   )
      //   .groupBy('a.author_id')
      //   .executeTakeFirstOrThrow();
      // const newChatroom = await ctx.db.transaction().execute(async (trx) => {
      //   const aiAuthor = await trx
      //     .insertInto('author')
      //     .values({
      //       role: Role.AI,
      //       first_name: 'Open AI',
      //       last_name: '',
      //       human_user_id: self.author_id,
      //       updated_at: dayjs().toISOString(),
      //     })
      //     .returning('author_id')
      //     .executeTakeFirstOrThrow();
      //   const _newChatroom = await trx
      //     .insertInto('chatroom')
      //     .values({
      //       type: ChatroomType.AI_CHATROOM,
      //       updated_at: dayjs.utc().toISOString(),
      //     })
      //     .returning('chatroom.id')
      //     .executeTakeFirstOrThrow();
      //
      //   // add authors to chatroom
      //   await trx
      //     .insertInto('_authors_on_chatrooms')
      //     .values((eb) => [
      //       {
      //         author_id: humanAuthor.author_id,
      //         chatroom_id: _newChatroom.id,
      //       },
      //       {
      //         author_id: aiAuthor.author_id,
      //         chatroom_id: _newChatroom.id,
      //       },
      //     ])
      //     .execute();
      //   return _newChatroom;
      // });
      //
      // console.log('LOGGY', newChatroom);
      // return newChatroom;
    } catch (e) {
      throw new TRPCError({
        cause: e,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error starting new AI chat',
      });
    }
  });

export default startAiChat;
