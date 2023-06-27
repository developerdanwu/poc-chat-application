import { env } from '@/env.mjs';
import { WebClient } from '@slack/web-api';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Configuration, OpenAIApi } from 'openai';

export const textDaVinci = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
  streaming: true,
});

const openAiConfig = new Configuration({
  apiKey: env.OPENAI_ACCESS_TOKEN,
});
export const genericOpenAiModel = new OpenAIApi(openAiConfig);

export const slackApi = new WebClient(env.SLACK_BOT_TOKEN);

export function parseSlashCommandRequest<T extends Record<string, string>>(
  payload: string
): T {
  const splitPayload = payload.split('&');

  return splitPayload.reduce<Record<string, string>>((acc, nextVal) => {
    const [key, value] = nextVal.split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
    return acc;
  }, {}) as any;
}
