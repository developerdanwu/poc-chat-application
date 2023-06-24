import {
  type GenericMessageEvent,
  type MeMessageEvent,
  type MessageEvent,
} from '@slack/bolt';
import { openaiApi, slackApi } from '@/app/api/slack/_utils';
import { type ChatPostMessageResponse } from '@slack/web-api';
import { db } from '@/server/db';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema';
import { PromptTemplate } from 'langchain/prompts';

export const findSlackChatroom = async ({ channel }: { channel: string }) => {
  return db
    .selectFrom('slack_chatroom')
    .select((eb) => [
      'slack_chatroom_id',
      'conversationSummary',
      jsonArrayFrom(
        eb
          .selectFrom('slack_message')
          .selectAll()
          .where(({ cmpr }) => cmpr('slack_chatroom_id', '=', channel))
          .orderBy('')
      ).as('slack_messages'),
    ])
    .where(({ cmpr }) => cmpr('slack_chatroom_id', '=', channel))
    .executeTakeFirst();
};

export const createSlackChatroom = async ({ channel }: { channel: string }) => {
  return db
    .insertInto('slack_chatroom')
    .values({
      slack_chatroom_id: channel,
      conversationSummary: '',
    })
    .returningAll()
    .executeTakeFirst();
};

export const sendTyping = async ({ data }: { data: MessageEvent }) => {
  const sendTyping = await slackApi.chat.postMessage({
    channel: data.channel,
    text: 'typing...',
  });
  return sendTyping;
};

export async function message({
  data,
  typingResponse,
}: {
  data: GenericMessageEvent | MeMessageEvent;
  typingResponse: ChatPostMessageResponse;
}) {
  if (!data.text) {
    return;
  }
  try {
    let targetChatoom: Awaited<ReturnType<typeof findSlackChatroom>>;

    targetChatoom = await findSlackChatroom({ channel: data.channel });
    if (!targetChatoom) {
      targetChatoom = await createSlackChatroom({
        channel: data.channel,
      });
    }

    if (!targetChatoom) {
      return;
    }

    const messageArray: string[] = [];
    const conversationMemoryTemplate = new PromptTemplate({
      template:
        'this is a summary of a conversation summary of a conversation between an AI model and a user: {conversationSummary}\n\n and this is the latest 5 exchanges between the AI and the USER {previousMessages}. you can make use of this information to answer any questions the user may have',
      inputVariables: ['conversationSummary', 'previousMessages'],
    });

    const openAiResponse = await openaiApi.call(
      [
        new SystemChatMessage(
          await conversationMemoryTemplate.format({
            conversationSummary: targetChatoom.conversationSummary,
            previousMessages: targetChatoom.slack_messages
              .map((message) => message.text)
              .join('\n\n'),
          })
        ),
        new HumanChatMessage(data.text),
      ],
      undefined,
      [
        {
          async handleLLMNewToken(token) {
            messageArray.push(token);
            if (messageArray.length % 20 === 0 && typingResponse.ts) {
              await slackApi.chat.update({
                ts: typingResponse.ts,
                channel: data.channel,
                text: messageArray.join(''),
              });
            }
          },
        },
      ]
    );
    if (openAiResponse.text && typingResponse.ts) {
      await slackApi.chat.update({
        ts: typingResponse.ts,
        channel: data.channel,
        text: openAiResponse.text,
      });
    }
    const summaryPromptTemplate = new PromptTemplate({
      template: `This is a summary of a previous conversation between an AI model and some users: {previousSummary}.\n\n The following is a continuation of the conversation in its raw form. \n\n user: {userInput} ai:{aiResponse}. \n\n Can you create a new summary of this conversation given this new conversation log? Keep the resulting summary under 500 words. Re-word the previous conversation only if necessary. Attempt to retain as much of the information from the previous conversation as possible.`,
      inputVariables: ['previousSummary', 'userInput', 'aiResponse'],
    });
    const conversationSummary = await openaiApi.call([
      new HumanChatMessage(
        await summaryPromptTemplate.format({
          previousSummary: targetChatoom.conversationSummary,
          userInput: data.text,
          aiResponse: openAiResponse.text,
        })
      ),
    ]);

    await db
      .updateTable('slack_chatroom')
      .set({
        conversationSummary: conversationSummary.text,
      })
      .execute();

    await db
      .insertInto('slack_message')
      .values({
        slack_chatroom_id: targetChatoom.slack_chatroom_id,
        text: `USER: ${data.text} AI: ${openAiResponse.text}`,
      })
      .returningAll()
      .execute();
  } catch (e) {
    if (typingResponse.ts) {
      await slackApi.chat.postEphemeral({
        channel: data.channel,
        text: 'an error has occurred!',
        user: data.user,
      });
    }
    console.log(e);
  }
}
