import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ChatGPTAPI } from "@/server/api/routers/chatGpt";
import { z } from "zod";
import { env } from "@/env.mjs";

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

export const chatGpt = createTRPCRouter({
  sendAiPrompt: protectedProcedure
    .input(
      z.object({
        textPrompt: z.string(),
        parentMessageId: z.string().optional(),
      })
    )
    .mutation(async ({ input: { textPrompt, parentMessageId } }) => {
      const res = await gpt.sendMessage(textPrompt, {
        parentMessageId,
      });
      return res;
    }),
});
