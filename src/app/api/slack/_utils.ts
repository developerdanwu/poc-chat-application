import { env } from '@/env.mjs';
import { WebClient } from '@slack/web-api';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export const openaiApi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
  streaming: true,
});

export const slackApi = new WebClient(env.SLACK_BOT_TOKEN);
