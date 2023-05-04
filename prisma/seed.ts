export {};

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
    clientMessageId: perBuild(() => uuid()),
    text: perBuild(() => faker.lorem.lines(2)),
    timestamp: perBuild(() => faker.date.past()),
    type: "message",
    content: {},
  },
});

async function main() {
  // Create two authors
  const author1 = await prisma.author.create({
    data: {
      role: "user",
      userId: "user_2NXj59TddnODr5H17Vi1wYo5Zvf",
    },
  });

  const author2 = await prisma.author.create({
    data: {
      role: "user",
      userId: uuid(),
    },
  });

  // Create a chatroom
  const chatroom = await prisma.chatroom.create({
    data: {
      users: {
        connect: [
          { authorId: author1.authorId },
          { authorId: author2.authorId },
        ],
      },
    },
  });

  // Create 20 messages sent by author1 in the chatroom
  for (let i = 0; i < 20; i++) {
    const isEven = i % 2 === 0;
    await prisma.message.create({
      data: {
        content: {},
        text: `Message ${i + 1}`,
        type: "text",
        author: {
          connect: {
            authorId: isEven ? author1.authorId : author2.authorId,
          },
        },
        chatroom: {
          connect: {
            id: chatroom.id,
          },
        },
      },
    });
  }

  // console.log("SEEDED", test);

  // insert random messages with these authors and link to chatroom
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
