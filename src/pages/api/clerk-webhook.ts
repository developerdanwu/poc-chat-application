import { type NextApiRequest, type NextApiResponse } from "next";
import { Webhook } from "svix";
import { buffer } from "micro";
import { env } from "@/env.mjs";
import { type ClerkWebhookEvent } from "@/server/webhooks";
import { type User } from "@clerk/nextjs/api";
import { prisma } from "@/server/db";

const secret = env.WEBHOOK_SECRET;
type UnwantedKeys =
  | "emailAddresses"
  | "firstName"
  | "lastName"
  | "primaryEmailAddressId"
  | "primaryPhoneNumberId"
  | "phoneNumbers";

type UserInterface = Omit<User, UnwantedKeys> & {
  email_addresses: {
    email_address: string;
    id: string;
  }[];
  primary_email_address_id: string;
  first_name: string;
  last_name: string;
  primary_phone_number_id: string;
  phone_numbers: {
    phone_number: string;
    id: string;
  }[];
};

type Event = {
  data: UserInterface;
  object: "event";
  type: ClerkWebhookEvent;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("REQUEST", req);
  if (req.method === "POST") {
    const payload = (await buffer(req)).toString();
    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];
    if (
      !svixId ||
      !svixTimestamp ||
      !svixSignature ||
      typeof svixId !== "string" ||
      typeof svixTimestamp !== "string" ||
      typeof svixSignature !== "string"
    ) {
      return res.status(400).send("Invalid webhook");
    }
    const svixHeaders = {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    } as const;

    let msg: Event | null = null;
    const wh = new Webhook(secret);
    try {
      msg = wh.verify(payload, svixHeaders) as Event;
    } catch (e) {
      return res.status(400).send("Invalid webhook");
    }

    if (msg) {
      const event = msg.type;
      switch (event) {
        case "user.created": {
          try {
            await prisma.author.create({
              data: {
                userId: msg.data.id,
                firstName: msg.data.first_name,
                lastName: msg.data.last_name,
                email: msg.data.email_addresses[0]?.email_address,
                role: "user",
              },
            });
            return res.status(200).send("ok");
          } catch (e) {
            return res.status(200).send("ok");
          }
        }
        case "user.updated": {
          try {
            await prisma.author.upsert({
              where: {
                userId: msg.data.id,
              },
              update: {
                userId: msg.data.id,
                firstName: msg.data.first_name,
                lastName: msg.data.last_name,
                email: msg.data.email_addresses[0]?.email_address,
                role: "user",
              },
              create: {
                userId: msg.data.id,
                firstName: msg.data.first_name,
                lastName: msg.data.last_name,
                email: msg.data.email_addresses[0]?.email_address,
                role: "user",
              },
            });
            return res.status(200).send("ok");
          } catch (e) {
            return res.status(500).send("Database error");
          }
        }
        default: {
          return res.status(400).send("Event not implemented");
        }
      }
    }
  }
}
