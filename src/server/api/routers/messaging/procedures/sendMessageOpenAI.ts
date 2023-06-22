import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { ChatOpenAI } from 'langchain/chat_models';
import { env } from '@/env.mjs';
import { HumanChatMessage } from 'langchain/schema';
import { ablyChannelKeyStore, MESSAGE_STREAM_NAMES } from '@/lib/ably';
import { z } from 'zod';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';

const llm = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
  streaming: true,
});

const sendMessageOpenAI = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
      authorId: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const messageArray: string[] = [];

    const parser = StructuredOutputParser.fromZodSchema(
      z
        .array(
          z.object({
            answer: z.string().describe("answer to the user's question "),
            sources: z
              .array(
                z.object({
                  type: z
                    .string()
                    .describe(
                      'type of source, can be one of WEBSITE, BOOK, VIDEO, IMAGE'
                    ),
                  source: z
                    .string()
                    .describe(
                      'source url, book title or anything that identifies the source'
                    ),
                })
              )
              .describe(
                'sources used to answer the question. It can be a website, book, video or image'
              ),
          })
        )
        .describe('array of answers to the user question')
    );

    const formatInstructions = parser.getFormatInstructions();

    const prompt = new PromptTemplate({
      template:
        'Answer the users question as best as possible. \n{format_instructions}\n{question}',
      inputVariables: ['question'],
      partialVariables: { format_instructions: formatInstructions },
    });
    const llmInput = await prompt.format({
      question:
        "give me some life advice taken from the world's greatest minds",
    });
    const response = await llm.call(
      [new HumanChatMessage(llmInput)],
      undefined,
      [
        {
          async handleLLMEnd(output, runId, parentRunId): Promise<void> {
            await ablyRest.channels
              .get(ablyChannelKeyStore.chatroom(input.chatroomId))
              .publish(MESSAGE_STREAM_NAMES.openAiMessage, {
                authorId: input.authorId,
                runId,
                parentRunId,
                message: output.generations[0],
              });
          },
          async handleLLMNewToken(
            token,
            runId: string,
            parentRunId?: string
          ): Promise<void> {
            messageArray.push(token);
            // slow down message stream to avoid rate limiting
            if (messageArray.length % 20 === 0) {
              await ablyRest.channels
                .get(ablyChannelKeyStore.chatroom(input.chatroomId))
                .publish(MESSAGE_STREAM_NAMES.openAiMessage, {
                  authorId: input.authorId,
                  runId,
                  parentRunId,
                  message: messageArray.join(''),
                });
            }
          },
        },
      ]
    );
  });

export default sendMessageOpenAI;
