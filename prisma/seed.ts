import { PrismaClient } from "@prisma/client";
import * as process from "process";

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
  const aiUser = await prisma.aiUser.upsert({
    where: { id: "chat-gpt" },
    update: {},
    create: {
      id: "chat-gpt",
      name: "ChatGPT",
      chatrooms: {
        create: {
          messages: {
            createMany: {
              data: [
                {
                  message: "hello",
                },
                {
                  message: "bye",
                },
              ],
            },
          },
          users: {
            create: {
              userId: "user_2NXj59TddnODr5H17Vi1wYo5Zvf",
            },
          },
        },
      },
    },
  });
  console.log(aiUser);
}

main()
  .then(async () => {
    console.log("herro??");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
