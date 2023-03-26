import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Configuration, OpenAIApi } from "openai";
import { z } from "zod";
import { env } from "@/env.mjs";

const openaiConfig = new Configuration({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});
const openaiApi = new OpenAIApi(openaiConfig);

export const openai = createTRPCRouter({
  createCompletion: protectedProcedure
    .input(
      z.object({
        model: z.literal("text-davinci-003"),
        prompt: z.string(),
      })
    )
    .mutation(async ({ input: { model, prompt } }) => {
      const res = await openaiApi.createCompletion({
        model,
        prompt,
      });

      return res.data?.choices?.[0]?.text;
    }),
  getModels: protectedProcedure.query(async () => {
    const res = await openaiApi.listModels();
    return res.data;
  }),
});
