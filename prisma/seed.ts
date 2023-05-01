import { build, perBuild } from "@jackfranklin/test-data-bot";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const aiUserBuilder = build({
  fields: {
    id: perBuild(() => uuid()),
    name: perBuild(() => faker.name.fullName()),
  },
});

const messagesBuilder = build({
  fields: {
    id: perBuild(() => uuid()),
    message: perBuild(() => faker.lorem.lines(2)),
    timestamp: perBuild(() => faker.date.past()),
    senderId: perBuild(() => uuid()),
    aiUserId: perBuild(() => uuid()),
  },
  traits: {
    user: {
      overrides: {
        senderId: "user_2NXj59TddnODr5H17Vi1wYo5Zvf",
        aiUserId: undefined,
      },
    },
    ai: {
      overrides: {
        senderId: undefined,
        aiUserId: perBuild(() => uuid()),
      },
    },
  },
});

async function main() {
  const fakeAiUser = aiUserBuilder.one();
  const getMessage = (aiUserId: string) => {
    const isAi = Math.random() < 0.5;
    const trait = isAi ? "ai" : "user";
    return messagesBuilder.one({
      traits: trait,
      overrides: {
        aiUserId: isAi ? aiUserId : undefined,
      },
    });
  };

  console.log(
    Array(20)
      .fill(1)
      .map(() => getMessage(fakeAiUser.id))
  );

  const aiUser = await prisma.aiUser.upsert({
    where: { id: "chat-gpt" },
    update: {},
    create: {
      ...fakeAiUser,
      chatrooms: {
        create: {
          messages: {
            createMany: {
              data: Array(20)
                .fill(1)
                .map(() => getMessage(fakeAiUser.id)),
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
