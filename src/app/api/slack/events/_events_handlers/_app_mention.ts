import { ChatOpenAI } from 'langchain/chat_models/openai';
import { env } from '@/env.mjs';
import { type AppMentionEvent } from '@slack/bolt';
import { slackApi } from '@/app/api/slack/_utils';
import { HumanChatMessage } from 'langchain/schema';

const openaiApi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
  streaming: true,
});

export async function app_mention({ data }: { data: AppMentionEvent }) {
  try {
    const sendTyping = await slackApi.chat.postMessage({
      channel: data.channel,
      text: 'typing...',
    });

    const messageArray: string[] = [];

    const openAiResponse = await openaiApi.call(
      [new HumanChatMessage(data.text)],
      undefined,
      [
        {
          async handleLLMNewToken(token, runId, parentRunId) {
            messageArray.push(token);
            if (messageArray.length % 20 === 0 && sendTyping.ts) {
              await slackApi.chat.update({
                ts: sendTyping.ts,
                channel: data.channel,
                text: messageArray.join(''),
              });
            }
          },
        },
      ]
    );
    if (openAiResponse.text && sendTyping.ts) {
      await slackApi.chat.update({
        ts: sendTyping.ts,
        channel: data.channel,
        text: openAiResponse.text,
      });
    }
  } catch (e) {
    console.log(e);
  }
}
