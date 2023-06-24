import { env } from '@/env.mjs';
import { WebClient } from '@slack/web-api';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export const openaiApi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
  streaming: true,
});

export const slackApi = new WebClient(env.SLACK_BOT_TOKEN);

export function parseSlashCommandPayload(payload: string) {
  const splitPayload = payload.split('&');
  console.log(splitPayload);

  return splitPayload.reduce<Record<string, string>>((acc, nextVal) => {
    const [key, value] = nextVal.split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {}) as {
    team_id: string;
    team_domain: string;
    enterprise_id: string;
    enterprise_name: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    command: string;
    text: string;
    response_url: string;
    trigger_id: string;
    api_app_id: string;
  };
}
