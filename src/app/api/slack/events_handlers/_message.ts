import {
  type GenericMessageEvent,
  type MeMessageEvent,
  type MessageEvent,
} from '@slack/bolt';
import { openaiApi, slackApi } from '@/app/api/slack/_utils';
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema';
import { type ChatPostMessageResponse } from '@slack/web-api';
import { PromptTemplate } from 'langchain/prompts';

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
    const messageArray: string[] = [];

    const openAiResponse = await openaiApi.call(
      [
        new SystemChatMessage(
          "this is a summary of the previous chat with this user: The user asked the AI for a funny joke, and the AI responded with a bicycle pun. The AI then answered the user's question about the current president of the United States, stating that as of its last training, the president is Joe Biden. The AI acknowledged that its responses may not be up to date, given that new information could change.\n\n you can make use of this information to answer any questions the user may have"
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
      template: `This is a summary of a previous conversation: {previousSummary}.\n\n The following is a continuation of the pervious conversation. \n\n user: {userInput} ai:{aiResponse}. \n\n Can you add to the summary of this conversation given this new information? Keep the resulting summary under 300 words and re-write the summary if necessary.`,
      inputVariables: ['previousSummary', 'userInput', 'aiResponse'],
    });
    const conversationSummary = await openaiApi.call([
      new HumanChatMessage(
        await summaryPromptTemplate.format({
          previousSummary:
            'The user asked the AI for a funny joke, and the AI responded with a pun about a bicycle being "two-tired" to stand up by itself.',
          userInput: data.text,
          aiResponse: openAiResponse.text,
        })
      ),
    ]);

    console.log('CONVO SUMMARY', conversationSummary.text);
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
