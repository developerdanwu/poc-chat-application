import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { env } from '@/env.mjs';
import { PromptTemplate } from 'langchain/prompts';
import { ChatOpenAI } from 'langchain/chat_models';
import { HumanChatMessage } from 'langchain/schema';

const openaiApi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
});
openaiApi.modelName;

export const openai = createTRPCRouter({
  createPrompt: protectedProcedure.query(async () => {
    const template = 'What is a good name for a company that makes {product}?';
    const prompt = new PromptTemplate({
      template: template,
      inputVariables: ['product'],
    });
    const res = await prompt.format({ product: 'colorful socks' });
    return res;
  }),
  generateText: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await openaiApi.generate([input.prompt]);
    }),
  createCompletion: protectedProcedure
    .input(
      z.object({
        model: z.literal('text-davinci-003'),
        prompt: z.string(),
      })
    )
    .mutation(async ({ input: { model, prompt } }) => {
      // const res = await openaiApi.createCompletion({
      //   model,
      //   prompt,
      // });
      // return res.data?.choices?.[0]?.text;
    }),
  getModels: protectedProcedure.query(async () => {
    const res = await openaiApi.call([new HumanChatMessage('hello')]);
    return res;
  }),
});
